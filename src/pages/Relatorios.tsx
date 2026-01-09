import { AppLayout } from '@/components/AppLayout';
import { FileText, Download, Calendar } from 'lucide-react';

export function Relatorios() {
    return (
        <AppLayout>
            <div className="p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Relatórios e Análises
                    </h1>
                    <p className="text-gray-600">
                        Exporte e visualize relatórios financeiros e operacionais
                    </p>
                </div>

                {/* Em Desenvolvimento */}
                <div className="premium-card text-center py-16">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-[#14532d]/10 rounded-2xl mb-6">
                        <FileText className="w-10 h-10 text-[#14532d]" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">
                        Relatórios em Desenvolvimento
                    </h2>
                    <p className="text-gray-600 max-w-md mx-auto mb-8">
                        Esta funcionalidade estará disponível em breve. Você poderá exportar relatórios de OS,
                        análises financeiras e muito mais.
                    </p>

                    {/* Preview de Relatórios Futuros */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
                        <div className="p-6 bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl border border-green-200">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="p-2 bg-white rounded-lg">
                                    <FileText className="w-5 h-5 text-green-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900">Relatório de OS</h3>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">
                                Exporte lista completa de ordens de serviço com filtros customizáveis
                            </p>
                            <div className="flex items-center text-xs text-green-700 font-medium">
                                <Download className="w-4 h-4 mr-1" />
                                PDF, Excel
                            </div>
                        </div>

                        <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-200">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="p-2 bg-white rounded-lg">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900">Análise Mensal</h3>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">
                                Visão consolidada de receitas, custos e performance por mês
                            </p>
                            <div className="flex items-center text-xs text-blue-700 font-medium">
                                <Download className="w-4 h-4 mr-1" />
                                PDF, Excel
                            </div>
                        </div>

                        <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl border border-purple-200">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="p-2 bg-white rounded-lg">
                                    <FileText className="w-5 h-5 text-purple-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900">Por Técnico</h3>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">
                                Performance individual de cada técnico com métricas detalhadas
                            </p>
                            <div className="flex items-center text-xs text-purple-700 font-medium">
                                <Download className="w-4 h-4 mr-1" />
                                PDF, Excel
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
