/**
 * Service para gerenciar despesas de OS (km e despesas de viagem)
 */

import { supabase } from '@/lib/supabase';

export type TipoDespesa = 'KM' | 'ABASTECIMENTO' | 'ALIMENTACAO' | 'HOSPEDAGEM' | 'PEDAGIO' | 'OUTROS';

export interface DespesaOS {
    id: string;
    ordem_servico_id: string;
    tipo: TipoDespesa;
    descricao: string | null;
    quantidade: number | null;
    valor_unitario: number | null;
    valor_total: number;
    data_despesa: string;
    comprovante_url: string | null;
    responsavel_id: string | null;
    km_inicial: number | null;
    km_final: number | null;
    created_at: string;
    updated_at: string;
    // Join com profiles
    responsavel?: {
        first_name: string | null;
        last_name: string | null;
    };
}

export interface CreateDespesaInput {
    ordem_servico_id: string;
    tipo: TipoDespesa;
    descricao?: string;
    quantidade?: number;
    valor_unitario?: number;
    valor_total: number;
    data_despesa?: string;
    comprovante_url?: string;
    responsavel_id?: string;
    km_inicial?: number;
    km_final?: number;
}

export interface UpdateDespesaInput {
    tipo?: TipoDespesa;
    descricao?: string;
    quantidade?: number;
    valor_unitario?: number;
    valor_total?: number;
    data_despesa?: string;
    comprovante_url?: string;
    km_inicial?: number;
    km_final?: number;
}

export interface ResumosDespesas {
    totalKm: number;
    totalAbastecimento: number;
    totalAlimentacao: number;
    totalHospedagem: number;
    totalPedagio: number;
    totalOutros: number;
    totalGeral: number;
}

class DespesasService {
    /**
     * Busca todas as despesas de uma OS
     */
    async getDespesasPorOS(ordemServicoId: string): Promise<DespesaOS[]> {
        const { data, error } = await supabase
            .from('despesas_os' as any)
            .select(`
                *,
                responsavel:responsavel_id (first_name, last_name)
            `)
            .eq('ordem_servico_id', ordemServicoId)
            .order('data_despesa', { ascending: false });

        if (error) {
            console.error('Erro ao buscar despesas:', error);
            throw error;
        }

        return (data || []) as DespesaOS[];
    }

    /**
     * Cria uma nova despesa
     */
    async criarDespesa(dados: CreateDespesaInput): Promise<DespesaOS> {
        const { data, error } = await supabase
            .from('despesas_os' as any)
            .insert({
                ordem_servico_id: dados.ordem_servico_id,
                tipo: dados.tipo,
                descricao: dados.descricao || null,
                quantidade: dados.quantidade || null,
                valor_unitario: dados.valor_unitario || null,
                valor_total: dados.valor_total,
                data_despesa: dados.data_despesa || new Date().toISOString().split('T')[0],
                comprovante_url: dados.comprovante_url || null,
                responsavel_id: dados.responsavel_id || null,
                km_inicial: dados.km_inicial || null,
                km_final: dados.km_final || null,
            })
            .select()
            .single();

        if (error) {
            console.error('Erro ao criar despesa:', error);
            throw error;
        }

        return data as DespesaOS;
    }

    /**
     * Atualiza uma despesa existente
     */
    async atualizarDespesa(id: string, dados: UpdateDespesaInput): Promise<DespesaOS> {
        const { data, error } = await supabase
            .from('despesas_os' as any)
            .update(dados)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Erro ao atualizar despesa:', error);
            throw error;
        }

        return data as DespesaOS;
    }

    /**
     * Exclui uma despesa
     */
    async excluirDespesa(id: string): Promise<void> {
        const { error } = await supabase
            .from('despesas_os' as any)
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Erro ao excluir despesa:', error);
            throw error;
        }
    }

    /**
     * Calcula o resumo de despesas de uma OS
     */
    async getResumoDespesas(ordemServicoId: string): Promise<ResumosDespesas> {
        const despesas = await this.getDespesasPorOS(ordemServicoId);

        const resumo: ResumosDespesas = {
            totalKm: 0,
            totalAbastecimento: 0,
            totalAlimentacao: 0,
            totalHospedagem: 0,
            totalPedagio: 0,
            totalOutros: 0,
            totalGeral: 0,
        };

        despesas.forEach((d) => {
            const valor = d.valor_total || 0;
            resumo.totalGeral += valor;

            switch (d.tipo) {
                case 'KM':
                    resumo.totalKm += valor;
                    break;
                case 'ABASTECIMENTO':
                    resumo.totalAbastecimento += valor;
                    break;
                case 'ALIMENTACAO':
                    resumo.totalAlimentacao += valor;
                    break;
                case 'HOSPEDAGEM':
                    resumo.totalHospedagem += valor;
                    break;
                case 'PEDAGIO':
                    resumo.totalPedagio += valor;
                    break;
                case 'OUTROS':
                    resumo.totalOutros += valor;
                    break;
            }
        });

        return resumo;
    }

    /**
     * Calcula km total rodados em uma OS
     */
    async getTotalKmRodados(ordemServicoId: string): Promise<number> {
        const despesas = await this.getDespesasPorOS(ordemServicoId);

        return despesas
            .filter(d => d.tipo === 'KM')
            .reduce((total, d) => total + (d.quantidade || 0), 0);
    }
}

export const despesasService = new DespesasService();
