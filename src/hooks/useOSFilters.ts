import { useState, useMemo } from 'react';
import { OSFilters } from '../components/ui/FilterBar';
import { calcularDiasEmAberto } from '../utils/osHelpers';

interface OS {
    id: string;
    numero_os: string;
    tipo_os: string;
    status_atual: string;
    data_abertura: string;
    valor_liquido_total: number;
    consultor_id?: string | null;
    chassi?: string | null;
    nome_cliente_digitavel?: string | null;
    modelo_maquina?: string | null;
}

export const useOSFilters = (ordenServico: OS[]) => {
    const [filters, setFilters] = useState<OSFilters>({
        tipo: 'TODOS',
        status: 'TODOS',
        diasCategoria: 'TODOS',
    });

    const filteredOS = useMemo(() => {
        return ordenServico.filter((os) => {
            // Filtro de busca geral
            if (filters.busca) {
                const busca = filters.busca.toLowerCase();
                const matchBusca =
                    os.numero_os.toLowerCase().includes(busca) ||
                    os.nome_cliente_digitavel?.toLowerCase().includes(busca) ||
                    os.chassi?.toLowerCase().includes(busca) ||
                    os.modelo_maquina?.toLowerCase().includes(busca);

                if (!matchBusca) return false;
            }

            // Filtro de tipo
            if (filters.tipo && filters.tipo !== 'TODOS') {
                if (os.tipo_os !== filters.tipo) return false;
            }

            // Filtro de status
            if (filters.status && filters.status !== 'TODOS') {
                if (os.status_atual !== filters.status) return false;
            }

            // Filtro de dias em aberto
            if (filters.diasCategoria && filters.diasCategoria !== 'TODOS') {
                const dias = calcularDiasEmAberto(os.data_abertura);

                switch (filters.diasCategoria) {
                    case 'MENOR_30':
                        if (dias >= 30) return false;
                        break;
                    case 'ENTRE_30_60':
                        if (dias < 30 || dias >= 60) return false;
                        break;
                    case 'ENTRE_60_90':
                        if (dias < 60 || dias >= 90) return false;
                        break;
                    case 'MAIOR_90':
                        if (dias < 90) return false;
                        break;
                }
            }

            // Filtro de valor mínimo
            if (filters.valorMin !== undefined && filters.valorMin !== null) {
                if (os.valor_liquido_total < filters.valorMin) return false;
            }

            // Filtro de valor máximo
            if (filters.valorMax !== undefined && filters.valorMax !== null) {
                if (os.valor_liquido_total > filters.valorMax) return false;
            }

            // Filtro de consultor
            if (filters.consultorId) {
                if (os.consultor_id !== filters.consultorId) return false;
            }

            // Filtro de data início
            if (filters.dataInicio) {
                const dataOS = new Date(os.data_abertura);
                const dataInicio = new Date(filters.dataInicio);
                if (dataOS < dataInicio) return false;
            }

            // Filtro de data fim
            if (filters.dataFim) {
                const dataOS = new Date(os.data_abertura);
                const dataFim = new Date(filters.dataFim);
                if (dataOS > dataFim) return false;
            }

            // Filtro de chassi
            if (filters.chassi) {
                if (!os.chassi?.toLowerCase().includes(filters.chassi.toLowerCase())) return false;
            }

            // Filtro de cliente
            if (filters.cliente) {
                if (!os.nome_cliente_digitavel?.toLowerCase().includes(filters.cliente.toLowerCase())) return false;
            }

            // Filtro de modelo
            if (filters.modelo) {
                if (!os.modelo_maquina?.toLowerCase().includes(filters.modelo.toLowerCase())) return false;
            }

            return true;
        });
    }, [ordenServico, filters]);

    const stats = useMemo(() => {
        return {
            total: ordenServico.length,
            filtered: filteredOS.length,
            percentual: ordenServico.length > 0 ? (filteredOS.length / ordenServico.length) * 100 : 0,
        };
    }, [ordenServico.length, filteredOS.length]);

    return {
        filters,
        setFilters,
        filteredOS,
        stats,
    };
};
