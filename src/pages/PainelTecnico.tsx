import { useState } from 'react';
import {
    Wrench,
    Package,
    Plus,
    RefreshCw,
    AlertCircle,
    Car,
    Clock,
    CheckCircle,
    Calendar
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
    const { user, profile } = useAuth();
    const queryClient = useQueryClient();
    const gerenteRoles = ['GERENTE', 'CHEFE_OFICINA'];
    const isGerente = gerenteRoles.includes(profile?.role?.toUpperCase() || '');

    const [selectedOS, setSelectedOS] = useState<string | null>(null);
    const [selectedNumeroOS, setSelectedNumeroOS] = useState<string>('');
    const [modalOpen, setModalOpen] = useState(false);
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
        queryKey: ['os-tecnico', tecnico?.id],
        queryFn: async () => {
            if (!tecnico?.id) return [];
            const result = await ordemServicoService.list({
                tecnicoId: tecnico.id,
                status: undefined // Trazer todas exceto canceladas/faturadas que o service já deve tratar ou filtraremos
            }, 1, 100);

            // Filtrar e mapear
            return result.data
                .filter(os => !['FATURADA', 'CANCELADA'].includes(os.status_atual))
                .map((os: any) => ({
                    id: os.id,
                    numero_os: os.numero_os,
                    nome_cliente_digitavel: os.nome_cliente_digitavel,
                    modelo_maquina: os.modelo_maquina,
                    status: os.status_atual,
                    data_abertura: os.data_abertura,
                    descricao_problema: os.descricao_problema || '',
                    pecas_lancadas: os.itens?.length || 0
                }));
        },
        enabled: !!tecnico?.id
    });

    // Estatísticas
    const estatisticas = {
        totalOS: osAtribuidas.length,
        emAndamento: osAtribuidas.filter((os: any) => os.status === 'EM_EXECUCAO').length,
        aguardandoPecas: osAtribuidas.filter((os: any) => os.status === 'AGUARDANDO_PECAS').length,
        concluidas: osAtribuidas.filter((os: any) => os.status === 'CONCLUIDA').length
    };

    const handleAdicionarPecas = (os: any) => {
        setSelectedOS(os.id);
        setModalOpen(true);
    };

    const handleLancarDespesas = (os: any) => {
        setSelectedOS(os.id);
        setSelectedNumeroOS(os.numero_os);
        setModalDespesaOpen(true);
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
                        <AlertCircle className="w-12 h-12 text-amber-500" />
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
                        <p className="text-[var(--text-muted)] font-medium mt-2 ml-1">
                            Gerenciamento de suas ordens de serviço ativas
                        </p>
                    </div>
                    <Button
                        variant="secondary"
                        onClick={refreshData}
                        leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
                    >
                        Atualizar Dados
                    </Button>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card
                        title="Total Ativo"
                        value={estatisticas.totalOS}
                        icon={Wrench}
                        trend={{ value: 0, label: 'na fila', isPositive: true }}
                        color="blue"
                        priority={0}
                    />
                    <Card
                        title="Em Andamento"
                        value={estatisticas.emAndamento}
                        icon={Clock}
                        trend={{ value: 0, label: 'executando', isPositive: true }}
                        color="emerald"
                        priority={1}
                    />
                    <Card
                        title="Aguardando Peças"
                        value={estatisticas.aguardandoPecas}
                        icon={Package}
                        trend={{ value: 0, label: 'pendentes', isPositive: false }}
                        color="amber"
                        priority={2}
                    />
                    <Card
                        title="Concluídas Hoje"
                        value={estatisticas.concluidas}
                        icon={CheckCircle}
                        trend={{ value: 0, label: 'finalizadas', isPositive: true }}
                        color="green"
                        priority={3}
                    />
                </div>

                {/* Lista de OS */}
                <div className="space-y-6">
                    <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                        <Wrench className="w-4 h-4" />
                        Minhas Ordens de Serviço ({osAtribuidas.length})
                    </h3>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <Skeleton key={i} height={180} className="rounded-3xl" />
                            ))}
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
                                    className="glass-card-enterprise p-6 rounded-3xl border border-white/[0.03] hover:bg-white/[0.04] transition-all group relative overflow-hidden"
                                >
                                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
                                        <div className="flex-1 space-y-4 w-full">
                                            {/* Header Card */}
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <span className="text-xs font-mono font-bold text-white bg-blue-500/20 px-2 py-1 rounded shadow-sm border border-blue-500/10">
                                                    #{os.numero_os}
                                                </span>
                                                <StatusBadge status={os.status as any} />
                                                <span className="text-[10px] font-black uppercase text-[var(--text-muted)] flex items-center gap-1.5 bg-white/[0.03] px-2 py-1 rounded-lg border border-white/5">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(os.data_abertura).toLocaleDateString('pt-BR')}
                                                </span>
                                            </div>

                                            {/* Info Principal */}
                                            <div>
                                                <h4 className="text-xl font-black text-[var(--text-primary)] mb-1 uppercase tracking-tight">
                                                    {os.nome_cliente_digitavel}
                                                </h4>
                                                <p className="text-sm text-[var(--text-secondary)] font-medium flex items-center gap-2">
                                                    <Car className="w-4 h-4 text-[var(--text-muted)]" />
                                                    {os.modelo_maquina || 'Máquina não identificada'}
                                                </p>
                                            </div>

                                            {/* Descrição e Status Extra */}
                                            <div className="flex flex-wrap gap-4">
                                                {os.descricao_problema && (
                                                    <div className="flex-1 min-w-[300px] p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                                                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-2">
                                                            <AlertCircle className="w-3 h-3" />
                                                            Problema Relatado
                                                        </p>
                                                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                                            {os.descricao_problema}
                                                        </p>
                                                    </div>
                                                )}

                                                {os.status === 'AGUARDANDO_PECAS' && (
                                                    <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 flex flex-col justify-center items-center min-w-[150px]">
                                                        <Package className="w-6 h-6 text-amber-500 mb-2 animate-pulse" />
                                                        <span className="text-xs font-bold text-amber-500 uppercase tracking-wide">Aguardando Peças</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions Column */}
                                        <div className="flex flex-row lg:flex-col gap-3 w-full lg:w-auto mt-4 lg:mt-0 border-t lg:border-t-0 lg:border-l border-white/5 pt-4 lg:pt-0 lg:pl-6">
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                leftIcon={<Plus className="w-3.5 h-3.5" />}
                                                onClick={() => handleAdicionarPecas(os)}
                                                className="w-full justify-start md:justify-center"
                                            >
                                                Lançar Peças
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                leftIcon={<Car className="w-3.5 h-3.5" />}
                                                onClick={() => handleLancarDespesas(os)}
                                                className="w-full justify-start md:justify-center"
                                            >
                                                Lançar Despesa
                                            </Button>

                                            {os.pecas_lancadas > 0 && (
                                                <div className="mt-2 text-center">
                                                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider bg-white/5 px-2 py-1 rounded-lg">
                                                        {os.pecas_lancadas} Peças Lançadas
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Agenda de Todos os Técnicos (visível para gerentes) */}
                {isGerente && (
                    <div className="mt-12 pt-8 border-t border-white/5">
                        <AgendaTecnicos />
                    </div>
                )}

                {/* Modal de Adicionar Peças */}
                <ModalAdicionarPeca
                    isOpen={modalOpen}
                    onClose={() => {
                        setModalOpen(false);
                        setSelectedOS(null);
                    }}
                    osId={selectedOS || ''}
                    onSuccess={refreshData}
                />

                {/* Modal de Lançar Despesas */}
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
