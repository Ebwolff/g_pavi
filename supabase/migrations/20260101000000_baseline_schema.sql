-- Baseline schema migration
-- Reconstructed via information_schema/pg_catalog introspection against the linked production project
-- (no local Docker available for `supabase db pull`); represents schema state as of generation time.

-- ============ EXTENSIONS ============
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============ ENUM TYPES ============
DO $$ BEGIN
  CREATE TYPE public.status_disponibilidade_tecnico AS ENUM ('DISPONIVEL', 'EM_TREINAMENTO', 'AUSENTE', 'FERIAS');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.status_orcamento AS ENUM ('EM_ELABORACAO', 'ENVIADO_CLIENTE', 'APROVADO', 'REPROVADO', 'CONVERTIDO_OS');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.status_os AS ENUM ('EM_EXECUCAO', 'AGUARDANDO_PECAS', 'PAUSADA', 'CONCLUIDA', 'FATURADA', 'CANCELADA', 'AGUARDANDO_APROVACAO_ORCAMENTO', 'AGUARDANDO_PAGAMENTO', 'EM_DIAGNOSTICO', 'EM_TRANSITO', 'AGUARDANDO_ATRIBUICAO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.status_veiculo AS ENUM ('DISPONIVEL', 'EM_USO', 'MANUTENCAO', 'INATIVO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.tipo_despesa_os AS ENUM ('KM', 'ABASTECIMENTO', 'ALIMENTACAO', 'HOSPEDAGEM', 'PEDAGIO', 'OUTROS', 'MAO_DE_OBRA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.tipo_os AS ENUM ('NORMAL', 'GARANTIA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('GERENTE', 'CONSULTOR_GARANTIA', 'CONSULTOR_POS_VENDA', 'TECNICO', 'COMPRAS', 'CHEFE_OFICINA', 'ALMOXARIFADO', 'FERAMENTAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ TABLES ============
CREATE TABLE IF NOT EXISTS public.alertas (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    os_id uuid,
    tipo_alerta text NOT NULL,
    titulo text NOT NULL,
    mensagem text NOT NULL,
    prioridade text NOT NULL DEFAULT 'NORMAL'::text,
    lido boolean NOT NULL DEFAULT false,
    data_leitura timestamp with time zone,
    usuario_id uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.anexos_os (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    ordem_servico_id uuid,
    url_anexo text NOT NULL,
    tipo_anexo text NOT NULL DEFAULT 'IMAGEM'::text,
    descricao text,
    usuario_id uuid,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.auditoria_os (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    os_id uuid,
    usuario_id uuid,
    usuario_nome text,
    acao text NOT NULL,
    descricao text,
    dados_anteriores jsonb,
    dados_novos jsonb,
    ip_address text,
    timestamp timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clientes (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    nome_cliente text NOT NULL,
    telefone text,
    email text,
    endereco text,
    cpf_cnpj text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.despesas_os (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    ordem_servico_id uuid NOT NULL,
    tipo tipo_despesa_os NOT NULL,
    descricao text,
    quantidade numeric(10,2),
    valor_unitario numeric(10,2),
    valor_total numeric(10,2) NOT NULL DEFAULT 0,
    data_despesa date NOT NULL DEFAULT CURRENT_DATE,
    comprovante_url text,
    responsavel_id uuid,
    km_inicial numeric(10,2),
    km_final numeric(10,2),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    veiculo_id uuid
);

CREATE TABLE IF NOT EXISTS public.estoque_pecas (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    codigo_peca text NOT NULL,
    descricao text NOT NULL,
    quantidade_atual integer DEFAULT 0,
    quantidade_minima integer DEFAULT 5,
    quantidade_reservada integer DEFAULT 0,
    unidade text DEFAULT 'UN'::text,
    localizacao text,
    categoria text,
    valor_unitario numeric(10,2),
    valor_total_estoque numeric(10,2) GENERATED ALWAYS AS (((quantidade_atual)::numeric * COALESCE(valor_unitario, (0)::numeric))) STORED,
    fornecedor_padrao text,
    observacoes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ferramentas (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    nome character varying(200) NOT NULL,
    codigo_patrimonio character varying(50),
    numero_serie character varying(100),
    categoria character varying(50) DEFAULT 'GERAL'::character varying,
    estado character varying(30) DEFAULT 'BOM'::character varying,
    quantidade integer DEFAULT 1,
    tecnico_id uuid,
    data_retirada timestamp with time zone,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.historico_alocacao_veiculos (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    veiculo_id uuid NOT NULL,
    tecnico_id uuid,
    data_inicio timestamp with time zone NOT NULL DEFAULT now(),
    data_fim timestamp with time zone,
    km_inicio numeric(10,2),
    km_fim numeric(10,2),
    motivo text,
    alocado_por uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.historico_status_os (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    ordem_servico_id uuid NOT NULL,
    status_anterior text,
    status_novo text NOT NULL,
    motivo_mudanca text,
    usuario_id uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    numero_orcamento character varying(50),
    numero_pedido character varying(50),
    tipo_diagnostico character varying(20),
    localizacao_atual character varying(200),
    motivo_pausa text
);

CREATE TABLE IF NOT EXISTS public.importacoes_log (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    nome_arquivo text NOT NULL,
    tipo_importacao text NOT NULL,
    status text NOT NULL,
    total_registros integer DEFAULT 0,
    registros_importados integer DEFAULT 0,
    registros_atualizados integer DEFAULT 0,
    registros_erro integer DEFAULT 0,
    mensagem_erro text,
    detalhes jsonb,
    usuario_id uuid,
    data_inicio timestamp with time zone NOT NULL DEFAULT now(),
    data_fim timestamp with time zone,
    duracao_segundos integer
);

CREATE TABLE IF NOT EXISTS public.itens_os (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    ordem_servico_id uuid NOT NULL,
    descricao text NOT NULL,
    quantidade integer NOT NULL DEFAULT 1,
    valor_unitario numeric(10,2) NOT NULL,
    valor_total numeric(10,2) NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    status_separacao text DEFAULT 'PENDENTE'::text,
    solicitacao_compra_id uuid,
    codigo_peca text,
    status_aprovacao character varying DEFAULT 'APROVADO'::character varying
);

CREATE TABLE IF NOT EXISTS public.maquinas (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    chassi text NOT NULL,
    modelo text NOT NULL,
    cliente_id uuid NOT NULL,
    ano integer,
    horas_uso integer,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.metas (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    nome_meta text NOT NULL,
    descricao text,
    tipo_meta text NOT NULL,
    valor_alvo numeric(12,2) NOT NULL,
    periodo_inicio date NOT NULL,
    periodo_fim date NOT NULL,
    unidade text,
    consultor_id uuid,
    equipe_id uuid,
    ativa boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.movimentacoes_ferramentas (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    ferramenta_id uuid NOT NULL,
    tecnico_id uuid,
    tipo character varying(20) NOT NULL,
    data_movimentacao timestamp with time zone DEFAULT now(),
    observacoes text,
    registrado_por uuid,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orcamentos_servico (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    numero_orcamento character varying NOT NULL,
    cliente_id uuid,
    nome_cliente_digitavel character varying,
    maquina_id uuid,
    modelo_maquina character varying,
    chassi character varying,
    descricao_problema text,
    valor_mao_de_obra numeric(10,2) DEFAULT 0,
    valor_pecas numeric(10,2) DEFAULT 0,
    valor_deslocamento numeric(10,2) DEFAULT 0,
    valor_liquido_total numeric(10,2) DEFAULT 0,
    tipo_diagnostico character varying,
    status_orcamento status_orcamento DEFAULT 'EM_ELABORACAO'::status_orcamento,
    consultor_id uuid,
    data_criacao timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    data_aprovacao timestamp with time zone,
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    observacoes text,
    pdf_nbs_url text,
    itens_orcamento jsonb DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS public.ordens_servico (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    numero_os text NOT NULL,
    tipo_os tipo_os NOT NULL DEFAULT 'NORMAL'::tipo_os,
    status_atual status_os NOT NULL DEFAULT 'EM_EXECUCAO'::status_os,
    data_abertura timestamp with time zone NOT NULL DEFAULT now(),
    data_fechamento timestamp with time zone,
    data_faturamento timestamp with time zone,
    tecnico_id uuid,
    cliente_id uuid,
    maquina_id uuid,
    consultor_id uuid,
    nome_cliente_digitavel text,
    modelo_maquina text,
    chassi text,
    descricao_problema text,
    solucao_aplicada text,
    observacoes text,
    valor_mao_de_obra numeric(10,2) NOT NULL DEFAULT 0,
    valor_pecas numeric(10,2) NOT NULL DEFAULT 0,
    valor_deslocamento numeric(10,2) NOT NULL DEFAULT 0,
    valor_liquido_total numeric(10,2) NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    numero_orcamento character varying(50),
    data_envio_orcamento timestamp with time zone,
    numero_pedido character varying(50),
    data_pedido timestamp with time zone,
    previsao_chegada_pecas timestamp with time zone,
    data_conclusao_servico timestamp with time zone,
    valor_servico numeric(10,2),
    motivo_pausa text,
    data_pausa timestamp with time zone,
    data_inicio_diagnostico timestamp with time zone,
    tipo_diagnostico character varying(20),
    observacoes_diagnostico text,
    data_saida timestamp with time zone,
    previsao_retorno timestamp with time zone,
    localizacao_atual character varying(200),
    roteiro text,
    aol character varying(255),
    data_agendamento timestamp with time zone,
    nivel_urgencia text DEFAULT 'NORMAL'::text,
    orcamento_id uuid,
    itens_orcamento jsonb DEFAULT '[]'::jsonb,
    pdf_nbs_url text
);

CREATE TABLE IF NOT EXISTS public.pendencias_os (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    os_id uuid NOT NULL,
    tipo_pendencia text NOT NULL,
    descricao text NOT NULL,
    data_inicio timestamp with time zone NOT NULL DEFAULT now(),
    data_prevista timestamp with time zone,
    data_resolucao timestamp with time zone,
    status text NOT NULL DEFAULT 'PENDENTE'::text,
    responsavel text,
    observacoes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL,
    username text NOT NULL,
    first_name text,
    last_name text,
    role user_role NOT NULL DEFAULT 'TECNICO'::user_role,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.solicitacoes_compra (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    ordem_servico_id uuid,
    codigo_peca text,
    descricao_peca text NOT NULL,
    quantidade integer NOT NULL DEFAULT 1,
    unidade text DEFAULT 'UN'::text,
    urgencia text DEFAULT 'MEDIA'::text,
    status text DEFAULT 'PENDENTE'::text,
    data_solicitacao timestamp with time zone NOT NULL DEFAULT now(),
    data_previsao_entrega date,
    data_entrega_real timestamp with time zone,
    fornecedor text,
    valor_unitario numeric(10,2),
    valor_total numeric(10,2),
    numero_pedido_fornecedor text,
    solicitante_id uuid,
    comprador_id uuid,
    observacoes text,
    motivo_cancelamento text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    item_os_id uuid,
    status_aprovacao character varying DEFAULT 'APROVADO'::character varying
);

CREATE TABLE IF NOT EXISTS public.tecnicos (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    nome_completo text NOT NULL,
    especialidade text,
    telefone text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    is_active boolean DEFAULT true,
    status_disponibilidade status_disponibilidade_tecnico DEFAULT 'DISPONIVEL'::status_disponibilidade_tecnico
);

CREATE TABLE IF NOT EXISTS public.veiculos (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    placa character varying(10) NOT NULL,
    modelo character varying(100) NOT NULL,
    marca character varying(50),
    ano integer,
    cor character varying(30),
    km_atual numeric(10,2) DEFAULT 0,
    status status_veiculo DEFAULT 'DISPONIVEL'::status_veiculo,
    tecnico_id uuid,
    data_alocacao timestamp with time zone,
    observacoes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vistorias_veiculos (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    veiculo_id uuid,
    tecnico_id uuid,
    data_vistoria timestamp with time zone DEFAULT now(),
    km_vistoria integer,
    itens jsonb DEFAULT '{}'::jsonb,
    observacoes text,
    status character varying(20) DEFAULT 'PENDENTE'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ============ CONSTRAINTS (PK / UNIQUE / CHECK / FK) ============
ALTER TABLE public.alertas ADD CONSTRAINT alertas_pkey PRIMARY KEY (id);
ALTER TABLE public.anexos_os ADD CONSTRAINT anexos_os_pkey PRIMARY KEY (id);
ALTER TABLE public.auditoria_os ADD CONSTRAINT auditoria_os_pkey PRIMARY KEY (id);
ALTER TABLE public.clientes ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);
ALTER TABLE public.despesas_os ADD CONSTRAINT despesas_os_pkey PRIMARY KEY (id);
ALTER TABLE public.estoque_pecas ADD CONSTRAINT estoque_pecas_pkey PRIMARY KEY (id);
ALTER TABLE public.ferramentas ADD CONSTRAINT ferramentas_pkey PRIMARY KEY (id);
ALTER TABLE public.historico_alocacao_veiculos ADD CONSTRAINT historico_alocacao_veiculos_pkey PRIMARY KEY (id);
ALTER TABLE public.historico_status_os ADD CONSTRAINT historico_status_os_pkey PRIMARY KEY (id);
ALTER TABLE public.importacoes_log ADD CONSTRAINT importacoes_log_pkey PRIMARY KEY (id);
ALTER TABLE public.itens_os ADD CONSTRAINT itens_os_pkey PRIMARY KEY (id);
ALTER TABLE public.maquinas ADD CONSTRAINT maquinas_pkey PRIMARY KEY (id);
ALTER TABLE public.metas ADD CONSTRAINT metas_pkey PRIMARY KEY (id);
ALTER TABLE public.movimentacoes_ferramentas ADD CONSTRAINT movimentacoes_ferramentas_pkey PRIMARY KEY (id);
ALTER TABLE public.orcamentos_servico ADD CONSTRAINT orcamentos_servico_pkey PRIMARY KEY (id);
ALTER TABLE public.ordens_servico ADD CONSTRAINT ordens_servico_pkey PRIMARY KEY (id);
ALTER TABLE public.pendencias_os ADD CONSTRAINT pendencias_os_pkey PRIMARY KEY (id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.solicitacoes_compra ADD CONSTRAINT solicitacoes_compra_pkey PRIMARY KEY (id);
ALTER TABLE public.tecnicos ADD CONSTRAINT tecnicos_pkey PRIMARY KEY (id);
ALTER TABLE public.veiculos ADD CONSTRAINT veiculos_pkey PRIMARY KEY (id);
ALTER TABLE public.vistorias_veiculos ADD CONSTRAINT vistorias_veiculos_pkey PRIMARY KEY (id);
ALTER TABLE public.clientes ADD CONSTRAINT clientes_cpf_cnpj_key UNIQUE (cpf_cnpj);
ALTER TABLE public.estoque_pecas ADD CONSTRAINT estoque_pecas_codigo_peca_key UNIQUE (codigo_peca);
ALTER TABLE public.maquinas ADD CONSTRAINT maquinas_chassi_key UNIQUE (chassi);
ALTER TABLE public.orcamentos_servico ADD CONSTRAINT orcamentos_servico_numero_orcamento_key UNIQUE (numero_orcamento);
ALTER TABLE public.ordens_servico ADD CONSTRAINT ordens_servico_numero_os_key UNIQUE (numero_os);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
ALTER TABLE public.tecnicos ADD CONSTRAINT tecnicos_user_id_key UNIQUE (user_id);
ALTER TABLE public.veiculos ADD CONSTRAINT veiculos_placa_key UNIQUE (placa);
ALTER TABLE public.alertas ADD CONSTRAINT alertas_prioridade_check CHECK ((prioridade = ANY (ARRAY['BAIXA'::text, 'NORMAL'::text, 'ALTA'::text, 'URGENTE'::text])));
ALTER TABLE public.alertas ADD CONSTRAINT alertas_tipo_alerta_check CHECK ((tipo_alerta = ANY (ARRAY['OS_VENCIDA'::text, 'GARANTIA_PENDENTE'::text, 'PECAS_CHEGANDO'::text, 'PREVISAO_ENTREGA'::text, 'META_FATURAMENTO'::text, 'OUTROS'::text, 'NOVA_OS'::text, 'OS_ATRIBUIDA'::text, 'PECAS_SOLICITADAS'::text, 'COMPRA_NECESSARIA'::text, 'STATUS_ALTERADO'::text])));
ALTER TABLE public.auditoria_os ADD CONSTRAINT auditoria_os_acao_check CHECK ((acao = ANY (ARRAY['CRIACAO'::text, 'EDICAO'::text, 'EXCLUSAO'::text, 'MUDANCA_STATUS'::text, 'OUTROS'::text])));
ALTER TABLE public.estoque_pecas ADD CONSTRAINT estoque_pecas_quantidade_atual_check CHECK ((quantidade_atual >= 0));
ALTER TABLE public.ferramentas ADD CONSTRAINT ferramentas_categoria_check CHECK (((categoria)::text = ANY ((ARRAY['ELETRICA'::character varying, 'MECANICA'::character varying, 'HIDRAULICA'::character varying, 'MEDICAO'::character varying, 'GERAL'::character varying])::text[])));
ALTER TABLE public.ferramentas ADD CONSTRAINT ferramentas_estado_check CHECK (((estado)::text = ANY ((ARRAY['NOVO'::character varying, 'BOM'::character varying, 'DESGASTADO'::character varying, 'AVARIADO'::character varying])::text[])));
ALTER TABLE public.importacoes_log ADD CONSTRAINT importacoes_log_status_check CHECK ((status = ANY (ARRAY['INICIADO'::text, 'PROCESSANDO'::text, 'SUCESSO'::text, 'ERRO'::text, 'CANCELADO'::text])));
ALTER TABLE public.importacoes_log ADD CONSTRAINT importacoes_log_tipo_importacao_check CHECK ((tipo_importacao = ANY (ARRAY['INCREMENTAL'::text, 'FULL'::text, 'MERGE'::text])));
ALTER TABLE public.itens_os ADD CONSTRAINT itens_os_status_separacao_check CHECK ((status_separacao = ANY (ARRAY['PENDENTE'::text, 'SEPARADO'::text, 'AGUARDANDO_COMPRA'::text, 'COMPRADO'::text, 'SOLICITADO_ESTOQUE'::text, 'SOLICITADO_COMPRA'::text, 'SEPARANDO'::text, 'AGUARDANDO_RETIRADA'::text, 'RETIRADO'::text])));
ALTER TABLE public.metas ADD CONSTRAINT metas_tipo_meta_check CHECK ((tipo_meta = ANY (ARRAY['FATURAMENTO'::text, 'QUANTIDADE_OS'::text, 'TEMPO_RESOLUCAO'::text, 'SATISFACAO'::text, 'BACKLOG'::text, 'OUTROS'::text])));
ALTER TABLE public.movimentacoes_ferramentas ADD CONSTRAINT movimentacoes_ferramentas_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['RETIRADA'::character varying, 'DEVOLUCAO'::character varying])::text[])));
ALTER TABLE public.ordens_servico ADD CONSTRAINT check_tipo_diagnostico CHECK (((tipo_diagnostico IS NULL) OR ((tipo_diagnostico)::text = ANY ((ARRAY['SIMPLES'::character varying, 'COMPLEXO'::character varying, 'ESPECIALIZADO'::character varying])::text[]))));
ALTER TABLE public.pendencias_os ADD CONSTRAINT pendencias_os_status_check CHECK ((status = ANY (ARRAY['PENDENTE'::text, 'EM_ANDAMENTO'::text, 'RESOLVIDO'::text, 'CANCELADO'::text])));
ALTER TABLE public.pendencias_os ADD CONSTRAINT pendencias_os_tipo_pendencia_check CHECK ((tipo_pendencia = ANY (ARRAY['PECAS'::text, 'SERVICO'::text, 'TERCEIROS'::text, 'GARANTIA'::text, 'CLIENTE'::text, 'OUTROS'::text])));
ALTER TABLE public.solicitacoes_compra ADD CONSTRAINT solicitacoes_compra_status_check CHECK ((status = ANY (ARRAY['PENDENTE'::text, 'EM_COTACAO'::text, 'APROVADO'::text, 'COMPRADO'::text, 'AGUARDANDO_ENTREGA'::text, 'ENTREGUE'::text, 'CANCELADO'::text])));
ALTER TABLE public.solicitacoes_compra ADD CONSTRAINT solicitacoes_compra_urgencia_check CHECK ((urgencia = ANY (ARRAY['BAIXA'::text, 'MEDIA'::text, 'ALTA'::text, 'CRITICA'::text])));
ALTER TABLE public.vistorias_veiculos ADD CONSTRAINT vistorias_veiculos_status_check CHECK (((status)::text = ANY ((ARRAY['PENDENTE'::character varying, 'APROVADA'::character varying, 'REPROVADA'::character varying])::text[])));
ALTER TABLE public.alertas ADD CONSTRAINT alertas_os_id_fkey FOREIGN KEY (os_id) REFERENCES ordens_servico(id) ON DELETE CASCADE;
ALTER TABLE public.alertas ADD CONSTRAINT alertas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.anexos_os ADD CONSTRAINT anexos_os_ordem_servico_id_fkey FOREIGN KEY (ordem_servico_id) REFERENCES ordens_servico(id) ON DELETE CASCADE;
ALTER TABLE public.anexos_os ADD CONSTRAINT anexos_os_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id);
ALTER TABLE public.auditoria_os ADD CONSTRAINT auditoria_os_os_id_fkey FOREIGN KEY (os_id) REFERENCES ordens_servico(id) ON DELETE CASCADE;
ALTER TABLE public.auditoria_os ADD CONSTRAINT auditoria_os_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.despesas_os ADD CONSTRAINT despesas_os_ordem_servico_id_fkey FOREIGN KEY (ordem_servico_id) REFERENCES ordens_servico(id) ON DELETE CASCADE;
ALTER TABLE public.despesas_os ADD CONSTRAINT despesas_os_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.despesas_os ADD CONSTRAINT despesas_os_veiculo_id_fkey FOREIGN KEY (veiculo_id) REFERENCES veiculos(id) ON DELETE SET NULL;
ALTER TABLE public.ferramentas ADD CONSTRAINT ferramentas_tecnico_id_fkey FOREIGN KEY (tecnico_id) REFERENCES tecnicos(id) ON DELETE SET NULL;
ALTER TABLE public.historico_alocacao_veiculos ADD CONSTRAINT historico_alocacao_veiculos_alocado_por_fkey FOREIGN KEY (alocado_por) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.historico_alocacao_veiculos ADD CONSTRAINT historico_alocacao_veiculos_tecnico_id_fkey FOREIGN KEY (tecnico_id) REFERENCES tecnicos(id) ON DELETE SET NULL;
ALTER TABLE public.historico_alocacao_veiculos ADD CONSTRAINT historico_alocacao_veiculos_veiculo_id_fkey FOREIGN KEY (veiculo_id) REFERENCES veiculos(id) ON DELETE CASCADE;
ALTER TABLE public.historico_status_os ADD CONSTRAINT historico_status_os_ordem_servico_id_fkey FOREIGN KEY (ordem_servico_id) REFERENCES ordens_servico(id) ON DELETE CASCADE;
ALTER TABLE public.historico_status_os ADD CONSTRAINT historico_status_os_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES profiles(id);
ALTER TABLE public.importacoes_log ADD CONSTRAINT importacoes_log_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.itens_os ADD CONSTRAINT itens_os_ordem_servico_id_fkey FOREIGN KEY (ordem_servico_id) REFERENCES ordens_servico(id) ON DELETE CASCADE;
ALTER TABLE public.itens_os ADD CONSTRAINT itens_os_solicitacao_compra_id_fkey FOREIGN KEY (solicitacao_compra_id) REFERENCES solicitacoes_compra(id) ON DELETE SET NULL;
ALTER TABLE public.maquinas ADD CONSTRAINT maquinas_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT;
ALTER TABLE public.metas ADD CONSTRAINT metas_consultor_id_fkey FOREIGN KEY (consultor_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.movimentacoes_ferramentas ADD CONSTRAINT movimentacoes_ferramentas_ferramenta_id_fkey FOREIGN KEY (ferramenta_id) REFERENCES ferramentas(id) ON DELETE CASCADE;
ALTER TABLE public.movimentacoes_ferramentas ADD CONSTRAINT movimentacoes_ferramentas_tecnico_id_fkey FOREIGN KEY (tecnico_id) REFERENCES tecnicos(id) ON DELETE SET NULL;
ALTER TABLE public.orcamentos_servico ADD CONSTRAINT orcamentos_servico_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL;
ALTER TABLE public.orcamentos_servico ADD CONSTRAINT orcamentos_servico_consultor_id_fkey FOREIGN KEY (consultor_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.ordens_servico ADD CONSTRAINT ordens_servico_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL;
ALTER TABLE public.ordens_servico ADD CONSTRAINT ordens_servico_consultor_id_fkey FOREIGN KEY (consultor_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.ordens_servico ADD CONSTRAINT ordens_servico_maquina_id_fkey FOREIGN KEY (maquina_id) REFERENCES maquinas(id) ON DELETE SET NULL;
ALTER TABLE public.ordens_servico ADD CONSTRAINT ordens_servico_orcamento_id_fkey FOREIGN KEY (orcamento_id) REFERENCES orcamentos_servico(id) ON DELETE SET NULL;
ALTER TABLE public.ordens_servico ADD CONSTRAINT ordens_servico_tecnico_id_fkey FOREIGN KEY (tecnico_id) REFERENCES tecnicos(id) ON DELETE SET NULL;
ALTER TABLE public.pendencias_os ADD CONSTRAINT pendencias_os_os_id_fkey FOREIGN KEY (os_id) REFERENCES ordens_servico(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.solicitacoes_compra ADD CONSTRAINT solicitacoes_compra_comprador_id_fkey FOREIGN KEY (comprador_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.solicitacoes_compra ADD CONSTRAINT solicitacoes_compra_item_os_id_fkey FOREIGN KEY (item_os_id) REFERENCES itens_os(id) ON DELETE SET NULL;
ALTER TABLE public.solicitacoes_compra ADD CONSTRAINT solicitacoes_compra_ordem_servico_id_fkey FOREIGN KEY (ordem_servico_id) REFERENCES ordens_servico(id) ON DELETE SET NULL;
ALTER TABLE public.solicitacoes_compra ADD CONSTRAINT solicitacoes_compra_solicitante_id_fkey FOREIGN KEY (solicitante_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.tecnicos ADD CONSTRAINT tecnicos_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.veiculos ADD CONSTRAINT veiculos_tecnico_id_fkey FOREIGN KEY (tecnico_id) REFERENCES tecnicos(id) ON DELETE SET NULL;
ALTER TABLE public.vistorias_veiculos ADD CONSTRAINT vistorias_veiculos_tecnico_id_fkey FOREIGN KEY (tecnico_id) REFERENCES tecnicos(id) ON DELETE SET NULL;
ALTER TABLE public.vistorias_veiculos ADD CONSTRAINT vistorias_veiculos_veiculo_id_fkey FOREIGN KEY (veiculo_id) REFERENCES veiculos(id) ON DELETE CASCADE;

-- ============ INDEXES (excludes ones auto-created by constraints above) ============
CREATE INDEX idx_alertas_created_at ON public.alertas USING btree (created_at DESC);
CREATE INDEX idx_alertas_lido ON public.alertas USING btree (lido);
CREATE INDEX idx_alertas_os_id ON public.alertas USING btree (os_id);
CREATE INDEX idx_alertas_tipo ON public.alertas USING btree (tipo_alerta);
CREATE INDEX idx_alertas_usuario_id ON public.alertas USING btree (usuario_id);
CREATE INDEX idx_auditoria_acao ON public.auditoria_os USING btree (acao);
CREATE INDEX idx_auditoria_os_id ON public.auditoria_os USING btree (os_id);
CREATE INDEX idx_auditoria_timestamp ON public.auditoria_os USING btree ("timestamp" DESC);
CREATE INDEX idx_auditoria_usuario_id ON public.auditoria_os USING btree (usuario_id);
CREATE INDEX idx_despesas_os_data ON public.despesas_os USING btree (data_despesa);
CREATE INDEX idx_despesas_os_ordem_servico ON public.despesas_os USING btree (ordem_servico_id);
CREATE INDEX idx_despesas_os_tipo ON public.despesas_os USING btree (tipo);
CREATE INDEX idx_estoque_categoria ON public.estoque_pecas USING btree (categoria);
CREATE INDEX idx_estoque_codigo ON public.estoque_pecas USING btree (codigo_peca);
CREATE INDEX idx_estoque_quantidade ON public.estoque_pecas USING btree (quantidade_atual);
CREATE INDEX idx_ferramentas_categoria ON public.ferramentas USING btree (categoria);
CREATE INDEX idx_ferramentas_tecnico ON public.ferramentas USING btree (tecnico_id);
CREATE INDEX idx_historico_tecnico ON public.historico_alocacao_veiculos USING btree (tecnico_id);
CREATE INDEX idx_historico_veiculo ON public.historico_alocacao_veiculos USING btree (veiculo_id);
CREATE INDEX idx_historico_status_created_at ON public.historico_status_os USING btree (created_at);
CREATE INDEX idx_historico_status_os_id ON public.historico_status_os USING btree (ordem_servico_id);
CREATE INDEX idx_importacoes_data_inicio ON public.importacoes_log USING btree (data_inicio DESC);
CREATE INDEX idx_importacoes_status ON public.importacoes_log USING btree (status);
CREATE INDEX idx_importacoes_usuario_id ON public.importacoes_log USING btree (usuario_id);
CREATE INDEX idx_itens_os_status_separacao ON public.itens_os USING btree (status_separacao);
CREATE INDEX idx_maquinas_cliente_id ON public.maquinas USING btree (cliente_id);
CREATE INDEX idx_metas_ativa ON public.metas USING btree (ativa);
CREATE INDEX idx_metas_consultor_id ON public.metas USING btree (consultor_id);
CREATE INDEX idx_metas_periodo ON public.metas USING btree (periodo_inicio, periodo_fim);
CREATE INDEX idx_metas_tipo ON public.metas USING btree (tipo_meta);
CREATE INDEX idx_mov_ferramentas_data ON public.movimentacoes_ferramentas USING btree (data_movimentacao DESC);
CREATE INDEX idx_mov_ferramentas_ferramenta ON public.movimentacoes_ferramentas USING btree (ferramenta_id);
CREATE INDEX idx_mov_ferramentas_tecnico ON public.movimentacoes_ferramentas USING btree (tecnico_id);
CREATE INDEX idx_ordens_servico_consultor_id ON public.ordens_servico USING btree (consultor_id);
CREATE INDEX idx_ordens_servico_data_abertura ON public.ordens_servico USING btree (data_abertura);
CREATE INDEX idx_ordens_servico_data_faturamento ON public.ordens_servico USING btree (data_faturamento);
CREATE INDEX idx_ordens_servico_numero_os ON public.ordens_servico USING btree (numero_os);
CREATE INDEX idx_ordens_servico_status_atual ON public.ordens_servico USING btree (status_atual);
CREATE INDEX idx_ordens_servico_tipo_os ON public.ordens_servico USING btree (tipo_os);
CREATE INDEX idx_os_data_envio_orcamento ON public.ordens_servico USING btree (data_envio_orcamento);
CREATE INDEX idx_os_data_pedido ON public.ordens_servico USING btree (data_pedido);
CREATE INDEX idx_os_numero_orcamento ON public.ordens_servico USING btree (numero_orcamento);
CREATE INDEX idx_os_numero_pedido ON public.ordens_servico USING btree (numero_pedido);
CREATE INDEX idx_os_tipo_diagnostico ON public.ordens_servico USING btree (tipo_diagnostico);
CREATE INDEX idx_pendencias_data_prevista ON public.pendencias_os USING btree (data_prevista);
CREATE INDEX idx_pendencias_os_id ON public.pendencias_os USING btree (os_id);
CREATE INDEX idx_pendencias_status ON public.pendencias_os USING btree (status);
CREATE INDEX idx_pendencias_tipo ON public.pendencias_os USING btree (tipo_pendencia);
CREATE INDEX idx_solicitacoes_compra_data ON public.solicitacoes_compra USING btree (data_solicitacao);
CREATE INDEX idx_solicitacoes_compra_os ON public.solicitacoes_compra USING btree (ordem_servico_id);
CREATE INDEX idx_solicitacoes_compra_solicitante ON public.solicitacoes_compra USING btree (solicitante_id);
CREATE INDEX idx_solicitacoes_compra_status ON public.solicitacoes_compra USING btree (status);
CREATE INDEX idx_solicitacoes_compra_urgencia ON public.solicitacoes_compra USING btree (urgencia);
CREATE INDEX idx_tecnicos_user_id ON public.tecnicos USING btree (user_id);
CREATE INDEX idx_veiculos_placa ON public.veiculos USING btree (placa);
CREATE INDEX idx_veiculos_status ON public.veiculos USING btree (status);
CREATE INDEX idx_veiculos_tecnico ON public.veiculos USING btree (tecnico_id);
CREATE INDEX idx_vistorias_data ON public.vistorias_veiculos USING btree (data_vistoria DESC);
CREATE INDEX idx_vistorias_tecnico ON public.vistorias_veiculos USING btree (tecnico_id);
CREATE INDEX idx_vistorias_veiculo ON public.vistorias_veiculos USING btree (veiculo_id);

-- ============ FUNCTIONS ============
CREATE OR REPLACE FUNCTION public.audit_ordens_servico()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_acao TEXT;
    v_usuario_id UUID;
    v_usuario_nome TEXT;
BEGIN
    -- Obter usuário atual (assumindo que está em auth.uid())
    v_usuario_id := auth.uid();
    
    -- Buscar nome do usuário
    SELECT COALESCE(first_name || ' ' || last_name, username)
    INTO v_usuario_nome
    FROM public.profiles
    WHERE id = v_usuario_id;
    
    -- Determinar ação
    IF TG_OP = 'INSERT' THEN
        v_acao := 'CRIACAO';
        INSERT INTO public.auditoria_os (os_id, usuario_id, usuario_nome, acao, dados_novos)
        VALUES (NEW.id, v_usuario_id, v_usuario_nome, v_acao, row_to_json(NEW)::jsonb);
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status_atual != NEW.status_atual THEN
            v_acao := 'MUDANCA_STATUS';
        ELSE
            v_acao := 'EDICAO';
        END IF;
        INSERT INTO public.auditoria_os (os_id, usuario_id, usuario_nome, acao, dados_anteriores, dados_novos)
        VALUES (NEW.id, v_usuario_id, v_usuario_nome, v_acao, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    ELSIF TG_OP = 'DELETE' THEN
        v_acao := 'EXCLUSAO';
        INSERT INTO public.auditoria_os (os_id, usuario_id, usuario_nome, acao, dados_anteriores)
        VALUES (OLD.id, v_usuario_id, v_usuario_nome, v_acao, row_to_json(OLD)::jsonb);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calc_total_orcamento()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.valor_liquido_total := COALESCE(NEW.valor_mao_de_obra, 0) + COALESCE(NEW.valor_pecas, 0) + COALESCE(NEW.valor_deslocamento, 0);
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_importacao_duracao()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.data_fim IS NOT NULL AND NEW.data_inicio IS NOT NULL THEN
        NEW.duracao_segundos = EXTRACT(EPOCH FROM (NEW.data_fim - NEW.data_inicio))::INTEGER;
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_item_total()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.valor_total = NEW.quantidade * NEW.valor_unitario;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_solicitacao_total()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.valor_unitario IS NOT NULL THEN
        NEW.valor_total = NEW.quantidade * NEW.valor_unitario;
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_test_user(p_email text, p_password text, p_username text, p_first_name text, p_last_name text, p_role user_role)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_user_id UUID;
    v_encrypted_pw TEXT;
    v_existing_id UUID;
BEGIN
    -- Verificar se usuário já existe
    SELECT id INTO v_existing_id FROM auth.users WHERE email = p_email;
    
    IF v_existing_id IS NOT NULL THEN
        -- Usuário já existe, apenas atualizar profile
        v_user_id := v_existing_id;
        RAISE NOTICE 'Usuário % já existe, atualizando profile...', p_email;
    ELSE
        -- Gerar novo UUID
        v_user_id := gen_random_uuid();
        
        -- Criptografar senha
        v_encrypted_pw := crypt(p_password, gen_salt('bf'));
        
        -- Inserir no auth.users
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            aud,
            role,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            v_user_id,
            '00000000-0000-0000-0000-000000000000',
            p_email,
            v_encrypted_pw,
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('first_name', p_first_name, 'last_name', p_last_name),
            'authenticated',
            'authenticated',
            NOW(),
            NOW(),
            '',
            ''
        );
        
        RAISE NOTICE 'Usuário % criado com sucesso!', p_email;
    END IF;
    
    -- Inserir/atualizar profile
    INSERT INTO public.profiles (id, username, first_name, last_name, role, is_active)
    VALUES (v_user_id, p_username, p_first_name, p_last_name, p_role, true)
    ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        role = EXCLUDED.role,
        updated_at = NOW();
    
    RETURN v_user_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.dar_baixa_estoque(p_codigo_peca text, p_quantidade integer)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_quantidade_atual INTEGER;
BEGIN
    -- Buscar quantidade atual
    SELECT quantidade_atual INTO v_quantidade_atual
    FROM public.estoque_pecas
    WHERE codigo_peca = p_codigo_peca;
    
    -- Verificar se existe e tem quantidade suficiente
    IF v_quantidade_atual IS NULL THEN
        RAISE EXCEPTION 'Peça % não encontrada no estoque', p_codigo_peca;
    END IF;
    
    IF v_quantidade_atual < p_quantidade THEN
        RAISE EXCEPTION 'Estoque insuficiente. Disponível: %, Solicitado: %', v_quantidade_atual, p_quantidade;
    END IF;
    
    -- Dar baixa
    UPDATE public.estoque_pecas
    SET quantidade_atual = quantidade_atual - p_quantidade,
        updated_at = NOW()
    WHERE codigo_peca = p_codigo_peca;
    
    RETURN true;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.dar_entrada_estoque(p_codigo_peca text, p_descricao text, p_quantidade integer, p_valor_unitario numeric DEFAULT NULL::numeric)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_peca_id UUID;
BEGIN
    -- Verificar se a peça já existe
    SELECT id INTO v_peca_id
    FROM public.estoque_pecas
    WHERE codigo_peca = p_codigo_peca;
    
    IF v_peca_id IS NOT NULL THEN
        -- Atualizar quantidade existente
        UPDATE public.estoque_pecas
        SET quantidade_atual = quantidade_atual + p_quantidade,
            valor_unitario = COALESCE(p_valor_unitario, valor_unitario),
            updated_at = NOW()
        WHERE id = v_peca_id;
    ELSE
        -- Criar novo item no estoque
        INSERT INTO public.estoque_pecas (
            codigo_peca,
            descricao,
            quantidade_atual,
            valor_unitario
        ) VALUES (
            p_codigo_peca,
            p_descricao,
            p_quantidade,
            p_valor_unitario
        )
        RETURNING id INTO v_peca_id;
    END IF;
    
    RETURN v_peca_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_orcamento_number()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    ano TEXT;
    seq_val INT;
BEGIN
    ano := to_char(CURRENT_DATE, 'YY');
    seq_val := nextval('seq_orcamentos');
    NEW.numero_orcamento := 'ORC-' || ano || '-' || lpad(seq_val::text, 4, '0');
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.gerar_alertas_os_vencidas()
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_count INTEGER := 0;
BEGIN
    INSERT INTO public.alertas (os_id, tipo_alerta, titulo, mensagem, prioridade)
    SELECT 
        id,
        'OS_VENCIDA',
        'OS #' || numero_os || ' Vencida',
        'Ordem de Serviço aberta há ' || EXTRACT(DAY FROM (NOW() - data_abertura))::INTEGER || ' dias',
        CASE 
            WHEN EXTRACT(DAY FROM (NOW() - data_abertura)) > 90 THEN 'URGENTE'
            WHEN EXTRACT(DAY FROM (NOW() - data_abertura)) > 60 THEN 'ALTA'
            ELSE 'NORMAL'
        END
    FROM public.ordens_servico
    WHERE status_atual NOT IN ('CONCLUIDA', 'FATURADA', 'CANCELADA')
    AND EXTRACT(DAY FROM (NOW() - data_abertura)) > 30
    AND NOT EXISTS (
        SELECT 1 FROM public.alertas a 
        WHERE a.os_id = ordens_servico.id 
        AND a.tipo_alerta = 'OS_VENCIDA'
        AND a.created_at > NOW() - INTERVAL '24 hours'
    );
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_monthly_stats(start_date timestamp with time zone)
 RETURNS TABLE(mes timestamp with time zone, tipo_os tipo_os, quantidade bigint, valor_total numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        DATE_TRUNC('month', data_abertura) as mes,
        ordens_servico.tipo_os,
        COUNT(*)::BIGINT as quantidade,
        SUM(valor_liquido_total) as valor_total
    FROM ordens_servico
    WHERE data_abertura >= start_date
    GROUP BY mes, tipo_os
    ORDER BY mes ASC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_solicitacoes_pendentes_count()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM public.solicitacoes_compra 
        WHERE status = 'PENDENTE'
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
    SELECT role::text FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$function$
;

CREATE OR REPLACE FUNCTION public.log_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.mark_alerta_lido()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.lido = true AND OLD.lido = false THEN
        NEW.data_leitura = NOW();
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.recalculate_os_total()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE public.ordens_servico
    SET valor_liquido_total = valor_mao_de_obra + valor_pecas + valor_deslocamento
    WHERE id = COALESCE(NEW.id, OLD.id);
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.registrar_mudanca_status_os()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Só registra se o status realmente mudou
    IF OLD.status_atual IS DISTINCT FROM NEW.status_atual THEN
        INSERT INTO public.historico_status_os (
            ordem_servico_id,
            status_anterior,
            status_novo,
            numero_orcamento,
            numero_pedido,
            tipo_diagnostico,
            localizacao_atual,
            motivo_pausa
        ) VALUES (
            NEW.id,
            OLD.status_atual::TEXT,
            NEW.status_atual::TEXT,
            NEW.numero_orcamento,
            NEW.numero_pedido,
            NEW.tipo_diagnostico,
            NEW.localizacao_atual,
            NEW.motivo_pausa
        );
    END IF;
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_despesas_os_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_ferramentas_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_veiculos_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_vistorias_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.verificar_disponibilidade_estoque(p_codigo_peca text, p_quantidade integer)
 RETURNS TABLE(disponivel boolean, quantidade_disponivel integer, quantidade_faltante integer)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(ep.quantidade_atual, 0) >= p_quantidade as disponivel,
        COALESCE(ep.quantidade_atual, 0) as quantidade_disponivel,
        GREATEST(0, p_quantidade - COALESCE(ep.quantidade_atual, 0)) as quantidade_faltante
    FROM public.estoque_pecas ep
    WHERE ep.codigo_peca = p_codigo_peca;
    
    -- Se a peça não existe no estoque, retornar valores padrão
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 0, p_quantidade;
    END IF;
END;
$function$
;

-- ============ ROW LEVEL SECURITY ============
ALTER TABLE public.anexos_os ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesas_os ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_pecas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ferramentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_alocacao_veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_status_os ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_os ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maquinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_ferramentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamentos_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tecnicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vistorias_veiculos ENABLE ROW LEVEL SECURITY;

-- ============ RLS POLICIES ============
CREATE POLICY "anexos_os_delete_policy" ON public.anexos_os AS PERMISSIVE FOR DELETE TO public
  USING ((auth.role() = 'authenticated'::text));

CREATE POLICY "anexos_os_insert_policy" ON public.anexos_os AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.role() = 'authenticated'::text));

CREATE POLICY "anexos_os_select_policy" ON public.anexos_os AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view clientes" ON public.clientes AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Gerentes e Consultores podem atualizar clientes" ON public.clientes AS PERMISSIVE FOR UPDATE TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['GERENTE'::user_role, 'CONSULTOR_GARANTIA'::user_role, 'CONSULTOR_POS_VENDA'::user_role]))))));

CREATE POLICY "Gerentes e Consultores podem criar clientes" ON public.clientes AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['GERENTE'::user_role, 'CONSULTOR_GARANTIA'::user_role, 'CONSULTOR_POS_VENDA'::user_role]))))));

CREATE POLICY "Usuários autenticados podem ver clientes" ON public.clientes AS PERMISSIVE FOR SELECT TO public
  USING ((auth.role() = 'authenticated'::text));

CREATE POLICY "Usuários autenticados podem atualizar despesas" ON public.despesas_os AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.role() = 'authenticated'::text));

CREATE POLICY "Usuários autenticados podem deletar despesas" ON public.despesas_os AS PERMISSIVE FOR DELETE TO public
  USING ((auth.role() = 'authenticated'::text));

CREATE POLICY "Usuários autenticados podem inserir despesas" ON public.despesas_os AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.role() = 'authenticated'::text));

CREATE POLICY "Usuários autenticados podem ver despesas" ON public.despesas_os AS PERMISSIVE FOR SELECT TO public
  USING ((auth.role() = 'authenticated'::text));

CREATE POLICY "almoxarifado_manage_estoque" ON public.estoque_pecas AS PERMISSIVE FOR ALL TO authenticated
  USING ((get_user_role() = ANY (ARRAY['ALMOXARIFADO'::text, 'GERENTE'::text, 'COMPRAS'::text])));

CREATE POLICY "authenticated_select_estoque" ON public.estoque_pecas AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "ferramentas_delete_all" ON public.ferramentas AS PERMISSIVE FOR DELETE TO authenticated
  USING (true);

CREATE POLICY "ferramentas_insert_all" ON public.ferramentas AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "ferramentas_select_all" ON public.ferramentas AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "ferramentas_update_all" ON public.ferramentas AS PERMISSIVE FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem atualizar histórico" ON public.historico_alocacao_veiculos AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.role() = 'authenticated'::text));

CREATE POLICY "Usuários autenticados podem inserir histórico" ON public.historico_alocacao_veiculos AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.role() = 'authenticated'::text));

