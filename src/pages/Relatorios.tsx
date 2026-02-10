import { AppLayout } from '@/components/AppLayout';
import { FileText, Download, Calendar, BarChart3, TrendingUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { relatoriosService } from '@/services/relatoriosService';
import { useState } from 'react';

export function Relatorios() {
    const [loading, setLoading] = useState<string | null>(null);

    const handleExport = async (tipo: string, action: () => Promise<void>) => {
        try {
            setLoading(tipo);
            await action();
        } catch (error) {
            console.error(`Erro ao exportar ${tipo}:`, error);
            alert('Erro ao gerar relatório. Verifique o console.');
        } finally {
            setLoading(null);
        }
    };

    return (
        <AppLayout>
            <div className="p-8 animate-fadeIn max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-3xl font-black text-[var(--text-primary)] mb-2 flex items-center gap-3 tracking-tight">
                            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                                <BarChart3 className="w-8 h-8 text-emerald-500" />
                            </div>
                            Relatórios Analíticos
                        </h1>
                        <p className="text-[var(--text-muted)] text-lg font-medium ml-1">
                            Exportação de dados e análise profunda de performance operacional.
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        leftIcon={<RefreshCw className="w-4 h-4" />}
                        className="text-[var(--text-muted)] hover:text-white"
                        onClick={() => window.location.reload()}
                    >
                        Atualizar Dados
                    </Button>
                </div>

                {/* Grid de Relatórios Ativos */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Relatório de OS */}
                    <div className="glass-card-enterprise p-8 rounded-3xl border-emerald-500/20 bg-emerald-500/[0.02] hover:bg-emerald-500/[0.04] transition-all group relative overflow-hidden flex flex-col h-full hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/10 duration-300">
                        <div className="absolute top-0 right-0 p-4 opacity-50 transition-opacity group-hover:opacity-100">
                            <FileText className="w-24 h-24 text-emerald-500/10 -mr-8 -mt-8 rotate-12 transition-transform group-hover:rotate-6 group-hover:scale-110 duration-500" />
                        </div>

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 border border-emerald-500/20 shadow-lg shadow-emerald-500/5 group-hover:scale-110 transition-transform duration-300">
                                <FileText className="w-8 h-8 text-emerald-500" />
                            </div>

                            <h3 className="text-2xl font-black text-[var(--text-primary)] mb-3 group-hover:text-emerald-400 transition-colors uppercase tracking-tight">
                                Produção de Oficina
                            </h3>
                            <p className="text-[var(--text-muted)] leading-relaxed mb-8 font-medium">
                                Listagem completa de Ordens de Serviço com filtros avançados de status, tipo e período.
                            </p>

                            <div className="mt-auto pt-8 border-t border-white/[0.05]">
                                <Button
                                    variant="secondary"
                                    className="w-full justify-center group-hover:bg-emerald-500/10 group-hover:text-emerald-400 border-emerald-500/20 py-6 text-sm font-bold tracking-wider uppercase backdrop-blur-sm"
                                    onClick={() => handleExport('garantia', () => relatoriosService.exportarRelatorioGarantia('pdf'))}
                                    isLoading={loading === 'garantia'}
                                    rightIcon={<Download className="w-4 h-4" />}
                                >
                                    Exportar PDF Analítico
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Análise Financeira */}
                    <div className="glass-card-enterprise p-8 rounded-3xl border-blue-500/20 bg-blue-500/[0.02] hover:bg-blue-500/[0.04] transition-all group relative overflow-hidden flex flex-col h-full hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10 duration-300">
                        <div className="absolute top-0 right-0 p-4 opacity-50 transition-opacity group-hover:opacity-100">
                            <TrendingUp className="w-24 h-24 text-blue-500/10 -mr-8 -mt-8 rotate-12 transition-transform group-hover:rotate-6 group-hover:scale-110 duration-500" />
                        </div>

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20 shadow-lg shadow-blue-500/5 group-hover:scale-110 transition-transform duration-300">
                                <Calendar className="w-8 h-8 text-blue-500" />
                            </div>

                            <h3 className="text-2xl font-black text-[var(--text-primary)] mb-3 group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                                Aging (Envelhecimento)
                            </h3>
                            <p className="text-[var(--text-muted)] leading-relaxed mb-8 font-medium">
                                Análise detalhada do tempo das OS em aberto, classificado por nível de urgência e dias parados.
                            </p>

                            <div className="mt-auto pt-8 border-t border-white/[0.05]">
                                <Button
                                    variant="secondary"
                                    className="w-full justify-center group-hover:bg-blue-500/10 group-hover:text-blue-400 border-blue-500/20 py-6 text-sm font-bold tracking-wider uppercase backdrop-blur-sm"
                                    onClick={() => handleExport('aging', () => relatoriosService.exportarRelatorioAging('pdf'))}
                                    isLoading={loading === 'aging'}
                                    rightIcon={<Download className="w-4 h-4" />}
                                >
                                    Exportar Relatório PDF
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Performance Técnica */}
                    <div className="glass-card-enterprise p-8 rounded-3xl border-violet-500/20 bg-violet-500/[0.02] hover:bg-violet-500/[0.04] transition-all group relative overflow-hidden flex flex-col h-full hover:-translate-y-1 hover:shadow-2xl hover:shadow-violet-500/10 duration-300">
                        <div className="absolute top-0 right-0 p-4 opacity-50 transition-opacity group-hover:opacity-100">
                            <BarChart3 className="w-24 h-24 text-violet-500/10 -mr-8 -mt-8 rotate-12 transition-transform group-hover:rotate-6 group-hover:scale-110 duration-500" />
                        </div>

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-6 border border-violet-500/20 shadow-lg shadow-violet-500/5 group-hover:scale-110 transition-transform duration-300">
                                <BarChart3 className="w-8 h-8 text-violet-500" />
                            </div>

                            <h3 className="text-2xl font-black text-[var(--text-primary)] mb-3 group-hover:text-violet-400 transition-colors uppercase tracking-tight">
                                Performance Técnica
                            </h3>
                            <p className="text-[var(--text-muted)] leading-relaxed mb-8 font-medium">
                                Eficiência individual, tempo médio de reparo e taxa de retorno por técnico.
                            </p>

                            <div className="mt-auto pt-8 border-t border-white/[0.05]">
                                <Button
                                    variant="secondary"
                                    className="w-full justify-center group-hover:bg-violet-500/10 group-hover:text-violet-400 border-violet-500/20 py-6 text-sm font-bold tracking-wider uppercase backdrop-blur-sm"
                                    onClick={() => handleExport('performance', () => relatoriosService.exportarRelatorioPerformance('pdf'))}
                                    isLoading={loading === 'performance'}
                                    rightIcon={<Download className="w-4 h-4" />}
                                >
                                    Gerar Análise PDF
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Banner de Desenvolvimento (Futuro) */}
                <div className="mt-12 glass-card-enterprise p-12 rounded-3xl border-white/[0.05] bg-gradient-to-r from-transparent to-white/[0.02] text-center border-dashed opacity-60 hover:opacity-100 transition-all duration-500 group cursor-default">
                    <p className="text-[var(--text-muted)] text-base font-medium group-hover:text-white transition-colors">
                        O módulo de <strong className="text-purple-400">Business Intelligence (BI)</strong> com gráficos dinâmicos estará disponível na versão <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-xs">2.1</span>
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
