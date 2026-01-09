import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database.types';
import { formatarData, formatarDataHora } from '../utils/osHelpers';
import { CustomBadge } from '../components/ui/StatusBadge';
import { AlertCircle, Clock, CheckCircle, XCircle, Plus, Filter, Search } from 'lucide-react';

type Pendencia = Database['public']['Tables']['pendencias_os']['Row'];
type PendenciaComOS = Pendencia & {
    ordens_servico?: {
        numero_os: string;
        nome_cliente_digitavel: string | null;
    };
};

export function PendenciasOS() {
    const navigate = useNavigate();
    const [pendencias, setPendencias] = useState<PendenciaComOS[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
    const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
    const [busca, setBusca] = useState('');

    useEffect(() => {
        carregarPendencias();
    }, []);

    const carregarPendencias = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('pendencias_os')
                .select(`
          *,
          ordens_servico (
            numero_os,
            nome_cliente_digitavel
          )
        `)
                .order('data_inicio', { ascending: false });

            if (error) throw error;
            setPendencias(data || []);
        } catch (error) {
            console.error('Erro ao carregar pendências:', error);
        } finally {
            setLoading(false);
        }
    };

    const pendenciasFiltradas = pendencias.filter((p) => {
        if (filtroTipo !== 'TODOS' && p.tipo_pendencia !== filtroTipo) return false;
        if (filtroStatus !== 'TODOS' && p.status !== filtroStatus) return false;
        if (busca && !p.descricao.toLowerCase().includes(busca.toLowerCase())) return false;
        return true;
    });

    const getIconeTipo = (tipo: string) => {
        const icons: Record<string, JSX.Element> = {
            PECAS: <AlertCircle className="h-5 w-5 text-orange-500" />,
            SERVICO: <Clock className="h-5 w-5 text-blue-500" />,
            TERCEIROS: <AlertCircle className="h-5 w-5 text-purple-500" />,
            GARANTIA: <AlertCircle className="h-5 w-5 text-red-500" />,
            CLIENTE: <AlertCircle className="h-5 w-5 text-yellow-500" />,
            OUTROS: <AlertCircle className="h-5 w-5 text-gray-500" />,
        };
        return icons[tipo] || icons.OUTROS;
    };

    const getCorStatus = (status: string): 'blue' | 'yellow' | 'green' | 'red' | 'gray' => {
        const cores: Record<string, 'blue' | 'yellow' | 'green' | 'red' | 'gray'> = {
            PENDENTE: 'yellow',
            EM_ANDAMENTO: 'blue',
            RESOLVIDO: 'green',
            CANCELADO: 'red',
        };
        return cores[status] || 'gray';
    };

    const estatisticas = {
        total: pendenciasFiltradas.length,
        pendentes: pendenciasFiltradas.filter((p) => p.status === 'PENDENTE').length,
        emAndamento: pendenciasFiltradas.filter((p) => p.status === 'EM_ANDAMENTO').length,
        resolvidas: pendenciasFiltradas.filter((p) => p.status === 'RESOLVIDO').length,
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Gestão de Pendências</h1>
                                <p className="text-sm text-gray-600">{estatisticas.total} pendências encontradas</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/pendencias/nova')}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium flex items-center space-x-2"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Nova Pendência</span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Estatísticas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total</p>
                                <p className="text-2xl font-bold text-gray-900">{estatisticas.total}</p>
                            </div>
                            <AlertCircle className="h-8 w-8 text-gray-400" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Pendentes</p>
                                <p className="text-2xl font-bold text-yellow-600">{estatisticas.pendentes}</p>
                            </div>
                            <Clock className="h-8 w-8 text-yellow-400" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Em Andamento</p>
                                <p className="text-2xl font-bold text-blue-600">{estatisticas.emAndamento}</p>
                            </div>
                            <Clock className="h-8 w-8 text-blue-400" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Resolvidas</p>
                                <p className="text-2xl font-bold text-green-600">{estatisticas.resolvidas}</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-400" />
                        </div>
                    </div>
                </div>

                {/* Filtros */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Search className="inline h-4 w-4 mr-1" />
                                Buscar
                            </label>
                            <input
                                type="text"
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                placeholder="Buscar por descrição..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Filter className="inline h-4 w-4 mr-1" />
                                Tipo
                            </label>
                            <select
                                value={filtroTipo}
                                onChange={(e) => setFiltroTipo(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                <option value="TODOS">Todos</option>
                                <option value="PECAS">Peças</option>
                                <option value="SERVICO">Serviço</option>
                                <option value="TERCEIROS">Terceiros</option>
                                <option value="GARANTIA">Garantia</option>
                                <option value="CLIENTE">Cliente</option>
                                <option value="OUTROS">Outros</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Filter className="inline h-4 w-4 mr-1" />
                                Status
                            </label>
                            <select
                                value={filtroStatus}
                                onChange={(e) => setFiltroStatus(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                <option value="TODOS">Todos</option>
                                <option value="PENDENTE">Pendente</option>
                                <option value="EM_ANDAMENTO">Em Andamento</option>
                                <option value="RESOLVIDO">Resolvido</option>
                                <option value="CANCELADO">Cancelado</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Lista de Pendências */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : pendenciasFiltradas.length > 0 ? (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">OS</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Início</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Previsão</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {pendenciasFiltradas.map((pendencia) => (
                                        <tr key={pendencia.id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {getIconeTipo(pendencia.tipo_pendencia)}
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {pendencia.tipo_pendencia}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">{pendencia.descricao}</div>
                                                {pendencia.responsavel && (
                                                    <div className="text-xs text-gray-500">Resp: {pendencia.responsavel}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4  whitespace-nowrap">
                                                <button
                                                    onClick={() => navigate(`/os/editar/${pendencia.os_id}`)}
                                                    className="text-sm text-indigo-600 hover:text-indigo-900"
                                                >
                                                    {pendencia.ordens_servico?.numero_os || '-'}
                                                </button>
                                                {pendencia.ordens_servico?.nome_cliente_digitavel && (
                                                    <div className="text-xs text-gray-500">
                                                        {pendencia.ordens_servico.nome_cliente_digitavel}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatarData(pendencia.data_inicio)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {pendencia.data_prevista ? formatarData(pendencia.data_prevista) : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <CustomBadge label={pendencia.status} color={getCorStatus(pendencia.status)} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <button
                                                    onClick={() => navigate(`/pendencias/editar/${pendencia.id}`)}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    Editar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma pendência encontrada</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {busca || filtroTipo !== 'TODOS' || filtroStatus !== 'TODOS'
                                ? 'Tente ajustar os filtros.'
                                : 'Comece criando uma nova pendência.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
