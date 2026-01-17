/**
 * Service para gerenciamento de frota de veículos
 */

import { supabase } from '@/lib/supabase';

export type StatusVeiculo = 'DISPONIVEL' | 'EM_USO' | 'MANUTENCAO' | 'INATIVO';

export interface Veiculo {
    id: string;
    placa: string;
    modelo: string;
    marca: string | null;
    ano: number | null;
    cor: string | null;
    km_atual: number;
    status: StatusVeiculo;
    tecnico_id: string | null;
    data_alocacao: string | null;
    observacoes: string | null;
    created_at: string;
    updated_at: string;
    // Join com tecnicos
    tecnico?: {
        id: string;
        nome_completo: string;
    };
}

export interface CreateVeiculoInput {
    placa: string;
    modelo: string;
    marca?: string;
    ano?: number;
    cor?: string;
    km_atual?: number;
    observacoes?: string;
}

export interface UpdateVeiculoInput {
    placa?: string;
    modelo?: string;
    marca?: string;
    ano?: number;
    cor?: string;
    km_atual?: number;
    status?: StatusVeiculo;
    observacoes?: string;
}

export interface HistoricoAlocacao {
    id: string;
    veiculo_id: string;
    tecnico_id: string | null;
    data_inicio: string;
    data_fim: string | null;
    km_inicio: number | null;
    km_fim: number | null;
    motivo: string | null;
    alocado_por: string | null;
    created_at: string;
    tecnico?: {
        nome_completo: string;
    };
    veiculo?: {
        placa: string;
        modelo: string;
    };
}

class FrotaService {
    /**
     * Busca todos os veículos
     */
    async getVeiculos(): Promise<Veiculo[]> {
        const { data, error } = await supabase
            .from('veiculos' as any)
            .select(`
                *,
                tecnico:tecnico_id (id, nome_completo)
            `)
            .order('placa', { ascending: true });

        if (error) {
            console.error('Erro ao buscar veículos:', error);
            throw error;
        }

        return (data || []) as Veiculo[];
    }

