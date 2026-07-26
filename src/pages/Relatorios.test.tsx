import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Relatorios } from './Relatorios';
import { relatoriosService } from '@/services/relatoriosService';

vi.mock('@/components/AppLayout', () => ({
    AppLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/services/relatoriosService', () => ({
    relatoriosService: {
        exportarRelatorioGarantia: vi.fn(),
        exportarRelatorioAging: vi.fn(),
        exportarRelatorioPerformance: vi.fn(),
    },
}));

describe('Relatorios', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('exporta o relatório de produção de oficina ao clicar no botão', async () => {
        (relatoriosService.exportarRelatorioGarantia as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

        render(<Relatorios />);
        fireEvent.click(screen.getByText('Exportar PDF Analítico'));

        await waitFor(() => {
            expect(relatoriosService.exportarRelatorioGarantia).toHaveBeenCalledWith('pdf');
        });
    });

    it('mostra alerta quando a exportação falha', async () => {
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { });
        (relatoriosService.exportarRelatorioAging as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Falha no servidor'));

        render(<Relatorios />);
        fireEvent.click(screen.getByText('Exportar Relatório PDF'));

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith('Erro ao gerar relatório. Verifique o console.');
        });
        alertSpy.mockRestore();
    });
});
