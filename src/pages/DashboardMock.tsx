import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { TrendingUp, DollarSign, Clock, AlertCircle, FileText } from 'lucide-react';

export function DashboardMock() {
    const navigate = useNavigate();
    console.log('✅ DashboardMock (Force New File) RENDERIZOU!');

    return (
        <AppLayout>
            <div className="min-h-screen bg-gray-50">
                <header className="bg-white shadow-sm border-b sticky top-0 z-10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Dashboard Analítico</h1>
                                <p className="text-sm text-gray-600">Visão geral e estátisticas (Modo Simplificado / Cache Bust)</p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {/* KPIs Mockados */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm text-gray-600">Total de OS</p>
                                <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <p className="text-3xl font-bold text-gray-900">150</p>
                            <p className="text-xs text-gray-500 mt-1">Dados mockados</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm text-gray-600">Valor Total</p>
                                <DollarSign className="w-5 h-5 text-green-600" />
                            </div>
                            <p className="text-3xl font-bold text-gray-900">R$ 45.000</p>
                            <p className="text-xs text-gray-500 mt-1">Dados mockados</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm text-gray-600">OS Críticas</p>
                                <AlertCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <p className="text-3xl font-bold text-gray-900">12</p>
                            <p className="text-xs text-gray-500 mt-1">Dados mockados</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm text-gray-600">Tempo Médio</p>
                                <Clock className="w-5 h-5 text-purple-600" />
                            </div>
                            <p className="text-3xl font-bold text-gray-900">35d</p>
                            <p className="text-xs text-gray-500 mt-1">Dados mockados</p>
                        </div>
                    </div>

                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center">
                        <TrendingUp className="w-12 h-12 text-green-600 mx-auto mb-3" />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">✅ Dashboard Carregado!</h2>
                        <p className="text-gray-700 mb-4">
                            Esta é uma versão nova (DashboardMock.tsx) para garantir que o cache foi limpo.
                        </p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
