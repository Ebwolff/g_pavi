-- Tabela de captura de erros do frontend (substituto sem custo/conta externa para um serviço tipo Sentry).
-- Alimentada pelo ErrorBoundary do React e por handlers globais de erro não tratado / promise rejeitada.
CREATE TABLE IF NOT EXISTS public.error_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    message text NOT NULL,
    stack text,
    component_stack text,
    context text NOT NULL DEFAULT 'unknown',
    url text,
    user_agent text,
    user_id uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT error_logs_pkey PRIMARY KEY (id),
    CONSTRAINT error_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_context ON public.error_logs USING btree (context);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário (logado ou não — ex: erro na própria tela de login) pode registrar um erro.
CREATE POLICY "anyone_insert_error_logs" ON public.error_logs
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Só GERENTE pode ler os logs de erro.
CREATE POLICY "gerente_select_error_logs" ON public.error_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'GERENTE'
        )
    );