CREATE POLICY "Usuários autenticados podem ver histórico" ON public.historico_alocacao_veiculos AS PERMISSIVE FOR SELECT TO public
  USING ((auth.role() = 'authenticated'::text));

CREATE POLICY "historico_status_os_insert" ON public.historico_status_os AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "historico_status_os_select" ON public.historico_status_os AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view itens_os" ON public.itens_os AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Gerentes e Consultores podem gerenciar itens" ON public.itens_os AS PERMISSIVE FOR ALL TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['GERENTE'::user_role, 'CONSULTOR_GARANTIA'::user_role, 'CONSULTOR_POS_VENDA'::user_role]))))));

CREATE POLICY "Permitir delete de itens_os para usuarios autenticados" ON public.itens_os AS PERMISSIVE FOR DELETE TO authenticated
  USING (true);

CREATE POLICY "Permitir insert de itens_os para usuarios autenticados" ON public.itens_os AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Permitir select de itens_os para usuarios autenticados" ON public.itens_os AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Permitir update de itens_os para usuarios autenticados" ON public.itens_os AS PERMISSIVE FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem ver itens" ON public.itens_os AS PERMISSIVE FOR SELECT TO public
  USING ((auth.role() = 'authenticated'::text));

CREATE POLICY "managers_full_access_items" ON public.itens_os AS PERMISSIVE FOR ALL TO authenticated
  USING ((get_user_role() = ANY (ARRAY['CHEFE_OFICINA'::text, 'CONSULTOR_GARANTIA'::text, 'CONSULTOR_POS_VENDA'::text, 'GERENTE'::text])));

