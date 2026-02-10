/**
 * Componente que mostra a agenda/OS de cada técnico
 * Visão para gerente acompanhar carga de trabalho
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    Wrench,
    ChevronRight,
    AlertTriangle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/Skeleton';

interface Tecnico {
    id: string;
    nome_completo: string;
    especialidade: string | null;
    ordens_servico: OSDoTecnico[];
}

interface OSDoTecnico {
    id: string;
    numero_os: string;
    nome_cliente_digitavel: string;
    modelo_maquina: string;
    status_atual: string;
    data_abertura: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    'EM_EXECUCAO': { bg: 'bg-blue-500/20', text: 'text-blue-400' },
    'AGUARDANDO_PECAS': { bg: 'bg-amber-500/20', text: 'text-amber-400' },
    'AGUARDANDO_APROVACAO_ORCAMENTO': { bg: 'bg-orange-500/20', text: 'text-orange-400' },
    'AGUARDANDO_PEDIDO_PECAS': { bg: 'bg-purple-500/20', text: 'text-purple-400' },
    'AGUARDANDO_PAGAMENTO': { bg: 'bg-pink-500/20', text: 'text-pink-400' },
    'PAUSADA': { bg: 'bg-slate-500/20', text: 'text-slate-400' },
    'CONCLUIDA': { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
};

const STATUS_LABELS: Record<string, string> = {
    'EM_EXECUCAO': 'Em Execução',
    'AGUARDANDO_PECAS': 'Ag. Peças',
    'AGUARDANDO_APROVACAO_ORCAMENTO': 'Ag. Orçamento',
    'AGUARDANDO_PEDIDO_PECAS': 'Ag. Pedido',
    'AGUARDANDO_PAGAMENTO': 'Ag. Pagamento',
    'PAUSADA': 'Pausada',
    'CONCLUIDA': 'Concluída',
};

export function AgendaTecnicos() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        setLoading(true);
        try {
            // Buscar técnicos
            const { data: tecnicosData, error: tecError } = await supabase
                .from('tecnicos' as any)
                .select('id, nome_completo, especialidade')
                .order('nome_completo');

            if (tecError) throw tecError;

            // Buscar OS abertas (não canceladas e não faturadas)
            const { data: osData, error: osError } = await supabase
                .from('ordens_servico')
                .select(`
                    id,
                    numero_os,
                    nome_cliente_digitavel,
                    modelo_maquina,
                    status_atual,
                    data_abertura,
                    tecnico_id
                `)
                .not('status_atual', 'in', '(CANCELADA,FATURADA)')
                .order('data_abertura', { ascending: true });

            if (osError) throw osError;

            // Mapear OS para cada técnico
            const tecnicosComOS = (tecnicosData || []).map((tec: any) => ({
                ...tec,
                ordens_servico: (osData || []).filter((os: any) => os.tecnico_id === tec.id)
            }));

            // Ordenar por quantidade de OS (maior primeiro)
            tecnicosComOS.sort((a: any, b: any) => b.ordens_servico.length - a.ordens_servico.length);

            setTecnicos(tecnicosComOS);
        } catch (error) {
            console.error('Erro ao carregar agenda:', error);
        } finally {
            setLoading(false);
        }
    };

    const calcularDiasAberta = (dataAbertura: string) => {
        const abertura = new Date(dataAbertura);
        const hoje = new Date();
        return Math.floor((hoje.getTime() - abertura.getTime()) / (1000 * 60 * 60 * 24));
    };

    if (loading) {
        return (
            <div className="mt-8">
                <div className="flex items-center gap-3 mb-4">
                    <Skeleton height={24} width={200} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} height={200} className="rounded-xl" />
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
                    <Users className="w-5 h-5 text-emerald-500" />
                    Agenda dos Técnicos
                </h2>
                <span className="text-xs text-[var(--text-muted)]">
                    {tecnicos.length} técnicos
                </span>
            </div>

            {/* Grid de Técnicos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {tecnicos.map((tecnico) => {
                    const totalOS = tecnico.ordens_servico.length;
                    const temUrgente = tecnico.ordens_servico.some(os => calcularDiasAberta(os.data_abertura) > 7);

                    return (
                        <div
                            key={tecnico.id}
                            className={`rounded-xl border p-4 transition-all ${totalOS > 0
                                ? 'bg-white/[0.03] border-white/10 hover:bg-white/[0.05]'
                                : 'bg-white/[0.01] border-white/5'
                                }`}
                        >
                            {/* Header do Técnico */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${totalOS > 0 ? 'bg-emerald-500/20' : 'bg-slate-500/20'
                                        }`}>
                                        <Wrench className={`w-4 h-4 ${totalOS > 0 ? 'text-emerald-400' : 'text-slate-400'
                                            }`} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-[var(--text-primary)] truncate max-w-[150px]">
                                            {tecnico.nome_completo}
                                        </p>
                                        <p className="text-[10px] text-[var(--text-muted)]">
                                            {tecnico.especialidade || 'Técnico'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {temUrgente && (
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                                    )}
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${totalOS > 0
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : 'bg-slate-500/20 text-slate-400'
                                        }`}>
                                        {totalOS}
                                    </span>
                                </div>
                            </div>

                            {/* Lista de OS */}
                            {totalOS === 0 ? (
                                <div className="text-center py-4 text-[var(--text-muted)] text-xs">
                                    Sem OS atribuídas
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                    {tecnico.ordens_servico.slice(0, 5).map((os) => {
                                        const dias = calcularDiasAberta(os.data_abertura);
                                        const isUrgent = dias > 7;
                                        const statusStyle = STATUS_COLORS[os.status_atual] || { bg: 'bg-slate-500/20', text: 'text-slate-400' };

                                        return (
                                            <button
                                                key={os.id}
                                                onClick={() => navigate(`/os/editar/${os.id}`)}
                                                className="w-full text-left p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all group flex items-center gap-2"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[10px] font-mono font-bold text-white">
                                                            {os.numero_os}
                                                        </span>
                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${statusStyle.bg} ${statusStyle.text}`}>
                                                            {STATUS_LABELS[os.status_atual] || os.status_atual}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-[var(--text-muted)] truncate">
                                                        {os.nome_cliente_digitavel}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isUrgent ? 'bg-rose-500/20 text-rose-400' : 'bg-white/5 text-[var(--text-muted)]'
                                                        }`}>
                                                        {dias}d
                                                    </span>
                                                    <ChevronRight className="w-3 h-3 text-[var(--text-muted)] opacity-0 group-hover:opacity-100" />
                                                </div>
                                            </button>
                                        );
                                    })}
                                    {totalOS > 5 && (
                                        <div className="text-center text-[10px] text-[var(--text-muted)] pt-1">
                                            + {totalOS - 5} mais
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
