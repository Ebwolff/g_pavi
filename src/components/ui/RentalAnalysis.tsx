import React from 'react';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    PieChart,
    Package,
    Wrench,
    Car,
    ArrowUpRight,
    Briefcase
} from 'lucide-react';
import { Card } from './Card';
import { cn } from '@/lib/utils';

export interface ProfitabilityData {
    os_id: string;
    receita_mao_de_obra: number;
    receita_pecas: number;
    receita_deslocamento: number;
    receita_total: number;
    custo_deslocamento: number;
    custo_combustivel: number;
    custo_alimentacao: number;
    custo_hospedagem: number;
    custo_pedagio: number;
    custo_mao_de_obra: number;
    custo_outros: number;
    custo_pecas: number;
    custo_total: number;
    lucro_bruto: number;
    margem_percentual: number;
}

interface RentalAnalysisProps {
    data: ProfitabilityData;
    isLoading?: boolean;
}

export function RentalAnalysis({ data, isLoading }: RentalAnalysisProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-white/5 rounded-2xl border border-white/5" />
                ))}
            </div>
        );
    }

    const formatCurrency = (val: number) => {
        return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const isProfitable = data.lucro_bruto > 0;

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Resumo Principal */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/20">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Receita Total</span>
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                            <ArrowUpRight className="w-4 h-4 text-indigo-500" />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-white">{formatCurrency(data.receita_total)}</p>
                    <div className="flex items-center gap-2 mt-2 opacity-60">
                        <span className="text-[9px] font-bold text-white uppercase tracking-tighter">Billed to customer</span>
                    </div>
                </Card>

                <Card className="bg-gradient-to-br from-rose-500/10 to-transparent border-rose-500/20">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Custo Total</span>
                        <div className="p-2 bg-rose-500/20 rounded-lg">
                            <TrendingDown className="w-4 h-4 text-rose-500" />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-white">{formatCurrency(data.custo_total)}</p>
                    <div className="flex items-center gap-2 mt-2 opacity-60">
                        <span className="text-[9px] font-bold text-white uppercase tracking-tighter">Aggregated Expenses</span>
                    </div>
                </Card>

                <Card className={cn(
                    "bg-gradient-to-br border-2 transition-all shadow-xl",
                    isProfitable
                        ? "from-emerald-500/20 to-transparent border-emerald-500/30"
                        : "from-rose-500/20 to-transparent border-rose-500/30"
                )}>
                    <div className="flex items-center justify-between mb-2">
                        <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest",
                            isProfitable ? "text-emerald-400" : "text-rose-400"
                        )}>Lucro Bruto</span>
                        <div className={cn(
                            "p-2 rounded-lg",
                            isProfitable ? "bg-emerald-500/20" : "bg-rose-500/20"
                        )}>
                            {isProfitable ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-rose-500" />}
                        </div>
                    </div>
                    <p className="text-3xl font-black text-white">{formatCurrency(data.lucro_bruto)}</p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                            isProfitable ? "bg-emerald-500/20 text-emerald-500" : "bg-rose-500/20 text-rose-500"
                        )}>
                            Margem: {data.margem_percentual.toFixed(1)}%
                        </span>
                    </div>
                </Card>
            </div>

            {/* Detalhamento de Receitas vs Custos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Lado da Receita */}
                <div className="space-y-4">
                    <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2 px-2">
                        <PieChart className="w-4 h-4 text-indigo-500" />
                        Composição da Receita
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                        <RevenueItem label="Serviços (MdO)" value={data.receita_mao_de_obra} icon={Wrench} color="blue" total={data.receita_total} />
                        <RevenueItem label="Peças & Materiais" value={data.receita_pecas} icon={Package} color="emerald" total={data.receita_total} />
                        <RevenueItem label="Deslocamento" value={data.receita_deslocamento} icon={Car} color="amber" total={data.receita_total} />
                    </div>
                </div>

                {/* Lado do Custo */}
                <div className="space-y-4">
                    <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2 px-2">
                        <TrendingDown className="w-4 h-4 text-rose-500" />
                        Composição do Custo (Manual)
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                        <CostItem label="Custo Mão de Obra" value={data.custo_mao_de_obra} icon={Briefcase} total={data.custo_total} />
                        <CostItem label="Custo de Peças" value={data.custo_pecas} icon={Package} total={data.custo_total} />
                        <CostItem label="Logística & Viagem" value={data.custo_deslocamento + data.custo_combustivel + data.custo_pedagio} icon={Car} total={data.custo_total} />
                        <CostItem label="Outros Gastos" value={data.custo_alimentacao + data.custo_hospedagem + data.custo_outros} icon={DollarSign} total={data.custo_total} />
                    </div>
                </div>
            </div>

            {/* Banner de Eficiência */}
            {data.receita_total > 0 && (
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-tight">Análise de Eficiência</h4>
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                            A cada R$ 1,00 faturado nesta O.S., o custo operacional foi de
                            <span className="text-white font-bold"> {formatCurrency(data.custo_total / data.receita_total)}</span>.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase mb-1">Ponto de Equilíbrio</p>
                            <div className="h-2 w-48 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                <div
                                    className={cn(
                                        "h-full transition-all duration-1000",
                                        data.margem_percentual > 30 ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" : "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                                    )}
                                    style={{ width: `${Math.min(100, (data.custo_total / data.receita_total) * 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function RevenueItem({ label, value, icon: Icon, color, total }: any) {
    const percent = total > 0 ? (value / total) * 100 : 0;
    return (
        <Card className="p-4 bg-white/[0.02] border-white/[0.05] hover:border-white/10 transition-all">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg",
                        color === 'blue' ? 'bg-blue-500/10 text-blue-400' :
                            color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    )}>
                        <Icon className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-white uppercase tracking-wider">{label}</p>
                        <p className="text-xs text-[var(--text-muted)] font-medium">{percent.toFixed(1)}% do faturamento</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-sm font-black text-white">{value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
            </div>
        </Card>
    );
}

function CostItem({ label, value, icon: Icon, total }: any) {
    const percent = total > 0 ? (value / total) * 100 : 0;
    return (
        <Card className="p-4 bg-white/[0.02] border-white/[0.05] hover:border-rose-500/10 transition-all border-l-2 border-l-rose-500/20">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                        <Icon className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-white/70 uppercase tracking-wider">{label}</p>
                        <p className="text-[10px] text-[var(--text-muted)] font-medium">{percent.toFixed(1)}% do custo total</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-sm font-black text-rose-400">{value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
            </div>
        </Card>
    );
}
