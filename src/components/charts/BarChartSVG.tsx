/**
 * Gráfico de barras SVG puro — sem dependência externa
 */

import { useState } from 'react';

export interface BarDataItem {
    label: string;
    value: number;
}

interface BarChartSVGProps {
    data: BarDataItem[];
    height?: number;
    barColor?: string;
    barColorEnd?: string;
    title?: string;
    subtitle?: string;
    unit?: string;
    className?: string;
}

export function BarChartSVG({
    data,
    height = 220,
    barColor = '#22c55e',
    barColorEnd = '#15803d',
    title,
    subtitle,
    unit = 'R$',
    className = '',
}: BarChartSVGProps) {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

    if (!data.length) return null;

    const maxVal = Math.max(...data.map(d => d.value)) * 1.15;
    const paddingLeft = 50;
    const paddingRight = 10;
    const paddingTop = 10;
    const paddingBottom = 30;
    const chartW = 600;
    const chartH = height;
    const innerW = chartW - paddingLeft - paddingRight;
    const innerH = chartH - paddingTop - paddingBottom;
    const barWidth = Math.min(28, (innerW / data.length) * 0.6);
    const gap = innerW / data.length;

    const gridLines = 5;
    const gridValues = Array.from({ length: gridLines }, (_, i) => Math.round((maxVal / (gridLines - 1)) * i));

    const gradientId = `barGrad-${barColor.replace('#', '')}`;

    return (
        <div className={`glass-card-enterprise p-6 rounded-3xl shadow-2xl border border-[var(--border-subtle)] bg-[var(--surface)] ${className}`}>
            {(title || subtitle) && (
                <div className="mb-5">
                    {title && (
                        <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em] flex items-center gap-2">
                            {title}
                        </h3>
                    )}
                    {subtitle && <p className="text-[10px] text-[var(--text-muted)] mt-1">{subtitle}</p>}
                </div>
            )}
            <svg
                viewBox={`0 0 ${chartW} ${chartH}`}
                className="w-full"
                style={{ height: `${height}px` }}
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={barColor} />
                        <stop offset="100%" stopColor={barColorEnd} />
                    </linearGradient>
                </defs>

                {/* Grid lines */}
                {gridValues.map((val, i) => {
                    const y = paddingTop + innerH - (val / maxVal) * innerH;
                    return (
                        <g key={`grid-${i}`}>
                            <line
                                x1={paddingLeft}
                                y1={y}
                                x2={chartW - paddingRight}
                                y2={y}
                                stroke="var(--border-subtle)"
                                strokeWidth="1"
                                strokeDasharray={i === 0 ? '0' : '4 4'}
                                opacity={0.5}
                            />
                            <text
                                x={paddingLeft - 8}
                                y={y + 3}
                                textAnchor="end"
                                fill="var(--text-muted)"
                                fontSize="9"
                                fontFamily="monospace"
                            >
                                {unit}{val.toLocaleString('pt-BR')}
                            </text>
                        </g>
                    );
                })}

                {/* Bars */}
                {data.map((d, i) => {
                    const barH = (d.value / maxVal) * innerH;
                    const x = paddingLeft + gap * i + (gap - barWidth) / 2;
                    const y = paddingTop + innerH - barH;
                    const isHovered = hoveredIdx === i;

                    return (
                        <g
                            key={`bar-${i}`}
                            onMouseEnter={() => setHoveredIdx(i)}
                            onMouseLeave={() => setHoveredIdx(null)}
                            style={{ cursor: 'pointer' }}
                        >
                            <rect
                                x={x}
                                y={y}
                                width={barWidth}
                                height={barH}
                                rx={3}
                                fill={`url(#${gradientId})`}
                                opacity={isHovered ? 1 : 0.85}
                                style={{
                                    transition: 'opacity 0.2s',
                                }}
                            >
                                <animate
                                    attributeName="height"
                                    from="0"
                                    to={barH}
                                    dur="0.6s"
                                    begin={`${i * 0.04}s`}
                                    fill="freeze"
                                />
                                <animate
                                    attributeName="y"
                                    from={paddingTop + innerH}
                                    to={y}
                                    dur="0.6s"
                                    begin={`${i * 0.04}s`}
                                    fill="freeze"
                                />
                            </rect>

                            {/* Tooltip */}
                            {isHovered && (
                                <>
                                    <rect
                                        x={x + barWidth / 2 - 30}
                                        y={y - 26}
                                        width={60}
                                        height={20}
                                        rx={4}
                                        fill="var(--surface-light)"
                                        stroke="var(--border-subtle)"
                                        strokeWidth="1"
                                    />
                                    <text
                                        x={x + barWidth / 2}
                                        y={y - 13}
                                        textAnchor="middle"
                                        fill="var(--text-primary)"
                                        fontSize="9"
                                        fontWeight="bold"
                                        fontFamily="monospace"
                                    >
                                        {unit}{d.value.toLocaleString('pt-BR')}
                                    </text>
                                </>
                            )}

                            {/* X label */}
                            <text
                                x={x + barWidth / 2}
                                y={chartH - 6}
                                textAnchor="middle"
                                fill="var(--text-muted)"
                                fontSize="9"
                                fontFamily="monospace"
                            >
                                {d.label}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
