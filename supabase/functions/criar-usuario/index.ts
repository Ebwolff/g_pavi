import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = [
    'https://visao-360.vercel.app',
    'http://localhost:1420',
    'http://localhost:5173',
];

const PAPEIS_VALIDOS = [
    'ADMIN',
    'GERENTE',
    'CONSULTOR_GARANTIA',
    'CONSULTOR_POS_VENDA',
    'CHEFE_OFICINA',
    'TECNICO',
    'ALMOXARIFADO',
    'COMPRAS',
    'FERAMENTAL',
];

// Quem pode criar técnicos sem ser ADMIN. Qualquer outro papel exige ADMIN.
const PODEM_CRIAR_TECNICO = ['ADMIN', 'GERENTE', 'CHEFE_OFICINA', 'CONSULTOR_POS_VENDA'];

function getCorsHeaders(req: Request) {
    const origin = req.headers.get('origin') || '';
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Vary': 'Origin',
    };
}

function validatePassword(senha: string): string | null {
    if (senha.length < 10) return 'A senha deve ter no mínimo 10 caracteres';
    if (!/[A-Z]/.test(senha)) return 'A senha deve conter ao menos uma letra maiúscula';
    if (!/[a-z]/.test(senha)) return 'A senha deve conter ao menos uma letra minúscula';
    if (!/[0-9]/.test(senha)) return 'A senha deve conter ao menos um número';
    return null;
}

serve(async (req) => {
    const corsHeaders = getCorsHeaders(req);
    const json = (body: unknown, status: number) =>
        new Response(JSON.stringify(body), {
            status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey =
            Deno.env.get('MY_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !supabaseKey) {
            return json({ error: 'Server Configuration Error' }, 500);
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return json({ error: 'Authentication Required' }, 401);
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !user) {
            return json({ error: 'Invalid Session' }, 401);
        }

        const { data: solicitante, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileError || !solicitante) {
            return json({ error: 'Permission Denied' }, 403);
        }

        const { email, senha, nome, sobrenome, role } = await req.json();
        const papelAlvo = role ?? 'TECNICO';

        if (!email || !senha || !nome || !sobrenome) {
            return json({ error: 'Todos os campos são obrigatórios' }, 400);
        }

        if (!PAPEIS_VALIDOS.includes(papelAlvo)) {
            return json({ error: `Papel inválido: ${papelAlvo}` }, 400);
        }

        // Só ADMIN cria usuários que não sejam técnicos — e só ADMIN cria outro ADMIN.
        const autorizado =
            solicitante.role === 'ADMIN' ||
            (papelAlvo === 'TECNICO' && PODEM_CRIAR_TECNICO.includes(solicitante.role));

        if (!autorizado) {
            return json({ error: 'Permission Denied' }, 403);
        }

        const passwordError = validatePassword(senha);
        if (passwordError) {
            return json({ error: passwordError }, 400);
        }

        const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: senha,
            email_confirm: true,
            user_metadata: { first_name: nome, last_name: sobrenome },
        });

        if (authError || !newUser?.user) {
            return json({ error: `Erro ao criar usuário: ${authError?.message ?? 'desconhecido'}` }, 400);
        }

        const { error: profileInsertError } = await supabaseAdmin
            .from('profiles')
            .insert({
                id: newUser.user.id,
                username: email.split('@')[0],
                first_name: nome,
                last_name: sobrenome,
                role: papelAlvo,
                is_active: true,
            });

        if (profileInsertError) {
            // Sem o perfil o usuário fica órfão e não consegue usar o sistema: desfaz.
            await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
            return json({ error: `Erro ao criar perfil: ${profileInsertError.message}` }, 400);
        }

        // Técnico precisa de registro em `tecnicos`: é por ele que as OS são vinculadas.
        if (papelAlvo === 'TECNICO') {
            const { error: tecnicoInsertError } = await supabaseAdmin
                .from('tecnicos')
                .upsert({
                    user_id: newUser.user.id,
                    nome_completo: `${nome} ${sobrenome}`.trim(),
                    is_active: true,
                    status_disponibilidade: 'DISPONIVEL',
                }, { onConflict: 'user_id' });

            if (tecnicoInsertError) {
                console.error('[criar-usuario] Falha ao sincronizar tecnicos:', tecnicoInsertError);
            }
        }

        return json({
            success: true,
            usuario: { id: newUser.user.id, email, nome, sobrenome, role: papelAlvo },
        }, 200);

    } catch {
        return json({ error: 'Internal server error' }, 500);
    }
})
