import { AppLayout } from '@/components/AppLayout';
import { FileText, Download, Calendar, BarChart3, TrendingUp, Clock } from 'lucide-react';
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
                <div className="mb-12">
                    <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2 flex items-center gap-3">
                        <BarChart3 className="w-8 h-8 text-emerald-500" />
                        Relatórios Analíticos
                    </h1>
                    <p className="text-[var(--text-muted)] text-lg">
                        Exportação de dados e análise profunda de performance operacional.
                    </p>
                </div>

                {/* Grid de Relatórios Ativos */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Relatório de OS */}
                    <div className="glass-card-enterprise p-8 rounded-3xl border-emerald-500/20 bg-emerald-500/[0.02] hover:bg-emerald-500/[0.04] transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-50">
                            <FileText className="w-24 h-24 text-emerald-500/10 -mr-8 -mt-8 rotate-12" />
                        </div>

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                                <FileText className="w-7 h-7 text-emerald-500" />
                            </div>

                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2 group-hover:text-emerald-400 transition-colors">
                                Produção de Oficina
                            </h3>
                            <p className="text-[var(--text-muted)] leading-relaxed mb-8">
                                Listagem completa de Ordens de Serviço com filtros avançados de status e tipo.
                            </p>

                            <div className="mt-auto pt-6 border-t border-white/[0.05]">
                                <Button
                                    variant="secondary"
                                    className="w-full justify-between group-hover:bg-emerald-500/10 group-hover:text-emerald-400 border-emerald-500/20"
                                    onClick={() => handleExport('garantia', () => relatoriosService.exportarRelatorioGarantia('pdf'))}
                                    isLoading={loading === 'garantia'}
                                    rightIcon={<Download className="w-4 h-4" />}
                                >
                                    Exportar PDF
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Análise Financeira */}
                    <div className="glass-card-enterprise p-8 rounded-3xl border-blue-500/20 bg-blue-500/[0.02] hover:bg-blue-500/[0.04] transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-50">
                            <TrendingUp className="w-24 h-24 text-blue-500/10 -mr-8 -mt-8 rotate-12" />
                        </div>

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20 shadow-lg shadow-blue-500/5">
                                <Calendar className="w-7 h-7 text-blue-500" />
                            </div>

                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2 group-hover:text-blue-400 transition-colors">
                                Aging (Envelhecimento)
                            </h3>
                            <p className="text-[var(--text-muted)] leading-relaxed mb-8">
                                Análise de tempo das OS em aberto, classificado por urgência e dias parados.
                            </p>

                            <div className="mt-auto pt-6 border-t border-white/[0.05]">
                                <Button
                                    variant="secondary"
                                    className="w-full justify-between group-hover:bg-blue-500/10 group-hover:text-blue-400 border-blue-500/20"
                                    onClick={() => handleExport('aging', () => relatoriosService.exportarRelatorioAging('pdf'))}
                                    isLoading={loading === 'aging'}
                                    rightIcon={<Download className="w-4 h-4" />}
                                >
                                    Exportar PDF
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Performance Técnica */}
                    <div className="glass-card-enterprise p-8 rounded-3xl border-violet-500/20 bg-violet-500/[0.02] hover:bg-violet-500/[0.04] transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-50">
                            <BarChart3 className="w-24 h-24 text-violet-500/10 -mr-8 -mt-8 rotate-12" />
                        </div>

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-6 border border-violet-500/20 shadow-lg shadow-violet-500/5">
                                <BarChart3 className="w-7 h-7 text-violet-500" />
                            </div>

                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2 group-hover:text-violet-400 transition-colors">
                                Performance Técnica
                            </h3>
                            <p className="text-[var(--text-muted)] leading-relaxed mb-8">
                                Eficiência individual, tempo médio de reparo e taxa de retorno por técnico.
                            </p>

                            <div className="mt-auto pt-6 border-t border-white/[0.05]">
                                <Button
                                    variant="secondary"
                                    className="w-full justify-between group-hover:bg-violet-500/10 group-hover:text-violet-400 border-violet-500/20"
                                    onClick={() => handleExport('performance', () => relatoriosService.exportarRelatorioPerformance('pdf'))}
                                    isLoading={loading === 'performance'}
                                    rightIcon={<Download className="w-4 h-4" />}
                                >
                                    Exportar PDF
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Banner de Desenvolvimento (Futuro) */}
                <div className="mt-12 glass-card-enterprise p-8 rounded-2xl border-white/[0.05] bg-gradient-to-r from-transparent to-white/[0.02] text-center border-dashed opacity-60 hover:opacity-100 transition-opacity">
                    <p className="text-[var(--text-muted)] text-sm">
                        O módulo de Business Intelligence (BI) com gráficos dinâmicos estará disponível na versão 2.1.
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}

