import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Calendar, DollarSign, User, Tag } from 'lucide-react';
import { TipoOS, StatusOS } from '../../types/database.types';

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
}

export const FilterBar: React.FC<FilterBarProps> = ({
    onFilterChange,
    consultores = [],
    className = '',
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
            setFilters(JSON.parse(savedFilters));
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

    return (
        <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
            {/* Barra de busca principal */}
            <div className="flex gap-2 mb-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                        type="text"
                        placeholder="Buscar por número de OS, cliente, chassi..."
                        value={filters.busca || ''}
                        onChange={(e) => handleFilterChange('busca', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${showFilters
                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                >
                    <Filter className="h-5 w-5" />
                    Filtros
                    {activeCount > 0 && (
                        <span className="bg-blue-500 text-white rounded-full px-2 py-0.5 text-xs font-medium">
                            {activeCount}
                        </span>
                    )}
                </button>
                {activeCount > 0 && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                        <X className="h-5 w-5" />
                        Limpar
                    </button>
                )}
            </div>

            {/* Painel de filtros expandido */}
            {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                    {/* Tipo de OS */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <Tag className="inline h-4 w-4 mr-1" />
                            Tipo de OS
                        </label>
                        <select
                            value={filters.tipo}
                            onChange={(e) => handleFilterChange('tipo', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="TODOS">Todos</option>
                            <option value="NORMAL">Normal</option>
                            <option value="GARANTIA">Garantia</option>
                        </select>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <Tag className="inline h-4 w-4 mr-1" />
                            Status
                        </label>
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="TODOS">Todos</option>
                            <option value="EM_EXECUCAO">Em Execução</option>
                            <option value="AGUARDANDO_PECAS">Aguardando Peças</option>
                            <option value="PAUSADA">Pausada</option>
                            <option value="CONCLUIDA">Concluída</option>
                            <option value="FATURADA">Faturada</option>
                            <option value="CANCELADA">Cancelada</option>
                        </select>
                    </div>

                    {/* Dias em Aberto */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <Calendar className="inline h-4 w-4 mr-1" />
                            Dias em Aberto
                        </label>
                        <select
                            value={filters.diasCategoria}
                            onChange={(e) => handleFilterChange('diasCategoria', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="TODOS">Todos</option>
                            <option value="MENOR_30">Menos de 30 dias</option>
                            <option value="ENTRE_30_60">30 a 60 dias</option>
                            <option value="ENTRE_60_90">60 a 90 dias</option>
                            <option value="MAIOR_90">Mais de 90 dias</option>
                        </select>
                    </div>

                    {/* Consul tor */}
                    {consultores.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <User className="inline h-4 w-4 mr-1" />
                                Consultor
                            </label>
                            <select
                                value={filters.consultorId || ''}
                                onChange={(e) => handleFilterChange('consultorId', e.target.value || undefined)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Todos</option>
                                {consultores.map((consultor) => (
                                    <option key={consultor.id} value={consultor.id}>
                                        {consultor.nome}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Valor Mínimo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <DollarSign className="inline h-4 w-4 mr-1" />
                            Valor Mínimo (R$)
                        </label>
                        <input
                            type="number"
                            placeholder="0.00"
                            value={filters.valorMin || ''}
                            onChange={(e) => handleFilterChange('valorMin', e.target.value ? parseFloat(e.target.value) : undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Valor Máximo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <DollarSign className="inline h-4 w-4 mr-1" />
                            Valor Máximo (R$)
                        </label>
                        <input
                            type="number"
                            placeholder="0.00"
                            value={filters.valorMax || ''}
                            onChange={(e) => handleFilterChange('valorMax', e.target.value ? parseFloat(e.target.value) : undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Data Início */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <Calendar className="inline h-4 w-4 mr-1" />
                            Data Início
                        </label>
                        <input
                            type="date"
                            value={filters.dataInicio || ''}
                            onChange={(e) => handleFilterChange('dataInicio', e.target.value || undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Data Fim */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <Calendar className="inline h-4 w-4 mr-1" />
                            Data Fim
                        </label>
                        <input
                            type="date"
                            value={filters.dataFim || ''}
                            onChange={(e) => handleFilterChange('dataFim', e.target.value || undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Chassi */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Chassi</label>
                        <input
                            type="text"
                            placeholder="Buscar por chassi"
                            value={filters.chassi || ''}
                            onChange={(e) => handleFilterChange('chassi', e.target.value || undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Cliente */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                        <input
                            type="text"
                            placeholder="Buscar por cliente"
                            value={filters.cliente || ''}
                            onChange={(e) => handleFilterChange('cliente', e.target.value || undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Modelo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                        <input
                            type="text"
                            placeholder="Buscar por modelo"
                            value={filters.modelo || ''}
                            onChange={(e) => handleFilterChange('modelo', e.target.value || undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
