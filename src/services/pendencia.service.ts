import { supabase } from '../lib/supabase';
import { Database, StatusPendencia } from '../types/database.types';

export type Pendencia = Database['public']['Tables']['pendencias_os']['Row'];
export type { StatusPendencia };

export interface PendenciaComOS extends Pendencia {
    ordens_servico?: {
        numero_os: string;
        nome_cliente_digitavel: string | null;
    } | null;
}

export interface PendenciaFilters {
    tipo?: string;
    status?: string;
    search?: string;
}

export const pendenciaService = {
    async list(filters?: PendenciaFilters): Promise<PendenciaComOS[]> {
        let query = supabase
            .from('pendencias_os')
            .select(`
        *,
        ordens_servico (
          numero_os,
          nome_cliente_digitavel
        )
      `)
            .order('data_inicio', { ascending: false });

        if (filters?.tipo && filters.tipo !== 'TODOS') {
            query = query.eq('tipo_pendencia', filters.tipo);
        }

        if (filters?.status && filters.status !== 'TODOS') {
            query = query.eq('status', filters.status);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Transformar dados para garantir que ordens_servico seja objeto único (Supabase joins return arrays sometimes depending on config)
        return (data || []).map((p: any) => ({
            ...p,
            ordens_servico: Array.isArray(p.ordens_servico) ? p.ordens_servico[0] : p.ordens_servico
        }));
    },

    async getById(id: string): Promise<PendenciaComOS> {
        const { data, error } = await supabase
            .from('pendencias_os')
            .select(`
        *,
        ordens_servico (
          numero_os,
          nome_cliente_digitavel
        )
      `)
            .eq('id', id)
            .single();

        if (error) throw error;

        const p = data as any;
        return {
            ...p,
            ordens_servico: Array.isArray(p.ordens_servico) ? p.ordens_servico[0] : p.ordens_servico
        };
    },

    async create(data: Omit<Database['public']['Tables']['pendencias_os']['Insert'], 'id' | 'created_at'>) {
        const { data: result, error } = await supabase
            .from('pendencias_os')
            .insert(data)
            .select()
            .single();

        if (error) throw error;
        return result;
    },

    async update(id: string, data: Database['public']['Tables']['pendencias_os']['Update']) {
        const { data: result, error } = await supabase
            .from('pendencias_os')
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return result;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('pendencias_os')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
