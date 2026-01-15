import { useState, useEffect } from 'react';
import {
    Hammer,
    Users,
    Clock,
    CheckCircle,
    AlertTriangle,
    RefreshCw,
    UserPlus,
    LayoutDashboard,
    PieChart
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { StatusOS } from '@/types/database.types';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { AssignTechnicianModal } from '@/components/ui/AssignTechnicianModal';
import { ModalCadastrarTecnico } from '@/components/ui/ModalCadastrarTecnico';

interface Tecnico {
    id: string;
    nome: string;
    osAtribuidas: number;
    osEmExecucao: number;
    osConcluidas: number;
}

interface OSNaoAtribuida {
    id: string;
    numero_os: string;
    tipo_os: 'NORMAL' | 'GARANTIA';
    nome_cliente_digitavel: string | null;
    modelo_maquina: string | null;
    data_abertura: string;
    dias_em_aberto: number;
}

interface OSPorStatus {
    status: StatusOS;
    quantidade: number;
    percentual: number;
}

const statusColors: Record<StatusOS, string> = {
    'EM_EXECUCAO': 'bg-blue-500',
    'AGUARDANDO_PECAS': 'bg-amber-500',
    'PAUSADA': 'bg-slate-500',
    'CONCLUIDA': 'bg-emerald-500',
    'FATURADA': 'bg-indigo-500',
    'CANCELADA': 'bg-rose-500',
};

const statusLabels: Record<StatusOS, string> = {
    'EM_EXECUCAO': 'Em Execução',
    'AGUARDANDO_PECAS': 'Aguardando Peças',
    'PAUSADA': 'Pausada',
    'CONCLUIDA': 'Concluída',
    'FATURADA': 'Faturada',
    'CANCELADA': 'Cancelada',
};

export default function PainelChefeOficina() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
    const [osNaoAtribuidas, setOsNaoAtribuidas] = useState<OSNaoAtribuida[]>([]);
    const [distribuicaoStatus, setDistribuicaoStatus] = useState<OSPorStatus[]>([]);
    const [estatisticas, setEstatisticas] = useState({
        totalTecnicos: 0,
        osEmAndamento: 0,
        osAguardandoPecas: 0,
        osSemTecnico: 0,
        osCriticas: 0,
    });
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedOS, setSelectedOS] = useState<OSNaoAtribuida | null>(null);
    const [modalCadastroOpen, setModalCadastroOpen] = useState(false);

    const carregarDados = async () => {
        setLoading(true);
        try {
            const { data: osData, error: osError } = await supabase
                .from('ordens_servico')
                .select('*')
                .not('status_atual', 'in', '("FATURADA","CANCELADA")');

            if (osError) throw osError;
            const os = osData || [];

            const semTecnico = os.filter((o: any) => !o.tecnico_id).map((o: any) => ({
                ...o,
                dias_em_aberto: Math.floor(
                    (Date.now() - new Date(o.data_abertura).getTime()) / (1000 * 60 * 60 * 24)
                ),
            }));
            setOsNaoAtribuidas(semTecnico as OSNaoAtribuida[]);

            const statusCount: Record<string, number> = {};
            os.forEach((o: any) => {
                statusCount[o.status_atual] = (statusCount[o.status_atual] || 0) + 1;
            });

            const totalOS = os.length;
            const distribuicao = Object.entries(statusLabels).map(([status]) => ({
                status: status as StatusOS,
                quantidade: statusCount[status] || 0,
                percentual: totalOS > 0 ? Math.round(((statusCount[status] || 0) / totalOS) * 100) : 0,
            })).filter(item => item.quantidade > 0);

            setDistribuicaoStatus(distribuicao);

            // Buscar técnicos da tabela tecnicos
            const { data: tecnicosData } = await supabase
                .from('tecnicos' as any)
                .select('id, nome_completo, user_id');

            // Também buscar profiles com role TECNICO (para compatibilidade com cadastros antigos)
            const { data: profilesTecnicos } = await supabase
                .from('profiles')
                .select('id, first_name, last_name')
                .eq('role', 'TECNICO');

            // Criar mapa de user_id -> tecnico para evitar duplicatas
            const tecnicosPorUserId = new Map<string, any>();
            (tecnicosData || []).forEach((t: any) => {
                if (t.user_id) tecnicosPorUserId.set(t.user_id, t);
            });

            // Combinar listas: técnicos da tabela tecnicos + profiles que não estão na tabela tecnicos
            const todosOsTecnicos: any[] = [];

            // Primeiro adiciona os técnicos da tabela tecnicos
            (tecnicosData || []).forEach((tecnico: any) => {
                todosOsTecnicos.push({
                    id: tecnico.id,
                    nome: tecnico.nome_completo || 'Técnico s/ nome',
                    isFromTecnicosTable: true,
                    profileId: tecnico.user_id
                });
            });

            // Depois adiciona profiles com role TECNICO que não têm registro na tabela tecnicos
            (profilesTecnicos || []).forEach((profile: any) => {
                if (!tecnicosPorUserId.has(profile.id)) {
                    todosOsTecnicos.push({
                        id: profile.id, // Usa profile.id como fallback (pode causar erro na atribuição se não migrado)
                        nome: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Técnico s/ nome',
                        isFromTecnicosTable: false,
                        profileId: profile.id
                    });
                }
            });

            const tecnicosComOS = await Promise.all(
                todosOsTecnicos.map(async (tecnico: any) => {
                    // Buscar OS atribuídas a este técnico
                    const { data: osDoTecnico } = await supabase
                        .from('ordens_servico')
                        .select('status_atual')
                        .eq('tecnico_id', tecnico.id)
                        .not('status_atual', 'in', '(FATURADA,CANCELADA)');

                    const osTecnico = osDoTecnico || [];
                    return {
                        id: tecnico.id,
                        nome: tecnico.nome,
                        osAtribuidas: osTecnico.length,
                        osEmExecucao: osTecnico.filter((o: any) => o.status_atual === 'EM_EXECUCAO').length,
                        osConcluidas: osTecnico.filter((o: any) => o.status_atual === 'CONCLUIDA').length,
                    };
                })
            );
            setTecnicos(tecnicosComOS);

            const limite60Dias = new Date();
            limite60Dias.setDate(limite60Dias.getDate() - 60);

            setEstatisticas({
                totalTecnicos: tecnicosComOS.length,
                osEmAndamento: os.filter((o: any) => o.status_atual === 'EM_EXECUCAO').length,
                osAguardandoPecas: os.filter((o: any) => o.status_atual === 'AGUARDANDO_PECAS').length,
                osSemTecnico: semTecnico.length,
                osCriticas: os.filter((o: any) => new Date(o.data_abertura) < limite60Dias).length,
            });

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarDados();
    }, []);

    const handleAtribuirTecnico = async (tecnicoId: string) => {
        if (!selectedOS) return;

        const { error } = await supabase
            .from('ordens_servico')
            .update({ tecnico_id: tecnicoId })
            .eq('id', selectedOS.id);

        if (error) {
            console.error('Erro ao atribuir técnico:', error);
            throw error;
        }

        // Recarregar dados
        await carregarDados();
        setModalOpen(false);
        setSelectedOS(null);
    };

    const openAssignModal = (os: OSNaoAtribuida) => {
        setSelectedOS(os);
        setModalOpen(true);
    };

    return (
        <AppLayout>
            <div className="p-8 space-y-8 animate-fadeIn max-w-[1600px] mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                            <div className="p-2 bg-amber-500/10 rounded-xl">
                                <Hammer className="w-8 h-8 text-amber-500" />
                            </div>
                            Gestão de Oficina
                        </h1>
                        <p className="text-[var(--text-muted)] mt-1 ml-1">Controle de equipe, alocação técnica e fluxo de produção</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="primary"
                            onClick={() => setModalCadastroOpen(true)}
                            leftIcon={<UserPlus className="w-4 h-4" />}
                        >
                            Cadastrar Técnico
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={carregarDados}
                            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
                        >
                            Atualizar Painel
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                        { label: 'Time Ativo', value: estatisticas.totalTecnicos, icon: Users, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                        { label: 'Em Execução', value: estatisticas.osEmAndamento, icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                        { label: 'Peças Pendentes', value: estatisticas.osAguardandoPecas, icon: PieChart, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                        { label: 'Sem Técnico', value: estatisticas.osSemTecnico, icon: UserPlus, color: estatisticas.osSemTecnico > 0 ? 'text-orange-400' : 'text-slate-500', bg: estatisticas.osSemTecnico > 0 ? 'bg-orange-500/10' : 'bg-white/5', critical: estatisticas.osSemTecnico > 0 },
                        { label: 'Atrasos Críticos', value: estatisticas.osCriticas, icon: AlertTriangle, color: estatisticas.osCriticas > 0 ? 'text-rose-400' : 'text-slate-500', bg: estatisticas.osCriticas > 0 ? 'bg-rose-500/10' : 'bg-white/5', critical: estatisticas.osCriticas > 0 },
                    ].map((stat, i) => (
                        <div key={i} className={`glass-card-enterprise p-5 rounded-2xl border ${stat.critical ? 'border-orange-500/20 shadow-lg shadow-orange-500/5' : 'border-white/[0.03]'}`}>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.1em]">{stat.label}</span>
                                <div className={`p-2 rounded-lg ${stat.bg}`}>
                                    <stat.icon className={`w-4 h-4 ${stat.color} ${stat.critical ? 'animate-pulse' : ''}`} />
                                </div>
                            </div>
                            <p className={`text-2xl font-black ${stat.critical ? 'text-white' : 'text-[var(--text-primary)]'}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Main Views */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Distribution Chart-like area */}
                    <div className="glass-card-enterprise p-6 rounded-2xl shadow-xl">
                        <h3 className="text-sm font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <LayoutDashboard className="w-4 h-4 text-amber-500" />
                            Fluxo da Operação
                        </h3>
                        <div className="space-y-6">
                            {loading ? <Skeleton height={200} className="rounded-xl" /> : distribuicaoStatus.length === 0 ? (
                                <p className="text-center py-8 text-[var(--text-muted)] text-sm">Nenhum serviço em andamento</p>
                            ) : (
                                distribuicaoStatus.map((item) => (
                                    <div key={item.status} className="space-y-2 group">
                                        <div className="flex justify-between items-end">
                                            <span className="text-xs font-bold text-[var(--text-secondary)] group-hover:text-white transition-colors uppercase tracking-tight">{statusLabels[item.status]}</span>
                                            <span className="text-sm font-black text-[var(--text-primary)]">{item.quantidade} <span className="text-[var(--text-muted)] text-[10px] font-medium font-mono">({item.percentual}%)</span></span>
                                        </div>
                                        <div className="h-2.5 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/[0.05] p-[1px]">
                                            <div
                                                className={`${statusColors[item.status]} h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.2)]`}
                                                style={{ width: `${item.percentual}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Team Load */}
                    <div className="glass-card-enterprise p-6 rounded-2xl shadow-xl">
                        <h3 className="text-sm font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <Users className="w-4 h-4 text-emerald-500" />
                            Carga por Técnico
                        </h3>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-mardisa">
                            {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={60} className="rounded-xl" />) : tecnicos.length === 0 ? (
                                <p className="text-center py-8 text-[var(--text-muted)] text-sm italic">Nenhum técnico disponível na base</p>
                            ) : (
                                tecnicos.map((tecnico) => (
                                    <div key={tecnico.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between hover:bg-white/[0.04] transition-all group">
                                        <div>
                                            <p className="text-sm font-black text-[var(--text-primary)] group-hover:text-amber-400 transition-colors uppercase">{tecnico.nome}</p>
                                            <div className="flex gap-4 mt-1.5">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]" />
                                                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">{tecnico.osEmExecucao} Execução</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                                                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">{tecnico.osConcluidas} Concluídas</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-lg border flex flex-col items-center min-w-[60px] ${tecnico.osAtribuidas > 5 ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-white/5 border-white/10 text-[var(--text-primary)]'}`}>
                                            <span className="text-xs font-black">{tecnico.osAtribuidas}</span>
                                            <span className="text-[8px] font-bold uppercase opacity-50 tracking-[0.1em]">Carga</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Critical Issues / Unassigned OS */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-sm font-black text-orange-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Pendentes de Alocação ({osNaoAtribuidas.length})
                        </h3>
                    </div>

                    {loading ? <Skeleton height={150} className="rounded-2xl" /> : osNaoAtribuidas.length === 0 ? (
                        <EmptyState
                            icon={CheckCircle}
                            title="Oficina Sincronizada"
                            description="Excelente! Todas as ordens de serviço ativas possuem técnicos atribuídos para execução."
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {osNaoAtribuidas.map((os) => (
                                <div key={os.id} className="glass-card-enterprise p-5 rounded-2xl border-orange-500/10 flex flex-col justify-between hover:bg-white/[0.04] transition-all group">
                                    <div className="space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-black text-white bg-white/10 px-2 py-0.5 rounded uppercase font-mono tracking-tighter">#{os.numero_os}</span>
                                                    <StatusBadge status={os.tipo_os as any} />
                                                    <span className={`text-[10px] font-black uppercase tracking-[0.1em] px-2 py-1 rounded border ${os.dias_em_aberto > 7 ? 'text-rose-400 border-rose-500/20 bg-rose-500/5' : 'text-slate-500 border-white/10 bg-white/5'}`}>
                                                        {os.dias_em_aberto}d SLA
                                                    </span>
                                                </div>
                                                <h4 className="text-sm font-black text-[var(--text-primary)] uppercase leading-tight line-clamp-1">{os.nome_cliente_digitavel || 'S/ Proprietário'}</h4>
                                                <p className="text-[11px] text-[var(--text-muted)] italic">{os.modelo_maquina || 'Máquina não especificada'}</p>
                                            </div>
                                            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
                                                <Clock className="w-4 h-4" />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 text-[10px] font-black uppercase text-[var(--text-muted)]">
                                            <div className="flex items-center gap-1.5">
                                                <div className={`w-1.5 h-1.5 rounded-full ${os.dias_em_aberto > 7 ? 'bg-rose-500 animate-pulse' : 'bg-slate-500'}`} />
                                                <span>{os.dias_em_aberto}d em espera</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-white/[0.03] flex justify-end">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => openAssignModal(os)}
                                            leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                                            className="text-[10px] px-3 font-black tracking-[0.1em]"
                                        >
                                            Atribuir Técnico
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Atribuição */}
            <AssignTechnicianModal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setSelectedOS(null);
                }}
                onAssign={handleAtribuirTecnico}
                tecnicos={tecnicos}
                osNumero={selectedOS?.numero_os || ''}
                osCliente={selectedOS?.nome_cliente_digitavel || undefined}
            />

            {/* Modal de Cadastro de Técnico */}
            <ModalCadastrarTecnico
                isOpen={modalCadastroOpen}
                onClose={() => setModalCadastroOpen(false)}
                onSuccess={carregarDados}
            />
        </AppLayout>
    );
}