CREATE POLICY "tecnico_insert_items_own_os" ON public.itens_os AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (((get_user_role() = 'TECNICO'::text) AND (EXISTS ( SELECT 1
   FROM ordens_servico os
  WHERE ((os.id = itens_os.ordem_servico_id) AND (os.tecnico_id = auth.uid()))))));

CREATE POLICY "tecnico_select_own_os_items" ON public.itens_os AS PERMISSIVE FOR SELECT TO authenticated
  USING (((get_user_role() = 'TECNICO'::text) AND (EXISTS ( SELECT 1
   FROM ordens_servico os
  WHERE ((os.id = itens_os.ordem_servico_id) AND (os.tecnico_id = auth.uid()))))));

CREATE POLICY "Authenticated users can view maquinas" ON public.maquinas AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Gerentes e Consultores podem gerenciar máquinas" ON public.maquinas AS PERMISSIVE FOR ALL TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['GERENTE'::user_role, 'CONSULTOR_GARANTIA'::user_role, 'CONSULTOR_POS_VENDA'::user_role]))))));

CREATE POLICY "Usuários autenticados podem ver máquinas" ON public.maquinas AS PERMISSIVE FOR SELECT TO public
  USING ((auth.role() = 'authenticated'::text));

CREATE POLICY "mov_ferramentas_insert_all" ON public.movimentacoes_ferramentas AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "mov_ferramentas_select_all" ON public.movimentacoes_ferramentas AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Acesso total orçamentos" ON public.orcamentos_servico AS PERMISSIVE FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Apenas Gerentes podem deletar OS" ON public.ordens_servico AS PERMISSIVE FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'GERENTE'::user_role)))));

