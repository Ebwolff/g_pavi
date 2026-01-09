import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { alertasService } from '../services/alertasService';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database.types';
import { formatarDataHora } from '../utils/osHelpers';
import { CustomBadge } from '../components/ui/StatusBadge';
import { Bell, CheckCheck, Trash2, Filter, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type Alerta = Database['public']['Tables']['alertas']['Row'];

export function Alertas() {
    const navigate = useNavigate();
    const [alertas, setAlertas] = useState<Alerta[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
    const [filtroPrioridade, setFiltroPrioridade] = useState<string>('TODOS');
    const [filtroLido, setFiltroLido] = useState<string>('TODOS');

    useEffect(() => {
        carregarAlertas();
    }, []);

    const carregarAlertas = async () => {
        try {
            setLoading(true);
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;

            const data = await alertasService.getAlertas(user.id);
            setAlertas(data);
        } catch (error) {
            console.error('Erro ao carregar alertas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarcarComoLido = async (alertaId: string) => {
        try {
            await alertasService.marcarComoLido(alertaId);
            await carregarAlertas();
        } catch (error) {
            console.error('Erro ao marcar como lido:', error);
        }
    };

    const handleMarcarTodosComoLidos = async () => {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;

            await alertasService.marcarTodosComoLidos(user.id);
            await carregarAlertas();
        } catch (error) {
            console.error('Erro ao marcar todos como lidos:', error);
        }
    };

    const handleDeletarAlerta = async (alertaId: string) => {
        if (!confirm('Deseja realmente excluir este alerta?')) return;

        try {
            await alertasService.deletarAlerta(alertaId);
            await carregarAlertas();
        } catch (error) {
            console.error('Erro ao deletar alerta:', error);
        }
    };

    const alertasFiltrados = alertas.filter((a) => {
        if (filtroTipo !== 'TODOS' && a.tipo_alerta !== filtroTipo) return false;
        if (filtroPrioridade !== 'TODOS' && a.prioridade !== filtroPrioridade) return false;
        if (filtroLido === 'LIDOS' && !a.lido) return false;
        if (filtroLido === 'NAO_LIDOS' && a.lido) return false;
        return true;
    });

    const getIconeAlerta = (tipo: string) => {
        switch (tipo) {
            case 'OS_VENCIDA':
                return <AlertCircle className="h-6 w-6 text-red-500" />;
            case 'GARANTIA_PENDENTE':
                return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
            case 'PECAS_CHEGANDO':
                return <Info className="h-6 w-6 text-blue-500" />;
            default:
                return <Bell className="h-6 w-6 text-gray-500" />;
        }
    };

    const getCorPrioridade = (prioridade: string): 'blue' | 'yellow' | 'orange' | 'red' | 'gray' => {
        const cores: Record<string, 'blue' | 'yellow' | 'orange' | 'red' | 'gray'> = {
            URGENTE: 'red',
            ALTA: 'orange',
            NORMAL: 'blue',
            BAIXA: 'gray',
        };
        return cores[prioridade] || 'gray';
    };

    const estatisticas = {
        total: alertas.length,
        naoLidos: alertas.filter((a) => !a.lido).length,
        urgentes: alertas.filter((a) => a.prioridade === 'URGENTE').length,
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
                                <h1 className="text-2xl font-bold text-gray-900">Alertas e Notificações</h1>
                                <p className="text-sm text-gray-600">
                                    {estatisticas.total} alertas • {estatisticas.naoLidos} não lidos
                                </p>
                            </div>
                        </div>
                        {estatisticas.naoLidos > 0 && (
                            <button
                                onClick={handleMarcarTodosComoLidos}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium flex items-center space-x-2"
                            >
                                <CheckCheck className="w-5 h-5" />
                                <span>Marcar Todos como Lidos</span>
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Estatísticas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total de Alertas</p>
                                <p className="text-2xl font-bold text-gray-900">{estatisticas.total}</p>
                            </div>
                            <Bell className="h-8 w-8 text-gray-400" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Não Lidos</p>
                                <p className="text-2xl font-bold text-blue-600">{estatisticas.naoLidos}</p>
                            </div>
                            <Bell className="h-8 w-8 text-blue-400" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Urgentes</p>
                                <p className="text-2xl font-bold text-red-600">{estatisticas.urgentes}</p>
                            </div>
                            <AlertCircle className="h-8 w-8 text-red-400" />
                        </div>
                    </div>
                </div>

                {/* Filtros */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                <option value="OS_VENCIDA">OS Vencida</option>
                                <option value="GARANTIA_PENDENTE">Garantia Pendente</option>
                                <option value="PECAS_CHEGANDO">Peças Chegando</option>
                                <option value="PREVISAO_ENTREGA">Previsão Entrega</option>
                                <option value="META_FATURAMENTO">Meta Faturamento</option>
                                <option value="OUTROS">Outros</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Filter className="inline h-4 w-4 mr-1" />
                                Prioridade
                            </label>
                            <select
                                value={filtroPrioridade}
                                onChange={(e) => setFiltroPrioridade(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                <option value="TODOS">Todas</option>
                                <option value="URGENTE">Urgente</option>
                                <option value="ALTA">Alta</option>
                                <option value="NORMAL">Normal</option>
                                <option value="BAIXA">Baixa</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Filter className="inline h-4 w-4 mr-1" />
                                Status
                            </label>
                            <select
                                value={filtroLido}
                                onChange={(e) => setFiltroLido(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                <option value="TODOS">Todos</option>
                                <option value="NAO_LIDOS">Não Lidos</option>
                                <option value="LIDOS">Lidos</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Lista de Alertas */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : alertasFiltrados.length > 0 ? (
                    <div className="space-y-4">
                        {alertasFiltrados.map((alerta) => (
                            <div
                                key={alerta.id}
                                className={`bg-white rounded-lg shadow border-l-4 p-6 transition-all hover:shadow-lg ${!alerta.lido ? 'bg-blue-50' : ''
                                    } ${alerta.prioridade === 'URGENTE'
                                        ? 'border-red-500'
                                        : alerta.prioridade === 'ALTA'
                                            ? 'border-orange-500'
                                            : alerta.prioridade === 'NORMAL'
                                                ? 'border-blue-500'
                                                : 'border-gray-300'
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 mt-1">{getIconeAlerta(alerta.tipo_alerta)}</div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <h3 className={`text-lg font-medium ${!alerta.lido ? 'text-gray-900' : 'text-gray-700'}`}>
                                                    {alerta.titulo}
                                                </h3>
                                                <p className="text-sm text-gray-600 mt-1">{alerta.mensagem}</p>
                                                <div className="flex items-center gap-4 mt-3">
                                                    <span className="text-xs text-gray-400">{formatarDataHora(alerta.created_at)}</span>
                                                    <CustomBadge label={alerta.prioridade} color={getCorPrioridade(alerta.prioridade)} />
                                                    {alerta.lido && (
                                                        <span className="text-xs text-green-600 flex items-center gap-1">
                                                            <CheckCheck className="h-3 w-3" />
                                                            Lido
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {!alerta.lido && (
                                                    <button
                                                        onClick={() => handleMarcarComoLido(alerta.id)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                        title="Marcar como lido"
                                                    >
                                                        <CheckCheck className="h-5 w-5" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeletarAlerta(alerta.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                    title="Excluir alerta"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                                {alerta.os_id && (
                                                    <button
                                                        onClick={() => navigate(`/os/editar/${alerta.os_id}`)}
                                                        className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                                                    >
                                                        Ver OS
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <Bell className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum alerta encontrado</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {filtroTipo !== 'TODOS' || filtroPrioridade !== 'TODOS' || filtroLido !== 'TODOS'
                                ? 'Tente ajustar os filtros.'
                                : 'Você não tem alertas no momento.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
