
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Card } from './Card';
import { RefreshCw } from 'lucide-react';

describe('Card', () => {
    it('renders title and value correctly', () => {
        render(
            <Card
                title="Total de Vendas"
                value="R$ 50.000"
                icon={RefreshCw}
            />
        );
        expect(screen.getByText('Total de Vendas')).toBeInTheDocument();
        expect(screen.getByText('R$ 50.000')).toBeInTheDocument();
    });

    it('renders trend indicator correctly', () => {
        render(
            <Card
                title="Crescimento"
                value="10%"
                icon={RefreshCw}
                trend={{ value: 5, label: 'vs mês anterior', isPositive: true }}
            />
        );
        expect(screen.getByText('5%')).toBeInTheDocument();
        expect(screen.getByText('vs mês anterior')).toBeInTheDocument();
        // Check for positive styling if possible, or just presence
    });
});
