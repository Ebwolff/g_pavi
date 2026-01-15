import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ordemServicoService, OSFilters } from '../services/ordemServico.service';
import { ModalAtualizarStatusOS } from '../components/ui/ModalAtualizarStatusOS';
import { StatusOS } from '../types/database.types';

export function ListaOS() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState<OSFilters>({});
    const [search, setSearch] = useState('');
    const [tipoFilter, setTipoFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedOS, setSelectedOS] = useState<{ id: string; numero_os: string; status_atual: StatusOS; } | null>(null);

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['ordens-servico', page, filters],
        queryFn: () => ordemServicoService.list(filters, page, 25),
    });

    const handleSearch = () => {
        setFilters({ ...filters, search: search || undefined, tipo: tipoFilter as any || undefined, status: statusFilter || undefined });
        setPage(1);
    };

    const handleClearFilters = () => { setSearch(''); setTipoFilter(''); setStatusFilter(''); setFilters({}); setPage(1); };

    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR');

    const getStatusBadge = (status: string) => {
        const badges: Record<string, string> = {
            'EM_EXECUCAO': 'bg-blue-100 text-blue-800', 'AGUARDANDO_PECAS': 'bg-yellow-100 text-yellow-800',
            'PAUSADA': 'bg-gray-100 text-gray-800', 'CONCLUIDA': 'bg-green-100 text-green-800',
            'FATURADA': 'bg-purple-100 text-purple-800', 'CANCELADA': 'bg-red-100 text-red-800',
            'AGUARDANDO_APROVACAO_ORCAMENTO': 'bg-amber-100 text-amber-800', 'AGUARDANDO_PAGAMENTO': 'bg-emerald-100 text-emerald-800',
            'EM_DIAGNOSTICO': 'bg-cyan-100 text-cyan-800', 'EM_TRANSITO': 'bg-indigo-100 text-indigo-800',
        };
        const labels: Record<string, string> = {
            'EM_EXECUCAO': 'Em Execução', 'AGUARDANDO_PECAS': 'Aguardando Peças', 'PAUSADA': 'Pausada',
            'CONCLUIDA': 'Concluída', 'FATURADA': 'Faturada', 'CANCELADA': 'Cancelada',
            'AGUARDANDO_APROVACAO_ORCAMENTO': 'Aguardando Orçamento', 'AGUARDANDO_PAGAMENTO': 'Aguardando Pagamento',
            'EM_DIAGNOSTICO': 'Em Diagnóstico', 'EM_TRANSITO': 'Em Trânsito',
        };
        return (<span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status] || 'bg-gray-100 text-gray-800'}`}>{labels[status] || status}</span>);
    };

    const handleOpenStatusModal = (os: any) => { setSelectedOS({ id: os.id, numero_os: os.numero_os, status_atual: os.status_atual as StatusOS }); setIsStatusModalOpen(true); };
    const handleCloseStatusModal = () => { setIsStatusModalOpen(false); setSelectedOS(null); };
    const handleConfirmStatusUpdate = async (statusData: any) => {
        if (!selectedOS) return;
        await ordemServicoService.updateStatus(selectedOS.id, statusData);
        queryClient.invalidateQueries({ queryKey: ['ordens-servico'] });
        await refetch();
    };

    const totalPages = data ? Math.ceil(data.count / 25) : 0;

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-lg transition">
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <div><h1 className="text-2xl font-bold text-gray-900">Ordens de Serviço</h1><p className="text-sm text-gray-600">{data?.count || 0} registros encontrados</p></div>
                        </div>
                        <button onClick={() => navigate('/os/nova')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium flex items-center space-x-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            <span>Nova OS</span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSearch()} placeholder="Número OS, cliente, chassi..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                            <select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none">
                                <option value="">Todos</option><option value="NORMAL">Normal (N)</option><option value="GARANTIA">Garantia (W)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none">
                                <option value="">Todos</option>
                                <option value="EM_EXECUCAO">Em Execução</option><option value="AGUARDANDO_PECAS">Aguardando Peças</option>
                                <option value="AGUARDANDO_APROVACAO_ORCAMENTO">Aguardando Orçamento</option><option value="AGUARDANDO_PAGAMENTO">Aguardando Pagamento</option>
                                <option value="EM_DIAGNOSTICO">Em Diagnóstico</option><option value="EM_TRANSITO">Em Trânsito</option>
                                <option value="PAUSADA">Pausada</option><option value="CONCLUIDA">Concluída</option>
                                <option value="FATURADA">Faturada</option><option value="CANCELADA">Cancelada</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-4">
                        <button onClick={handleClearFilters} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium">Limpar</button>
                        <button onClick={handleSearch} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium">Filtrar</button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>
                ) : data && data.data.length > 0 ? (
                    <>
                        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número OS</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Abertura</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Total</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {data.data.map((os: any) => (
                                            <tr key={os.id} className="hover:bg-gray-50 transition">
                                                <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{os.numero_os}</div></td>
                                                <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 rounded text-xs font-medium ${os.tipo_os === 'NORMAL' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>{os.tipo_os === 'NORMAL' ? 'N' : 'W'}</span></td>
                                                <td className="px-6 py-4"><div className="text-sm text-gray-900">{os.nome_cliente_digitavel || '-'}</div>{os.chassi && (<div className="text-xs text-gray-500">Chassi: {os.chassi}</div>)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(os.data_abertura)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(os.status_atual)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(os.valor_liquido_total)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <button onClick={() => handleOpenStatusModal(os)} className="text-amber-600 hover:text-amber-900 transition" title="Alterar Status">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                                        </button>
                                                        <button onClick={() => navigate(`/os/editar/${os.id}`)} className="text-indigo-600 hover:text-indigo-900 transition" title="Editar">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-6">
                                <div className="text-sm text-gray-700">Página {page} de {totalPages}</div>
                                <div className="flex space-x-2">
                                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed">Anterior</button>
                                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed">Próxima</button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma OS encontrada</h3>
                        <p className="mt-1 text-sm text-gray-500">Comece criando uma nova ordem de serviço.</p>
                        <div className="mt-6">
                            <button onClick={() => navigate('/os/nova')} className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                                <svg className="mr-2 -ml-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Nova OS
                            </button>
                        </div>
                    </div>
                )}
            </div>
            {selectedOS && (<ModalAtualizarStatusOS isOpen={isStatusModalOpen} onClose={handleCloseStatusModal} onConfirm={handleConfirmStatusUpdate} currentStatus={selectedOS.status_atual} osId={selectedOS.id} numeroOS={selectedOS.numero_os} />)}
        </div>
    );
}
