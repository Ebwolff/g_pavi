import { describe, it, expect } from 'vitest';
import { calcularDiasEmAberto, formatarValor } from './osHelpers';

describe('osHelpers', () => {
    it('calculates days open correctly', () => {
        const today = new Date();
        const tenDaysAgo = new Date(today);
        tenDaysAgo.setDate(today.getDate() - 10);

        // Simplistic check, as implementation details depend on timezone/date parsing
        // Mocking date would make this more robust
        const days = calcularDiasEmAberto(tenDaysAgo.toISOString());
        expect(days).toBeGreaterThanOrEqual(9);
        expect(days).toBeLessThanOrEqual(11);
    });

    it('formats currency BRL correctly', () => {
        expect(formatarValor(1000)).toContain('R$');
        expect(formatarValor(1000)).toContain('1.000,00');
    });

    it('handles zero currency', () => {
        expect(formatarValor(0)).toContain('0,00');
    });
});
