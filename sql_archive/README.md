# Arquivo histórico de scripts SQL

Estes scripts foram usados para evoluir o schema do banco de produção ao longo do tempo (rodados manualmente via SQL Editor do painel Supabase, antes de haver um fluxo formal de migrations).

O estado atual completo do schema já está capturado em `supabase/migrations/20260101000000_baseline_schema.sql`, reconstruído via introspecção direta do banco de produção (`information_schema`/`pg_catalog`). Os efeitos de todos os scripts aqui já estão refletidos nesse baseline.

**Não execute estes arquivos novamente** — eles ficam aqui apenas como referência histórica de como cada mudança foi introduzida. Novas alterações de schema devem ser feitas via `supabase migration new <nome>` + `supabase db push`.
