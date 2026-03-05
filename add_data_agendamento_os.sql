-- Este script adiciona a coluna "data_agendamento" na tabela de ordens de serviço.
-- Execute no Editor SQL do Supabase para aplicar a mudança no banco de dados.

ALTER TABLE ordens_servico 
ADD COLUMN IF NOT EXISTS data_agendamento TIMESTAMP WITH TIME ZONE;

-- Opcional: Para manter as visões e outras funções sincronizadas caso sejam fortemente tipadas
-- OBS: Apenas se algo se quebrar que aponte explicitamente '*' para 'ordens_servico'. 
-- Tipicamente adicionar uma nova coluna é seguro e transparente no Supabase.
