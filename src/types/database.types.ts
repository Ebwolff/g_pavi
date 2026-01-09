export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export type UserRole = 'GERENTE' | 'CONSULTOR_GARANTIA' | 'CONSULTOR_POS_VENDA' | 'TECNICO';
export type TipoOS = 'NORMAL' | 'GARANTIA';
export type StatusOS = 'EM_EXECUCAO' | 'AGUARDANDO_PECAS' | 'PAUSADA' | 'CONCLUIDA' | 'FATURADA' | 'CANCELADA';

// Novos tipos para melhorias
export type TipoPendencia = 'PECAS' | 'SERVICO' | 'TERCEIROS' | 'GARANTIA' | 'CLIENTE' | 'OUTROS';
export type StatusPendencia = 'PENDENTE' | 'EM_ANDAMENTO' | 'RESOLVIDO' | 'CANCELADO';
export type TipoAlerta = 'OS_VENCIDA' | 'GARANTIA_PENDENTE' | 'PECAS_CHEGANDO' | 'PREVISAO_ENTREGA' | 'META_FATURAMENTO' | 'OUTROS';
export type PrioridadeAlerta = 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE';
export type AcaoAuditoria = 'CRIACAO' | 'EDICAO' | 'EXCLUSAO' | 'MUDANCA_STATUS' | 'OUTROS';
export type TipoMeta = 'FATURAMENTO' | 'QUANTIDADE_OS' | 'TEMPO_RESOLUCAO' | 'SATISFACAO' | 'BACKLOG' | 'OUTROS';
export type TipoImportacao = 'INCREMENTAL' | 'FULL' | 'MERGE';
export type StatusImportacao = 'INICIADO' | 'PROCESSANDO' | 'SUCESSO' | 'ERRO' | 'CANCELADO';
export type NivelUrgencia = 'NORMAL' | 'MEDIO' | 'ALTO' | 'CRITICO';

export interface Database {
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
                    created_at: string;
                    updated_at: string;
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
                    created_at?: string;
                    updated_at?: string;
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
                    created_at?: string;
                    updated_at?: string;
                };
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
        };
        Enums: {
            user_role: UserRole;
            tipo_os: TipoOS;
            status_os: StatusOS;
        };
    };
}
