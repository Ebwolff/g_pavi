import { describe, it, expect, vi, beforeEach } from 'vitest';
import { orcamentoService } from './orcamento.service';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
    },
}));

/**
 * Constrói um mock encadeável de PostgrestQueryBuilder: todo método de
 * filtro/ordenação retorna o próprio builder, e tanto `await builder` quanto
 * `await builder.single()/.maybeSingle()` resolvem para `result`.
 */
function chainable(result: { data: any; error: any; count?: number }) {
    const builder: any = {};
    const chainMethods = [
        'select', 'insert', 'update', 'delete',
        'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'or', 'order', 'range', 'limit',
    ];
    chainMethods.forEach((m) => {
        builder[m] = vi.fn(() => builder);
    });
    builder.single = vi.fn(() => Promise.resolve(result));
    builder.maybeSingle = vi.fn(() => Promise.resolve(result));
    builder.then = (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject);
    return builder;
}

describe('orcamentoService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('updateStatus', () => {
        it('define data_aprovacao ao transicionar para APROVADO', async () => {
            const builder = chainable({ data: { id: '1', status_orcamento: 'APROVADO' }, error: null });
            (supabase.from as any).mockReturnValue(builder);

            await orcamentoService.updateStatus('1', 'APROVADO');

            expect(builder.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    status_orcamento: 'APROVADO',
                    data_aprovacao: expect.any(String),
                })
            );
        });

        it('NÃO define data_aprovacao para outras transições', async () => {
            const builder = chainable({ data: { id: '1', status_orcamento: 'REPROVADO' }, error: null });
            (supabase.from as any).mockReturnValue(builder);

            await orcamentoService.updateStatus('1', 'REPROVADO');

            const callArg = builder.update.mock.calls[0][0];
            expect(callArg.status_orcamento).toBe('REPROVADO');
            expect(callArg.data_aprovacao).toBeUndefined();
        });

        it('propaga o erro do Supabase', async () => {
            const builder = chainable({ data: null, error: { message: 'falhou' } });
            (supabase.from as any).mockReturnValue(builder);

            await expect(orcamentoService.updateStatus('1', 'APROVADO')).rejects.toBeTruthy();
        });
    });

    describe('converterParaOS', () => {
        const orcamentoAprovado = {
            id: 'orc-1',
            numero_orcamento: 'NBS-001',
            status_orcamento: 'APROVADO',
            cliente_id: 'cli-1',
            nome_cliente_digitavel: 'João',
            maquina_id: 'maq-1',
            modelo_maquina: 'Trator X',
            chassi: 'CHASSI123',
            descricao_problema: 'Problema X',
            valor_mao_de_obra: 100,
            valor_pecas: 50,
            valor_deslocamento: 10,
            valor_liquido_total: 160,
            tipo_diagnostico: 'SIMPLES',
            consultor_id: 'cons-1',
        };

        it('rejeita conversão se o orçamento não estiver APROVADO', async () => {
            const orcamentoNaoAprovado = { ...orcamentoAprovado, status_orcamento: 'EM_ELABORACAO' };
            (supabase.from as any).mockImplementation(() =>
                chainable({ data: orcamentoNaoAprovado, error: null })
            );

            await expect(orcamentoService.converterParaOS('orc-1', {})).rejects.toThrow(
                /APROVADOS podem ser convertidos/
            );
        });

        it('cria a OS herdando os dados financeiros e do cliente do orçamento aprovado', async () => {
            const novaOS = { id: 'os-1', numero_os: 'OS-001' };
            let osInsertPayload: any = null;

            (supabase.from as any).mockImplementation((table: string) => {
                if (table === 'orcamentos_servico') {
                    // getById (select) e updateStatus (update) usam a mesma tabela
                    return chainable({ data: orcamentoAprovado, error: null });
                }
                if (table === 'ordens_servico') {
                    // Sem .single(): getNextOSNumber() consulta o maior numero_os existente (lista vazia = ano-0001).
                    // Com .single(): retorno do .insert(...).select().single() da OS recém-criada.
                    const builder = chainable({ data: [], error: null });
                    builder.single = vi.fn(() => Promise.resolve({ data: novaOS, error: null }));
                    builder.insert = vi.fn((payload: any) => {
                        osInsertPayload = payload;
                        return builder;
                    });
                    return builder;
                }
                if (table === 'historico_status_os') {
                    return chainable({ data: null, error: null });
                }
                return chainable({ data: null, error: null });
            });

            const resultado = await orcamentoService.converterParaOS('orc-1', { data_agendamento: '2026-01-01' });

            expect(resultado).toEqual(novaOS);
            expect(osInsertPayload).toMatchObject({
                orcamento_id: 'orc-1',
                cliente_id: 'cli-1',
                chassi: 'CHASSI123',
                valor_liquido_total: 160,
                consultor_id: 'cons-1',
                tipo_os: 'NORMAL',
                status_atual: 'AGUARDANDO_ATRIBUICAO',
                data_agendamento: '2026-01-01',
                tipo_diagnostico: 'SIMPLES',
            });
            // numero_os é obrigatório (NOT NULL + UNIQUE no banco) e precisa ser gerado,
            // não apenas herdado do orçamento.
            expect(osInsertPayload.numero_os).toEqual(expect.any(String));
        });

        it('não propaga tipo_diagnostico inválido para a OS (ordens_servico tem CHECK constraint)', async () => {
            const novaOS = { id: 'os-2', numero_os: 'OS-002' };
            let osInsertPayload: any = null;
            const orcamentoComTipoInvalido = { ...orcamentoAprovado, tipo_diagnostico: 'MANUTENCAO' };

            (supabase.from as any).mockImplementation((table: string) => {
                if (table === 'orcamentos_servico') {
                    return chainable({ data: orcamentoComTipoInvalido, error: null });
                }
                if (table === 'ordens_servico') {
                    const builder = chainable({ data: [], error: null });
                    builder.single = vi.fn(() => Promise.resolve({ data: novaOS, error: null }));
                    builder.insert = vi.fn((payload: any) => {
                        osInsertPayload = payload;
                        return builder;
                    });
                    return builder;
                }
                return chainable({ data: null, error: null });
            });

            await orcamentoService.converterParaOS('orc-1', {});

            // 'MANUTENCAO' não é SIMPLES/COMPLEXO/ESPECIALIZADO: precisa virar null,
            // senão o INSERT falha no banco por violar check_tipo_diagnostico.
            expect(osInsertPayload.tipo_diagnostico).toBeNull();
        });
    });

    describe('getEstatisticas', () => {
        it('agrega contagens por status e soma o valor aprovado', async () => {
            const rows = [
                { status_orcamento: 'EM_ELABORACAO', valor_liquido_total: 100 },
                { status_orcamento: 'ENVIADO_CLIENTE', valor_liquido_total: 200 },
                { status_orcamento: 'APROVADO', valor_liquido_total: 300 },
                { status_orcamento: 'APROVADO', valor_liquido_total: 150 },
                { status_orcamento: 'CONVERTIDO_OS', valor_liquido_total: 400 },
            ];
            (supabase.from as any).mockReturnValue(chainable({ data: rows, error: null }));

            const stats = await orcamentoService.getEstatisticas();

            expect(stats).toEqual({
                emElaboracao: 1,
                enviados: 1,
                aprovados: 2,
                convertidos: 1,
                valorTotalAprovado: 450,
            });
        });
    });
});
