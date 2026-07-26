export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export type UserRole = 'GERENTE' | 'CONSULTOR_GARANTIA' | 'CONSULTOR_POS_VENDA' | 'CHEFE_OFICINA' | 'TECNICO' | 'ALMOXARIFADO' | 'COMPRAS' | 'FERAMENTAL';
export type TipoOS = 'NORMAL' | 'GARANTIA';
export type StatusOS = 'AGUARDANDO_ATRIBUICAO' | 'EM_EXECUCAO' | 'AGUARDANDO_PECAS' | 'PAUSADA' | 'CONCLUIDA' | 'FATURADA' | 'CANCELADA' | 'AGUARDANDO_APROVACAO_ORCAMENTO' | 'AGUARDANDO_PAGAMENTO' | 'EM_DIAGNOSTICO' | 'EM_TRANSITO';
export type StatusDisponibilidadeTecnico = 'DISPONIVEL' | 'EM_TREINAMENTO' | 'AUSENTE' | 'FERIAS';
export type TipoDiagnostico = 'SIMPLES' | 'COMPLEXO' | 'ESPECIALIZADO';

// Novos tipos para melhorias
export type TipoPendencia = 'PECAS' | 'SERVICO' | 'TERCEIROS' | 'GARANTIA' | 'CLIENTE' | 'OUTROS';
export type StatusPendencia = 'PENDENTE' | 'EM_ANDAMENTO' | 'RESOLVIDO' | 'CANCELADO';
export type TipoAlerta = 'OS_VENCIDA' | 'GARANTIA_PENDENTE' | 'PECAS_CHEGANDO' | 'PREVISAO_ENTREGA' | 'META_FATURAMENTO' | 'OUTROS' | 'NOVA_OS' | 'OS_ATRIBUIDA' | 'PECAS_SOLICITADAS' | 'COMPRA_NECESSARIA' | 'STATUS_ALTERADO';
export type PrioridadeAlerta = 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE';
export type AcaoAuditoria = 'CRIACAO' | 'EDICAO' | 'EXCLUSAO' | 'MUDANCA_STATUS' | 'OUTROS';
export type TipoMeta = 'FATURAMENTO' | 'QUANTIDADE_OS' | 'TEMPO_RESOLUCAO' | 'SATISFACAO' | 'BACKLOG' | 'OUTROS';
export type TipoImportacao = 'INCREMENTAL' | 'FULL' | 'MERGE';
export type StatusImportacao = 'INICIADO' | 'PROCESSANDO' | 'SUCESSO' | 'ERRO' | 'CANCELADO';
export type NivelUrgencia = 'NORMAL' | 'MEDIO' | 'ALTO' | 'CRITICO';
export type StatusOrcamento = 'EM_ELABORACAO' | 'ENVIADO_CLIENTE' | 'APROVADO' | 'REPROVADO' | 'CONVERTIDO_OS';
export type StatusAprovacaoPeca = 'PENDENTE_CONSULTOR' | 'APROVADO' | 'REPROVADO';

