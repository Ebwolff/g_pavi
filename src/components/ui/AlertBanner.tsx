import { AlertTriangle, AlertCircle, Info, X, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface AlertBannerProps {
    type: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    dismissible?: boolean;
}

const typeConfig = {
    critical: {
        bg: 'bg-gradient-to-r from-red-500 to-red-600',
        icon: AlertTriangle,
        iconBg: 'bg-red-400/30',
        textColor: 'text-white',
        buttonColor: 'bg-white/20 hover:bg-white/30',
    },
    warning: {
        bg: 'bg-gradient-to-r from-amber-400 to-orange-500',
        icon: AlertCircle,
        iconBg: 'bg-orange-400/30',
        textColor: 'text-white',
        buttonColor: 'bg-white/20 hover:bg-white/30',
    },
    info: {
        bg: 'bg-gradient-to-r from-blue-500 to-indigo-600',
        icon: Info,
        iconBg: 'bg-blue-400/30',
        textColor: 'text-white',
        buttonColor: 'bg-white/20 hover:bg-white/30',
    },
};

export function AlertBanner({ type, title, message, action, dismissible = true }: AlertBannerProps) {
    const [dismissed, setDismissed] = useState(false);
    const config = typeConfig[type];
    const Icon = config.icon;

    if (dismissed) return null;

    return (
        <div className={`${config.bg} ${config.textColor} rounded-xl p-4 mb-6 shadow-lg animate-slideDown`}>
            <div className="flex items-center gap-4">
                {/* Icon */}
                <div className={`${config.iconBg} p-3 rounded-xl flex-shrink-0`}>
                    <Icon className="w-6 h-6" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-lg">{title}</h4>
                    <p className="text-sm opacity-90">{message}</p>
                </div>

                {/* Action */}
                {action && (
                    <button
                        onClick={action.onClick}
                        className={`${config.buttonColor} px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 flex-shrink-0`}
                    >
                        {action.label}
                        <ChevronRight className="w-4 h-4" />
                    </button>
                )}

                {/* Dismiss */}
                {dismissible && (
                    <button
                        onClick={() => setDismissed(true)}
                        className="p-2 hover:bg-white/20 rounded-lg transition-all flex-shrink-0"
                        aria-label="Fechar alerta"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
}

// Componente que gerencia múltiplos alertas baseado nos dados
interface DashboardAlertsProps {
    osCriticas: number;
    pendenciasAbertas: number;
    alertasNaoLidos: number;
    diasMedioEmAberto: number;
    onNavigate: (path: string) => void;
}

export function DashboardAlerts({
    osCriticas,
    pendenciasAbertas,
    // alertasNaoLidos - reservado para uso futuro
    diasMedioEmAberto,
    onNavigate,
}: DashboardAlertsProps) {
    const alerts: AlertBannerProps[] = [];

    // Alerta crítico: OS paradas há muito tempo
    if (osCriticas > 0) {
        alerts.push({
            type: 'critical',
            title: `${osCriticas} OS Crítica${osCriticas > 1 ? 's' : ''}!`,
            message: `${osCriticas > 1 ? 'Existem' : 'Existe'} ${osCriticas} ordem${osCriticas > 1 ? 'ns' : ''} de serviço parada${osCriticas > 1 ? 's' : ''} há mais de 90 dias.`,
            action: {
                label: 'Ver OS',
                onClick: () => onNavigate('/os/lista?urgencia=critica'),
            },
        });
    }

    // Alerta warning: Muitas pendências
    if (pendenciasAbertas > 5) {
        alerts.push({
            type: 'warning',
            title: `${pendenciasAbertas} Pendências Abertas`,
            message: 'Há pendências acumuladas que precisam de atenção.',
            action: {
                label: 'Resolver',
                onClick: () => onNavigate('/pendencias'),
            },
        });
    }

    // Alerta info: Tempo médio alto
    if (diasMedioEmAberto > 30) {
        alerts.push({
            type: 'info',
            title: 'Tempo Médio Elevado',
            message: `As OS abertas estão em média há ${Math.round(diasMedioEmAberto)} dias. Considere priorizar as mais antigas.`,
            action: {
                label: 'Analisar',
                onClick: () => onNavigate('/os/lista?ordenar=dias_aberto'),
            },
        });
    }

    if (alerts.length === 0) return null;

    // Mostra apenas o alerta mais crítico para não sobrecarregar
    const alertToShow = alerts[0];

    return <AlertBanner {...alertToShow} />;
}
