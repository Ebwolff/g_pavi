import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = [
    'https://visao-360.vercel.app',
    'http://localhost:1420',
    'http://localhost:5173',
];

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

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceKey = Deno.env.get('MY_SERVICE_ROLE_KEY');
        const defaultKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseKey = serviceKey ?? defaultKey;

        if (!supabaseUrl || !supabaseKey) {
            return new Response(
                JSON.stringify({ error: 'Server Configuration Error' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Criar cliente Supabase com Service Role Key (admin)
        const supabaseAdmin = createClient(
            supabaseUrl,
            supabaseKey,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // Validar autenticação do usuário que está fazendo a requisição
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'Authentication Required' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

        if (userError || !user) {
            return new Response(
                JSON.stringify({ error: 'Invalid Session' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Verificar se o usuário tem permissão (CHEFE_OFICINA ou GERENTE)
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profileError || !profile) {
            return new Response(
                JSON.stringify({ error: 'Permission Denied' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (profile.role !== 'CHEFE_OFICINA' && profile.role !== 'GERENTE' && profile.role !== 'CONSULTOR_POS_VENDA') {
            return new Response(
                JSON.stringify({ error: 'Permission Denied' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Obter dados do novo técnico
        const { email, senha, nome, sobrenome } = await req.json()

        // Validações
        if (!email || !senha || !nome || !sobrenome) {
            return new Response(
                JSON.stringify({ error: 'Todos os campos são obrigatórios' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const passwordError = validatePassword(senha);
        if (passwordError) {
            return new Response(
                JSON.stringify({ error: passwordError }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 1. Criar usuário no Supabase Auth
        const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: senha,
            email_confirm: true,
            user_metadata: {
                first_name: nome,
                last_name: sobrenome
            }
        })

        if (authError) {
            return new Response(
                JSON.stringify({ error: `Erro ao criar usuário: ${authError.message}` }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 2. Criar profile do técnico
        const { error: profileInsertError } = await supabaseAdmin
            .from('profiles')
            .insert({
                id: newUser.user.id,
                username: email.split('@')[0],
                first_name: nome,
                last_name: sobrenome,
                role: 'TECNICO',
                is_active: true
            })

        if (profileInsertError) {
            // Se falhar ao criar profile, deletar o usuário criado
            await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)

            return new Response(
                JSON.stringify({ error: `Erro ao criar perfil: ${profileInsertError.message}` }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 3. Sincronizar com a tabela de técnicos (para o Painel do Chefe de Oficina)
        const { error: tecnicoInsertError } = await supabaseAdmin
            .from('tecnicos')
            .upsert({
                user_id: newUser.user.id,
                nome_completo: `${nome} ${sobrenome}`.trim(),
                is_active: true,
                status_disponibilidade: 'DISPONIVEL'
            }, { onConflict: 'user_id' })

        if (tecnicoInsertError) {
            console.error('[Edge Function] Falha ao sincronizar com tabela tecnicos:', tecnicoInsertError);
        }

        // Retornar sucesso
        return new Response(
            JSON.stringify({
                success: true,
                tecnico: {
                    id: newUser.user.id,
                    email,
                    nome,
                    sobrenome
                }
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        const corsHeaders = getCorsHeaders(req);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
