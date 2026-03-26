/**
 * Gráfico donut SVG puro — sem dependência externa
 */

import { useState } from 'react';

export interface DonutSegment {
    label: string;
    value: number;
    color: string;
}

interface DonutChartSVGProps {
    segments: DonutSegment[];
    size?: number;
    strokeWidth?: number;
    centerLabel?: string;
    centerValue?: string;
    title?: string;
    subtitle?: string;
    className?: string;
}

export function DonutChartSVG({
    segments,
    size = 160,
    strokeWidth = 18,
    centerLabel,
    centerValue,
    title,
    subtitle,
    className = '',
}: DonutChartSVGProps) {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

    const total = segments.reduce((sum, s) => sum + s.value, 0);
    if (total === 0) return null;

    const cx = 60;
    const cy = 60;
    const r = 45;
    const circumference = 2 * Math.PI * r;

    let cumulativeOffset = -circumference * 0.25; // start at top

    const segmentsWithPct = segments.map(s => ({
        ...s,
        pct: Math.round((s.value / total) * 100),
    }));

    return (
        <div className={`glass-card-enterprise p-6 rounded-3xl shadow-2xl border border-[var(--border-subtle)] bg-[var(--surface)] ${className}`}>
            {(title || subtitle) && (
                <div className="mb-4">
                    {title && (
                        <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">
                            {title}
                        </h3>
                    )}
                    {subtitle && <p className="text-[10px] text-[var(--text-muted)] mt-1">{subtitle}</p>}
                </div>
            )}

            <div className="flex items-center justify-center" style={{ height: `${size + 10}px` }}>
                <svg viewBox="0 0 120 120" width={size} height={size}>
                    {/* Background ring */}
                    <circle
                        cx={cx}
                        cy={cy}
                        r={r}
                        fill="none"
                        stroke="var(--surface-light)"
                        strokeWidth={strokeWidth}
                    />

                    {/* Segments */}
                    {segmentsWithPct.map((seg, i) => {
                        const dashLen = (seg.pct / 100) * circumference;
                        const offset = cumulativeOffset;
                        cumulativeOffset += dashLen;
                        const isHovered = hoveredIdx === i;

                        return (
                            <circle
                                key={`seg-${i}`}
                                cx={cx}
                                cy={cy}
                                r={r}
                                fill="none"
                                stroke={seg.color}
                                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                                strokeDasharray={`${dashLen} ${circumference - dashLen}`}
                                strokeDashoffset={-offset}
                                strokeLinecap="round"
                                opacity={hoveredIdx !== null && !isHovered ? 0.4 : 1}
                                onMouseEnter={() => setHoveredIdx(i)}
                                onMouseLeave={() => setHoveredIdx(null)}
                                style={{
                                    transition: 'opacity 0.3s, stroke-width 0.3s',
                                    cursor: 'pointer',
                                }}
                            />
                        );
                    })}

                    {/* Center text */}
                    {centerValue && (
                        <text
                            x={cx}
                            y={cy - 2}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="var(--text-primary)"
                            fontSize="18"
                            fontWeight="800"
                            fontFamily="monospace"
                        >
                            {hoveredIdx !== null ? `${segmentsWithPct[hoveredIdx].pct}%` : centerValue}
                        </text>
                    )}
                    {centerLabel && (
                        <text
                            x={cx}
                            y={cy + 14}
                            textAnchor="middle"
                            fill="var(--text-muted)"
                            fontSize="7"
                            fontWeight="600"
                        >
                            {hoveredIdx !== null ? segmentsWithPct[hoveredIdx].label : centerLabel}
                        </text>
                    )}
                </svg>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4 mt-4">
                {segmentsWithPct.map((seg, i) => (
                    <div
                        key={`legend-${i}`}
                        className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] cursor-pointer transition-opacity"
                        style={{ opacity: hoveredIdx !== null && hoveredIdx !== i ? 0.4 : 1 }}
                        onMouseEnter={() => setHoveredIdx(i)}
                        onMouseLeave={() => setHoveredIdx(null)}
                    >
                        <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ background: seg.color }}
                        />
                        {seg.label} {seg.pct}%
                    </div>
                ))}
            </div>
        </div>
    );
}
