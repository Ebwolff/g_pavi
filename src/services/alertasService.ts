import { supabase } from '../lib/supabase';
import { Database } from '../types/database.types';

type Alerta = Database['public']['Tables']['alertas']['Row'];
type AlertaInsert = Database['public']['Tables']['alertas']['Insert'];
type AlertaUpdate = Database['public']['Tables']['alertas']['Update'];

export const alertasService = {
    /**
     * Buscar todos os alertas do usuário atual
     */
    async getAlertas(usuarioId: string) {
        const { data, error } = await supabase
            .from('alertas')
            .select('*')
            .eq('usuario_id', usuarioId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Alerta[];
    },

    /**
     * Buscar alertas não lidos
     */
    async getAlertasNaoLidos(usuarioId: string) {
        const { data, error } = await supabase
            .from('alertas')
            .select('*')
            .eq('usuario_id', usuarioId)
            .eq('lido', false)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Alerta[];
    },

    /**
     * Contar alertas não lidos
     */
    async contarNaoLidos(usuarioId: string): Promise<number> {
        const { count, error } = await supabase
            .from('alertas')
            .select('*', { count: 'exact', head: true })
            .eq('usuario_id', usuarioId)
            .eq('lido', false);

        if (error) throw error;
        return count || 0;
    },

    /**
     * Marcar alerta como lido
     */
    async marcarComoLido(alertaId: string) {
        const { data, error } = await supabase
            .from('alertas')
            .update({ lido: true })
            .eq('id', alertaId)
            .select()
            .single();

        if (error) throw error;
        return data as Alerta;
    },

    /**
     * Marcar todos como lidos
     */
    async marcarTodosComoLidos(usuarioId: string) {
        const { error } = await supabase
            .from('alertas')
            .update({ lido: true })
            .eq('usuario_id', usuarioId)
            .eq('lido', false);

        if (error) throw error;
    },

    /**
     * Criar novo alerta
     */
    async criarAlerta(alerta: AlertaInsert) {
        const { data, error } = await supabase
            .from('alertas')
            .insert(alerta)
            .select()
            .single();

        if (error) throw error;
        return data as Alerta;
    },

    /**
     * Deletar alerta
     */
    async deletarAlerta(alertaId: string) {
        const { error } = await supabase
            .from('alertas')
            .delete()
            .eq('id', alertaId);

        if (error) throw error;
    },

    /**
     * Gerar alertas automáticos para OS vencidas
     * Chama a função do banco de dados
     */
    async gerarAlertasOSVencidas(): Promise<number> {
        const { data, error } = await supabase.rpc('gerar_alertas_os_vencidas');

        if (error) throw error;
        return data as number;
    },

    /**
     * Buscar alertas por tipo
     */
    async getAlertasPorTipo(usuarioId: string, tipo: string) {
        const { data, error } = await supabase
            .from('alertas')
            .select('*')
            .eq('usuario_id', usuarioId)
            .eq('tipo_alerta', tipo)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Alerta[];
    },

    /**
     * Buscar alertas por prioridade
     */
    async getAlertasPorPrioridade(usuarioId: string, prioridade: string) {
        const { data, error } = await supabase
            .from('alertas')
            .select('*')
            .eq('usuario_id', usuarioId)
            .eq('prioridade', prioridade)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Alerta[];
    },

    /**
     * Limpar alertas antigos (mais de 30 dias)
     */
    async limparAlertasAntigos() {
        const trintaDiasAtras = new Date();
        trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

        const { error } = await supabase
            .from('alertas')
            .delete()
            .lt('created_at', trintaDiasAtras.toISOString())
            .eq('lido', true);

        if (error) throw error;
    },
};
