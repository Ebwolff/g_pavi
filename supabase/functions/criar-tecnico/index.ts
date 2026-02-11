import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceKey = Deno.env.get('MY_SERVICE_ROLE_KEY');
        const defaultKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseKey = serviceKey ?? defaultKey;

        console.log('Environment Check:', {
            hasUrl: !!supabaseUrl,
            hasServiceKey: !!serviceKey,
            hasDefaultKey: !!defaultKey,
            usingKey: serviceKey ? 'CUSTOM' : 'DEFAULT'
        });

        if (!supabaseUrl || !supabaseKey) {
            return new Response(
                JSON.stringify({
                    error: 'Server Configuration Error',
                    details: `Missing Vars (URL: ${!!supabaseUrl}, Key: ${!!supabaseKey})`
                }),
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
            console.error('No Authorization header provided');
            return new Response(
                JSON.stringify({ error: 'Authentication Required', details: 'No Authorization header' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

        if (userError || !user) {
            console.error('Token verification failed:', userError);
            return new Response(
                JSON.stringify({
                    error: 'Invalid Session',
                    details: userError?.message || 'Token verification failed'
                }),
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
            console.error('Requester profile not found:', profileError);
            return new Response(
                JSON.stringify({ error: 'Permission Denied', details: 'Requester profile not found' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log('Requester Role:', profile.role);

        if (profile.role !== 'CHEFE_OFICINA' && profile.role !== 'GERENTE') {
            return new Response(
                JSON.stringify({
                    error: 'Permission Denied',
                    details: `User role '${profile.role}' is not allowed to register technicians`
                }),
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

        if (senha.length < 8) {
            return new Response(
                JSON.stringify({ error: 'A senha deve ter no mínimo 8 caracteres' }),
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
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
