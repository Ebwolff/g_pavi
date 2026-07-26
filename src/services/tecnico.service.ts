import { supabase } from '@/lib/supabase';
import { StatusDisponibilidadeTecnico } from '@/types/database.types';


export interface Tecnico {
    id: string; // ID da tabela tecnicos ou profiles (fallback)
    nome: string;
    userId?: string | null; // ID do usuário no Auth/Profiles
    isRegistered: boolean; // Se está na tabela tecnicos
    status_disponibilidade: StatusDisponibilidadeTecnico;
    stats?: {
        osAtribuidas: number;
        osEmExecucao: number;
        osConcluidas: number;
    }
}

class TecnicoService {
    /**
     * Lista todos os técnicos (combinando tabela tecnicos e profiles com role TECNICO)
     * Opcionalmente carrega estatísticas
     */
    async getAll(includeStats = false): Promise<Tecnico[]> {
        // 1. Buscar técnicos da tabela dedicada
        const { data: tecnicosData, error: tecnicosError } = await supabase
            .from('tecnicos')
            .select('id, nome_completo, user_id, status_disponibilidade');

        if (tecnicosError) throw tecnicosError;

        // 2. Buscar profiles com role TECNICO (para compatibilidade/fallback)
        const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .eq('role', 'TECNICO');

        if (profilesError) throw profilesError;

        const tecnicosMap = new Map<string, Tecnico>();

        // Adicionar da tabela tecnicos
        (tecnicosData || []).forEach((t) => {
            tecnicosMap.set(t.id, {
                id: t.id,
                nome: t.nome_completo || 'Técnico sem nome',
                userId: t.user_id,
                status_disponibilidade: t.status_disponibilidade || 'DISPONIVEL',
                isRegistered: true
            });
        });

        // Adicionar do profiles (se não existir na tabela tecnicos)
        (profilesData || []).forEach((p) => {
            // Verificar se já existe um técnico com este user_id
            const existing = Array.from(tecnicosMap.values()).find(t => t.userId === p.id);
            if (!existing) {
                tecnicosMap.set(p.id, {
                    id: p.id, // Usa profile.id como ID temporário
                    nome: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Usuário Técnico',
                    userId: p.id,
                    status_disponibilidade: 'DISPONIVEL', // Fallback
                    isRegistered: false
                });
            }
        });

        const tecnicos = Array.from(tecnicosMap.values());

        if (includeStats) {
            return await this.loadStats(tecnicos);
        }

        return tecnicos;
    }

    /**
     * Carrega estatísticas para uma lista de técnicos
     */
    private async loadStats(tecnicos: Tecnico[]): Promise<Tecnico[]> {
        const { data: osData } = await supabase
            .from('ordens_servico')
            .select('tecnico_id, status_atual')
            .not('status_atual', 'in', '(FATURADA,CANCELADA)');

        const osList = osData || [];

        return tecnicos.map(t => {
            const osDoTecnico = osList.filter((os) => os.tecnico_id === t.id);
            return {
                ...t,
                stats: {
                    osAtribuidas: osDoTecnico.length,
                    osEmExecucao: osDoTecnico.filter((os) => os.status_atual === 'EM_EXECUCAO').length,
                    osConcluidas: osDoTecnico.filter((os) => os.status_atual === 'CONCLUIDA').length
                }
            };
        });
    }

    /**
     * Busca um técnico pelo ID do Usuário (Auth)
     */
    async getByUserId(userId: string): Promise<Tecnico | null> {
        // 1. Tenta buscar na tabela tecnicos
        const { data: tecnico } = await supabase
            .from('tecnicos')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (tecnico) {
            return {
                id: tecnico.id,
                nome: tecnico.nome_completo,
                userId: tecnico.user_id,
                status_disponibilidade: tecnico.status_disponibilidade || 'DISPONIVEL',
                isRegistered: true
            };
        }

        // 2. Fallback: Busca no profiles se não estiver na tabela de técnicos
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, role')
            .eq('id', userId)
            .eq('role', 'TECNICO')
            .single();

        if (profile) {
            return {
                id: profile.id,
                nome: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Técnico(a)',
                userId: profile.id,
                status_disponibilidade: 'DISPONIVEL',
                isRegistered: false
            };
        }

        return null;
    }

    /**
     * Atualiza a disponibilidade do técnico
     */
    async setAvailability(tecnicoId: string, status: StatusDisponibilidadeTecnico) {
        const { error } = await supabase
            .from('tecnicos')
            .update({ status_disponibilidade: status })
            .eq('id', tecnicoId);

        if (error) throw error;
    }

    /**
     * Cria um novo registro de técnico a partir de um profile
     */
    async createFromProfile(profileId: string): Promise<Tecnico> {
        const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', profileId)
            .single();

        if (!profile) throw new Error('Perfil não encontrado');

        const { data: novoTecnico, error } = await supabase
            .from('tecnicos')
            .insert({
                user_id: profileId,
                nome_completo: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
                status_disponibilidade: 'DISPONIVEL'
            })
            .select()
            .single();

        if (error) throw error;

        return {
            id: novoTecnico.id,
            nome: novoTecnico.nome_completo,
            userId: novoTecnico.user_id,
            status_disponibilidade: novoTecnico.status_disponibilidade,
            isRegistered: true
        };
    }
}

export const tecnicoService = new TecnicoService();