CREATE POLICY "Authenticated users can insert ordens_servico" ON public.ordens_servico AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update ordens_servico" ON public.ordens_servico AS PERMISSIVE FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view ordens_servico" ON public.ordens_servico AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Gerentes e Consultores podem atualizar OS" ON public.ordens_servico AS PERMISSIVE FOR UPDATE TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['GERENTE'::user_role, 'CONSULTOR_GARANTIA'::user_role, 'CONSULTOR_POS_VENDA'::user_role]))))));

CREATE POLICY "Gerentes e Consultores podem criar OS" ON public.ordens_servico AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['GERENTE'::user_role, 'CONSULTOR_GARANTIA'::user_role, 'CONSULTOR_POS_VENDA'::user_role]))))));

CREATE POLICY "Usuários autenticados podem ver OS" ON public.ordens_servico AS PERMISSIVE FOR SELECT TO public
  USING ((auth.role() = 'authenticated'::text));

CREATE POLICY "chefe_oficina_select_all_os" ON public.ordens_servico AS PERMISSIVE FOR SELECT TO authenticated
  USING ((get_user_role() = 'CHEFE_OFICINA'::text));

CREATE POLICY "chefe_oficina_update_all_os" ON public.ordens_servico AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((get_user_role() = 'CHEFE_OFICINA'::text));

