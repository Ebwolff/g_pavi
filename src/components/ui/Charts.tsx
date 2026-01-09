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
} from 'recharts';

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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendência de OS - Últimos 30 Dias</h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                        dataKey="data"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => {
                            const date = new Date(value);
                            return `${date.getDate()}/${date.getMonth() + 1}`;
                        }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                        }}
                        labelFormatter={(value) => {
                            const date = new Date(value);
                            return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
                        }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Total" />
                    <Line type="monotone" dataKey="normal" stroke="#10b981" strokeWidth={2} name="Normal" />
                    <Line type="monotone" dataKey="garantia" stroke="#ef4444" strokeWidth={2} name="Garantia" />
                </LineChart>
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
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'];

    const statusLabels: Record<string, string> = {
        EM_EXECUCAO: 'Em Execução',
        AGUARDANDO_PECAS: 'Aguardando Peças',
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição por Status</h3>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
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
    const chartData = data.slice(0, 10); // Top 10

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance por Consultor (Top 10)</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis
                        dataKey="consultor_nome"
                        type="category"
                        width={120}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => {
                            if (value.length > 15) return value.substring(0, 15) + '...';
                            return value;
                        }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                        }}
                    />
                    <Legend />
                    <Bar dataKey="total_os" fill="#3b82f6" name="Total OS" />
                    <Bar dataKey="os_concluidas" fill="#10b981" name="Concluídas" />
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
        }).format(value);
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Clientes por Valor</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                        dataKey="cliente"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        tick={{ fontSize: 11 }}
                        interval={0}
                        tickFormatter={(value) => {
                            if (value.length > 10) return value.substring(0, 10) + '...';
                            return value;
                        }}
                    />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                        }}
                        formatter={(value: number) => [formatCurrency(value), 'Valor Total']}
                    />
                    <Bar dataKey="valor" fill="#10b981" radius={[8, 8, 0, 0]} />
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
    const data = [
        { name: 'Críticas (>90d)', value: criticas, color: '#ef4444' },
        { name: 'Altas (60-90d)', value: altas, color: '#f97316' },
        { name: 'Médias (30-60d)', value: medias, color: '#eab308' },
        { name: 'Normais (<30d)', value: normais, color: '#22c55e' },
    ];

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição por Urgência</h3>
            <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};
