-- SCRIPT DE ATUALIZAÇÃO DO BANCO DE DADOS - MARDISA AGRO
-- Execute este script no SQL Editor do Supabase para adicionar as novas funcionalidades do Consultor.

BEGIN;

-- 1. Adicionar novos campos na tabela ordens_servico
ALTER TABLE public.ordens_servico 
ADD COLUMN IF NOT EXISTS aol text,
ADD COLUMN IF NOT EXISTS data_faturamento_fabrica timestamptz,
ADD COLUMN IF NOT EXISTS link_pdf_os text;

COMMENT ON COLUMN public.ordens_servico.aol IS 'Identificador ou Link do sistema AOL';
COMMENT ON COLUMN public.ordens_servico.data_faturamento_fabrica IS 'Data em que a fábrica faturou a peça/serviço';
COMMENT ON COLUMN public.ordens_servico.link_pdf_os IS 'Caminho para o documento PDF da Ordem de Serviço';

-- 2. Criar tabela de anexos para imagens do atendimento
CREATE TABLE IF NOT EXISTS public.anexos_os (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ordem_servico_id uuid NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
    url_anexo text NOT NULL,
    tipo_anexo text DEFAULT 'IMAGEM', -- IMAGEM, DOCUMENTO, etc.
    descricao text,
    usuario_id uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now()
);

-- 3. Habilitar RLS (Row Level Security) para a nova tabela
ALTER TABLE public.anexos_os ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas básicas de acesso (ajustar conforme necessidade)
CREATE POLICY "Permitir leitura de anexos para usuários autenticados" 
ON public.anexos_os FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Permitir inserção de anexos para usuários autenticados" 
ON public.anexos_os FOR INSERT 
TO authenticated 
WITH CHECK (true);

COMMIT;