CREATE POLICY "consultores_manage_os" ON public.ordens_servico AS PERMISSIVE FOR ALL TO authenticated
  USING ((get_user_role() = ANY (ARRAY['CONSULTOR_GARANTIA'::text, 'CONSULTOR_POS_VENDA'::text])));

CREATE POLICY "gerente_full_access_os" ON public.ordens_servico AS PERMISSIVE FOR ALL TO authenticated
  USING ((get_user_role() = 'GERENTE'::text));

CREATE POLICY "tecnico_select_own_os" ON public.ordens_servico AS PERMISSIVE FOR SELECT TO authenticated
  USING (((get_user_role() = 'TECNICO'::text) AND (tecnico_id = auth.uid())));

CREATE POLICY "tecnico_update_own_os" ON public.ordens_servico AS PERMISSIVE FOR UPDATE TO authenticated
  USING (((get_user_role() = 'TECNICO'::text) AND (tecnico_id = auth.uid())))
  WITH CHECK (((get_user_role() = 'TECNICO'::text) AND (tecnico_id = auth.uid())));

CREATE POLICY "Permitir leitura de perfis" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Permitir leitura de perfis autenticados" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Permitir update próprio perfil" ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((auth.uid() = id));

CREATE POLICY "Service role has full access" ON public.profiles AS PERMISSIVE FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can insert own profile" ON public.profiles AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = id));

