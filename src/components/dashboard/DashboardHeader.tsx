import { BarChart2, PieChart } from 'lucide-react';
import { DashboardTab } from '@/hooks/useDashboard';

interface DashboardHeaderProps {
    activeTab: DashboardTab;
    onTabChange: (tab: DashboardTab) => void;
}

export function DashboardHeader({ activeTab, onTabChange }: DashboardHeaderProps) {
    return (
        <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1
                        className="text-2xl font-bold mb-2"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        Painel de Controle
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Visão consolidada da operação e indicadores
                    </p>
                </div>

                {/* Tab Switcher */}
                <div
                    className="p-1 rounded-xl inline-flex"
                    style={{ background: 'var(--surface)' }}
                >
                    <button
                        onClick={() => onTabChange('performance')}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                        style={{
                            background: activeTab === 'performance' ? 'var(--primary)' : 'transparent',
                            color: activeTab === 'performance' ? 'white' : 'var(--text-secondary)',
                        }}
                    >
                        <BarChart2 className="w-4 h-4" />
                        Performance
                    </button>
                    <button
                        onClick={() => onTabChange('analitico')}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                        style={{
                            background: activeTab === 'analitico' ? 'var(--primary)' : 'transparent',
                            color: activeTab === 'analitico' ? 'white' : 'var(--text-secondary)',
                        }}
                    >
                        <PieChart className="w-4 h-4" />
                        Analítico
                    </button>
                </div>
            </div>
        </div>
    );
}
