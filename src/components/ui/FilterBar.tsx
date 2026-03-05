import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Calendar, User, Tag, ChevronDown } from 'lucide-react';
import { TipoOS, StatusOS } from '../../types/database.types';
import { cn } from '@/lib/utils';
import { Input } from './Input';

export interface OSFilters {
    busca?: string;
    tipo?: TipoOS | 'TODOS';
    status?: StatusOS | 'TODOS';
    diasCategoria?: 'TODOS' | 'MENOR_30' | 'ENTRE_30_60' | 'ENTRE_60_90' | 'MAIOR_90';
    valorMin?: number;
    valorMax?: number;
    consultorId?: string;
    dataInicio?: string;
    dataFim?: string;
    chassi?: string;
    cliente?: string;
    modelo?: string;
}

interface FilterBarProps {
    onFilterChange: (filters: OSFilters) => void;
    consultores?: Array<{ id: string; nome: string }>;
    className?: string;
    hideStatus?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
    onFilterChange,
    consultores = [],
    className = '',
    hideStatus = false,
}) => {
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<OSFilters>({
        tipo: 'TODOS',
        status: 'TODOS',
        diasCategoria: 'TODOS',
    });

    useEffect(() => {
        // Salvar filtros no localStorage
        localStorage.setItem('os_filters', JSON.stringify(filters));
        onFilterChange(filters);
    }, [filters, onFilterChange]);

    useEffect(() => {
        // Carregar filtros do localStorage
        const savedFilters = localStorage.getItem('os_filters');
        if (savedFilters) {
            try {
                setFilters(JSON.parse(savedFilters));
            } catch (e) {
                console.error('Erro ao carregar filtros salvos:', e);
            }
        }
    }, []);

    const handleFilterChange = (key: keyof OSFilters, value: any) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            tipo: 'TODOS',
            status: 'TODOS',
            diasCategoria: 'TODOS',
        });
        localStorage.removeItem('os_filters');
    };

    const countActiveFilters = () => {
        let count = 0;
        if (filters.busca) count++;
        if (filters.tipo && filters.tipo !== 'TODOS') count++;
        if (filters.status && filters.status !== 'TODOS') count++;
        if (filters.diasCategoria && filters.diasCategoria !== 'TODOS') count++;
        if (filters.valorMin || filters.valorMax) count++;
        if (filters.consultorId) count++;
        if (filters.dataInicio || filters.dataFim) count++;
        if (filters.chassi) count++;
        if (filters.cliente) count++;
        if (filters.modelo) count++;
        return count;
    };

    const activeCount = countActiveFilters();

    const selectClassName = "w-full bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none appearance-none cursor-pointer font-medium";

    return (
        <div className={cn("bg-[var(--surface)] transition-all", className)}>
            {/* Barra de busca principal */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                    <Input
                        icon={Search}
                        placeholder="Número da OS, cliente ou plano..."
                        value={filters.busca || ''}
                        onChange={(e) => handleFilterChange('busca', e.target.value)}
                        className="bg-[var(--surface-light)]"
                    />
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            "flex items-center gap-2.5 px-6 py-3 rounded-xl border font-bold text-sm transition-all",
                            showFilters
                                ? "bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-lg shadow-blue-500/10"
                                : "bg-[var(--surface-light)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] shadow-sm"
                        )}
                    >
                        <Filter className={cn("h-4 w-4 transition-transform", showFilters && "scale-110")} />
                        Painel de Filtros
                        {activeCount > 0 && (
                            <span className="bg-blue-500 text-white rounded-full min-w-[20px] h-5 flex items-center justify-center text-[10px] font-black px-1">
                                {activeCount}
                            </span>
                        )}
                    </button>
                    {activeCount > 0 && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-light)] text-[var(--text-secondary)] hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30 transition-all font-bold text-sm shadow-sm"
                        >
                            <X className="h-4 w-4" />
                            Limpar
                        </button>
                    )}
                </div>
            </div>

            {/* Painel de filtros expandido */}
            <div
                className={cn(
                    "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-300 origin-top overflow-hidden",
                    showFilters ? "max-h-[1000px] opacity-100 pt-6 border-t border-[var(--border-subtle)] mb-4" : "max-h-0 opacity-0 pointer-events-none"
                )}
            >
                {/* Tipo de OS */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.15em] ml-1 flex items-center gap-2">
                        <Tag className="h-3 w-3" /> Tipo de Registro
                    </label>
                    <div className="relative">
                        <select
                            value={filters.tipo}
                            onChange={(e) => handleFilterChange('tipo', e.target.value)}
                            className={selectClassName}
                        >
                            <option value="TODOS">Todas as Modalidades</option>
                            <option value="NORMAL">Venda Normal (Direta)</option>
                            <option value="GARANTIA">Garantia de Fábrica</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                    </div>
                </div>

                {/* Status */}
                {!hideStatus && (
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.15em] ml-1 flex items-center gap-2">
                            <Activity className="h-3 w-3" /> Status Operacional
                        </label>
                        <div className="relative">
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className={selectClassName}
                            >
                                <option value="TODOS">Todos os Status</option>
                                <option value="AGUARDANDO_ATRIBUICAO">Aguardando Atribuição</option>
                                <option value="EM_EXECUCAO">Em Execução</option>
                                <option value="EM_DIAGNOSTICO">Em Diagnóstico</option>
                                <option value="AGUARDANDO_PECAS">Aguardando Peças</option>
                                <option value="AGUARDANDO_APROVACAO_ORCAMENTO">Aguard. Orçamento</option>
                                <option value="AGUARDANDO_PAGAMENTO">Aguard. Pagamento</option>
                                <option value="EM_TRANSITO">Em Trânsito</option>
                                <option value="PAUSADA">Pausada</option>
                                <option value="CONCLUIDA">Concluída</option>
                                <option value="FATURADA">Faturada</option>
                                <option value="CANCELADA">Cancelada</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                        </div>
                    </div>
                )}

                {/* Dias em Aberto */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.15em] ml-1 flex items-center gap-2">
                        <Clock className="h-3 w-3" /> Ciclo de Vida (SLA)
                    </label>
                    <div className="relative">
                        <select
                            value={filters.diasCategoria}
                            onChange={(e) => handleFilterChange('diasCategoria', e.target.value)}
                            className={selectClassName}
                        >
                            <option value="TODOS">Qualquer Período</option>
                            <option value="MENOR_30">Recentes (Até 30 dias)</option>
                            <option value="ENTRE_30_60">Médio Prazo (30 a 60 dias)</option>
                            <option value="ENTRE_60_90">Alerta (60 a 90 dias)</option>
                            <option value="MAIOR_90">Crítico (Acima de 90 dias)</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                    </div>
                </div>

                {/* Consultor */}
                {consultores.length > 0 && (
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.15em] ml-1 flex items-center gap-2">
                            <User className="h-3 w-3" /> Responsável Técnico
                        </label>
                        <div className="relative">
                            <select
                                value={filters.consultorId || ''}
                                onChange={(e) => handleFilterChange('consultorId', e.target.value || undefined)}
                                className={selectClassName}
                            >
                                <option value="">Todos os Consultores</option>
                                {consultores.map((consultor) => (
                                    <option key={consultor.id} value={consultor.id}>
                                        {consultor.nome}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                        </div>
                    </div>
                )}

                {/* Data Início */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.15em] ml-1 flex items-center gap-2">
                        <Calendar className="h-3 w-3" /> Abertura Inicial
                    </label>
                    <Input
                        type="date"
                        value={filters.dataInicio || ''}
                        onChange={(e) => handleFilterChange('dataInicio', e.target.value || undefined)}
                        className="bg-[var(--surface-light)]"
                    />
                </div>

                {/* Data Fim */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.15em] ml-1 flex items-center gap-2">
                        <Calendar className="h-3 w-3" /> Abertura Final
                    </label>
                    <Input
                        type="date"
                        value={filters.dataFim || ''}
                        onChange={(e) => handleFilterChange('dataFim', e.target.value || undefined)}
                        className="bg-[var(--surface-light)]"
                    />
                </div>

                {/* Chassi */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.15em] ml-1">Número de Série / Chassi</label>
                    <Input
                        placeholder="Ex: 8HGT..."
                        value={filters.chassi || ''}
                        onChange={(e) => handleFilterChange('chassi', e.target.value || undefined)}
                        className="bg-[var(--surface-light)] uppercase"
                    />
                </div>

                {/* Cliente */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.15em] ml-1">Proprietário / Cliente</label>
                    <Input
                        placeholder="Nome social ou CPF/CNPJ..."
                        value={filters.cliente || ''}
                        onChange={(e) => handleFilterChange('cliente', e.target.value || undefined)}
                        className="bg-[var(--surface-light)]"
                    />
                </div>

                {/* Modelo */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.15em] ml-1">Modelo Comercial</label>
                    <Input
                        placeholder="Ex: T250, Valmet 148..."
                        value={filters.modelo || ''}
                        onChange={(e) => handleFilterChange('modelo', e.target.value || undefined)}
                        className="bg-[var(--surface-light)]"
                    />
                </div>
            </div>
        </div>
    );
};

// Adicionei os ícones que faltavam para evitar erros de lint (Activity, Clock)
const Activity = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-activity"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
);
const Clock = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
);
