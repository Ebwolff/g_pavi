import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ordemServicoService } from './ordemServico.service';
import { supabase } from '@/lib/supabase';
import { notifyOSCreated, notifyTecnicoAssigned, notifyOSStatusChanged } from '@/lib/notificationHelper';

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
        auth: { getUser: vi.fn() },
    },
}));

vi.mock('@/lib/notificationHelper', () => ({
    notifyOSCreated: vi.fn().mockResolvedValue(undefined),
    notifyTecnicoAssigned: vi.fn().mockResolvedValue(undefined),
    notifyOSStatusChanged: vi.fn().mockResolvedValue(undefined),
}));

function chainable(result: { data: any; error: any; count?: number }) {
    const builder: any = {};
    const chainMethods = [
        'select', 'insert', 'update', 'delete',
        'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'or', 'not', 'order', 'range', 'limit',
    ];
    chainMethods.forEach((m) => {
        builder[m] = vi.fn(() => builder);
    });
    builder.single = vi.fn(() => Promise.resolve(result));
    builder.maybeSingle = vi.fn(() => Promise.resolve(result));
    builder.then = (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject);
    return builder;
}

describe('ordemServicoService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getNextOSNumber', () => {
        const year = new Date().getFullYear();

        it('retorna o primeiro número do ano quando não há OS anteriores', async () => {
            (supabase.from as any).mockReturnValue(chainable({ data: [], error: null }));

            const numero = await ordemServicoService.getNextOSNumber();

            expect(numero).toBe(`${year}-0001`);
        });

        it('incrementa a partir do último número existente', async () => {
            (supabase.from as any).mockReturnValue(
                chainable({ data: [{ numero_os: `${year}-0042` }], error: null })
            );

            const numero = await ordemServicoService.getNextOSNumber();

            expect(numero).toBe(`${year}-0043`);
        });

        it('preserva o padding de zeros ao virar a centena/milhar', async () => {
            (supabase.from as any).mockReturnValue(
                chainable({ data: [{ numero_os: `${year}-0099` }], error: null })
            );
            expect(await ordemServicoService.getNextOSNumber()).toBe(`${year}-0100`);

            (supabase.from as any).mockReturnValue(
                chainable({ data: [{ numero_os: `${year}-9999` }], error: null })
            );
            expect(await ordemServicoService.getNextOSNumber()).toBe(`${year}-10000`);
        });

        it('cai no primeiro número do ano se o formato existente for inesperado', async () => {
            (supabase.from as any).mockReturnValue(
                chainable({ data: [{ numero_os: 'FORMATO-INVALIDO' }], error: null })
            );

            // 'FORMATO-INVALIDO' na verdade casa com /(\d+)$/? não tem dígito no fim -> sem match
            const numero = await ordemServicoService.getNextOSNumber();
            expect(numero).toBe(`${year}-0001`);
        });

        it('propaga erro do Supabase', async () => {
            (supabase.from as any).mockReturnValue(
                chainable({ data: null, error: { message: 'falhou' } })
            );

            await expect(ordemServicoService.getNextOSNumber()).rejects.toBeTruthy();
        });
    });

    describe('update', () => {
        it('preenche data_faturamento automaticamente ao mudar status para FATURADA', async () => {
            const builder = chainable({ data: { id: 'os-1', status_atual: 'FATURADA' }, error: null });
            (supabase.from as any).mockReturnValue(builder);

            await ordemServicoService.update('os-1', { status_atual: 'FATURADA' });

            const updatePayload = builder.update.mock.calls[0][0];
            expect(updatePayload.data_faturamento).toEqual(expect.any(String));
        });

        it('não sobrescreve data_faturamento se já informada', async () => {
            const builder = chainable({ data: { id: 'os-1' }, error: null });
            (supabase.from as any).mockReturnValue(builder);

            await ordemServicoService.update('os-1', {
                status_atual: 'FATURADA',
                data_faturamento: '2026-01-01T00:00:00.000Z',
            });

            const updatePayload = builder.update.mock.calls[0][0];
            expect(updatePayload.data_faturamento).toBe('2026-01-01T00:00:00.000Z');
        });

        it('dispara notifyTecnicoAssigned quando um técnico é atribuído', async () => {
            const builder = chainable({ data: { id: 'os-1' }, error: null });
            (supabase.from as any).mockReturnValue(builder);

            await ordemServicoService.update('os-1', { tecnico_id: 'tec-1' });

            expect(notifyTecnicoAssigned).toHaveBeenCalledWith('os-1', 'tec-1');
        });

        it('dispara notifyOSStatusChanged quando o status muda', async () => {
            const builder = chainable({ data: { id: 'os-1' }, error: null });
            (supabase.from as any).mockReturnValue(builder);

            await ordemServicoService.update('os-1', { status_atual: 'EM_EXECUCAO' });

            expect(notifyOSStatusChanged).toHaveBeenCalledWith('os-1', 'EM_EXECUCAO');
        });

        it('não dispara notificações quando não há mudança de técnico/status', async () => {
            const builder = chainable({ data: { id: 'os-1' }, error: null });
            (supabase.from as any).mockReturnValue(builder);

            await ordemServicoService.update('os-1', { observacoes: 'nota qualquer' });

            expect(notifyTecnicoAssigned).not.toHaveBeenCalled();
            expect(notifyOSStatusChanged).not.toHaveBeenCalled();
        });
    });

    describe('create', () => {
        it('sempre cria a OS como AGUARDANDO_ATRIBUICAO e vinculada ao usuário logado', async () => {
            (supabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: 'user-1' } } });
            const builder = chainable({ data: { id: 'os-1', numero_os: '2026-0001' }, error: null });
            (supabase.from as any).mockReturnValue(builder);

            await ordemServicoService.create({ numero_os: '2026-0001' } as any);

            const insertPayload = builder.insert.mock.calls[0][0];
            expect(insertPayload.status_atual).toBe('AGUARDANDO_ATRIBUICAO');
            expect(insertPayload.consultor_id).toBe('user-1');
        });

        it('dispara notifyOSCreated após criar', async () => {
            (supabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: 'user-1' } } });
            (supabase.from as any).mockReturnValue(
                chainable({ data: { id: 'os-1', numero_os: '2026-0001' }, error: null })
            );

            await ordemServicoService.create({ numero_os: '2026-0001' } as any);

            expect(notifyOSCreated).toHaveBeenCalledWith('os-1', '2026-0001');
        });
    });

    describe('updateStatus', () => {
        it('preenche data_fechamento ao concluir a OS', async () => {
            const builder = chainable({ data: { id: 'os-1' }, error: null });
            (supabase.from as any).mockReturnValue(builder);

            await ordemServicoService.updateStatus('os-1', { novoStatus: 'CONCLUIDA' });

            const payload = builder.update.mock.calls[0][0];
            expect(payload.status_atual).toBe('CONCLUIDA');
            expect(payload.data_fechamento).toEqual(expect.any(String));
            expect(payload.data_faturamento).toBeUndefined();
        });

        it('preenche data_faturamento ao faturar a OS', async () => {
            const builder = chainable({ data: { id: 'os-1' }, error: null });
            (supabase.from as any).mockReturnValue(builder);

            await ordemServicoService.updateStatus('os-1', { novoStatus: 'FATURADA' });

            const payload = builder.update.mock.calls[0][0];
            expect(payload.data_faturamento).toEqual(expect.any(String));
        });

        it('só inclui campos de motivo opcionais quando informados', async () => {
            const builder = chainable({ data: { id: 'os-1' }, error: null });
            (supabase.from as any).mockReturnValue(builder);

            await ordemServicoService.updateStatus('os-1', {
                novoStatus: 'PAUSADA',
                motivo_pausa: 'Aguardando cliente',
            });

            const payload = builder.update.mock.calls[0][0];
            expect(payload.motivo_pausa).toBe('Aguardando cliente');
            expect(payload.numero_orcamento).toBeUndefined();
            expect(payload.data_conclusao_servico).toBeUndefined();
        });
    });
});
