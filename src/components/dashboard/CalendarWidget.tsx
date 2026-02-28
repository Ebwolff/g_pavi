import React, { useMemo, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarWidgetProps {
    datesWithTasks: string[]; // Formato YYYY-MM-DD
    className?: string;
}

export function CalendarWidget({ datesWithTasks, className }: CalendarWidgetProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const { days, monthName, year } = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const days = [];
        // Preencher dias em branco do começo do mês
        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push(null);
        }

        // Dias do mês
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            days.push({
                day: i,
                dateStr,
                hasTask: datesWithTasks.includes(dateStr),
                isToday: new Date().toISOString().split('T')[0] === dateStr
            });
        }

        const monthName = currentDate.toLocaleString('pt-BR', { month: 'long' });

        return { days, monthName, year };
    }, [currentDate, datesWithTasks]);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    return (
        <div className={cn("glass-card-enterprise p-6 md:p-8 rounded-3xl shadow-2xl border border-[var(--border-subtle)] bg-[var(--surface)] flex flex-col", className)}>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em] flex items-center gap-3">
                    <CalendarIcon className="w-5 h-5 text-blue-500" />
                    Calendário de Operações
                </h3>
                <div className="flex items-center gap-3 text-[var(--text-primary)] font-bold text-sm bg-[var(--surface-light)] px-3 py-1.5 rounded-lg border border-[var(--border-subtle)]">
                    <button onClick={handlePrevMonth} className="hover:text-blue-500 transition-colors p-1">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="capitalize w-24 text-center">{monthName} {year}</span>
                    <button onClick={handleNextMonth} className="hover:text-blue-500 transition-colors p-1">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex-1">
                <div className="grid grid-cols-7 gap-2 mb-2 text-center text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider">
                    {weekDays.map(d => <div key={d}>{d}</div>)}
                </div>

                <div className="grid grid-cols-7 gap-1 md:gap-2">
                    {days.map((dayObj, i) => {
                        if (!dayObj) return <div key={`empty-${i}`} className="p-2" />;

                        return (
                            <div
                                key={dayObj.dateStr}
                                className={cn(
                                    "relative flex items-center justify-center p-2 rounded-xl text-sm font-semibold transition-all duration-200",
                                    dayObj.isToday
                                        ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                                        : "bg-[var(--surface-light)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)]",
                                    dayObj.hasTask && !dayObj.isToday && "text-[var(--text-primary)] border-amber-500/30 bg-amber-500/5",
                                    !dayObj.hasTask && !dayObj.isToday && "text-[var(--text-secondary)]"
                                )}
                            >
                                <span>{dayObj.day}</span>
                                {dayObj.hasTask && (
                                    <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-6 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                <div className="flex items-center gap-2">
                    <span className="block w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]" />
                    <span>OS Ativa</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="block w-2 h-2 rounded-full border border-blue-500/50 bg-blue-600/20" />
                    <span>Hoje</span>
                </div>
            </div>
        </div>
    );
}
