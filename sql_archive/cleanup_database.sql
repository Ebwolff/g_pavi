-- SCRIPT DE LIMPEZA DE DADOS FICTÍCIOS
-- Execute este script no SQL Editor do Supabase para limpar todas as informações de teste.

-- Desativa RLS temporariamente para a sessão (não necessário se rodar no dashboard como admin, mas evita problemas)
-- SET session_replication_role = 'replica'; 

BEGIN;

-- Limpeza de tabelas relacionadas a Ordens de Serviço
TRUNCATE TABLE public.itens_os CASCADE;
TRUNCATE TABLE public.historico_status_os CASCADE;
TRUNCATE TABLE public.pendencias_os CASCADE;
TRUNCATE TABLE public.alertas CASCADE;
TRUNCATE TABLE public.mensagens_os CASCADE;
TRUNCATE TABLE public.ordens_servico CASCADE;

-- Limpeza de tabelas de Frota
TRUNCATE TABLE public.historico_alocacao_veiculos CASCADE;
TRUNCATE TABLE public.veiculos CASCADE;

-- Limpeza de Cadastros Base
TRUNCATE TABLE public.tecnicos CASCADE;
TRUNCATE TABLE public.clientes CASCADE;
TRUNCATE TABLE public.maquinas CASCADE;

-- NOTA: A tabela 'profiles' NÃO será truncada para manter seu acesso.
-- Se houver usuários de teste na tabela 'profiles', você deve removê-los manualmente 
-- ou usar: DELETE FROM public.profiles WHERE email NOT IN ('seu-email@exemplo.com');

COMMIT;

-- Reativa regras (se necessário)
-- SET session_replication_role = 'origin';

-- VERIFICAÇÃO FINAL
SELECT 'Ordens de Serviço' as tabela, count(*) FROM public.ordens_servico
UNION ALL SELECT 'Clientes', count(*) FROM public.clientes
UNION ALL SELECT 'Veículos', count(*) FROM public.veiculos
UNION ALL SELECT 'Perfis (Usuários)', count(*) FROM public.profiles;
