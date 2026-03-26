import { logger } from '@/lib/logger';
/**
 * Service para gestão de ferramentas (inventário + alocação)
 */

import { supabase } from '@/lib/supabase';

export type CategoriaFerramenta = 'ELETRICA' | 'MECANICA' | 'HIDRAULICA' | 'MEDICAO' | 'GERAL';
export type EstadoFerramenta = 'NOVO' | 'BOM' | 'DESGASTADO' | 'AVARIADO';
export type TipoMovimentacao = 'RETIRADA' | 'DEVOLUCAO';

export interface Ferramenta {
    id: string;
    nome: string;
    codigo_patrimonio: string | null;
    numero_serie: string | null;
    categoria: CategoriaFerramenta;
    estado: EstadoFerramenta;
    quantidade: number;
    tecnico_id: string | null;
    data_retirada: string | null;
    observacoes: string | null;
    created_at: string;
    updated_at: string;
    tecnico?: {
        id: string;
        nome_completo: string;
    };
}

export interface MovimentacaoFerramenta {
    id: string;
    ferramenta_id: string;
    tecnico_id: string | null;
    tipo: TipoMovimentacao;
    data_movimentacao: string;
    observacoes: string | null;
    registrado_por: string | null;
    created_at: string;
    tecnico?: { nome_completo: string };
    ferramenta?: { nome: string; codigo_patrimonio: string };
}

export interface CreateFerramentaInput {
    nome: string;
    codigo_patrimonio?: string;
    numero_serie?: string;
    categoria?: CategoriaFerramenta;
    estado?: EstadoFerramenta;
    quantidade?: number;
    observacoes?: string;
}

class FerramentaService {
    async getAll(): Promise<Ferramenta[]> {
        const { data, error } = await supabase
            .from('ferramentas' as any)
            .select(`*, tecnico:tecnico_id (id, nome_completo)`)
            .order('nome', { ascending: true });

        if (error) {
            logger.error('Erro ao buscar ferramentas:', error);
            throw error;
        }
        return (data || []) as Ferramenta[];
    }

    async criar(dados: CreateFerramentaInput): Promise<Ferramenta> {
        const { data, error } = await supabase
            .from('ferramentas' as any)
            .insert({
                nome: dados.nome,
                codigo_patrimonio: dados.codigo_patrimonio || null,
                numero_serie: dados.numero_serie || null,
                categoria: dados.categoria || 'GERAL',
                estado: dados.estado || 'BOM',
                quantidade: dados.quantidade || 1,
                observacoes: dados.observacoes || null,
            })
            .select()
            .single();

        if (error) throw error;
        return data as Ferramenta;
    }

    async atualizar(id: string, dados: Partial<CreateFerramentaInput>): Promise<Ferramenta> {
        const { data, error } = await supabase
            .from('ferramentas' as any)
            .update(dados)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Ferramenta;
    }

    async excluir(id: string): Promise<void> {
        const { error } = await supabase
            .from('ferramentas' as any)
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    async retirar(ferramentaId: string, tecnicoId: string, registradoPor?: string, obs?: string): Promise<void> {
        // Atualizar a ferramenta
        const { error: upErr } = await supabase
            .from('ferramentas' as any)
            .update({
                tecnico_id: tecnicoId,
                data_retirada: new Date().toISOString(),
            })
            .eq('id', ferramentaId);

        if (upErr) throw upErr;

        // Registrar movimentação
        const { error: movErr } = await supabase
            .from('movimentacoes_ferramentas' as any)
            .insert({
                ferramenta_id: ferramentaId,
                tecnico_id: tecnicoId,
                tipo: 'RETIRADA',
                data_movimentacao: new Date().toISOString(),
                observacoes: obs || null,
                registrado_por: registradoPor || null,
            });

        if (movErr) logger.error('Erro ao registrar movimentação:', movErr);
    }

    async devolver(ferramentaId: string, registradoPor?: string, obs?: string): Promise<void> {
        // Buscar técnico atual antes de limpar
        const { data: ferramenta } = await supabase
            .from('ferramentas' as any)
            .select('tecnico_id')
            .eq('id', ferramentaId)
            .single();

        // Atualizar a ferramenta
        const { error: upErr } = await supabase
            .from('ferramentas' as any)
            .update({
                tecnico_id: null,
                data_retirada: null,
            })
            .eq('id', ferramentaId);

        if (upErr) throw upErr;

        // Registrar movimentação
        const { error: movErr } = await supabase
            .from('movimentacoes_ferramentas' as any)
            .insert({
                ferramenta_id: ferramentaId,
                tecnico_id: (ferramenta as any)?.tecnico_id || null,
                tipo: 'DEVOLUCAO',
                data_movimentacao: new Date().toISOString(),
                observacoes: obs || null,
                registrado_por: registradoPor || null,
            });

        if (movErr) logger.error('Erro ao registrar movimentação:', movErr);
    }

    async getMovimentacoes(ferramentaId?: string, limit = 20): Promise<MovimentacaoFerramenta[]> {
        let query = supabase
            .from('movimentacoes_ferramentas' as any)
            .select(`
                *,
                tecnico:tecnico_id (nome_completo),
                ferramenta:ferramenta_id (nome, codigo_patrimonio)
            `)
            .order('data_movimentacao', { ascending: false })
            .limit(limit);

        if (ferramentaId) {
            query = query.eq('ferramenta_id', ferramentaId);
        }

        const { data, error } = await query;

        if (error) {
            logger.error('Erro ao buscar movimentações:', error);
            return [];
        }
        return (data || []) as MovimentacaoFerramenta[];
    }

    async getEstatisticas() {
        const ferramentas = await this.getAll();
        return {
            total: ferramentas.length,
            noEstoque: ferramentas.filter(f => !f.tecnico_id).length,
            comTecnico: ferramentas.filter(f => !!f.tecnico_id).length,
            avariadas: ferramentas.filter(f => f.estado === 'AVARIADO').length,
        };
    }
}

export const ferramentaService = new FerramentaService();