    /**
     * Busca veículo por ID
     */
    async getVeiculoById(id: string): Promise<Veiculo | null> {
        const { data, error } = await supabase
            .from('veiculos' as any)
            .select(`
                *,
                tecnico:tecnico_id (id, nome_completo)
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Erro ao buscar veículo:', error);
            return null;
        }

        return data as Veiculo;
    }

    /**
     * Busca veículo alocado a um técnico
     */
    async getVeiculoDoTecnico(tecnicoId: string): Promise<Veiculo | null> {
        const { data, error } = await supabase
            .from('veiculos' as any)
            .select('*')
            .eq('tecnico_id', tecnicoId)
            .eq('status', 'EM_USO')
            .single();

        if (error) {
            // Não é erro se não encontrar
            return null;
        }

        return data as Veiculo;
    }

    /**
     * Cria um novo veículo
     */
    async criarVeiculo(dados: CreateVeiculoInput): Promise<Veiculo> {
        const { data, error } = await supabase
            .from('veiculos' as any)
            .insert({
                placa: dados.placa.toUpperCase().replace(/[^A-Z0-9]/g, ''),
                modelo: dados.modelo,
                marca: dados.marca || null,
                ano: dados.ano || null,
                cor: dados.cor || null,
                km_atual: dados.km_atual || 0,
                status: 'DISPONIVEL',
                observacoes: dados.observacoes || null,
            })
            .select()
            .single();

        if (error) {
            console.error('Erro ao criar veículo:', error);
            throw error;
        }

        return data as Veiculo;
    }

    /**
     * Atualiza um veículo
     */
    async atualizarVeiculo(id: string, dados: UpdateVeiculoInput): Promise<Veiculo> {
        const updateData: any = { ...dados };
        if (dados.placa) {
            updateData.placa = dados.placa.toUpperCase().replace(/[^A-Z0-9]/g, '');
        }

        const { data, error } = await supabase
            .from('veiculos' as any)
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Erro ao atualizar veículo:', error);
            throw error;
        }

        return data as Veiculo;
    }

    /**
     * Aloca veículo a um técnico
     */
    async alocarVeiculo(veiculoId: string, tecnicoId: string, alocadoPor?: string): Promise<void> {
        // Buscar km atual do veículo
        const veiculo = await this.getVeiculoById(veiculoId);
        if (!veiculo) throw new Error('Veículo não encontrado');

        // Atualizar veículo
        const { error: updateError } = await supabase
            .from('veiculos' as any)
            .update({
                tecnico_id: tecnicoId,
                status: 'EM_USO',
                data_alocacao: new Date().toISOString(),
            })
            .eq('id', veiculoId);

        if (updateError) throw updateError;

        // Registrar histórico
        const { error: histError } = await supabase
            .from('historico_alocacao_veiculos' as any)
            .insert({
                veiculo_id: veiculoId,
                tecnico_id: tecnicoId,
                data_inicio: new Date().toISOString(),
                km_inicio: veiculo.km_atual,
                alocado_por: alocadoPor || null,
            });

        if (histError) {
            console.error('Erro ao registrar histórico:', histError);
            // Não lança erro para não impedir a alocação
        }
    }

    /**
     * Desaloca veículo (libera)
     */
    async desalocarVeiculo(veiculoId: string, motivo?: string): Promise<void> {
        // Buscar veículo e km atual
        const veiculo = await this.getVeiculoById(veiculoId);
        if (!veiculo) throw new Error('Veículo não encontrado');

        // Fechar histórico de alocação atual
        const { error: histError } = await supabase
            .from('historico_alocacao_veiculos' as any)
            .update({
                data_fim: new Date().toISOString(),
                km_fim: veiculo.km_atual,
                motivo: motivo || null,
            })
            .eq('veiculo_id', veiculoId)
            .is('data_fim', null);

        if (histError) console.error('Erro ao fechar histórico:', histError);

        // Atualizar veículo
        const { error: updateError } = await supabase
            .from('veiculos' as any)
            .update({
                tecnico_id: null,
                status: 'DISPONIVEL',
                data_alocacao: null,
            })
            .eq('id', veiculoId);

        if (updateError) throw updateError;
    }

    /**
     * Atualiza km do veículo
     */
    async atualizarKm(veiculoId: string, kmAtual: number): Promise<void> {
        const { error } = await supabase
            .from('veiculos' as any)
            .update({ km_atual: kmAtual })
            .eq('id', veiculoId);

        if (error) throw error;
    }

    /**
     * Busca histórico de alocações de um veículo
     */
    async getHistoricoVeiculo(veiculoId: string): Promise<HistoricoAlocacao[]> {
        const { data, error } = await supabase
            .from('historico_alocacao_veiculos' as any)
            .select(`
                *,
                tecnico:tecnico_id (nome_completo)
            `)
            .eq('veiculo_id', veiculoId)
            .order('data_inicio', { ascending: false });

        if (error) {
            console.error('Erro ao buscar histórico:', error);
            throw error;
        }

        return (data || []) as HistoricoAlocacao[];
    }

    /**
     * Exclui um veículo
     */
    async excluirVeiculo(id: string): Promise<void> {
        const { error } = await supabase
            .from('veiculos' as any)
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    /**
     * Busca estatísticas da frota
     */
    async getEstatisticas(): Promise<{
        total: number;
        disponiveis: number;
        emUso: number;
        manutencao: number;
        inativos: number;
    }> {
        const veiculos = await this.getVeiculos();

        return {
            total: veiculos.length,
            disponiveis: veiculos.filter(v => v.status === 'DISPONIVEL').length,
            emUso: veiculos.filter(v => v.status === 'EM_USO').length,
            manutencao: veiculos.filter(v => v.status === 'MANUTENCAO').length,
            inativos: veiculos.filter(v => v.status === 'INATIVO').length,
        };
    }
}

export const frotaService = new FrotaService();
