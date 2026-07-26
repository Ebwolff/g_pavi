import Dexie, { type EntityTable } from 'dexie'
import type { Database } from '@/types/database.types'

// Tipos para o banco offline
export interface OfflineOS {
    id: string
    numero_os: string
    tipo_os: string
    status_atual: string
    data_abertura: string
    data_fechamento: string | null
    data_faturamento: string | null
    tecnico_id: string | null
    cliente_id: string | null
    consultor_id: string | null
    nome_cliente_digitavel: string | null
    modelo_maquina: string | null
    chassi: string | null
    descricao_problema: string | null
    solucao_aplicada: string | null
    observacoes: string | null
    valor_mao_de_obra: number
    valor_pecas: number
    valor_deslocamento: number
    valor_liquido_total: number
    nivel_urgencia: string
    updated_at: string
    // Relações flatten (cacheadas)
    tecnico_nome?: string | null
    consultor_nome?: string | null
    // Raw data do Supabase para rehydration
    _raw?: Record<string, unknown>
}

export interface SyncAction {
    id?: number
    table: keyof Database['public']['Tables']
    action: 'create' | 'update' | 'delete'
    recordId: string
    payload: Record<string, unknown>
    timestamp: string
    retries: number
    lastError: string | null
}

export interface CachedFile {
    id?: number
    key: string
    blob: Blob
    mimeType: string
    osId: string | null
    createdAt: string
}

export interface SyncMeta {
    key: string
    value: string
}

class OfflineDatabase extends Dexie {
    ordensServico!: EntityTable<OfflineOS, 'id'>
    syncQueue!: EntityTable<SyncAction, 'id'>
    cachedFiles!: EntityTable<CachedFile, 'id'>
    syncMeta!: EntityTable<SyncMeta, 'key'>

    constructor() {
        super('visao360-offline')

        this.version(1).stores({
            ordensServico: 'id, numero_os, status_atual, tecnico_id, consultor_id, updated_at',
            syncQueue: '++id, table, action, recordId, timestamp',
            cachedFiles: '++id, key, osId, createdAt',
            syncMeta: 'key',
        })
    }
}

export const offlineDb = new OfflineDatabase()

// Helpers
export async function getLastSyncTime(): Promise<Date | null> {
    const meta = await offlineDb.syncMeta.get('lastSyncAt')
    return meta ? new Date(meta.value) : null
}

export async function setLastSyncTime(date: Date): Promise<void> {
    await offlineDb.syncMeta.put({ key: 'lastSyncAt', value: date.toISOString() })
}

export async function getPendingActionsCount(): Promise<number> {
    return offlineDb.syncQueue.count()
}

export async function clearAllOfflineData(): Promise<void> {
    await offlineDb.ordensServico.clear()
    await offlineDb.syncQueue.clear()
    await offlineDb.cachedFiles.clear()
    await offlineDb.syncMeta.clear()
}
