import { logger } from '@/lib/logger'
import { supabase } from '@/lib/supabase'
import { offlineDb, setLastSyncTime, type SyncAction, type OfflineOS } from '@/lib/offlineDb'

let syncInProgress = false
let autoSyncInterval: ReturnType<typeof setInterval> | null = null

/**
 * Processa a fila de mutations pendentes (outbox pattern)
 * Cada ação é executada contra o Supabase e removida da fila se sucesso
 */
export async function flushQueue(): Promise<{ success: number; failed: number }> {
    if (syncInProgress) return { success: 0, failed: 0 }
    syncInProgress = true

    let success = 0
    let failed = 0

    try {
        const pendingActions = await offlineDb.syncQueue
            .orderBy('timestamp')
            .toArray()

        for (const action of pendingActions) {
            try {
                await executeSyncAction(action)
                await offlineDb.syncQueue.delete(action.id!)
                success++
            } catch (err) {
                failed++
                logger.error(`[Sync] Falha na ação ${action.action} em ${action.table}:`, err)

                // Incrementar retries e salvar erro
                await offlineDb.syncQueue.update(action.id!, {
                    retries: (action.retries || 0) + 1,
                    lastError: err instanceof Error ? err.message : 'Erro desconhecido',
                })

                // Após 5 tentativas, desistir
                if ((action.retries || 0) >= 5) {
                    logger.error(`[Sync] Ação descartada após 5 tentativas:`, action)
                    await offlineDb.syncQueue.delete(action.id!)
                }
            }
        }
    } finally {
        syncInProgress = false
    }

    if (success > 0) {
        logger.log(`[Sync] Flush concluído: ${success} OK, ${failed} falhas`)
    }

    return { success, failed }
}

/**
 * Executa uma ação individual contra o Supabase
 */
async function executeSyncAction(action: SyncAction): Promise<void> {
    const { table, action: tipo, recordId, payload } = action

    switch (tipo) {
        case 'create': {
            // payload vem da fila offline como um blob genérico (pode ser de qualquer tabela);
            // `never` deixa o `table` (o que realmente importa aqui) checado contra o schema real.
            const { error } = await supabase
                .from(table)
                .insert(payload as never)
            if (error) throw error
            break
        }
        case 'update': {
            const { error } = await supabase
                .from(table)
                .update(payload as never)
                .eq('id', recordId)
            if (error) throw error
            break
        }
        case 'delete': {
            const { error } = await supabase
                .from(table)
                .delete()
                .eq('id', recordId)
            if (error) throw error
            break
        }
    }
}

/**
 * Puxa dados frescos das OS do Supabase e atualiza o IndexedDB
 */
export async function pullFreshData(userId?: string): Promise<void> {
    try {
        let query = supabase
            .from('ordens_servico')
            .select(`
                *,
                tecnico:tecnicos(nome_completo),
                consultor:profiles(first_name, last_name)
            `)
            .not('status_atual', 'in', '("FATURADA","CANCELADA")')
            .order('data_abertura', { ascending: false })
            .limit(50)

        // Se tiver userId, filtrar por técnico ou consultor
        if (userId) {
            query = query.or(`tecnico_id.eq.${userId},consultor_id.eq.${userId}`)
        }

        const { data, error } = await query

        if (error) {
            logger.error('[Sync] Erro ao puxar dados:', error)
            return
        }

        if (!data || data.length === 0) return

        // Mapear para o formato offline
        const offlineRecords: OfflineOS[] = data.map((os) => ({
            id: os.id,
            numero_os: os.numero_os,
            tipo_os: os.tipo_os,
            status_atual: os.status_atual,
            data_abertura: os.data_abertura,
            data_fechamento: os.data_fechamento,
            data_faturamento: os.data_faturamento,
            tecnico_id: os.tecnico_id,
            cliente_id: os.cliente_id,
            consultor_id: os.consultor_id,
            nome_cliente_digitavel: os.nome_cliente_digitavel,
            modelo_maquina: os.modelo_maquina,
            chassi: os.chassi,
            descricao_problema: os.descricao_problema,
            solucao_aplicada: os.solucao_aplicada,
            observacoes: os.observacoes,
            valor_mao_de_obra: os.valor_mao_de_obra,
            valor_pecas: os.valor_pecas,
            valor_deslocamento: os.valor_deslocamento,
            valor_liquido_total: os.valor_liquido_total,
            nivel_urgencia: os.nivel_urgencia,
            updated_at: os.updated_at,
            tecnico_nome: os.tecnico?.nome_completo || null,
            consultor_nome: os.consultor
                ? `${os.consultor.first_name || ''} ${os.consultor.last_name || ''}`.trim()
                : null,
            _raw: os,
        }))

        // Bulk upsert no IndexedDB
        await offlineDb.ordensServico.bulkPut(offlineRecords)
        await setLastSyncTime(new Date())

        logger.log(`[Sync] ${offlineRecords.length} OS sincronizadas para offline`)
    } catch (err) {
        logger.error('[Sync] Erro no pullFreshData:', err)
    }
}

/**
 * Enfileira uma mutation para sync posterior
 */
export async function enqueueAction(
    table: SyncAction['table'],
    action: 'create' | 'update' | 'delete',
    recordId: string,
    payload: Record<string, unknown>
): Promise<void> {
    await offlineDb.syncQueue.add({
        table,
        action,
        recordId,
        payload,
        timestamp: new Date().toISOString(),
        retries: 0,
        lastError: null,
    })

    logger.log(`[Sync] Ação enfileirada: ${action} em ${table} (${recordId})`)

    // Se online, tentar flush imediato
    if (navigator.onLine) {
        setTimeout(() => flushQueue(), 500)
    }
}

/**
 * Inicia o auto-sync:
 * - Flush + pull quando volta online
 * - Periodic pull a cada 5 min quando online
 */
export function startAutoSync(userId?: string): void {
    // Listener de reconexão
    const handleOnline = async () => {
        logger.log('[Sync] Reconectado! Iniciando sync...')
        await flushQueue()
        await pullFreshData(userId)
    }

    window.addEventListener('online', handleOnline)

    // Pull inicial ao iniciar
    if (navigator.onLine) {
        pullFreshData(userId)
    }

    // Sync periódico a cada 5 minutos
    autoSyncInterval = setInterval(async () => {
        if (navigator.onLine) {
            await flushQueue()
            await pullFreshData(userId)
        }
    }, 5 * 60 * 1000)

    logger.log('[Sync] Auto-sync iniciado')
}

/**
 * Para o auto-sync (chamado no logout)
 */
export function stopAutoSync(): void {
    if (autoSyncInterval) {
        clearInterval(autoSyncInterval)
        autoSyncInterval = null
    }
    window.removeEventListener('online', () => { })
    logger.log('[Sync] Auto-sync parado')
}
