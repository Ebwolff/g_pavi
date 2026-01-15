import { AppLayout } from '@/components/AppLayout';
import { FileText, Download, Calendar, BarChart3, TrendingUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Relatorios() {
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

                {/* Coming Soon Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Relatório de OS */}
                    <div className="glass-card-enterprise p-8 rounded-3xl border-emerald-500/20 bg-emerald-500/[0.02] hover:bg-emerald-500/[0.04] transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-50">
                            <FileText className="w-24 h-24 text-emerald-500/10 -mr-8 -mt-8 rotate-12" />
                        </div>

                        <div className="relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                                <FileText className="w-7 h-7 text-emerald-500" />
                            </div>

                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2 group-hover:text-emerald-400 transition-colors">
                                Produção de Oficina
                            </h3>
                            <p className="text-[var(--text-muted)] leading-relaxed mb-8 h-12">
                                Listagem completa de Ordens de Serviço com filtros avançados de status e tipo.
                            </p>

                            <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/[0.05]">
                                <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5" />
                                    Em Breve
                                </span>
                                <Button variant="ghost" disabled size="sm" className="opacity-50">
                                    Exportar
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Análise Financeira */}
                    <div className="glass-card-enterprise p-8 rounded-3xl border-blue-500/20 bg-blue-500/[0.02] hover:bg-blue-500/[0.04] transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-50">
                            <TrendingUp className="w-24 h-24 text-blue-500/10 -mr-8 -mt-8 rotate-12" />
                        </div>

                        <div className="relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20 shadow-lg shadow-blue-500/5">
                                <Calendar className="w-7 h-7 text-blue-500" />
                            </div>

                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2 group-hover:text-blue-400 transition-colors">
                                Fechamento Mensal
                            </h3>
                            <p className="text-[var(--text-muted)] leading-relaxed mb-8 h-12">
                                Consolidação de receitas, custos de garantia e margem por período.
                            </p>

                            <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/[0.05]">
                                <span className="text-xs font-bold text-blue-500 uppercase tracking-widest flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5" />
                                    Em Breve
                                </span>
                                <Button variant="ghost" disabled size="sm" className="opacity-50">
                                    Exportar
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Performance Técnica */}
                    <div className="glass-card-enterprise p-8 rounded-3xl border-violet-500/20 bg-violet-500/[0.02] hover:bg-violet-500/[0.04] transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-50">
                            <BarChart3 className="w-24 h-24 text-violet-500/10 -mr-8 -mt-8 rotate-12" />
                        </div>

                        <div className="relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-6 border border-violet-500/20 shadow-lg shadow-violet-500/5">
                                <BarChart3 className="w-7 h-7 text-violet-500" />
                            </div>

                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2 group-hover:text-violet-400 transition-colors">
                                Performance Técnica
                            </h3>
                            <p className="text-[var(--text-muted)] leading-relaxed mb-8 h-12">
                                Eficiência individual, tempo médio de reparo e taxa de retorno por técnico.
                            </p>

                            <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/[0.05]">
                                <span className="text-xs font-bold text-violet-500 uppercase tracking-widest flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5" />
                                    Em Breve
                                </span>
                                <Button variant="ghost" disabled size="sm" className="opacity-50">
                                    Exportar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Banner de Desenvolvimento */}
                <div className="mt-12 glass-card-enterprise p-8 rounded-2xl border-white/[0.05] bg-gradient-to-r from-transparent to-white/[0.02] text-center border-dashed">
                    <p className="text-[var(--text-muted)] text-sm">
                        O módulo de Business Intelligence está sendo calibrado. Novas visualizações estarão disponíveis na versão 2.1.
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
