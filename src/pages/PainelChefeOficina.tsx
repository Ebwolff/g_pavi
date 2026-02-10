import { useState } from 'react';
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tecnicoService } from '@/services/tecnico.service';
import { ordemServicoService } from '@/services/ordemServico.service';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { AssignTechnicianModal } from '@/components/ui/AssignTechnicianModal';
import { ModalCadastrarTecnico } from '@/components/ui/ModalCadastrarTecnico';
import { Card } from '@/components/ui/Card';

interface OSNaoAtribuida {
    id: string;
    numero_os: string;
    tipo_os: 'NORMAL' | 'GARANTIA';
    nome_cliente_digitavel: string | null;
    modelo_maquina: string | null;
    data_abertura: string;
    dias_em_aberto: number;
}

export default function PainelChefeOficina() {
    const queryClient = useQueryClient();
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedOS, setSelectedOS] = useState<OSNaoAtribuida | null>(null);
    const [modalCadastroOpen, setModalCadastroOpen] = useState(false);

    // Queries de Dados
    const { data: tecnicos = [], isLoading: isLoadingTecnicos } = useQuery({
        queryKey: ['tecnicos-stats'],
        queryFn: () => tecnicoService.getAll(true)
    });

    const { data: todasOS = [], isLoading: isLoadingOS } = useQuery({
        queryKey: ['os-ativas'],
        queryFn: async () => {
            const result = await ordemServicoService.list({
                status: undefined
            }, 1, 1000);
            return result.data;
        }
    });

    // Filtros e Cálculos derivados
    const osAtivas = todasOS.filter((os: any) => !['FATURADA', 'CANCELADA'].includes(os.status_atual));
    const limite60Dias = new Date();
    limite60Dias.setDate(limite60Dias.getDate() - 60);

    const estatisticas = {
        totalTecnicos: tecnicos.length,
        osEmAndamento: osAtivas.filter((o: any) => o.status_atual === 'EM_EXECUCAO').length,
        osAguardandoPecas: osAtivas.filter((o: any) => o.status_atual === 'AGUARDANDO_PECAS').length,
        osSemTecnico: osAtivas.filter((o: any) => !o.tecnico_id).length,
        osCriticas: osAtivas.filter((o: any) => new Date(o.data_abertura) < limite60Dias).length,
    };

    const osNaoAtribuidas: OSNaoAtribuida[] = osAtivas
        .filter((o: any) => !o.tecnico_id)
        .map((o: any) => ({
            id: o.id,
            numero_os: o.numero_os,
            tipo_os: o.tipo_os,
            nome_cliente_digitavel: o.nome_cliente_digitavel,
            modelo_maquina: o.modelo_maquina,
            data_abertura: o.data_abertura,
            dias_em_aberto: Math.floor(
                (Date.now() - new Date(o.data_abertura).getTime()) / (1000 * 60 * 60 * 24)
            ),
        }));

    // Distribuição de Status
    const statusCounts = osAtivas.reduce((acc: any, os: any) => {
        acc[os.status_atual] = (acc[os.status_atual] || 0) + 1;
        return acc;
    }, {});

    const distribuicaoStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        quantidade: Number(count),
        percentual: Math.round((Number(count) / osAtivas.length) * 100)
    })).sort((a, b) => b.quantidade - a.quantidade);

    // Mutation para atribuir técnico
    const atribuirTecnicoMutation = useMutation({
        mutationFn: async ({ tecnicoId, osId }: { tecnicoId: string, osId: string }) => {
            let finalTecnicoId = tecnicoId;
            const tecnico = tecnicos.find(t => t.id === tecnicoId || t.userId === tecnicoId);

            if (tecnico && !tecnico.isRegistered && tecnico.userId) {
                const novo = await tecnicoService.createFromProfile(tecnico.userId);
                finalTecnicoId = novo.id;
            } else if (tecnico) {
                finalTecnicoId = tecnico.id;
            }

            return ordemServicoService.update(osId, { tecnico_id: finalTecnicoId } as any);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['os-ativas'] });
            queryClient.invalidateQueries({ queryKey: ['tecnicos-stats'] });
            setModalOpen(false);
            setSelectedOS(null);
        }
    });

    const handleAtribuir = async (tecnicoId: string) => {
        if (selectedOS) {
            await atribuirTecnicoMutation.mutateAsync({ tecnicoId, osId: selectedOS.id });
        }
    };

    const openAssignModal = (os: OSNaoAtribuida) => {
        setSelectedOS(os);
        setModalOpen(true);
    };

    const isLoading = isLoadingTecnicos || isLoadingOS;

    return (
        <AppLayout>
            <div className="p-8 space-y-8 animate-fadeIn max-w-[1600px] mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-[var(--text-primary)] flex items-center gap-3 tracking-tight">
                            <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                                <Hammer className="w-8 h-8 text-amber-500" />
                            </div>
                            Gestão de Oficina
                        </h1>
                        <p className="text-[var(--text-muted)] font-medium mt-2 ml-1">Controle estratégico de equipe e fluxo de produção</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => setModalCadastroOpen(true)}
                            leftIcon={<UserPlus className="w-4 h-4" />}
                            className="bg-white/5 border-white/10 hover:bg-white/10"
                        >
                            Cadastrar Técnico
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => queryClient.invalidateQueries()}
                            leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
                        >
                            Atualizar
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <Card
                        title="Time Ativo"
                        value={estatisticas.totalTecnicos}
                        icon={Users}
                        trend={{ value: 0, label: 'técnicos', isPositive: true }}
                        color="amber"
                        priority={0}
                    />
                    <Card
                        title="Em Execução"
                        value={estatisticas.osEmAndamento}
                        icon={Clock}
                        trend={{ value: 0, label: 'ordens', isPositive: true }}
                        color="blue"
                        priority={1}
                    />
                    <Card
                        title="Peças Pendentes"
                        value={estatisticas.osAguardandoPecas}
                        icon={PieChart}
                        trend={{ value: 0, label: 'aguardando', isPositive: false }}
                        color="amber"
                        priority={2}
                    />
                    <div className={`glass-card-enterprise p-6 rounded-2xl border flex flex-col justify-between relative overflow-hidden ${estatisticas.osSemTecnico > 0 ? 'border-orange-500/30' : 'border-white/[0.05]'}`}>
                        {estatisticas.osSemTecnico > 0 && <div className="absolute inset-0 bg-orange-500/5 animate-pulse" />}
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Sem Técnico</h3>
                                <p className={`text-3xl font-black mt-2 ${estatisticas.osSemTecnico > 0 ? 'text-orange-400' : 'text-white'}`}>{estatisticas.osSemTecnico}</p>
                            </div>
                            <div className={`p-3 rounded-xl ${estatisticas.osSemTecnico > 0 ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-slate-400'}`}>
                                <UserPlus className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    <div className={`glass-card-enterprise p-6 rounded-2xl border flex flex-col justify-between relative overflow-hidden ${estatisticas.osCriticas > 0 ? 'border-rose-500/30' : 'border-white/[0.05]'}`}>
                        {estatisticas.osCriticas > 0 && <div className="absolute inset-0 bg-rose-500/5 animate-pulse" />}
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Atrasos Críticos</h3>
                                <p className={`text-3xl font-black mt-2 ${estatisticas.osCriticas > 0 ? 'text-rose-400' : 'text-white'}`}>{estatisticas.osCriticas}</p>
                            </div>
                            <div className={`p-3 rounded-xl ${estatisticas.osCriticas > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-white/5 text-slate-400'}`}>
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Views */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Distribution Chart */}
                    <div className="glass-card-enterprise p-8 rounded-3xl shadow-2xl border border-white/5">
                        <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                            <LayoutDashboard className="w-4 h-4 text-amber-500" />
                            Fluxo da Operação
                        </h3>
                        <div className="space-y-6">
                            {isLoading ? <Skeleton className="h-[200px] w-full rounded-2xl" /> : distribuicaoStatus.length === 0 ? (
                                <p className="text-center py-12 text-[var(--text-muted)] text-sm border border-dashed border-white/10 rounded-2xl">Nenhum serviço em andamento</p>
                            ) : (
                                distribuicaoStatus.map((item) => (
                                    <div key={item.status} className="space-y-2 group">
                                        <div className="flex justify-between items-end px-1">
                                            <div className="flex items-center gap-2">
                                                <StatusBadge status={item.status as any} size="sm" />
                                            </div>
                                            <span className="text-sm font-black text-[var(--text-primary)]">{item.quantidade} <span className="text-[var(--text-muted)] text-[10px] font-medium ml-1 opacity-50">({item.percentual}%)</span></span>
                                        </div>
                                        <div className="h-3 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/[0.05] p-[2px]">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ease-out bg-current opacity-80`}
                                                style={{ width: `${item.percentual}%`, color: 'var(--text-primary)' }}
                                            >
                                                <div className="w-full h-full bg-white/20" />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Team Load */}
                    <div className="glass-card-enterprise p-8 rounded-3xl shadow-2xl border border-white/5">
                        <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                            <Users className="w-4 h-4 text-emerald-500" />
                            Carga Técnica da Equipe
                        </h3>
                        <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                            {isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />) : tecnicos.length === 0 ? (
                                <p className="text-center py-12 text-[var(--text-muted)] text-sm italic border border-dashed border-white/10 rounded-2xl">Nenhum técnico disponível na base</p>
                            ) : (
                                tecnicos.map((tecnico) => (
                                    <div key={tecnico.id} className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between hover:bg-white/[0.04] transition-all group">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`w-2 h-2 rounded-full ${tecnico.isRegistered ? 'bg-emerald-500' : 'bg-amber-500'}`} title={tecnico.isRegistered ? 'Cadastrado' : 'Pendente de Cadastro'}></span>
                                                <p className="text-sm font-black text-[var(--text-primary)] group-hover:text-amber-400 transition-colors uppercase tracking-tight">{tecnico.nome}</p>
                                            </div>

                                            <div className="flex gap-4">
                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/10 border border-blue-500/10">
                                                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">{tecnico.stats?.osEmExecucao || 0} Execução</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/10">
                                                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">{tecnico.stats?.osConcluidas || 0} Concluídas</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`px-5 py-3 rounded-xl border flex flex-col items-center min-w-[70px] ${(tecnico.stats?.osAtribuidas || 0) > 5 ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-white/5 border-white/10 text-[var(--text-primary)]'}`}>
                                            <span className="text-xl font-black leading-none">{tecnico.stats?.osAtribuidas || 0}</span>
                                            <span className="text-[8px] font-bold uppercase opacity-50 tracking-[0.1em] mt-1">Carga</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Critical Issues / Unassigned OS */}
                <div className="space-y-6 pt-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xs font-black text-orange-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Pendentes de Alocação ({osNaoAtribuidas.length})
                        </h3>
                    </div>

                    {isLoading ? <Skeleton className="h-[200px] w-full rounded-2xl" /> : osNaoAtribuidas.length === 0 ? (
                        <EmptyState
                            icon={CheckCircle}
                            title="Oficina Sincronizada"
                            description="Excelente! Todas as ordens de serviço ativas possuem técnicos atribuídos para execução."
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {osNaoAtribuidas.map((os) => (
                                <div key={os.id} className="glass-card-enterprise p-6 rounded-3xl border border-orange-500/10 flex flex-col justify-between hover:bg-white/[0.04] transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <UserPlus className="w-24 h-24 text-orange-500/50 rotate-12" />
                                    </div>

                                    <div className="space-y-5 relative z-10">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs font-black text-white bg-white/10 px-2 py-0.5 rounded uppercase font-mono tracking-tighter shadow-sm">#{os.numero_os}</span>
                                                    <StatusBadge status={os.tipo_os as any} size="sm" />
                                                </div>
                                                <h4 className="text-sm font-black text-[var(--text-primary)] uppercase leading-tight line-clamp-2 min-h-[2.5em]">{os.nome_cliente_digitavel || 'S/ Proprietário'}</h4>
                                                <p className="text-xs text-[var(--text-muted)] italic mt-1">{os.modelo_maquina || 'Máquina não especificada'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 text-[10px] font-black uppercase text-[var(--text-muted)] bg-white/[0.02] p-3 rounded-xl border border-white/5">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${os.dias_em_aberto > 7 ? 'bg-rose-500 animate-pulse' : 'bg-slate-500'}`} />
                                                <span>{os.dias_em_aberto} dias em espera</span>
                                            </div>
                                            {os.dias_em_aberto > 7 && <span className="ml-auto text-rose-400">SLA Crítico</span>}
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-5 border-t border-white/[0.03] flex justify-end relative z-10">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => openAssignModal(os)}
                                            leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                                            className="text-[10px] px-4 py-2 font-black tracking-[0.1em] hover:bg-orange-500/20 hover:text-orange-400 hover:border-orange-500/20 transition-all w-full"
                                        >
                                            ATRIBUIR AGORA
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
                onAssign={handleAtribuir}
                tecnicos={tecnicos.map(t => ({
                    ...t,
                    osAtribuidas: t.stats?.osAtribuidas || 0,
                    osEmExecucao: t.stats?.osEmExecucao || 0,
                    osConcluidas: t.stats?.osConcluidas || 0
                }))}
                osNumero={selectedOS?.numero_os || ''}
                osCliente={selectedOS?.nome_cliente_digitavel || undefined}
            />

            {/* Modal de Cadastro de Técnico */}
            <ModalCadastrarTecnico
                isOpen={modalCadastroOpen}
                onClose={() => setModalCadastroOpen(false)}
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ['tecnicos-stats'] })}
            />
        </AppLayout>
    );
}
