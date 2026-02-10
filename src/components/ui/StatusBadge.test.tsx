
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
    it('renders correctly with PENDENTE status', () => {
        render(<StatusBadge status="PENDENTE" />);
        const badge = screen.getByText(/Pendente/i);
        expect(badge).toBeInTheDocument();
        expect(badge.className).toContain('badge-enterprise');
    });

    it('renders correctly with CONCLUIDA status', () => {
        render(<StatusBadge status="CONCLUIDA" />);
        const badge = screen.getByText(/Concluída/i);
        expect(badge).toBeInTheDocument();
        expect(badge.className).toContain('badge-enterprise');
    });

    it('renders unknown status with default styling', () => {
        // @ts-ignore
        render(<StatusBadge status="DESCONHECIDO" />);
        const badge = screen.getByText(/DESCONHECIDO/i);
        expect(badge).toBeInTheDocument();
    });
});