CREATE POLICY "Users can update own profile" ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((auth.uid() = id))
  WITH CHECK ((auth.uid() = id));

CREATE POLICY "Users can view own profile" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated
  USING ((auth.uid() = id));

CREATE POLICY "Usuários podem atualizar apenas seu próprio perfil" ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((auth.uid() = id))
  WITH CHECK ((auth.uid() = id));

CREATE POLICY "authenticated_users_read_all_profiles" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "chefe_oficina_create_tecnico_profiles" ON public.profiles AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (((get_user_role() = ANY (ARRAY['CHEFE_OFICINA'::text, 'GERENTE'::text])) AND (role = 'TECNICO'::user_role)));

CREATE POLICY "service_role_insert_profiles" ON public.profiles AS PERMISSIVE FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "users_update_own_profile_only" ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((auth.uid() = id))
  WITH CHECK ((auth.uid() = id));

CREATE POLICY "Gerentes e Compras podem criar solicitações" ON public.solicitacoes_compra AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Gerentes e Compras podem editar solicitações" ON public.solicitacoes_compra AS PERMISSIVE FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Permitir delete solicitacoes_compra para autenticados" ON public.solicitacoes_compra AS PERMISSIVE FOR DELETE TO authenticated
  USING (true);

CREATE POLICY "Permitir insert solicitacoes_compra para autenticados" ON public.solicitacoes_compra AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Permitir select solicitacoes_compra para autenticados" ON public.solicitacoes_compra AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Permitir update solicitacoes_compra para autenticados" ON public.solicitacoes_compra AS PERMISSIVE FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem ver solicitações" ON public.solicitacoes_compra AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view tecnicos" ON public.tecnicos AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Gerentes podem gerenciar técnicos" ON public.tecnicos AS PERMISSIVE FOR ALL TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'GERENTE'::user_role)))));

CREATE POLICY "Permitir leitura para usuários autenticados" ON public.tecnicos AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Permitir update para Gerentes e Chefe de Oficina" ON public.tecnicos AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['GERENTE'::user_role, 'CONSULTOR_POS_VENDA'::user_role]))))));

CREATE POLICY "Usuários autenticados podem ver técnicos" ON public.tecnicos AS PERMISSIVE FOR SELECT TO public
  USING ((auth.role() = 'authenticated'::text));

