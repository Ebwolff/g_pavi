/**
 * Componente de Pipeline/Kanban de OS
 * Mostra todas as OS organizadas por status/etapa
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Play,
    Package,
    FileCheck,
    ShoppingCart,
    CreditCard,
    Pause,
    CheckCircle,
    Receipt,
    Clock,
    User,
    ChevronRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/Skeleton';

interface OSPipeline {
    id: string;
    numero_os: string;
    nome_cliente_digitavel: string;
    modelo_maquina: string;
    status_atual: string;
    data_abertura: string;
    tecnico?: {
        nome_completo: string;
    };
}

// Configuração das etapas do pipeline
const PIPELINE_STAGES = [
    {
        status: 'EM_EXECUCAO',
        label: 'Em Execução',
        icon: Play,
        color: 'blue',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        textColor: 'text-blue-400'
    },
    {
        status: 'AGUARDANDO_PECAS',
        label: 'Ag. Peças',
        icon: Package,
        color: 'amber',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        textColor: 'text-amber-400'
    },
    {
        status: 'AGUARDANDO_APROVACAO_ORCAMENTO',
        label: 'Ag. Orçamento',
        icon: FileCheck,
        color: 'orange',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/30',
        textColor: 'text-orange-400'
    },
    {
        status: 'AGUARDANDO_PEDIDO_PECAS',
        label: 'Ag. Pedido',
        icon: ShoppingCart,
        color: 'purple',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/30',
        textColor: 'text-purple-400'
    },
    {
        status: 'AGUARDANDO_PAGAMENTO',
        label: 'Ag. Pagamento',
        icon: CreditCard,
        color: 'pink',
        bgColor: 'bg-pink-500/10',
        borderColor: 'border-pink-500/30',
        textColor: 'text-pink-400'
    },
    {
        status: 'PAUSADA',
        label: 'Pausada',
        icon: Pause,
        color: 'slate',
        bgColor: 'bg-slate-500/10',
        borderColor: 'border-slate-500/30',
        textColor: 'text-slate-400'
    },
    {
        status: 'CONCLUIDA',
        label: 'Concluída',
        icon: CheckCircle,
        color: 'emerald',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/30',
        textColor: 'text-emerald-400'
    },
    {
        status: 'FATURADA',
        label: 'Faturada',
        icon: Receipt,
        color: 'green',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
        textColor: 'text-green-400'
    },
];

export function PipelineOS() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [osPorStatus, setOsPorStatus] = useState<Record<string, OSPipeline[]>>({});

    useEffect(() => {
        carregarOS();
    }, []);

    const carregarOS = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('ordens_servico')
                .select(`
                    id,
                    numero_os,
                    nome_cliente_digitavel,
                    modelo_maquina,
                    status_atual,
                    data_abertura,
                    tecnico:tecnico_id (nome_completo)
                `)
                .not('status_atual', 'eq', 'CANCELADA')
                .order('data_abertura', { ascending: true });

            if (error) throw error;

            // Agrupar por status
            const agrupado: Record<string, OSPipeline[]> = {};
            PIPELINE_STAGES.forEach(stage => {
                agrupado[stage.status] = [];
            });

            (data || []).forEach((os: any) => {
                const status = os.status_atual;
                if (agrupado[status]) {
                    agrupado[status].push(os);
                }
            });

            setOsPorStatus(agrupado);
        } catch (error) {
            console.error('Erro ao carregar OS:', error);
        } finally {
            setLoading(false);
        }
    };

    const calcularDiasAberta = (dataAbertura: string) => {
        const abertura = new Date(dataAbertura);
        const hoje = new Date();
        const diff = Math.floor((hoje.getTime() - abertura.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    if (loading) {
        return (
            <div className="mt-8">
                <div className="flex items-center gap-3 mb-4">
                    <Skeleton height={24} width={200} />
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <Skeleton key={i} height={300} width={280} className="rounded-xl flex-shrink-0" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="mt-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    Pipeline de Processos
                </h2>
                <span className="text-xs text-[var(--text-muted)]">
                    Arraste para ver todas as etapas →
                </span>
            </div>

            {/* Pipeline Container */}
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {PIPELINE_STAGES.map((stage) => {
                    const Icon = stage.icon;
                    const osNaEtapa = osPorStatus[stage.status] || [];
                    const count = osNaEtapa.length;

                    return (
                        <div
                            key={stage.status}
                            className={`flex-shrink-0 w-[280px] rounded-xl border ${stage.borderColor} ${stage.bgColor} p-4`}
                        >
                            {/* Header da Coluna */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-lg ${stage.bgColor}`}>
                                        <Icon className={`w-4 h-4 ${stage.textColor}`} />
                                    </div>
                                    <span className={`text-sm font-bold ${stage.textColor}`}>
                                        {stage.label}
                                    </span>
                                </div>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${stage.bgColor} ${stage.textColor}`}>
                                    {count}
                                </span>
                            </div>

                            {/* Lista de OS */}
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                                {osNaEtapa.length === 0 ? (
                                    <div className="text-center py-8 text-[var(--text-muted)] text-xs">
                                        Nenhuma OS
                                    </div>
                                ) : (
                                    osNaEtapa.map((os) => {
                                        const dias = calcularDiasAberta(os.data_abertura);
                                        const isUrgent = dias > 7;

                                        return (
                                            <button
                                                key={os.id}
                                                onClick={() => navigate(`/os/editar/${os.id}`)}
                                                className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all group"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <span className="text-xs font-mono font-bold text-white bg-white/10 px-1.5 py-0.5 rounded">
                                                        {os.numero_os}
                                                    </span>
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isUrgent ? 'bg-rose-500/20 text-rose-400' : 'bg-white/5 text-[var(--text-muted)]'
                                                        }`}>
                                                        {dias}d
                                                    </span>
                                                </div>
                                                <p className="text-xs font-semibold text-[var(--text-primary)] truncate mb-1">
                                                    {os.nome_cliente_digitavel}
                                                </p>
                                                <p className="text-[10px] text-[var(--text-muted)] truncate mb-2">
                                                    {os.modelo_maquina}
                                                </p>
                                                {os.tecnico && (
                                                    <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                                                        <User className="w-3 h-3" />
                                                        <span className="truncate">{os.tecnico.nome_completo}</span>
                                                    </div>
                                                )}
                                                <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