export interface Database {
    __InternalSupabase: {
        PostgrestVersion: '12';
    };
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    username: string;
                    first_name: string | null;
                    last_name: string | null;
                    role: UserRole;
                    is_active: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    username: string;
                    first_name?: string | null;
                    last_name?: string | null;
                    role?: UserRole;
                    is_active?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    username?: string;
                    first_name?: string | null;
                    last_name?: string | null;
                    role?: UserRole;
                    is_active?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [];
            };
            orcamentos_servico: {
                Row: {
                    id: string;
                    numero_orcamento: string;
                    cliente_id: string | null;
                    nome_cliente_digitavel: string | null;
                    maquina_id: string | null;
                    modelo_maquina: string | null;
                    chassi: string | null;
                    descricao_problema: string | null;
                    valor_mao_de_obra: number;
                    valor_pecas: number;
                    valor_deslocamento: number;
                    valor_liquido_total: number;
                    tipo_diagnostico: string | null;
                    status_orcamento: StatusOrcamento;
                    consultor_id: string | null;
                    data_criacao: string;
                    data_aprovacao: string | null;
                    updated_at: string;
                    observacoes: string | null;
                    pdf_nbs_url: string | null;
                    itens_orcamento: Json | null;
                };
                Insert: {
                    id?: string;
                    numero_orcamento?: string;
                    cliente_id?: string | null;
                    nome_cliente_digitavel?: string | null;
                    maquina_id?: string | null;
                    modelo_maquina?: string | null;
                    chassi?: string | null;
                    descricao_problema?: string | null;
                    valor_mao_de_obra?: number;
                    valor_pecas?: number;
                    valor_deslocamento?: number;
                    valor_liquido_total?: number;
                    tipo_diagnostico?: string | null;
                    status_orcamento?: StatusOrcamento;
                    consultor_id?: string | null;
                    data_criacao?: string;
                    data_aprovacao?: string | null;
                    updated_at?: string;
                    observacoes?: string | null;
                    pdf_nbs_url?: string | null;
                    itens_orcamento?: Json | null;
                };
                Update: {
                    id?: string;
                    numero_orcamento?: string;
                    cliente_id?: string | null;
                    nome_cliente_digitavel?: string | null;
                    maquina_id?: string | null;
                    modelo_maquina?: string | null;
                    chassi?: string | null;
                    descricao_problema?: string | null;
                    valor_mao_de_obra?: number;
                    valor_pecas?: number;
                    valor_deslocamento?: number;
                    valor_liquido_total?: number;
                    tipo_diagnostico?: string | null;
                    status_orcamento?: StatusOrcamento;
                    consultor_id?: string | null;
                    data_criacao?: string;
                    data_aprovacao?: string | null;
                    updated_at?: string;
                    observacoes?: string | null;
                    pdf_nbs_url?: string | null;
                    itens_orcamento?: Json | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "orcamentos_servico_cliente_id_fkey";
                        columns: ["cliente_id"];
                        isOneToOne: false;
                        referencedRelation: "clientes";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "orcamentos_servico_consultor_id_fkey";
                        columns: ["consultor_id"];
                        isOneToOne: false;
                        referencedRelation: "profiles";
                        referencedColumns: ["id"];
                    }
                ];
            };
            clientes: {
                Row: {
                    id: string;
                    nome_cliente: string;
                    telefone: string | null;
                    email: string | null;
                    endereco: string | null;
                    cpf_cnpj: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    nome_cliente: string;
                    telefone?: string | null;
                    email?: string | null;
                    endereco?: string | null;
                    cpf_cnpj?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    nome_cliente?: string;
                    telefone?: string | null;
                    email?: string | null;
                    endereco?: string | null;
                    cpf_cnpj?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [];
            };
            maquinas: {
                Row: {
                    id: string;
                    chassi: string;
                    modelo: string;
                    cliente_id: string;
                    ano: number | null;
                    horas_uso: number | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    chassi: string;
                    modelo: string;
                    cliente_id: string;
                    ano?: number | null;
                    horas_uso?: number | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    chassi?: string;
                    modelo?: string;
                    cliente_id?: string;
                    ano?: number | null;
                    horas_uso?: number | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "maquinas_cliente_id_fkey";
                        columns: ["cliente_id"];
                        isOneToOne: false;
                        referencedRelation: "clientes";
                        referencedColumns: ["id"];
                    }
                ];
            };
            ordens_servico: {
                Row: {
                    id: string;
                    numero_os: string;
                    tipo_os: TipoOS;
                    status_atual: StatusOS;
                    data_abertura: string;
                    data_fechamento: string | null;
                    data_faturamento: string | null;
                    tecnico_id: string | null;
                    cliente_id: string | null;
                    maquina_id: string | null;
                    consultor_id: string | null;
                    nome_cliente_digitavel: string | null;
                    modelo_maquina: string | null;
                    chassi: string | null;
                    descricao_problema: string | null;
                    solucao_aplicada: string | null;
                    observacoes: string | null;
                    valor_mao_de_obra: number;
                    valor_pecas: number;
                    valor_deslocamento: number;
                    valor_liquido_total: number;
                    nivel_urgencia: NivelUrgencia;
                    created_at: string;
                    updated_at: string;
                    data_agendamento: string | null;
                    // Campos para motivos de abertura
                    numero_orcamento: string | null;
                    data_envio_orcamento: string | null;
                    numero_pedido: string | null;
                    data_pedido: string | null;
                    previsao_chegada_pecas: string | null;
                    data_conclusao_servico: string | null;
                    valor_servico: number | null;
                    motivo_pausa: string | null;
                    data_pausa: string | null;
                    data_inicio_diagnostico: string | null;
                    tipo_diagnostico: TipoDiagnostico | null;
                    observacoes_diagnostico: string | null;
                    data_saida: string | null;
                    previsao_retorno: string | null;
                    localizacao_atual: string | null;
                    roteiro: string | null;
                    aol: string | null;
                    data_faturamento_fabrica: string | null;
                    link_pdf_os: string | null;
                    orcamento_id: string | null;
                    itens_orcamento: Json | null;
                };
                Insert: {
                    id?: string;
                    numero_os: string;
                    tipo_os?: TipoOS;
                    status_atual?: StatusOS;
                    data_abertura?: string;
                    data_fechamento?: string | null;
                    data_faturamento?: string | null;
                    tecnico_id?: string | null;
                    cliente_id?: string | null;
                    maquina_id?: string | null;
                    consultor_id?: string | null;
                    nome_cliente_digitavel?: string | null;
                    modelo_maquina?: string | null;
                    chassi?: string | null;
                    descricao_problema?: string | null;
                    solucao_aplicada?: string | null;
                    observacoes?: string | null;
                    valor_mao_de_obra?: number;
                    valor_pecas?: number;
                    valor_deslocamento?: number;
                    valor_liquido_total?: number;
                    nivel_urgencia?: NivelUrgencia;
                    created_at?: string;
                    updated_at?: string;
                    data_agendamento?: string | null;
                    // Campos para motivos de abertura (Insert)
                    numero_orcamento?: string | null;
                    data_envio_orcamento?: string | null;
                    numero_pedido?: string | null;
                    data_pedido?: string | null;
                    previsao_chegada_pecas?: string | null;
                    data_conclusao_servico?: string | null;
                    valor_servico?: number | null;
                    motivo_pausa?: string | null;
                    data_pausa?: string | null;
                    data_inicio_diagnostico?: string | null;
                    tipo_diagnostico?: TipoDiagnostico | null;
                    observacoes_diagnostico?: string | null;
                    data_saida?: string | null;
                    previsao_retorno?: string | null;
                    localizacao_atual?: string | null;
                    roteiro?: string | null;
                    orcamento_id?: string | null;
                    itens_orcamento?: Json | null;
                };
                Update: {
                    id?: string;
                    numero_os?: string;
                    tipo_os?: TipoOS;
                    status_atual?: StatusOS;
                    data_abertura?: string;
                    data_fechamento?: string | null;
                    data_faturamento?: string | null;
                    tecnico_id?: string | null;
                    cliente_id?: string | null;
                    maquina_id?: string | null;
                    consultor_id?: string | null;
                    nome_cliente_digitavel?: string | null;
                    modelo_maquina?: string | null;
                    chassi?: string | null;
                    descricao_problema?: string | null;
                    solucao_aplicada?: string | null;
                    observacoes?: string | null;
                    valor_mao_de_obra?: number;
                    valor_pecas?: number;
                    valor_deslocamento?: number;
                    valor_liquido_total?: number;
                    nivel_urgencia?: NivelUrgencia;
                    created_at?: string;
                    updated_at?: string;
                    data_agendamento?: string | null;
                    // Campos para motivos de abertura (Update)
                    numero_orcamento?: string | null;
                    data_envio_orcamento?: string | null;
                    numero_pedido?: string | null;
                    data_pedido?: string | null;
                    previsao_chegada_pecas?: string | null;
                    data_conclusao_servico?: string | null;
                    valor_servico?: number | null;
                    motivo_pausa?: string | null;
                    data_pausa?: string | null;
                    data_inicio_diagnostico?: string | null;
                    tipo_diagnostico?: TipoDiagnostico | null;
                    observacoes_diagnostico?: string | null;
                    data_saida?: string | null;
                    previsao_retorno?: string | null;
                    localizacao_atual?: string | null;
                    roteiro?: string | null;
                    orcamento_id?: string | null;
                    itens_orcamento?: Json | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "ordens_servico_tecnico_id_fkey";
                        columns: ["tecnico_id"];
                        isOneToOne: false;
                        referencedRelation: "tecnicos";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "ordens_servico_cliente_id_fkey";
                        columns: ["cliente_id"];
                        isOneToOne: false;
                        referencedRelation: "clientes";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "ordens_servico_consultor_id_fkey";
                        columns: ["consultor_id"];
                        isOneToOne: false;
                        referencedRelation: "profiles";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "ordens_servico_maquina_id_fkey";
                        columns: ["maquina_id"];
                        isOneToOne: false;
                        referencedRelation: "maquinas";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "itens_os_ordem_servico_id_fkey";
                        columns: ["ordem_servico_id"];
                        isOneToOne: false;
                        referencedRelation: "itens_os";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "despesas_os_ordem_servico_id_fkey";
                        columns: ["ordem_servico_id"];
                        isOneToOne: false;
                        referencedRelation: "despesas_os";
                        referencedColumns: ["id"];
                    }
                ];
            };
            historico_status_os: {
                Row: {
                    id: string;
                    ordem_servico_id: string;
                    status_anterior: string | null;
                    status_novo: string;
                    motivo_mudanca: string | null;
                    usuario_id: string | null;
                    created_at: string;
                    numero_orcamento: string | null;
                    numero_pedido: string | null;
                    tipo_diagnostico: string | null;
                    localizacao_atual: string | null;
                    motivo_pausa: string | null;
                };
                Insert: {
                    id?: string;
                    ordem_servico_id: string;
                    status_anterior?: string | null;
                    status_novo: string;
                    motivo_mudanca?: string | null;
                    usuario_id?: string | null;
                    created_at?: string;
                    numero_orcamento?: string | null;
                    numero_pedido?: string | null;
                    tipo_diagnostico?: string | null;
                    localizacao_atual?: string | null;
                    motivo_pausa?: string | null;
                };
                Update: {
                    id?: string;
                    ordem_servico_id?: string;
                    status_anterior?: string | null;
                    status_novo?: string;
                    motivo_mudanca?: string | null;
                    usuario_id?: string | null;
                    created_at?: string;
                    numero_orcamento?: string | null;
                    numero_pedido?: string | null;
                    tipo_diagnostico?: string | null;
                    localizacao_atual?: string | null;
                    motivo_pausa?: string | null;
                };
                Relationships: [];
            };
            pendencias_os: {
                Row: {
                    id: string;
                    os_id: string;
                    tipo_pendencia: TipoPendencia;
                    descricao: string;
                    data_inicio: string;
                    data_prevista: string | null;
                    data_resolucao: string | null;
                    status: StatusPendencia;
                    responsavel: string | null;
                    observacoes: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    os_id: string;
                    tipo_pendencia: TipoPendencia;
                    descricao: string;
                    data_inicio?: string;
                    data_prevista?: string | null;
                    data_resolucao?: string | null;
                    status?: StatusPendencia;
                    responsavel?: string | null;
                    observacoes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    os_id?: string;
                    tipo_pendencia?: TipoPendencia;
                    descricao?: string;
                    data_inicio?: string;
                    data_prevista?: string | null;
                    data_resolucao?: string | null;
                    status?: StatusPendencia;
                    responsavel?: string | null;
                    observacoes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "pendencias_os_os_id_fkey";
                        columns: ["os_id"];
                        isOneToOne: false;
                        referencedRelation: "ordens_servico";
                        referencedColumns: ["id"];
                    }
                ];
            };
            alertas: {
                Row: {
                    id: string;
                    os_id: string | null;
                    tipo_alerta: TipoAlerta;
                    titulo: string;
                    mensagem: string;
                    prioridade: PrioridadeAlerta;
                    lido: boolean;
                    data_leitura: string | null;
                    usuario_id: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    os_id?: string | null;
                    tipo_alerta: TipoAlerta;
                    titulo: string;
                    mensagem: string;
                    prioridade?: PrioridadeAlerta;
                    lido?: boolean;
                    data_leitura?: string | null;
                    usuario_id?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    os_id?: string | null;
                    tipo_alerta?: TipoAlerta;
                    titulo?: string;
                    mensagem?: string;
                    prioridade?: PrioridadeAlerta;
                    lido?: boolean;
                    data_leitura?: string | null;
                    usuario_id?: string | null;
                    created_at?: string;
                };
                Relationships: [];
            };
            auditoria_os: {
                Row: {
                    id: string;
                    os_id: string | null;
                    usuario_id: string | null;
                    usuario_nome: string | null;
                    acao: AcaoAuditoria;
                    descricao: string | null;
                    dados_anteriores: Json | null;
                    dados_novos: Json | null;
                    ip_address: string | null;
                    timestamp: string;
                };
                Insert: {
                    id?: string;
                    os_id?: string | null;
                    usuario_id?: string | null;
                    usuario_nome?: string | null;
                    acao: AcaoAuditoria;
                    descricao?: string | null;
                    dados_anteriores?: Json | null;
                    dados_novos?: Json | null;
                    ip_address?: string | null;
                    timestamp?: string;
                };
                Update: {
                    id?: string;
                    os_id?: string | null;
                    usuario_id?: string | null;
                    usuario_nome?: string | null;
                    acao?: AcaoAuditoria;
                    descricao?: string | null;
                    dados_anteriores?: Json | null;
                    dados_novos?: Json | null;
                    ip_address?: string | null;
                    timestamp?: string;
                };
                Relationships: [];
            };
            metas: {
                Row: {
                    id: string;
                    nome_meta: string;
                    descricao: string | null;
                    tipo_meta: TipoMeta;
                    valor_alvo: number;
                    periodo_inicio: string;
                    periodo_fim: string;
                    unidade: string | null;
                    consultor_id: string | null;
                    equipe_id: string | null;
                    ativa: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    nome_meta: string;
                    descricao?: string | null;
                    tipo_meta: TipoMeta;
                    valor_alvo: number;
                    periodo_inicio: string;
                    periodo_fim: string;
                    unidade?: string | null;
                    consultor_id?: string | null;
                    equipe_id?: string | null;
                    ativa?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    nome_meta?: string;
                    descricao?: string | null;
                    tipo_meta?: TipoMeta;
                    valor_alvo?: number;
                    periodo_inicio?: string;
                    periodo_fim?: string;
                    unidade?: string | null;
                    consultor_id?: string | null;
                    equipe_id?: string | null;
                    ativa?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [];
            };
            importacoes_log: {
                Row: {
                    id: string;
                    nome_arquivo: string;
                    tipo_importacao: TipoImportacao;
                    status: StatusImportacao;
                    total_registros: number;
                    registros_importados: number;
                    registros_atualizados: number;
                    registros_erro: number;
                    mensagem_erro: string | null;
                    detalhes: Json | null;
                    usuario_id: string | null;
                    data_inicio: string;
                    data_fim: string | null;
                    duracao_segundos: number | null;
                };
                Insert: {
                    id?: string;
                    nome_arquivo: string;
                    tipo_importacao: TipoImportacao;
                    status?: StatusImportacao;
                    total_registros?: number;
                    registros_importados?: number;
                    registros_atualizados?: number;
                    registros_erro?: number;
                    mensagem_erro?: string | null;
                    detalhes?: Json | null;
                    usuario_id?: string | null;
                    data_inicio?: string;
                    data_fim?: string | null;
                    duracao_segundos?: number | null;
                };
                Update: {
                    id?: string;
                    nome_arquivo?: string;
                    tipo_importacao?: TipoImportacao;
                    status?: StatusImportacao;
                    total_registros?: number;
                    registros_importados?: number;
                    registros_atualizados?: number;
                    registros_erro?: number;
                    mensagem_erro?: string | null;
                    detalhes?: Json | null;
                    usuario_id?: string | null;
                    data_inicio?: string;
                    data_fim?: string | null;
                    duracao_segundos?: number | null;
                };
                Relationships: [];
            };
            itens_os: {
                Row: {
                    id: string;
                    ordem_servico_id: string;
                    descricao: string;
                    quantidade: number;
                    valor_unitario: number;
                    valor_total: number;
                    status_separacao: string;
                    solicitacao_compra_id: string | null;
                    codigo_peca: string | null;
                    status_aprovacao: StatusAprovacaoPeca | string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    ordem_servico_id: string;
                    descricao: string;
                    quantidade: number;
                    valor_unitario: number;
                    valor_total?: number;
                    status_separacao?: string;
                    solicitacao_compra_id?: string | null;
                    codigo_peca?: string | null;
                    status_aprovacao?: StatusAprovacaoPeca | string;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    ordem_servico_id?: string;
                    descricao?: string;
                    quantidade?: number;
                    valor_unitario?: number;
                    valor_total?: number;
                    status_separacao?: string;
                    solicitacao_compra_id?: string | null;
                    codigo_peca?: string | null;
                    status_aprovacao?: StatusAprovacaoPeca | string;
                    created_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "itens_os_ordem_servico_id_fkey";
                        columns: ["ordem_servico_id"];
                        isOneToOne: false;
                        referencedRelation: "ordens_servico";
                        referencedColumns: ["id"];
                    }
                ];
            };
            solicitacoes_compra: {
                Row: {
                    id: string;
                    ordem_servico_id: string | null;
                    item_os_id: string | null;
                    codigo_peca: string | null;
                    descricao_peca: string;
                    quantidade: number;
                    unidade: string;
                    urgencia: Database["public"]["Enums"]["urgencia_compra"];
                    status: Database["public"]["Enums"]["status_solicitacao_compra"];
                    valor_total: number;
                    valor_unitario: number | null;
                    fornecedor: string | null;
                    data_previsao_entrega: string | null;
                    data_solicitacao: string;
                    data_entrega_real: string | null;
                    numero_pedido_fornecedor: string | null;
                    aol: string | null;
                    data_faturamento_fabrica: string | null;
                    solicitante_id: string | null;
                    comprador_id: string | null;
                    observacoes: string | null;
                    motivo_cancelamento: string | null;
                    status_aprovacao: StatusAprovacaoPeca | string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    ordem_servico_id?: string | null;
                    item_os_id?: string | null;
                    codigo_peca?: string | null;
                    descricao_peca: string;
                    quantidade: number;
                    unidade: string;
                    urgencia?: Database["public"]["Enums"]["urgencia_compra"];
                    status?: Database["public"]["Enums"]["status_solicitacao_compra"];
                    valor_total?: number;
                    valor_unitario?: number | null;
                    fornecedor?: string | null;
                    data_previsao_entrega?: string | null;
                    data_solicitacao?: string;
                    data_entrega_real?: string | null;
                    numero_pedido_fornecedor?: string | null;
                    aol?: string | null;
                    data_faturamento_fabrica?: string | null;
                    solicitante_id?: string | null;
                    comprador_id?: string | null;
                    observacoes?: string | null;
                    motivo_cancelamento?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    ordem_servico_id?: string | null;
                    item_os_id?: string | null;
                    codigo_peca?: string | null;
                    descricao_peca?: string;
                    quantidade?: number;
                    unidade?: string;
                    urgencia?: Database["public"]["Enums"]["urgencia_compra"];
                    status?: Database["public"]["Enums"]["status_solicitacao_compra"];
                    valor_total?: number;
                    valor_unitario?: number | null;
                    fornecedor?: string | null;
                    data_previsao_entrega?: string | null;
                    data_solicitacao?: string;
                    data_entrega_real?: string | null;
                    numero_pedido_fornecedor?: string | null;
                    aol?: string | null;
                    data_faturamento_fabrica?: string | null;
                    solicitante_id?: string | null;
                    comprador_id?: string | null;
                    observacoes?: string | null;
                    motivo_cancelamento?: string | null;
                    created_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "solicitacoes_compra_ordem_servico_id_fkey";
                        columns: ["ordem_servico_id"];
                        isOneToOne: false;
                        referencedRelation: "ordens_servico";
                        referencedColumns: ["id"];
                    }
                ];
            };
            anexos_os: {
                Row: {
                    id: string;
                    ordem_servico_id: string;
                    url_anexo: string;
                    tipo_anexo: string;
                    descricao: string | null;
                    usuario_id: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    ordem_servico_id: string;
                    url_anexo: string;
                    tipo_anexo?: string;
                    descricao?: string | null;
                    usuario_id?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    ordem_servico_id?: string;
                    url_anexo?: string;
                    tipo_anexo?: string;
                    descricao?: string | null;
                    usuario_id?: string | null;
                    created_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "anexos_os_ordem_servico_id_fkey";
                        columns: ["ordem_servico_id"];
                        isOneToOne: false;
                        referencedRelation: "ordens_servico";
                        referencedColumns: ["id"];
                    }
                ];
            };
            tecnicos: {
                Row: {
                    id: string;
                    nome_completo: string;
                    user_id: string | null;
                    sku_oficina: string | null;
                    especialidade: string | null;
                    is_active: boolean;
                    status_disponibilidade: StatusDisponibilidadeTecnico;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    nome_completo: string;
                    user_id?: string | null;
                    sku_oficina?: string | null;
                    especialidade?: string | null;
                    is_active?: boolean;
                    status_disponibilidade?: StatusDisponibilidadeTecnico;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    nome_completo?: string;
                    user_id?: string | null;
                    sku_oficina?: string | null;
                    especialidade?: string | null;
                    is_active?: boolean;
                    status_disponibilidade?: StatusDisponibilidadeTecnico;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [];
            };
            veiculos: {
                Row: {
                    id: string;
                    placa: string;
                    modelo: string;
                    marca: string | null;
                    ano: number | null;
                    cor: string | null;
                    km_atual: number;
                    status: string;
                    tecnico_id: string | null;
                    data_alocacao: string | null;
                    observacoes: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    placa: string;
                    modelo: string;
                    marca?: string | null;
                    ano?: number | null;
                    cor?: string | null;
                    km_atual?: number;
                    status?: string;
                    tecnico_id?: string | null;
                    data_alocacao?: string | null;
                    observacoes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    placa?: string;
                    modelo?: string;
                    marca?: string | null;
                    ano?: number | null;
                    cor?: string | null;
                    km_atual?: number;
                    status?: string;
                    tecnico_id?: string | null;
                    data_alocacao?: string | null;
                    observacoes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "veiculos_tecnico_id_fkey";
                        columns: ["tecnico_id"];
                        isOneToOne: false;
                        referencedRelation: "tecnicos";
                        referencedColumns: ["id"];
                    }
                ];
            };
            historico_alocacao_veiculos: {
                Row: {
                    id: string;
                    veiculo_id: string;
                    tecnico_id: string | null;
                    data_inicio: string;
                    data_fim: string | null;
                    km_inicio: number | null;
                    km_fim: number | null;
                    motivo: string | null;
                    alocado_por: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    veiculo_id: string;
                    tecnico_id?: string | null;
                    data_inicio?: string;
                    data_fim?: string | null;
                    km_inicio?: number | null;
                    km_fim?: number | null;
                    motivo?: string | null;
                    alocado_por?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    veiculo_id?: string;
                    tecnico_id?: string | null;
                    data_inicio?: string;
                    data_fim?: string | null;
                    km_inicio?: number | null;
                    km_fim?: number | null;
                    motivo?: string | null;
                    alocado_por?: string | null;
                    created_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "historico_alocacao_veiculos_veiculo_id_fkey";
                        columns: ["veiculo_id"];
                        isOneToOne: false;
                        referencedRelation: "veiculos";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "historico_alocacao_veiculos_tecnico_id_fkey";
                        columns: ["tecnico_id"];
                        isOneToOne: false;
                        referencedRelation: "tecnicos";
                        referencedColumns: ["id"];
                    }
                ];
            };
            despesas_os: {
                Row: {
                    id: string;
                    ordem_servico_id: string;
                    tipo: string;
                    descricao: string | null;
                    quantidade: number | null;
                    valor_unitario: number | null;
                    valor_total: number;
                    data_despesa: string;
                    comprovante_url: string | null;
                    responsavel_id: string | null;
                    km_inicial: number | null;
                    km_final: number | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    ordem_servico_id: string;
                    tipo: string;
                    descricao?: string | null;
                    quantidade?: number | null;
                    valor_unitario?: number | null;
                    valor_total: number;
                    data_despesa?: string;
                    comprovante_url?: string | null;
                    responsavel_id?: string | null;
                    km_inicial?: number | null;
                    km_final?: number | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    ordem_servico_id?: string;
                    tipo?: string;
                    descricao?: string | null;
                    quantidade?: number | null;
                    valor_unitario?: number | null;
                    valor_total?: number;
                    data_despesa?: string;
                    comprovante_url?: string | null;
                    responsavel_id?: string | null;
                    km_inicial?: number | null;
                    km_final?: number | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "despesas_os_ordem_servico_id_fkey";
                        columns: ["ordem_servico_id"];
                        isOneToOne: false;
                        referencedRelation: "ordens_servico";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "despesas_os_responsavel_id_fkey";
                        columns: ["responsavel_id"];
                        isOneToOne: false;
                        referencedRelation: "profiles";
                        referencedColumns: ["id"];
                    }
                ];
            };
            ferramentas: {
                Row: {
                    id: string;
                    nome: string;
                    codigo_patrimonio: string | null;
                    numero_serie: string | null;
                    categoria: string;
                    estado: string;
                    quantidade: number;
                    tecnico_id: string | null;
                    data_retirada: string | null;
                    observacoes: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    nome: string;
                    codigo_patrimonio?: string | null;
                    numero_serie?: string | null;
                    categoria?: string;
                    estado?: string;
                    quantidade?: number;
                    tecnico_id?: string | null;
                    data_retirada?: string | null;
                    observacoes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    nome?: string;
                    codigo_patrimonio?: string | null;
                    numero_serie?: string | null;
                    categoria?: string;
                    estado?: string;
                    quantidade?: number;
                    tecnico_id?: string | null;
                    data_retirada?: string | null;
                    observacoes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "ferramentas_tecnico_id_fkey";
                        columns: ["tecnico_id"];
                        isOneToOne: false;
                        referencedRelation: "tecnicos";
                        referencedColumns: ["id"];
                    }
                ];
            };
            movimentacoes_ferramentas: {
                Row: {
                    id: string;
                    ferramenta_id: string;
                    tecnico_id: string | null;
                    tipo: string;
                    data_movimentacao: string;
                    observacoes: string | null;
                    registrado_por: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    ferramenta_id: string;
                    tecnico_id?: string | null;
                    tipo: string;
                    data_movimentacao?: string;
                    observacoes?: string | null;
                    registrado_por?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    ferramenta_id?: string;
                    tecnico_id?: string | null;
                    tipo?: string;
                    data_movimentacao?: string;
                    observacoes?: string | null;
                    registrado_por?: string | null;
                    created_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "movimentacoes_ferramentas_ferramenta_id_fkey";
                        columns: ["ferramenta_id"];
                        isOneToOne: false;
                        referencedRelation: "ferramentas";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "movimentacoes_ferramentas_tecnico_id_fkey";
                        columns: ["tecnico_id"];
                        isOneToOne: false;
                        referencedRelation: "tecnicos";
                        referencedColumns: ["id"];
                    }
                ];
            };
            vistorias_veiculos: {
                Row: {
                    id: string;
                    veiculo_id: string | null;
                    tecnico_id: string | null;
                    data_vistoria: string;
                    km_vistoria: number | null;
                    itens: Json;
                    observacoes: string | null;
                    status: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    veiculo_id?: string | null;
                    tecnico_id?: string | null;
                    data_vistoria?: string;
                    km_vistoria?: number | null;
                    itens?: Json;
                    observacoes?: string | null;
                    status?: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    veiculo_id?: string | null;
                    tecnico_id?: string | null;
                    data_vistoria?: string;
                    km_vistoria?: number | null;
                    itens?: Json;
                    observacoes?: string | null;
                    status?: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "vistorias_veiculos_veiculo_id_fkey";
                        columns: ["veiculo_id"];
                        isOneToOne: false;
                        referencedRelation: "veiculos";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "vistorias_veiculos_tecnico_id_fkey";
                        columns: ["tecnico_id"];
                        isOneToOne: false;
                        referencedRelation: "tecnicos";
                        referencedColumns: ["id"];
                    }
                ];
            };
        };
        Views: {
            vw_os_estatisticas: {
                Row: {
                    id: string;
                    numero_os: string;
                    tipo_os: TipoOS;
                    status_atual: StatusOS;
                    data_abertura: string;
                    data_fechamento: string | null;
                    valor_liquido_total: number;
                    dias_em_aberto: number;
                    nivel_urgencia: NivelUrgencia;
                    cliente_nome: string | null;
                    consultor_nome: string | null;
                    pendencias_ativas: number;
                };
                Relationships: [];
            };
            vw_os_motivos_abertura: {
                Row: {
                    id: string;
                    numero_os: string;
                    status_atual: StatusOS;
                    data_abertura: string;
                    dias_aberta: number;
                    motivo_detalhado: string;
                    dias_no_status_atual: number | null;
                    numero_orcamento: string | null;
                    numero_pedido: string | null;
                    data_conclusao_servico: string | null;
                    valor_servico: number | null;
                    tipo_diagnostico: TipoDiagnostico | null;
                    localizacao_atual: string | null;
                    roteiro: string | null;
                    previsao_retorno: string | null;
                    previsao_chegada_pecas: string | null;
                    motivo_pausa: string | null;
                    tecnico_id: string | null;
                    cliente_id: string | null;
                    consultor_id: string | null;
                    nome_cliente_digitavel: string | null;
                    modelo_maquina: string | null;
                };
                Relationships: [];
            };
            vw_pecas_pendentes_separacao: {
                Row: {
                    item_id: string;
                    ordem_servico_id: string;
                    numero_os: string;
                    cliente: string;
                    codigo_peca: string | null;
                    descricao: string;
                    quantidade: number;
                    unidade: string;
                    status_separacao: string;
                    estoque_disponivel: number | null;
                    disponibilidade: 'DISPONIVEL' | 'PARCIAL' | 'INDISPONIVEL';
                    tecnico_responsavel: string;
                    data_solicitacao: string;
                };
                Relationships: [];
            };
            vw_os_profitability: {
                Row: {
                    os_id: string;
                    data_abertura: string;
                    status_atual: StatusOS;
                    receita_mao_de_obra: number;
                    receita_pecas: number;
                    receita_deslocamento: number;
                    receita_total: number;
                    custo_deslocamento: number;
                    custo_combustivel: number;
                    custo_alimentacao: number;
                    custo_hospedagem: number;
                    custo_pedagio: number;
                    custo_mao_de_obra: number;
                    custo_outros: number;
                    custo_pecas: number;
                    custo_total: number;
                    lucro_bruto: number;
                    margem_percentual: number;
                };
                Relationships: [
                    {
                        foreignKeyName: "vw_os_profitability_os_id_fkey";
                        columns: ["os_id"];
                        isOneToOne: true;
                        referencedRelation: "ordens_servico";
                        referencedColumns: ["id"];
                    }
                ];
            };
        };
        Functions: {
            get_monthly_stats: {
                Args: {
                    start_date: string;
                };
                Returns: {
                    mes: string;
                    tipo_os: TipoOS;
                    quantidade: number;
                    valor_total: number;
                }[];
            };
            dar_baixa_estoque: {
                Args: {
                    p_codigo_peca: string;
                    p_quantidade: number;
                };
                Returns: void;
            };
            dar_entrada_estoque: {
                Args: {
                    p_codigo_peca: string;
                    p_descricao: string;
                    p_quantidade: number;
                    p_valor_unitario: number;
                };
                Returns: void;
            };
            gerar_alertas_os_vencidas: {
                Args: Record<string, never>;
                Returns: number;
            };
        };
        Enums: {
            user_role: UserRole;
            tipo_os: TipoOS;
            status_os: StatusOS;
            status_solicitacao_compra: StatusSolicitacaoCompra;
            urgencia_compra: UrgenciaCompra;
            status_disponibilidade_tecnico: StatusDisponibilidadeTecnico;
        };
    };
}

export type StatusSolicitacaoCompra = 'PENDENTE' | 'EM_COTACAO' | 'AGUARDANDO_ENTREGA' | 'ENTREGUE' | 'CANCELADO' | 'COMPRADO';
export type UrgenciaCompra = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
