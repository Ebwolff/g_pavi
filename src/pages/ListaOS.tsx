import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, LayoutDashboard, FileText, Search, RefreshCw, ChevronLeft, ChevronRight, Edit2, History } from 'lucide-react';
import { ordemServicoService, OSFilters as ServiceFilters } from '@/services/ordemServico.service';
import { ModalAtualizarStatusOS } from '@/components/ui/ModalAtualizarStatusOS';
import { StatusOS } from '@/types/database.types';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/Button';
import { FilterBar, OSFilters as UIOSFilters } from '@/components/ui/FilterBar';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table';
import { StatusBadge, TipoBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatarValor, formatarData } from '@/utils/osHelpers';

export function ListaOS() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 25;

    const [uiFilters, setUiFilters] = useState<UIOSFilters>({
        tipo: 'TODOS',
        status: 'TODOS',
        diasCategoria: 'TODOS',
    });

    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedOS, setSelectedOS] = useState<{ id: string; numero_os: string; status_atual: StatusOS; } | null>(null);

    // Mapeamento de filtros da UI para Filters do Service
    const serviceFilters = useMemo((): ServiceFilters => {
        return {
            search: uiFilters.busca || undefined,
            tipo: uiFilters.tipo === 'TODOS' ? undefined : uiFilters.tipo as 'NORMAL' | 'GARANTIA',
            status: uiFilters.status === 'TODOS' ? undefined : uiFilters.status,
            dataInicio: uiFilters.dataInicio,
            dataFim: uiFilters.dataFim,
            consultorId: uiFilters.consultorId,
        };
    }, [uiFilters]);

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['ordens-servico', page, serviceFilters],
        queryFn: () => ordemServicoService.list(serviceFilters, page, ITEMS_PER_PAGE),
    });

    const handleFilterChange = (newFilters: UIOSFilters) => {
        setUiFilters(newFilters);
        setPage(1);
    };

    const handleOpenStatusModal = (os: any) => {
        setSelectedOS({ id: os.id, numero_os: os.numero_os, status_atual: os.status_atual as StatusOS });
        setIsStatusModalOpen(true);
    };

    const handleCloseStatusModal = () => {
        setIsStatusModalOpen(false);
        setSelectedOS(null);
    };

    const handleConfirmStatusUpdate = async (statusData: any) => {
        if (!selectedOS) return;
        await ordemServicoService.updateStatus(selectedOS.id, statusData);
        queryClient.invalidateQueries({ queryKey: ['ordens-servico'] });
        await refetch();
    };

    const totalPages = data ? Math.ceil(data.count / ITEMS_PER_PAGE) : 0;

    return (
        <AppLayout>
            <div className="p-8 animate-fadeIn space-y-8">
                {/* Header Page */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                            <FileText className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Gestão de Ordens de Serviço</h1>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-sm text-[var(--text-muted)] flex items-center gap-1">
                                    <LayoutDashboard className="w-3.5 h-3.5" />
                                    Operacional
                                </span>
                                <span className="w-1 h-1 rounded-full bg-[var(--border-subtle)]" />
                                <span className="text-sm text-blue-400 font-medium">{data?.count || 0} Registros</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => refetch()}
                            leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
                        >
                            Atualizar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => navigate('/os/nova')}
                            leftIcon={<Plus className="w-4 h-4" />}
                            className="shadow-lg shadow-blue-500/20"
                        >
                            Nova OS
                        </Button>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="glass-card-enterprise p-1 border-none shadow-none bg-transparent">
                    <FilterBar
                        onFilterChange={handleFilterChange}
                        className="bg-[var(--surface-light)] border border-[var(--border-subtle)] !shadow-none rounded-2xl p-6"
                    />
                </div>

                {/* Table Section */}
                {isLoading ? (
                    <div className="glass-card-enterprise rounded-2xl overflow-hidden border border-[var(--border-subtle)]">
                        <div className="p-6 space-y-4">
                            <Skeleton className="h-10 w-full rounded-lg" />
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} className="h-16 w-full rounded-lg opacity-20" style={{ animationDelay: `${i * 100}ms` }} />
                            ))}
                        </div>
                    </div>
                ) : data && data.data.length > 0 ? (
                    <div className="space-y-6">
                        <Table>
                            <THead>
                                <TR>
                                    <TH>Nº OS</TH>
                                    <TH>Tipo</TH>
                                    <TH>Cliente / Equipamento</TH>
                                    <TH>Data Abertura</TH>
                                    <TH>Status</TH>
                                    <TH>Valor Líquido</TH>
                                    <TH className="text-right">Ações</TH>
                                </TR>
                            </THead>
                            <TBody>
                                {data.data.map((os: any) => (
                                    <TR key={os.id}>
                                        <TD className="font-bold text-white tracking-wider">{os.numero_os}</TD>
                                        <TD><TipoBadge tipo={os.tipo_os} /></TD>
                                        <TD>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-[var(--text-primary)] truncate max-w-[300px]">
                                                    {os.nome_cliente_digitavel || 'Cliente não identificado'}
                                                </span>
                                                <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                                                    <Search className="w-2.5 h-2.5" />
                                                    {os.chassi || 'Sem Chassi'}
                                                </span>
                                            </div>
                                        </TD>
                                        <TD className="text-[var(--text-muted)]">{formatarData(os.data_abertura)}</TD>
                                        <TD><StatusBadge status={os.status_atual} /></TD>
                                        <TD>
                                            <span className="font-bold text-emerald-400">
                                                {formatarValor(os.valor_liquido_total)}
                                            </span>
                                        </TD>
                                        <TD className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenStatusModal(os)}
                                                    className="p-2 rounded-lg hover:bg-amber-500/10 text-amber-500 transition-colors group"
                                                    title="Mudar Status"
                                                >
                                                    <History className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/os/editar/${os.id}`)}
                                                    className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-500 transition-colors group"
                                                    title="Editar OS"
                                                >
                                                    <Edit2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                </button>
                                            </div>
                                        </TD>
                                    </TR>
                                ))}
                            </TBody>
                        </Table>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-2">
                                <span className="text-sm text-[var(--text-muted)] font-medium">
                                    Página {page} de {totalPages}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="p-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-light)] hover:bg-[var(--surface-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronLeft className="w-5 h-5 text-[var(--text-secondary)]" />
                                    </button>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="p-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-light)] hover:bg-[var(--surface-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="glass-card-enterprise p-12 rounded-2xl border border-[var(--border-subtle)]">
                        <EmptyState
                            title="Nenhuma Ordem de Serviço encontrada"
                            description="Tente ajustar seus filtros ou crie uma nova OS para começar."
                            action={{
                                label: "Limpar Filtros",
                                onClick: () => {
                                    setUiFilters({ tipo: 'TODOS', status: 'TODOS', diasCategoria: 'TODOS' });
                                    setPage(1);
                                },
                                icon: RefreshCw
                            }}
                        />
                    </div>
                )}
            </div>

            {selectedOS && (
                <ModalAtualizarStatusOS
                    isOpen={isStatusModalOpen}
                    onClose={handleCloseStatusModal}
                    onConfirm={handleConfirmStatusUpdate}
                    currentStatus={selectedOS.status_atual}
                    osId={selectedOS.id}
                    numeroOS={selectedOS.numero_os}
                />
            )}
        </AppLayout>
    );
}
