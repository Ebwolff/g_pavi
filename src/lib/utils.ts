import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Sanitiza texto livre antes de interpolar em filtros PostgREST (.or(), .ilike()).
 * Remove caracteres com significado especial na mini-linguagem de filtros
 * (`,` separa condições, `.` separa coluna/operador, `()` agrupa, `%`/`*` são wildcards),
 * evitando que o usuário injete condições extras na query.
 */
export function sanitizePostgrestFilterValue(value: string): string {
    return value.replace(/[,.()%*]/g, ' ').trim();
}
