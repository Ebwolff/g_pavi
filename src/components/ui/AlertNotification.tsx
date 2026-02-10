import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { alertasService } from '../../services/alertasService';
import { Database } from '../../types/database.types';
import { supabase } from '../../lib/supabase';
import { formatarDataHora } from '../../utils/osHelpers';
import { useNavigate } from 'react-router-dom';

type Alerta = Database['public']['Tables']['alertas']['Row'];

export const AlertNotification: React.FC = () => {
    const [alertas, setAlertas] = useState<Alerta[]>([]);
    const [naoLidos, setNaoLidos] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const carregarAlertas = async () => {
        try {
            setLoading(true);
            // Obter usuário atual do Supabase
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const data = await alertasService.getAlertas(user.id);
            setAlertas(data);

            const count = await alertasService.contarNaoLidos(user.id);
            setNaoLidos(count);
        } catch (error) {
            console.error('Erro ao carregar alertas:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarAlertas();

        // Atualizar a cada 30 segundos
        const interval = setInterval(carregarAlertas, 30000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarcarComoLido = async (alertaId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await alertasService.marcarComoLido(alertaId);
            await carregarAlertas();
        } catch (error) {
            console.error('Erro ao marcar alerta como lido:', error);
        }
    };

    const handleMarcarTodosComoLidos = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await alertasService.marcarTodosComoLidos(user.id);
            await carregarAlertas();
        } catch (error) {
            console.error('Erro ao marcar todos como lidos:', error);
        }
    };

    const handleAlertaClick = (alerta: Alerta) => {
        if (alerta.os_id) {
            navigate(`/editar-os/${alerta.os_id}`);
            setShowDropdown(false);
        }
    };

    const getIconeAlerta = (tipo: string) => {
        switch (tipo) {
            case 'OS_VENCIDA':
                return <AlertCircle className="h-5 w-5 text-red-500" />;
            case 'GARANTIA_PENDENTE':
                return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
            case 'PECAS_CHEGANDO':
                return <Info className="h-5 w-5 text-blue-500" />;
            default:
                return <Bell className="h-5 w-5 text-gray-500" />;
        }
    };

    const getCorPrioridade = (prioridade: string) => {
        switch (prioridade) {
            case 'URGENTE':
                return 'border-l-4 border-red-500';
            case 'ALTA':
                return 'border-l-4 border-orange-500';
            case 'NORMAL':
                return 'border-l-4 border-blue-500';
            case 'BAIXA':
                return 'border-l-4 border-gray-500';
            default:
                return '';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
                <Bell className="h-6 w-6" />
                {naoLidos > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                        {naoLidos > 99 ? '99+' : naoLidos}
                    </span>
                )}
            </button>

            {showDropdown && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Notificações</h3>
                            {naoLidos > 0 && (
                                <p className="text-sm text-gray-500">{naoLidos} não lida{naoLidos > 1 ? 's' : ''}</p>
                            )}
                        </div>
                        {naoLidos > 0 && (
                            <button
                                onClick={handleMarcarTodosComoLidos}
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                                <CheckCheck className="h-4 w-4" />
                                Marcar todas como lidas
                            </button>
                        )}
                    </div>

                    {/* Lista de Alertas */}
                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-2">Carregando...</p>
                            </div>
                        ) : alertas.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                                <p>Nenhuma notificação</p>
                            </div>
                        ) : (
                            alertas.map((alerta) => (
                                <div
                                    key={alerta.id}
                                    onClick={() => handleAlertaClick(alerta)}
                                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${!alerta.lido ? 'bg-blue-50' : ''
                                        } ${getCorPrioridade(alerta.prioridade)}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 mt-1">
                                            {getIconeAlerta(alerta.tipo_alerta)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h4 className={`text-sm font-medium ${!alerta.lido ? 'text-gray-900' : 'text-gray-700'}`}>
                                                    {alerta.titulo}
                                                </h4>
                                                {!alerta.lido && (
                                                    <button
                                                        onClick={(e) => handleMarcarComoLido(alerta.id, e)}
                                                        className="flex-shrink-0 text-blue-600 hover:text-blue-800"
                                                        title="Marcar como lida"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">{alerta.mensagem}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {formatarDataHora(alerta.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {alertas.length > 0 && (
                        <div className="p-3 border-t border-gray-200 text-center">
                            <button
                                onClick={() => {
                                    navigate('/alertas');
                                    setShowDropdown(false);
                                }}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                                Ver todos os alertas
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
