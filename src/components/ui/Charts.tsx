import React from 'react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Area,
    AreaChart,
} from 'recharts';

// --- Enterprise Theme Colors (Neon & Glass) ---
const THEME = {
    primary: '#60A5FA',   // blue-400
    success: '#4ADE80',   // green-400
    warning: '#FBBF24',   // amber-400
    danger: '#F87171',    // red-400
    violet: '#A78BFA',    // violet-400
    indigo: '#818CF8',    // indigo-400
    text: '#9CA3AF',      // gray-400
    grid: 'rgba(255, 255, 255, 0.05)',
    tooltipBg: 'rgba(17, 24, 39, 0.9)',
    tooltipBorder: 'rgba(255, 255, 255, 0.1)',
};

const CHART_COLORS = [THEME.primary, THEME.success, THEME.warning, THEME.danger, THEME.violet, THEME.indigo];

// --- Premium Tooltip ---
const CustomTooltip = ({ active, payload, label, formatter }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#0B0F14]/90 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-2xl min-w-[180px]">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 pb-2 border-b border-white/5">
                    {label}
                </p>
                <div className="space-y-2">
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px]"
                                    style={{
                                        backgroundColor: entry.color || entry.fill,
                                        boxShadow: `0 0 8px ${entry.color || entry.fill}`
                                    }}
                                />
                                <span className="text-sm font-medium text-gray-300">{entry.name}</span>
                            </div>
                            <span className="text-sm font-bold text-white font-mono">
                                {formatter ? formatter(entry.value) : entry.value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

// --- Charts ---

interface TendenciaChartProps {
    data: Array<{
        data: string;
        total: number;
        normal: number;
        garantia: number;
    }>;
}

export const TendenciaChart: React.FC<TendenciaChartProps> = ({ data }) => {
    return (
        <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={THEME.primary} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={THEME.primary} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorNormal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={THEME.success} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={THEME.success} stopOpacity={0} />
                        </linearGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} vertical={false} />
                    <XAxis
                        dataKey="data"
                        tick={{ fontSize: 10, fill: THEME.text }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => {
                            const date = new Date(value);
                            return `${date.getDate()}/${date.getMonth() + 1}`;
                        }}
                        dy={10}
                    />
                    <YAxis
                        tick={{ fontSize: 10, fill: THEME.text }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px', opacity: 0.8 }} />

                    <Area
                        type="monotone"
                        dataKey="total"
                        stroke={THEME.primary}
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorTotal)"
                        filter="url(#glow)"
                        name="Total"
                    />
                    <Area
                        type="monotone"
                        dataKey="normal"
                        stroke={THEME.success}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorNormal)"
                        filter="url(#glow)"
                        name="Normal"
                    />
                    <Line
                        type="monotone"
                        dataKey="garantia"
                        stroke={THEME.danger}
                        strokeWidth={2}
                        dot={false}
                        name="Garantia"
                        filter="url(#glow)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

interface DistribuicaoStatusChartProps {
    data: Array<{
        status: string;
        count: number;
    }>;
}

export const DistribuicaoStatusChart: React.FC<DistribuicaoStatusChartProps> = ({ data }) => {
    const statusLabels: Record<string, string> = {
        EM_EXECUCAO: 'Execução',
        AGUARDANDO_PECAS: 'Peças',
        PAUSADA: 'Pausada',
        CONCLUIDA: 'Concluída',
        FATURADA: 'Faturada',
        CANCELADA: 'Cancelada',
    };

    const chartData = data.map((d) => ({
        ...d,
        name: statusLabels[d.status] || d.status,
    }));

    return (
        <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="count"
                        stroke="none"
                        cornerRadius={6}
                    >
                        {chartData.map((_, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                                style={{ filter: 'drop-shadow(0px 0px 4px rgba(0,0,0,0.5))' }}
                            />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        layout="vertical"
                        align="right"
                        verticalAlign="middle"
                        iconType="circle"
                        wrapperStyle={{ fontSize: '11px', color: THEME.text }}
                    />
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                        <tspan x="50%" dy="-1em" fontSize="24" fontWeight="bold" fill="white">
                            {data.reduce((acc, curr) => acc + curr.count, 0)}
                        </tspan>
                        <tspan x="50%" dy="1.5em" fontSize="12" fill={THEME.text}>
                            Total OS
                        </tspan>
                    </text>
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

interface ConsultorPerformanceChartProps {
    data: Array<{
        consultor_nome: string;
        total_os: number;
        os_concluidas: number;
        valor_total: number;
    }>;
}

export const ConsultorPerformanceChart: React.FC<ConsultorPerformanceChartProps> = ({ data }) => {
    const chartData = data.slice(0, 5);

    return (
        <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} vertical={false} />
                    <XAxis
                        dataKey="consultor_nome"
                        tick={{ fontSize: 10, fill: THEME.text }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => value.split(' ')[0]}
                        dy={10}
                    />
                    <YAxis tick={{ fontSize: 10, fill: THEME.text }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px', opacity: 0.8 }} />
                    <Bar
                        dataKey="total_os"
                        fill={THEME.primary}
                        name="Total OS"
                        radius={[4, 4, 0, 0]}
                        barSize={32}
                    />
                    <Bar
                        dataKey="os_concluidas"
                        fill={THEME.success}
                        name="Concluídas"
                        radius={[4, 4, 0, 0]}
                        barSize={32}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

interface TopClientesChartProps {
    data: Array<{
        cliente: string;
        valor: number;
        quantidade: number;
    }>;
}

export const TopClientesChart: React.FC<TopClientesChartProps> = ({ data }) => {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    return (
        <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis
                        dataKey="cliente"
                        type="category"
                        tick={{ fontSize: 10, fill: THEME.text }}
                        axisLine={false}
                        tickLine={false}
                        width={100}
                        tickFormatter={(value) => value.length > 12 ? value.substring(0, 12) + '...' : value}
                    />
                    <Tooltip content={<CustomTooltip formatter={formatCurrency} />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                    <Bar
                        dataKey="valor"
                        fill={THEME.success}
                        radius={[0, 6, 6, 0]}
                        barSize={24}
                    >
                        {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fillOpacity={0.8 + (index * 0.05)} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

interface UrgenciaDistributionProps {
    criticas: number;
    altas: number;
    medias: number;
    normais: number;
}

export const UrgenciaDistributionChart: React.FC<UrgenciaDistributionProps> = ({
    criticas,
    altas,
    medias,
    normais,
}) => {
    const chartData = [
        { name: 'Críticas (>90d)', value: criticas, color: THEME.danger },
        { name: 'Altas (60-90d)', value: altas, color: '#FB923C' }, // Orange-400
        { name: 'Médias (30-60d)', value: medias, color: THEME.warning },
        { name: 'Normais (<30d)', value: normais, color: THEME.success },
    ].filter(d => d.value > 0);

    return (
        <div className="w-full h-[250px]">
            {chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[var(--text-muted)] text-sm">
                    Nenhum dado disponível.
                </div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={4}
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                    style={{ filter: 'drop-shadow(0px 0px 4px rgba(0,0,0,0.3))' }}
                                />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: THEME.text }} />
                        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                            <tspan x="50%" dy="0.3em" fontSize="20" fontWeight="bold" fill="white">
                                {criticas + altas + medias + normais}
                            </tspan>
                        </text>
                    </PieChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};
