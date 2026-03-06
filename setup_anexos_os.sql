-- Este script irá preparar o Supabase (Storage e Banco de Dados) 
-- para permitir de forma segura os uploads de anexos pelo aplicativo.

-- 1. Criar o bucket de storage se ele não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('anexos_os', 'anexos_os', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Políticas de permissão no Storage (Permitir Insert/Select/Delete)
-- Remover as antigas por garantia p/ evitar erro de duplicidade e criar as novas:
DROP POLICY IF EXISTS "Permitir upload para autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir leitura para todos no bucket" ON storage.objects;
DROP POLICY IF EXISTS "Permitir delete para autenticados" ON storage.objects;

create policy "Permitir upload para autenticados"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'anexos_os' );

create policy "Permitir leitura para todos no bucket"
  on storage.objects for select
  using ( bucket_id = 'anexos_os' );

create policy "Permitir delete para autenticados"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'anexos_os' );

-- 3. Caso a tabela anexos_os ainda não exista e esteja causando falha silenciosa:
CREATE TABLE IF NOT EXISTS public.anexos_os (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ordem_servico_id UUID REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
    url_anexo TEXT NOT NULL,
    tipo_anexo TEXT NOT NULL DEFAULT 'IMAGEM',
    descricao TEXT,
    usuario_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Habilitar RLS na tabela e criar políticas para a tabela anexos_os
ALTER TABLE public.anexos_os ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anexos_os_select_policy" ON public.anexos_os;
DROP POLICY IF EXISTS "anexos_os_insert_policy" ON public.anexos_os;
DROP POLICY IF EXISTS "anexos_os_delete_policy" ON public.anexos_os;

create policy "anexos_os_select_policy"
on public.anexos_os for select
using ( true );

create policy "anexos_os_insert_policy"
on public.anexos_os for insert
with check ( auth.role() = 'authenticated' );

create policy "anexos_os_delete_policy"
on public.anexos_os for delete
using ( auth.role() = 'authenticated' );
