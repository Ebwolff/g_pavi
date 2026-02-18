import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Wrench,
    Clock,
    CheckCircle,
    Play,
    Pause,
    AlertTriangle,
    ChevronRight,
    Search,
    RefreshCw,
    Box,
    CreditCard,
    LayoutDashboard
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { tecnicoService } from '@/services/tecnico.service';
import { ordemServicoService } from '@/services/ordemServico.service';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card } from '@/components/ui/Card';
import { ModalAdicionarPeca } from '@/components/ui/ModalAdicionarPeca';
import { ModalLancarDespesa } from '@/components/ui/ModalLancarDespesa';
import { AgendaTecnicos } from '@/components/dashboard/AgendaTecnicos';

export default function PainelTecnico() {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const queryClient = useQueryClient();
    const gerenteRoles = ['GERENTE', 'CHEFE_OFICINA', 'DIRETORIA'];
    const isGerente = gerenteRoles.includes(profile?.role?.toUpperCase() || '');

    const [selectedOS, setSelectedOS] = useState<string | null>(null);
    const [selectedNumeroOS, setSelectedNumeroOS] = useState<string>('');
    const [modalPecaOpen, setModalPecaOpen] = useState(false);
    const [modalDespesaOpen, setModalDespesaOpen] = useState(false);

    // 1. Identificar Técnico
    const { data: tecnico, isLoading: isLoadingTecnico } = useQuery({
        queryKey: ['tecnico-profile', user?.id],
        queryFn: async () => {
            if (!user?.id) return null;
            return tecnicoService.getByUserId(user.id);
        },
        enabled: !!user?.id
    });

    // 2. Buscar OS do Técnico
    const { data: osAtribuidas = [], isLoading: isLoadingOS } = useQuery({
        queryKey: ['os-tecnico', tecnico?.id, isGerente],
        queryFn: async () => {
            // Se for gerente, traz todas as ativas. Se for técnico, traz apenas as dele.
            const filters: any = {};
            if (!isGerente) {
                if (!tecnico?.id) return [];
                filters.tecnicoId = tecnico.id;
            }

            const result = await ordemServicoService.list(filters, 1, 100);

            return result.data
                .filter(os => !['FATURADA', 'CANCELADA'].includes(os.status_atual) && !!os.tecnico_id)
                .map((os: any) => ({
                    id: os.id,
                    numero_os: os.numero_os,
                    nome_cliente_digitavel: os.nome_cliente_digitavel,
                    modelo_maquina: os.modelo_maquina,
                    status: os.status_atual,
                    data_abertura: os.data_abertura,
                    descricao_problema: os.descricao_problema || '',
                    pecas_lancadas: os.itens?.length || 0,
                    nome_tecnico: os.tecnico?.nome_completo // Pegar nome do técnico responsável
                }));
        },
        enabled: isGerente || !!tecnico?.id
    });

    // Mutation para atualização de status
    const updateStatusMutation = useMutation({
        mutationFn: async ({ osId, status }: { osId: string, status: string }) => {
            return ordemServicoService.update(osId, { status_atual: status } as any);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['os-tecnico'] });
        }
    });

    const handleUpdateStatus = async (osId: string, status: string) => {
        try {
            await updateStatusMutation.mutateAsync({ osId, status });
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
        }
    };

    // Estatísticas
    const estatisticas = {
        totalOS: osAtribuidas.length,
        emAndamento: osAtribuidas.filter((os: any) => os.status === 'EM_EXECUCAO').length,
        aguardandoPecas: osAtribuidas.filter((os: any) => os.status === 'AGUARDANDO_PECAS').length,
        concluidas: osAtribuidas.filter((os: any) => os.status === 'CONCLUIDA').length
    };

    const loading = isLoadingTecnico || isLoadingOS;

    const refreshData = () => {
        queryClient.invalidateQueries({ queryKey: ['os-tecnico'] });
    };

    if (!loading && !tecnico && !isGerente) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                    <div className="p-4 bg-amber-500/10 rounded-full mb-4">
                        <AlertTriangle className="w-12 h-12 text-amber-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Perfil Técnico Não Encontrado</h2>
                    <p className="text-[var(--text-muted)] max-w-md">
                        Seu usuário não está vinculado a um cadastro de técnico. Entre em contato com o gerente ou chefe de oficina.
                    </p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="p-8 space-y-8 animate-fadeIn max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-[var(--text-primary)] flex items-center gap-3 tracking-tight">
                            <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                                <Wrench className="w-8 h-8 text-blue-500" />
                            </div>
                            Painel do Técnico
                        </h1>
                        <p className="text-[var(--text-muted)] font-medium mt-1 ml-1">
                            {isGerente
                                ? 'Monitoramento global de ordens de serviço ativas'
                                : 'Gerenciamento de suas ordens de serviço ativas'}
                        </p>
                    </div>
                    <Button
                        variant="secondary"
                        onClick={refreshData}
                        leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
                        className="bg-[var(--surface-light)] border-[var(--border-subtle)]"
                    >
                        Atualizar Dados
                    </Button>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card title="Total Ativo" value={estatisticas.totalOS} icon={Wrench} color="blue" priority={1} />
                    <Card title="Em Andamento" value={estatisticas.emAndamento} icon={Clock} color="blue" priority={2} />
                    <Card title="Aguardando Peças" value={estatisticas.aguardandoPecas} icon={Box} color="amber" priority={3} />
                    <Card title="Concluídas Hoje" value={estatisticas.concluidas} icon={CheckCircle} color="emerald" priority={4} />
                </div>

                {/* Lista de OS */}
                <div className="space-y-6">
                    <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4" />
                        {isGerente ? 'Fila de Trabalho / OS Ativas' : 'Minhas Ordens de Serviço'} ({osAtribuidas.length})
                    </h3>

                    {loading ? (
                        <div className="grid grid-cols-1 gap-6">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-3xl" />)}
                        </div>
                    ) : osAtribuidas.length === 0 ? (
                        <EmptyState
                            icon={Wrench}
                            title="Nenhuma OS atribuída"
                            description="Você não possui ordens de serviço ativas no momento. Aproveite para organizar sua bancada!"
                        />
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {osAtribuidas.map((os: any) => (
                                <div
                                    key={os.id}
                                    className="glass-card-enterprise p-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-light)] hover:bg-[var(--surface-hover)] transition-all duration-group relative overflow-hidden"
                                >
                                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
                                        <div className="flex-1 space-y-4 w-full">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded border border-blue-500/20 shadow-sm uppercase tracking-tighter">
                                                    #{os.numero_os}
                                                </span>
                                                <StatusBadge status={os.status as any} size="sm" />
                                                <span className="text-[10px] font-black uppercase text-[var(--text-muted)] flex items-center gap-1.5 bg-[var(--surface)] px-2 py-1.5 rounded-lg border border-[var(--border-subtle)]">
                                                    <RefreshCw className="w-3 h-3" />
                                                    {new Date(os.data_abertura).toLocaleDateString('pt-BR')}
                                                </span>
                                            </div>

                                            <div>
                                                <h4 className="text-xl font-black text-[var(--text-primary)] mb-1 uppercase tracking-tight">
                                                    {os.nome_cliente_digitavel || 'S/ Proprietário'}
                                                </h4>
                                                <div className="flex items-center gap-4">
                                                    <p className="text-xs text-[var(--text-muted)] font-medium flex items-center gap-2">
                                                        <Search className="w-4 h-4" />
                                                        {os.modelo_maquina || 'Máquina não identificada'}
                                                    </p>
                                                    {os.pecas_lancadas > 0 && (
                                                        <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10 uppercase tracking-tighter">
                                                            {os.pecas_lancadas} Peças Lançadas
                                                        </span>
                                                    )}
                                                    {isGerente && os.nome_tecnico && (
                                                        <span className="text-[10px] font-black text-blue-400 bg-blue-500/5 px-2 py-1 rounded border border-blue-500/10 uppercase tracking-tighter flex items-center gap-1.5">
                                                            <div className="w-1 h-1 rounded-full bg-blue-500" />
                                                            Técnico: {os.nome_tecnico}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {os.descricao_problema && (
                                                <div className="p-4 bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)]">
                                                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-2">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        Diagnóstico / Reclamação
                                                    </p>
                                                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-2 italic">
                                                        "{os.descricao_problema}"
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-[var(--border-subtle)] lg:pl-6">
                                            <Button
                                                variant={os.status === 'EM_EXECUCAO' ? 'secondary' : 'primary'}
                                                size="sm"
                                                onClick={() => handleUpdateStatus(os.id, os.status === 'EM_EXECUCAO' ? 'PAUSADA' : 'EM_EXECUCAO')}
                                                leftIcon={os.status === 'EM_EXECUCAO' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                                className={os.status === 'EM_EXECUCAO' ? 'border-[var(--border-subtle)] flex-1 lg:flex-none' : 'bg-blue-600 hover:bg-blue-700 text-white flex-1 lg:flex-none'}
                                            >
                                                {os.status === 'EM_EXECUCAO' ? 'Pausar' : 'Iniciar'}
                                            </Button>

                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedOS(os.id);
                                                    setModalPecaOpen(true);
                                                }}
                                                leftIcon={<Box className="w-4 h-4" />}
                                                className="border-[var(--border-subtle)] opacity-80 hover:opacity-100 flex-1 lg:flex-none"
                                            >
                                                Peças
                                            </Button>

                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedOS(os.id);
                                                    setSelectedNumeroOS(os.numero_os);
                                                    setModalDespesaOpen(true);
                                                }}
                                                leftIcon={<CreditCard className="w-4 h-4" />}
                                                className="border-[var(--border-subtle)] opacity-80 hover:opacity-100 flex-1 lg:flex-none"
                                            >
                                                Custos
                                            </Button>

                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => navigate(`/os/editar/${os.id}`)}
                                                leftIcon={<ChevronRight className="w-4 h-4" />}
                                                className="border-[var(--border-subtle)] p-2 hover:bg-blue-500 hover:text-white transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {isGerente && (
                    <div className="mt-12 pt-8 border-t border-[var(--border-subtle)]">
                        <AgendaTecnicos />
                    </div>
                )}

                <ModalAdicionarPeca
                    isOpen={modalPecaOpen}
                    onClose={() => {
                        setModalPecaOpen(false);
                        setSelectedOS(null);
                    }}
                    osId={selectedOS || ''}
                    onSuccess={refreshData}
                />

                <ModalLancarDespesa
                    isOpen={modalDespesaOpen}
                    onClose={() => {
                        setModalDespesaOpen(false);
                        setSelectedOS(null);
                        setSelectedNumeroOS('');
                    }}
                    osId={selectedOS || ''}
                    osNumero={selectedNumeroOS}
                    onSuccess={refreshData}
                />
            </div>
        </AppLayout>
    );
}
