// Trigger deploy: 2026-02-18 15:53
import React, { useState } from 'react';
import {
    Users,
    Clock,
    CheckCircle,
    AlertTriangle,
    Plus,
    UserPlus,
    PieChart,
    RefreshCw,
    Package
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
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
import { ModalDetalhesTecnico } from '@/components/ui/ModalDetalhesTecnico';

interface OSNaoAtribuida {
    id: string;
    numero_os: string;
    tipo_os: 'NORMAL' | 'GARANTIA';
    nome_cliente_digitavel: string | null;
    modelo_maquina: string | null;
    data_abertura: string;
    dias_em_aberto: number;
    descricao_problema: string | null;
}

const PainelChefeOficina: React.FC = () => {
    const queryClient = useQueryClient();
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedOS, setSelectedOS] = useState<OSNaoAtribuida | null>(null);
    const [modalCadastroOpen, setModalCadastroOpen] = useState(false);
    const [modalDetalhesOpen, setModalDetalhesOpen] = useState(false);
    const [selectedTecnico, setSelectedTecnico] = useState<any | null>(null);
    const [expandedOS, setExpandedOS] = useState<string | null>(null);
    const { profile } = useAuth();
    const isGerente = profile?.role === 'GERENTE';

    // Refs para scroll suave
    const tecnicosRef = React.useRef<HTMLDivElement>(null);
    const pendenciasRef = React.useRef<HTMLDivElement>(null);
    const distribucaoRef = React.useRef<HTMLDivElement>(null);

    const scrollToRef = (ref: React.RefObject<HTMLDivElement | null>) => {
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const { data: tecnicos = [], isLoading: isLoadingTecnicos } = useQuery({
        queryKey: ['tecnicos-stats'],
        queryFn: async () => {
            const allTecnicos = await tecnicoService.getAll(true);

            // Buscar OS para popular o modal de detalhes
            const { data: osData } = await supabase
                .from('ordens_servico')
                .select('*')
                .not('status_atual', 'in', '(CANCELADA,FATURADA)');

            return allTecnicos.map(t => ({
                ...t,
                ordens_servico: (osData || []).filter((os: any) => os.tecnico_id === t.id)
            }));
        }
    });

    // Todas as OS ativas
    const { data: todasOS = [], isLoading: isLoadingOS } = useQuery({
        queryKey: ['os-ativas'],
        queryFn: async () => {
            const result = await ordemServicoService.list({ status: undefined }, 1, 1000);
            return result.data;
        }
    });

    const openTecnicoDetails = (tecnico: any) => {
        setSelectedTecnico(tecnico);
        setModalDetalhesOpen(true);
    };

    // Cálculos derivados
    const osAtivas = todasOS.filter((os: any) => !['FATURADA', 'CANCELADA'].includes(os.status_atual));
    const limite60Dias = new Date();
    limite60Dias.setDate(limite60Dias.getDate() - 60);

    const osSemTecnico = osAtivas.filter((o: any) => !o.tecnico_id);
    const totalHorasSemTecnico = osSemTecnico.reduce((acc: number, o: any) => {
        const horas = (Date.now() - new Date(o.data_abertura).getTime()) / (1000 * 60 * 60);
        return acc + horas;
    }, 0);

    const estatisticas = {
        totalTecnicos: tecnicos.length,
        osEmAndamento: osAtivas.filter((o: any) => o.status_atual === 'EM_EXECUCAO').length,
        osAguardandoPecas: osAtivas.filter((o: any) => o.status_atual === 'AGUARDANDO_PECAS').length,
        osSemTecnico: osSemTecnico.length,
        osCriticas: osAtivas.filter((o: any) => new Date(o.data_abertura) < limite60Dias).length,
        leadTimeTriagem: osSemTecnico.length > 0 ? (totalHorasSemTecnico / osSemTecnico.length).toFixed(1) : 0,
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
            dias_em_aberto: Math.floor((Date.now() - new Date(o.data_abertura).getTime()) / (1000 * 60 * 60 * 24)),
            descricao_problema: o.descricao_problema || 'Nenhuma descrição detalhada fornecida.',
        }));

    const statusCounts = osAtivas.reduce((acc: any, os: any) => {
        acc[os.status_atual] = (acc[os.status_atual] || 0) + 1;
        return acc;
    }, {});

    const distribuicaoStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        quantidade: Number(count),
        percentual: Math.round((Number(count) / (osAtivas.length || 1)) * 100)
    })).sort((a, b) => b.quantidade - a.quantidade);

    const handleAtribuir = async (tecnicoId: string) => {
        if (selectedOS) {
            try {
                await ordemServicoService.update(selectedOS.id, { tecnico_id: tecnicoId } as any);
                queryClient.invalidateQueries({ queryKey: ['os-ativas'] });
                queryClient.invalidateQueries({ queryKey: ['tecnicos-stats'] });
                setModalOpen(false);
                setSelectedOS(null);
            } catch (error) {
                console.error('Erro ao atribuir:', error);
            }
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-[var(--text-primary)] flex items-center gap-3 tracking-tight">
                            <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                                <Plus className="w-8 h-8 text-amber-500" />
                            </div>
                            Gestão de Oficina
                        </h1>
                        <p className="text-[var(--text-muted)] font-medium mt-1 ml-1">Controle estratégico de equipe e fluxo de produção</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => queryClient.invalidateQueries()}
                            leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
                            className="bg-[var(--surface-light)] border-[var(--border-subtle)]"
                        >
                            Sincronizar
                        </Button>
                        {!isGerente && (
                            <Button
                                variant="primary"
                                onClick={() => setModalCadastroOpen(true)}
                                leftIcon={<UserPlus className="w-4 h-4" />}
                                className="bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-500/20"
                            >
                                Novo Técnico
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <Card
                        title="Técnicos Ativos"
                        value={estatisticas.totalTecnicos}
                        icon={Users}
                        color="blue"
                        priority={1}
                        onClick={() => scrollToRef(tecnicosRef)}
                    />
                    <Card
                        title="OS em Execução"
                        value={estatisticas.osEmAndamento}
                        icon={Clock}
                        color="blue"
                        priority={2}
                        onClick={() => scrollToRef(distribucaoRef)}
                    />
                    <Card
                        title="OS Sem Técnico"
                        value={estatisticas.osSemTecnico}
                        icon={UserPlus}
                        color={estatisticas.osSemTecnico > 0 ? "rose" : "blue"}
                        priority={3}
                        onClick={() => scrollToRef(pendenciasRef)}
                    />
                    <Card
                        title="Lead Time Triagem"
                        value={`${estatisticas.leadTimeTriagem}h`}
                        icon={Clock}
                        color={Number(estatisticas.leadTimeTriagem) > 24 ? "rose" : "amber"}
                        priority={4}
                        trend={{ value: 0, label: 'média atual', isPositive: false }}
                    />
                    <Card
                        title="Atrasos Críticos"
                        value={estatisticas.osCriticas}
                        icon={AlertTriangle}
                        color={estatisticas.osCriticas > 0 ? "rose" : "blue"}
                        priority={5}
                        onClick={() => scrollToRef(pendenciasRef)}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div id="distribuicao-oficina" ref={distribucaoRef} className="glass-card-enterprise p-8 rounded-3xl shadow-2xl border border-[var(--border-subtle)] bg-[var(--surface)] scroll-mt-8">
                        <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                            <PieChart className="w-5 h-5 text-amber-500" />
                            Distribuição da Demanda
                        </h3>
                        <div className="space-y-5">
                            {isLoading ? <Skeleton className="h-[200px] w-full rounded-2xl" /> : distribuicaoStatus.length === 0 ? (
                                <p className="text-center py-12 text-[var(--text-muted)] text-sm border border-dashed border-[var(--border-subtle)] rounded-2xl">Nenhum serviço em andamento</p>
                            ) : (
                                distribuicaoStatus.map((item) => (
                                    <div key={item.status} className="space-y-2.5 group">
                                        <div className="flex justify-between items-end px-1">
                                            <StatusBadge status={item.status as any} size="sm" />
                                            <div className="text-right">
                                                <span className="text-sm font-black text-[var(--text-primary)]">{item.quantidade}</span>
                                                <span className="text-[10px] font-black text-blue-400 ml-2 bg-blue-500/5 px-1.5 py-0.5 rounded border border-blue-500/10">{item.percentual}%</span>
                                            </div>
                                        </div>
                                        <div className="h-2.5 w-full bg-[var(--surface-light)] rounded-full overflow-hidden border border-[var(--border-subtle)] p-[1px]">
                                            <div
                                                className="h-full rounded-full transition-all duration-1000 ease-out bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.3)]"
                                                style={{ width: `${item.percentual}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div id="carga-tecnica" ref={tecnicosRef} className="glass-card-enterprise p-8 rounded-3xl shadow-2xl border border-[var(--border-subtle)] bg-[var(--surface)] scroll-mt-8">
                        <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                            <Users className="w-5 h-5 text-emerald-500" />
                            Carga Técnica da Equipe
                        </h3>
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-visao360">
                            {isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />) : tecnicos.length === 0 ? (
                                <p className="text-center py-12 text-[var(--text-muted)] text-sm italic border border-dashed border-[var(--border-subtle)] rounded-2xl">Nenhum técnico disponível na base</p>
                            ) : (
                                (tecnicos || []).map((tecnico: any) => (
                                    <div
                                        key={tecnico.id}
                                        onClick={() => openTecnicoDetails(tecnico)}
                                        className="p-5 bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-2xl flex items-center justify-between hover:bg-[var(--surface-hover)] transition-all group cursor-pointer"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2.5">
                                                <span className={`w-2.5 h-2.5 rounded-full ${tecnico.isRegistered ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                                <p className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">{tecnico.nome}</p>
                                            </div>
                                            <div className="flex flex-wrap gap-3">
                                                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-blue-500/5 border border-blue-500/10 text-blue-400">
                                                    <span className="text-[10px] font-black uppercase tracking-tighter">{tecnico.stats?.osEmExecucao || 0} Executando</span>
                                                </div>
                                                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-emerald-400">
                                                    <span className="text-[10px] font-black uppercase tracking-tighter">{tecnico.stats?.osConcluidas || 0} Concluídas</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`flex flex-col items-center justify-center h-16 w-16 rounded-2xl border transition-all duration-300 ${(tecnico.stats?.osAtribuidas || 0) > 5 ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-[var(--surface)] border-[var(--border-subtle)] text-[var(--text-primary)]'}`}>
                                            <span className="text-2xl font-black leading-none">{tecnico.stats?.osAtribuidas || 0}</span>
                                            <span className="text-[8px] font-black uppercase opacity-40 tracking-widest mt-1">Carga</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div id="pendencias-alocacao" ref={pendenciasRef} className="space-y-6 pt-4 scroll-mt-8">
                    <h3 className="text-xs font-black text-orange-400 uppercase tracking-[0.2em] flex items-center gap-2 px-2">
                        <AlertTriangle className="w-4 h-4" />
                        Pendências de Alocação ({osNaoAtribuidas.length})
                    </h3>

                    {isLoading ? <Skeleton className="h-[200px] w-full rounded-2xl" /> : osNaoAtribuidas.length === 0 ? (
                        <EmptyState icon={CheckCircle} title="Oficina Sincronizada" description="Excelente! Todas as ordens de serviço ativas possuem técnicos atribuídos." />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {osNaoAtribuidas.map((os) => (
                                <div
                                    key={os.id}
                                    className={`glass-card-enterprise p-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-light)] flex flex-col justify-between hover:bg-[var(--surface-hover)] transition-all group relative overflow-hidden cursor-pointer ${expandedOS === os.id ? 'ring-2 ring-orange-500/50' : ''}`}
                                    onClick={() => setExpandedOS(expandedOS === os.id ? null : os.id)}
                                >
                                    <div className="absolute -top-6 -right-6 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
                                        <UserPlus className="w-32 h-32 text-orange-500 rotate-12" />
                                    </div>
                                    <div className="space-y-4 relative z-10">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-orange-400 bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20 shadow-sm">#{os.numero_os}</span>
                                            <StatusBadge status={os.tipo_os as any} size="sm" />
                                        </div>
                                        <h4 className="text-base font-black text-[var(--text-primary)] uppercase leading-tight line-clamp-2 min-h-[2.5em]">
                                            {os.nome_cliente_digitavel || 'S/ Proprietário'}
                                        </h4>
                                        <p className="text-xs text-[var(--text-muted)] font-medium flex items-center gap-1.5">
                                            <Package className="w-3.5 h-3.5" />
                                            {os.modelo_maquina || 'Máquina não especificada'}
                                        </p>

                                        {expandedOS === os.id && (
                                            <div className="mt-4 p-4 bg-[var(--surface)] border border-orange-500/20 rounded-2xl animate-slideDown">
                                                <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    Relato do Problema
                                                </p>
                                                <p className="text-sm font-medium text-[var(--text-primary)] leading-relaxed italic border-l-2 border-orange-500/30 pl-3">
                                                    "{os.descricao_problema}"
                                                </p>
                                            </div>
                                        )}

                                        <div className={`flex items-center gap-3 text-[10px] font-black uppercase p-3 rounded-xl border ${os.dias_em_aberto > 7 ? 'bg-rose-500/5 border-rose-500/20 text-rose-400' : 'bg-[var(--surface)] border-[var(--border-subtle)] text-[var(--text-muted)]'}`}>
                                            <div className={`w-2 h-2 rounded-full ${os.dias_em_aberto > 7 ? 'bg-rose-500 animate-pulse' : 'bg-slate-500/40'}`} />
                                            <span>{os.dias_em_aberto} dias em espera</span>
                                        </div>
                                    </div>
                                    {!isGerente && (
                                        <div className="mt-6 pt-5 border-t border-[var(--border-subtle)] relative z-10">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openAssignModal(os);
                                                }}
                                                leftIcon={<UserPlus className="w-4 h-4" />}
                                                className="w-full text-[10px] font-black tracking-widest uppercase hover:bg-orange-500 hover:text-white transition-all"
                                            >
                                                Atribuir Técnico
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <AssignTechnicianModal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setSelectedOS(null); }}
                onAssign={handleAtribuir}
                tecnicos={tecnicos.map((t: any) => ({
                    ...t,
                    osAtribuidas: t.stats?.osAtribuidas || 0,
                    osEmExecucao: t.stats?.osEmExecucao || 0,
                    osConcluidas: t.stats?.osConcluidas || 0
                }))}
                osNumero={selectedOS?.numero_os || ''}
                osCliente={selectedOS?.nome_cliente_digitavel || undefined}
            />

            <ModalCadastrarTecnico
                isOpen={modalCadastroOpen}
                onClose={() => setModalCadastroOpen(false)}
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ['tecnicos-stats'] })}
            />

            <ModalDetalhesTecnico
                isOpen={modalDetalhesOpen}
                onClose={() => {
                    setModalDetalhesOpen(false);
                    setSelectedTecnico(null);
                }}
                tecnico={selectedTecnico}
            />
        </AppLayout>
    );
};

export default PainelChefeOficina;