CREATE POLICY "authenticated_select_tecnicos" ON public.tecnicos AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "managers_manage_tecnicos" ON public.tecnicos AS PERMISSIVE FOR ALL TO authenticated
  USING ((get_user_role() = ANY (ARRAY['GERENTE'::text, 'CHEFE_OFICINA'::text])));

CREATE POLICY "Usuários autenticados podem atualizar veículos" ON public.veiculos AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.role() = 'authenticated'::text));

CREATE POLICY "Usuários autenticados podem deletar veículos" ON public.veiculos AS PERMISSIVE FOR DELETE TO public
  USING ((auth.role() = 'authenticated'::text));

CREATE POLICY "Usuários autenticados podem inserir veículos" ON public.veiculos AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.role() = 'authenticated'::text));

CREATE POLICY "Usuários autenticados podem ver veículos" ON public.veiculos AS PERMISSIVE FOR SELECT TO public
  USING ((auth.role() = 'authenticated'::text));

CREATE POLICY "vistorias_delete_all" ON public.vistorias_veiculos AS PERMISSIVE FOR DELETE TO authenticated
  USING (true);

CREATE POLICY "vistorias_insert_all" ON public.vistorias_veiculos AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "vistorias_select_all" ON public.vistorias_veiculos AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "vistorias_update_all" ON public.vistorias_veiculos AS PERMISSIVE FOR UPDATE TO authenticated
  USING (true);

-- ============ TRIGGERS ============
CREATE TRIGGER mark_alerta_lido_trigger BEFORE UPDATE OF lido ON public.alertas FOR EACH ROW EXECUTE FUNCTION mark_alerta_lido();
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_despesas_os_updated_at BEFORE UPDATE ON public.despesas_os FOR EACH ROW EXECUTE FUNCTION update_despesas_os_updated_at();
CREATE TRIGGER update_estoque_pecas_updated_at BEFORE UPDATE ON public.estoque_pecas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_ferramentas_updated_at BEFORE UPDATE ON public.ferramentas FOR EACH ROW EXECUTE FUNCTION update_ferramentas_updated_at();
CREATE TRIGGER calculate_importacao_duracao_trigger BEFORE UPDATE OF data_fim ON public.importacoes_log FOR EACH ROW EXECUTE FUNCTION calculate_importacao_duracao();
CREATE TRIGGER calculate_itens_os_total BEFORE INSERT OR UPDATE ON public.itens_os FOR EACH ROW EXECUTE FUNCTION calculate_item_total();
CREATE TRIGGER update_maquinas_updated_at BEFORE UPDATE ON public.maquinas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_metas_updated_at BEFORE UPDATE ON public.metas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_calc_total_orcamento BEFORE INSERT OR UPDATE OF valor_mao_de_obra, valor_pecas, valor_deslocamento ON public.orcamentos_servico FOR EACH ROW EXECUTE FUNCTION calc_total_orcamento();
CREATE TRIGGER trg_generate_orcamento_number BEFORE INSERT ON public.orcamentos_servico FOR EACH ROW WHEN (((new.numero_orcamento IS NULL) OR ((new.numero_orcamento)::text = ''::text))) EXECUTE FUNCTION generate_orcamento_number();
CREATE TRIGGER trg_orcamentos_updated_at BEFORE UPDATE ON public.orcamentos_servico FOR EACH ROW EXECUTE FUNCTION log_updated_at();
CREATE TRIGGER audit_ordens_servico_trigger AFTER INSERT OR DELETE OR UPDATE ON public.ordens_servico FOR EACH ROW EXECUTE FUNCTION audit_ordens_servico();
CREATE TRIGGER recalculate_os_total_trigger AFTER INSERT OR UPDATE OF valor_mao_de_obra, valor_pecas, valor_deslocamento ON public.ordens_servico FOR EACH ROW EXECUTE FUNCTION recalculate_os_total();
CREATE TRIGGER trigger_registrar_mudanca_status AFTER UPDATE OF status_atual ON public.ordens_servico FOR EACH ROW EXECUTE FUNCTION registrar_mudanca_status_os();
CREATE TRIGGER update_ordens_servico_updated_at BEFORE UPDATE ON public.ordens_servico FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pendencias_os_updated_at BEFORE UPDATE ON public.pendencias_os FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER calculate_solicitacao_total_trigger BEFORE INSERT OR UPDATE ON public.solicitacoes_compra FOR EACH ROW EXECUTE FUNCTION calculate_solicitacao_total();
CREATE TRIGGER update_solicitacoes_compra_updated_at BEFORE UPDATE ON public.solicitacoes_compra FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tecnicos_updated_at BEFORE UPDATE ON public.tecnicos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_veiculos_updated_at BEFORE UPDATE ON public.veiculos FOR EACH ROW EXECUTE FUNCTION update_veiculos_updated_at();
CREATE TRIGGER trigger_vistorias_updated_at BEFORE UPDATE ON public.vistorias_veiculos FOR EACH ROW EXECUTE FUNCTION update_vistorias_updated_at();

-- ============ VIEWS ============
CREATE OR REPLACE VIEW public.os_completa AS
SELECT os.id,
    os.numero_os,
    os.tipo_os,
    os.status_atual,
    os.data_abertura,
    os.data_fechamento,
    os.data_faturamento,
    os.tecnico_id,
    os.cliente_id,
    os.maquina_id,
    os.consultor_id,
    os.nome_cliente_digitavel,
    os.modelo_maquina,
    os.chassi,
    os.descricao_problema,
    os.solucao_aplicada,
    os.observacoes,
    os.valor_mao_de_obra,
    os.valor_pecas,
    os.valor_deslocamento,
    os.valor_liquido_total,
    os.created_at,
    os.updated_at,
    c.nome_cliente AS cliente_nome,
    c.telefone AS cliente_telefone,
    t.nome_completo AS tecnico_nome,
    p.username AS consultor_username,
    (p.first_name || ' '::text) || p.last_name AS consultor_nome,
    m.modelo AS maquina_modelo,
    m.chassi AS maquina_chassi
   FROM ordens_servico os
     LEFT JOIN clientes c ON os.cliente_id = c.id
     LEFT JOIN tecnicos t ON os.tecnico_id = t.id
     LEFT JOIN profiles p ON os.consultor_id = p.id
     LEFT JOIN maquinas m ON os.maquina_id = m.id
;

CREATE OR REPLACE VIEW public.vw_os_estatisticas AS
SELECT os.id,
    os.numero_os,
    os.tipo_os,
    os.status_atual,
    os.data_abertura,
    os.data_fechamento,
    os.valor_liquido_total,
    EXTRACT(day FROM COALESCE(os.data_fechamento, now()) - os.data_abertura)::integer AS dias_em_aberto,
        CASE
            WHEN EXTRACT(day FROM COALESCE(os.data_fechamento, now()) - os.data_abertura) > 90::numeric THEN 'CRITICO'::text
            WHEN EXTRACT(day FROM COALESCE(os.data_fechamento, now()) - os.data_abertura) > 60::numeric THEN 'ALTO'::text
            WHEN EXTRACT(day FROM COALESCE(os.data_fechamento, now()) - os.data_abertura) > 30::numeric THEN 'MEDIO'::text
            ELSE 'NORMAL'::text
        END AS nivel_urgencia,
    c.nome_cliente AS cliente_nome,
    p.username AS consultor_nome,
    ( SELECT count(*) AS count
           FROM pendencias_os
          WHERE pendencias_os.os_id = os.id AND pendencias_os.status <> 'RESOLVIDO'::text) AS pendencias_ativas
   FROM ordens_servico os
     LEFT JOIN clientes c ON os.cliente_id = c.id
     LEFT JOIN profiles p ON os.consultor_id = p.id
;

