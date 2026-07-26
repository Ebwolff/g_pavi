import { useState, useEffect, useCallback } from 'react'
import { offlineDb, type OfflineOS } from '@/lib/offlineDb'
import { enqueueAction, pullFreshData, flushQueue } from '@/lib/syncEngine'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

interface UseOfflineOSReturn {
    ordens: OfflineOS[]
    isLoading: boolean
    updateOS: (id: string, updates: Partial<OfflineOS>) => Promise<void>
    refresh: () => Promise<void>
}

/**
 * Hook que abstrai leitura/escrita de OS com suporte offline
 * - Online: busca do Supabase e atualiza IndexedDB
 * - Offline: lê do IndexedDB e enfileira mutations
 */
export function useOfflineOS(filters?: {
    tecnicoId?: string
    consultorId?: string
    statusExclude?: string[]
}): UseOfflineOSReturn {
    const [ordens, setOrdens] = useState<OfflineOS[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const loadFromIndexedDB = useCallback(async () => {
        try {
            let query = offlineDb.ordensServico.toCollection()

            const results = await query.reverse().sortBy('data_abertura')

            // Filtrar no client-side (IndexedDB não suporta queries complexas)
            let filtered = results
            if (filters?.tecnicoId) {
                filtered = filtered.filter(os => os.tecnico_id === filters.tecnicoId)
            }
            if (filters?.consultorId) {
                filtered = filtered.filter(os => os.consultor_id === filters.consultorId)
            }
            if (filters?.statusExclude) {
                filtered = filtered.filter(os => !filters.statusExclude!.includes(os.status_atual))
            }

            setOrdens(filtered)
        } catch (err) {
            logger.error('[OfflineOS] Erro ao ler IndexedDB:', err)
        }
    }, [filters?.tecnicoId, filters?.consultorId, filters?.statusExclude])

    const fetchFromSupabase = useCallback(async () => {
        try {
            // Pull fresh do Supabase e salvar no IndexedDB
            const { data: user } = await supabase.auth.getUser()
            await pullFreshData(user.user?.id)
            // Recarregar do IndexedDB após pull
            await loadFromIndexedDB()
        } catch (err) {
            logger.error('[OfflineOS] Erro ao buscar do Supabase:', err)
        }
    }, [loadFromIndexedDB])

    const refresh = useCallback(async () => {
        setIsLoading(true)
        try {
            if (navigator.onLine) {
                // Online: flush pending + pull fresh + load from IDB
                await flushQueue()
                await fetchFromSupabase()
            } else {
                // Offline: load from IndexedDB only
                await loadFromIndexedDB()
            }
        } finally {
            setIsLoading(false)
        }
    }, [fetchFromSupabase, loadFromIndexedDB])

    // Carga inicial
    useEffect(() => {
        refresh()
    }, [refresh])

    // Reagir a mudanças de conectividade
    useEffect(() => {
        const handleOnline = () => {
            logger.log('[OfflineOS] Online detectado, sincronizando...')
            refresh()
        }

        window.addEventListener('online', handleOnline)
        return () => window.removeEventListener('online', handleOnline)
    }, [refresh])

    const updateOS = useCallback(async (id: string, updates: Partial<OfflineOS>) => {
        // Atualizar localmente no IndexedDB imediatamente
        const existing = await offlineDb.ordensServico.get(id)
        if (existing) {
            const updatedRecord = {
                ...existing,
                ...updates,
                updated_at: new Date().toISOString(),
            }
            await offlineDb.ordensServico.put(updatedRecord)
        }

        if (navigator.onLine) {
            // Online: atualizar direto no Supabase
            try {
                const { _raw, tecnico_nome, consultor_nome, ...cleanUpdates } = updates
                // OfflineOS usa tipos frouxos (string) para enums vindos do cache local;
                // `never` deixa a chamada em si (tabela/coluna) checada normalmente.
                const { error } = await supabase
                    .from('ordens_servico')
                    .update(cleanUpdates as never)
                    .eq('id', id)

                if (error) throw error
            } catch (err) {
                logger.error('[OfflineOS] Erro ao atualizar online, enfileirando:', err)
                // Fallback: enfileirar para sync posterior
                const { _raw, tecnico_nome, consultor_nome, ...cleanUpdates } = updates
                await enqueueAction('ordens_servico', 'update', id, cleanUpdates)
            }
        } else {
            // Offline: enfileirar ação para sync posterior
            const { _raw, tecnico_nome, consultor_nome, ...cleanUpdates } = updates
            await enqueueAction('ordens_servico', 'update', id, cleanUpdates)
        }

        // Recarregar lista local
        await loadFromIndexedDB()
    }, [loadFromIndexedDB])

    return { ordens, isLoading, updateOS, refresh }
}
