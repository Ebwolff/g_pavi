import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
    Plus, Search, FileText, Calendar
} from 'lucide-react';

import { orcamentoService } from '@/services/orcamento.service';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CustomBadge } from '@/components/ui/StatusBadge';
import { formatarValor, formatarData } from '@/utils/osHelpers';
import type { StatusOrcamento } from '@/types/database.types';

const statusConfig: Record<StatusOrcamento, { label: string, color: 'blue' | 'yellow' | 'green' | 'red' | 'gray' }> = {
    EM_ELABORACAO: { label: 'Em Elaboração', color: 'gray' },
    ENVIADO_CLIENTE: { label: 'Enviado ao Cliente', color: 'blue' },
    APROVADO: { label: 'Aprovado', color: 'green' },
    REPROVADO: { label: 'Reprovado', color: 'red' },
    CONVERTIDO_OS: { label: 'Convertido em OS', color: 'yellow' }
};

export function ListaOrcamentos() {
    const navigate = useNavigate();
    const { profile } = useAuth();
    
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusOrcamento | ''>('');
    const [page, setPage] = useState(1);

    const isGerente = ['GERENTE', 'DIRETORIA'].includes(profile?.role || '');
    const consultorIdFilter = isGerente ? undefined : profile?.id;

    // TODO: implement debounce
    const { data, isLoading } = useQuery({
        queryKey: ['orcamentos', page, search, statusFilter, consultorIdFilter],
        queryFn: () => orcamentoService.list({
            search,
            status: statusFilter,
            consultorId: consultorIdFilter
        }, page, 15),
        gcTime: 1000 * 60 * 5,
        staleTime: 1000 * 60,
    });

    const handleClearFilters = () => {
        setSearch('');
        setStatusFilter('');
        setPage(1);
    };

    return (
        <AppLayout>
            <div className="p-8 animate-fadeIn max-w-7xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                <FileText className="w-5 h-5 text-blue-400" />
                            </span>
                            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Painel Consultor</span>
                        </div>
                        <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Orçamentos</h1>
                        <p className="text-sm text-[var(--text-muted)]">Gestão de orçamentos e propostas comerciais</p>
                    </div>
                    
                    <Button 
                        variant="primary" 
                        leftIcon={<Plus className="w-5 h-5" />}
                        onClick={() => navigate('/orcamentos/novo')}
                    >
                        Novo Orçamento
                    </Button>
                </div>

                {/* Filters */}
                <div className="bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-end shadow-sm">
                    <div className="flex-1 w-full relative">
                        <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1.5 block">Buscar</label>
                        <Input
                            placeholder="Buscar por N° ORC, Cliente ou Chassi..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 h-11"
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-9" />
                    </div>

                    <div className="w-full md:w-56">
                        <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1.5 block">Status</label>
                        <select 
                            className="w-full h-11 px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value as StatusOrcamento | '');
                                setPage(1);
                            }}
                        >
                            <option value="">Todos os status</option>
                            {Object.entries(statusConfig).map(([key, config]) => (
                                <option key={key} value={key}>{config.label}</option>
                            ))}
                        </select>
                    </div>

                    {(search || statusFilter) && (
                        <div className="md:w-32">
                            <Button variant="ghost" className="h-11 w-full text-gray-500" onClick={handleClearFilters}>
                                Limpar
                            </Button>
                        </div>
                    )}
                </div>

                {/* Table */}
                <div className="bg-[var(--surface-light)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-hover)]">
                                    <th className="px-6 py-4 text-xs font-black tracking-wider text-[var(--text-muted)] uppercase">Número</th>
                                    <th className="px-6 py-4 text-xs font-black tracking-wider text-[var(--text-muted)] uppercase">Cliente</th>
                                    <th className="px-6 py-4 text-xs font-black tracking-wider text-[var(--text-muted)] uppercase">Máquina / Chassi</th>
                                    <th className="px-6 py-4 text-xs font-black tracking-wider text-[var(--text-muted)] uppercase">Data Início</th>
                                    <th className="px-6 py-4 text-xs font-black tracking-wider text-[var(--text-muted)] uppercase">Valor Estimado</th>
                                    <th className="px-6 py-4 text-xs font-black tracking-wider text-[var(--text-muted)] uppercase text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-subtle)]">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-sm text-[var(--text-muted)]">
                                            Carregando orçamentos...
                                        </td>
                                    </tr>
                                ) : data?.data && data.data.length > 0 ? (
                                    data.data.map((orc: any) => {
                                        const stat = statusConfig[orc.status_orcamento as StatusOrcamento] || { label: orc.status_orcamento, color: 'gray' };
                                        
                                        return (
                                            <tr 
                                                key={orc.id} 
                                                onClick={() => navigate(`/orcamentos/${orc.id}`)}
                                                className="group hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-[var(--text-primary)] text-sm group-hover:text-blue-500 transition-colors">
                                                        {orc.numero_orcamento}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-[var(--text-primary)] truncate max-w-[200px]">
                                                            {orc.nome_cliente_digitavel || orc.cliente?.dados?.nome_razao || 'N/I'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm text-[var(--text-primary)] font-medium">
                                                            {orc.modelo_maquina || 'N/A'}
                                                        </span>
                                                        <span className="text-xs text-[var(--text-muted)] mt-0.5">
                                                            Chassi: {orc.chassi || 'N/A'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm text-[var(--text-secondary)] flex items-center gap-1.5">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            {formatarData(orc.data_criacao).split(' ')[0]}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-bold text-[var(--text-primary)]">
                                                        {formatarValor(orc.valor_liquido_total || 0)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <CustomBadge 
                                                        label={stat.label} 
                                                        variant={stat.color as any} 
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-[var(--text-muted)] space-y-3">
                                                <FileText className="w-10 h-10 opacity-20" />
                                                <p className="text-sm">Nenhum orçamento encontrado.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination */}
                    {data?.count && data.count > 15 && (
                        <div className="p-4 border-t border-[var(--border-subtle)] flex justify-between items-center bg-[var(--surface)]">
                            <span className="text-xs text-[var(--text-muted)]">
                                Mostrando de {(page - 1) * 15 + 1} até {Math.min(page * 15, data.count)} de {data.count}
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="h-8 text-xs py-0"
                                >
                                    Anterior
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={page * 15 >= data.count}
                                    className="h-8 text-xs py-0"
                                >
                                    Próxima
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