CREATE OR REPLACE VIEW public.vw_os_motivos_abertura AS
SELECT id,
    numero_os,
    status_atual::text AS status_atual,
    data_abertura,
    EXTRACT(day FROM now() - data_abertura)::integer AS dias_aberta,
        CASE
            WHEN status_atual::text = 'AGUARDANDO_APROVACAO_ORCAMENTO'::text THEN 'Aguardando aprovação de orçamento #'::text || COALESCE(numero_orcamento, 'N/A'::character varying)::text
            WHEN status_atual::text = 'AGUARDANDO_PECAS'::text THEN 'Aguardando chegada de peças - Pedido #'::text || COALESCE(numero_pedido, 'N/A'::character varying)::text
            WHEN status_atual::text = 'AGUARDANDO_PAGAMENTO'::text THEN 'Aguardando pagamento - Serviço concluído em '::text || COALESCE(to_char(data_conclusao_servico, 'DD/MM/YYYY'::text), 'data não informada'::text)
            WHEN status_atual::text = 'EM_DIAGNOSTICO'::text THEN ('Em diagnóstico '::text || COALESCE(tipo_diagnostico, ''::character varying)::text) ||
            CASE
                WHEN observacoes_diagnostico IS NOT NULL THEN ' - '::text || "left"(observacoes_diagnostico, 50)
                ELSE ''::text
            END
            WHEN status_atual::text = 'EM_TRANSITO'::text THEN ('Em deslocamento - '::text || COALESCE(localizacao_atual, 'Localização não informada'::character varying)::text) ||
            CASE
                WHEN roteiro IS NOT NULL THEN ' | Roteiro: '::text || roteiro
                ELSE ''::text
            END
            WHEN status_atual::text = 'EM_EXECUCAO'::text THEN 'Em execução pelo técnico'::text
            WHEN status_atual::text = 'PAUSADA'::text THEN 'Pausada: '::text || COALESCE(motivo_pausa, 'Sem motivo informado'::text)
            ELSE 'Outro motivo'::text
        END AS motivo_detalhado,
        CASE
            WHEN status_atual::text = 'AGUARDANDO_APROVACAO_ORCAMENTO'::text THEN EXTRACT(day FROM now() - data_envio_orcamento)::integer
            WHEN status_atual::text = 'AGUARDANDO_PECAS'::text THEN EXTRACT(day FROM now() - data_pedido)::integer
            WHEN status_atual::text = 'AGUARDANDO_PAGAMENTO'::text THEN EXTRACT(day FROM now() - data_conclusao_servico)::integer
            WHEN status_atual::text = 'EM_DIAGNOSTICO'::text THEN EXTRACT(day FROM now() - data_inicio_diagnostico)::integer
            WHEN status_atual::text = 'EM_TRANSITO'::text THEN EXTRACT(day FROM now() - data_saida)::integer
            WHEN status_atual::text = 'PAUSADA'::text THEN EXTRACT(day FROM now() - data_pausa)::integer
            ELSE NULL::integer
        END AS dias_no_status_atual,
    numero_orcamento,
    numero_pedido,
    data_conclusao_servico,
    valor_servico,
    tipo_diagnostico,
    localizacao_atual,
    roteiro,
    previsao_retorno,
    previsao_chegada_pecas,
    motivo_pausa,
    tecnico_id,
    cliente_id,
    consultor_id,
    nome_cliente_digitavel,
    modelo_maquina
   FROM ordens_servico os
  WHERE status_atual::text <> ALL (ARRAY['CONCLUIDA'::text, 'FATURADA'::text, 'CANCELADA'::text])
;

CREATE OR REPLACE VIEW public.vw_os_profitability AS
WITH os_revenues AS (
         SELECT ordens_servico.id AS os_id,
            ordens_servico.data_abertura,
            ordens_servico.status_atual,
            COALESCE(ordens_servico.valor_mao_de_obra, 0::numeric) AS receita_mao_de_obra,
            COALESCE(ordens_servico.valor_pecas, 0::numeric) AS receita_pecas,
            COALESCE(ordens_servico.valor_deslocamento, 0::numeric) AS receita_deslocamento,
            COALESCE(ordens_servico.valor_liquido_total, 0::numeric) AS receita_total
           FROM ordens_servico
        ), os_costs AS (
         SELECT despesas_os.ordem_servico_id AS os_id,
            sum(
                CASE
                    WHEN despesas_os.tipo::text = 'KM'::text THEN despesas_os.valor_total
                    ELSE 0::numeric
                END) AS custo_deslocamento,
            sum(
                CASE
                    WHEN despesas_os.tipo::text = 'ABASTECIMENTO'::text THEN despesas_os.valor_total
                    ELSE 0::numeric
                END) AS custo_combustivel,
            sum(
                CASE
                    WHEN despesas_os.tipo::text = 'ALIMENTACAO'::text THEN despesas_os.valor_total
                    ELSE 0::numeric
                END) AS custo_alimentacao,
            sum(
                CASE
                    WHEN despesas_os.tipo::text = 'HOSPEDAGEM'::text THEN despesas_os.valor_total
                    ELSE 0::numeric
                END) AS custo_hospedagem,
            sum(
                CASE
                    WHEN despesas_os.tipo::text = 'PEDAGIO'::text THEN despesas_os.valor_total
                    ELSE 0::numeric
                END) AS custo_pedagio,
            sum(
                CASE
                    WHEN despesas_os.tipo::text = 'MAO_DE_OBRA'::text THEN despesas_os.valor_total
                    ELSE 0::numeric
                END) AS custo_mao_de_obra,
            sum(
                CASE
                    WHEN despesas_os.tipo::text = 'OUTROS'::text THEN despesas_os.valor_total
                    ELSE 0::numeric
                END) AS custo_outros,
            sum(despesas_os.valor_total) AS custo_total_despesas
           FROM despesas_os
          GROUP BY despesas_os.ordem_servico_id
        ), os_parts_costs AS (
         SELECT solicitacoes_compra.ordem_servico_id AS os_id,
            sum(COALESCE(solicitacoes_compra.valor_total, 0::numeric)) AS custo_pecas
           FROM solicitacoes_compra
          WHERE solicitacoes_compra.status <> 'CANCELADO'::text
          GROUP BY solicitacoes_compra.ordem_servico_id
        )
 SELECT r.os_id,
    r.data_abertura,
    r.status_atual,
    r.receita_mao_de_obra,
    r.receita_pecas,
    r.receita_deslocamento,
    r.receita_total,
    COALESCE(c.custo_deslocamento, 0::numeric) AS custo_deslocamento,
    COALESCE(c.custo_combustivel, 0::numeric) AS custo_combustivel,
    COALESCE(c.custo_alimentacao, 0::numeric) AS custo_alimentacao,
    COALESCE(c.custo_hospedagem, 0::numeric) AS custo_hospedagem,
    COALESCE(c.custo_pedagio, 0::numeric) AS custo_pedagio,
    COALESCE(c.custo_mao_de_obra, 0::numeric) AS custo_mao_de_obra,
    COALESCE(c.custo_outros, 0::numeric) AS custo_outros,
    COALESCE(p.custo_pecas, 0::numeric) AS custo_pecas,
    COALESCE(c.custo_total_despesas, 0::numeric) + COALESCE(p.custo_pecas, 0::numeric) AS custo_total,
    r.receita_total - (COALESCE(c.custo_total_despesas, 0::numeric) + COALESCE(p.custo_pecas, 0::numeric)) AS lucro_bruto,
        CASE
            WHEN r.receita_total > 0::numeric THEN (r.receita_total - (COALESCE(c.custo_total_despesas, 0::numeric) + COALESCE(p.custo_pecas, 0::numeric))) / r.receita_total * 100::numeric
            ELSE 0::numeric
        END AS margem_percentual
   FROM os_revenues r
     LEFT JOIN os_costs c ON r.os_id = c.os_id
     LEFT JOIN os_parts_costs p ON r.os_id = p.os_id
;

CREATE OR REPLACE VIEW public.vw_pecas_pendentes_separacao AS
SELECT io.id AS item_id,
    io.ordem_servico_id,
    os.numero_os,
    os.nome_cliente_digitavel AS cliente,
    io.codigo_peca,
    io.descricao,
    io.quantidade,
    COALESCE(ep.unidade, 'UN'::text) AS unidade,
    io.status_separacao,
    ep.quantidade_atual AS estoque_disponivel,
        CASE
            WHEN ep.quantidade_atual >= io.quantidade THEN 'DISPONIVEL'::text
            WHEN ep.quantidade_atual > 0 THEN 'PARCIAL'::text
            ELSE 'INDISPONIVEL'::text
        END AS disponibilidade,
    t.nome_completo AS tecnico_responsavel,
    io.created_at AS data_solicitacao
   FROM itens_os io
     JOIN ordens_servico os ON io.ordem_servico_id = os.id
     LEFT JOIN estoque_pecas ep ON io.codigo_peca = ep.codigo_peca
     LEFT JOIN tecnicos t ON os.tecnico_id = t.user_id
  WHERE io.status_separacao = ANY (ARRAY['PENDENTE'::text, 'AGUARDANDO_COMPRA'::text])
  ORDER BY (
        CASE io.status_separacao
            WHEN 'PENDENTE'::text THEN 1
            ELSE 2
        END), io.created_at
;

CREATE OR REPLACE VIEW public.vw_solicitacoes_pendentes AS
SELECT sc.id,
    sc.ordem_servico_id,
    sc.codigo_peca,
    sc.descricao_peca,
    sc.quantidade,
    sc.unidade,
    sc.urgencia,
    sc.status,
    sc.data_solicitacao,
    sc.data_previsao_entrega,
    sc.data_entrega_real,
    sc.fornecedor,
    sc.valor_unitario,
    sc.valor_total,
    sc.numero_pedido_fornecedor,
    sc.solicitante_id,
    sc.comprador_id,
    sc.observacoes,
    sc.motivo_cancelamento,
    sc.created_at,
    sc.updated_at,
    os.numero_os,
    os.nome_cliente_digitavel AS cliente,
    os.modelo_maquina,
    (p.first_name || ' '::text) || COALESCE(p.last_name, ''::text) AS solicitante_nome,
    EXTRACT(day FROM now() - sc.data_solicitacao) AS dias_aguardando
   FROM solicitacoes_compra sc
     LEFT JOIN ordens_servico os ON sc.ordem_servico_id = os.id
     LEFT JOIN profiles p ON sc.solicitante_id = p.id
  WHERE sc.status <> ALL (ARRAY['ENTREGUE'::text, 'CANCELADO'::text])
  ORDER BY (
        CASE sc.urgencia
            WHEN 'CRITICA'::text THEN 1
            WHEN 'ALTA'::text THEN 2
            WHEN 'MEDIA'::text THEN 3
            ELSE 4
        END), sc.data_solicitacao
;
