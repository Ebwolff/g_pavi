import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';
import { AppLayout } from '@/components/AppLayout';
import { TrendingUp, TrendingDown, Calendar, DollarSign, Clock, AlertCircle } from 'lucide-react';

export function Dashboard() {
    const { data: dashboardData, isLoading } = useQuery({
        queryKey: ['dashboard-kpis'],
        queryFn: () => dashboardService.getKPIs(),
        refetchInterval: 30000,
    });

    const kpis = dashboardData?.kpis;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    return (
        <AppLayout>
            <div className="p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Dashboard de Performance
                    </h1>
                    <p className="text-gray-600">
                        Visão consolidada por tipo de serviço no mês atual
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center space-y-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#14532d]"></div>
                            <p className="text-gray-600">Carregando indicadores...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* KPI Cards Premium */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {/* Total OS Abertas */}
                            <div className="premium-card">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-1">Total de OS em Aberto</p>
                                        <h3 className="text-4xl font-bold text-gray-900">{kpis?.totalOsAbertas || 0}</h3>
                                    </div>
                                    <div className="p-3 bg-blue-50 rounded-xl">
                                        <Calendar className="w-6 h-6 text-blue-600" />
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 text-sm">
                                    <span className="px-2 py-1 bg-green-50 text-green-700 rounded-md font-medium">
                                        N: {kpis?.totalOsNormal || 0}
                                    </span>
                                    <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded-md font-medium">
                                        W: {kpis?.totalOsGarantia || 0}
                                    </span>
                                </div>
                            </div>

                            {/* Receita Potencial (Normal) */}
                            <div className="premium-card border-l-4 border-green-500">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-1">Valor Total Aberto (PÓS-VENDA)</p>
                                        <h3 className="text-3xl font-bold text-green-600">
                                            {formatCurrency(kpis?.valorTotalNormal || 0)}
                                        </h3>
                                    </div>
                                    <div className="p-3 bg-green-50 rounded-xl">
                                        <TrendingUp className="w-6 h-6 text-green-600" />
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500">Potencial Receita do Serviço</p>
                            </div>

                            {/* Custo Garantia */}
                            <div className="premium-card border-l-4 border-red-500">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-1">Valor Total Aberto (GARANTIA)</p>
                                        <h3 className="text-3xl font-bold text-red-600">
                                            {formatCurrency(kpis?.valorTotalGarantia || 0)}
                                        </h3>
                                    </div>
                                    <div className="p-3 bg-red-50 rounded-xl">
                                        <TrendingDown className="w-6 h-6 text-red-600" />
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500">Potencial de Custo de Garantia</p>
                            </div>

                            {/* Tempo Médio */}
                            <div className="premium-card">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-1">Tempo Médio de Serviço</p>
                                        <h3 className="text-4xl font-bold text-gray-900">
                                            {kpis?.tempoMedioExecucaoDias || 0}
                                        </h3>
                                    </div>
                                    <div className="p-3 bg-indigo-50 rounded-xl">
                                        <Clock className="w-6 h-6 text-indigo-600" />
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 font-medium">dias de execução</p>
                            </div>
                        </div>

                        {/* Controle Operacional */}
                        <div className="premium-card mb-8">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="p-2 bg-[#14532d] rounded-lg">
                                    <AlertCircle className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Controle Operacional</h2>
                                    <p className="text-sm text-gray-600">Segregação por tipos de OS</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Total OS Cliente (Normal) */}
                                <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-6 border border-orange-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-semibold text-orange-900">Total OS Cliente</h3>
                                        <div className="px-2 py-1 bg-white rounded-md">
                                            <span className="text-xs font-bold text-orange-700">TIPO N</span>
                                        </div>
                                    </div>
                                    <p className="text-4xl font-bold text-orange-700 mb-1">{kpis?.totalOsNormal || 0}</p>
                                    <p className="text-xs text-orange-600">OS Tipo 'N' (Foco em Receita)</p>
                                </div>

                                {/* Total OS Garantia */}
                                <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl p-6 border border-red-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-semibold text-red-900">Total OS Garantia</h3>
                                        <div className="px-2 py-1 bg-white rounded-md">
                                            <span className="text-xs font-bold text-red-700">TIPO W</span>
                                        </div>
                                    </div>
                                    <p className="text-4xl font-bold text-red-700 mb-1">{kpis?.totalOsGarantia || 0}</p>
                                    <p className="text-xs text-red-600">OS Tipo 'W' (Foco em Custo)</p>
                                </div>

                                {/* Tempo Médio */}
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-6 border border-blue-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-semibold text-blue-900">Tempo Médio de Serviço</h3>
                                    </div>
                                    <p className="text-4xl font-bold text-blue-700 mb-1">
                                        {kpis?.tempoMedioExecucaoDias || 0}
                                        <span className="text-xl ml-1">dias</span>
                                    </p>
                                    <p className="text-xs text-blue-600">KPI a ser implementado</p>
                                </div>
                            </div>
                        </div>

                        {/* Bem-vindo Banner */}
                        <div className="premium-card bg-gradient-to-r from-[#14532d] to-[#064e3b] text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="inline-flex items-center px-3 py-1 bg-white/20 rounded-full text-xs font-medium mb-3">
                                        <span>✓ Sistema pronto para gestão de KPIs</span>
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">Bem-vindo(a), {dashboardData ? 'NAGILLA_SILVA' : 'Usuário'}</h3>
                                    <p className="text-white/80 text-sm">O sistema está pronto para a gestão de KPIs</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
