import { useState, useEffect, useCallback } from 'react'
import { getPendingActionsCount, getLastSyncTime } from '@/lib/offlineDb'

export interface NetworkStatus {
    isOnline: boolean
    pendingActions: number
    lastSyncAt: Date | null
    isSyncing: boolean
}

/**
 * Hook que expõe o status de rede e sincronização
 */
export function useNetworkStatus(): NetworkStatus {
    const [isOnline, setIsOnline] = useState(navigator.onLine)
    const [pendingActions, setPendingActions] = useState(0)
    const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null)
    const [isSyncing, setIsSyncing] = useState(false)

    const refreshStatus = useCallback(async () => {
        try {
            const count = await getPendingActionsCount()
            setPendingActions(count)
            const lastSync = await getLastSyncTime()
            setLastSyncAt(lastSync)
        } catch {
            // IndexedDB pode não estar disponível
        }
    }, [])

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true)
            setIsSyncing(true)
            // Dar tempo pro sync completar
            setTimeout(() => {
                setIsSyncing(false)
                refreshStatus()
            }, 3000)
        }

        const handleOffline = () => {
            setIsOnline(false)
            setIsSyncing(false)
        }

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        // Refresh periódico do status
        const interval = setInterval(refreshStatus, 10000)
        refreshStatus()

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
            clearInterval(interval)
        }
    }, [refreshStatus])

    return { isOnline, pendingActions, lastSyncAt, isSyncing }
}
