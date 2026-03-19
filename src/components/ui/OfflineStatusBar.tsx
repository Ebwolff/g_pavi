import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { Wifi, WifiOff, RefreshCw, Cloud } from 'lucide-react'
import { flushQueue, pullFreshData } from '@/lib/syncEngine'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'

/**
 * Barra de status de conexão/sincronização
 * Posicionada no topo da interface
 */
export function OfflineStatusBar() {
    const { isOnline, pendingActions, lastSyncAt, isSyncing } = useNetworkStatus()
    const [manualSyncing, setManualSyncing] = useState(false)

    const handleManualSync = async () => {
        if (manualSyncing || !isOnline) return
        setManualSyncing(true)
        try {
            await flushQueue()
            const { data: { user } } = await supabase.auth.getUser()
            await pullFreshData(user?.id)
        } catch {
            // silenciar
        } finally {
            setManualSyncing(false)
        }
    }

    const syncing = isSyncing || manualSyncing

    // Não mostrar quando online e sem pendências
    if (isOnline && pendingActions === 0 && !syncing) {
        return null
    }

    return (
        <div
            className={`flex items-center justify-between px-4 py-2 text-xs font-bold transition-all duration-500 ${
                !isOnline
                    ? 'bg-red-500/15 border-b border-red-500/20 text-red-400'
                    : syncing
                    ? 'bg-amber-500/15 border-b border-amber-500/20 text-amber-400'
                    : 'bg-emerald-500/15 border-b border-emerald-500/20 text-emerald-400'
            }`}
        >
            <div className="flex items-center gap-2">
                {!isOnline ? (
                    <>
                        <WifiOff className="w-3.5 h-3.5" />
                        <span>Modo Offline</span>
                        {pendingActions > 0 && (
                            <span className="px-1.5 py-0.5 bg-red-500/20 rounded-md text-[10px]">
                                {pendingActions} {pendingActions === 1 ? 'ação pendente' : 'ações pendentes'}
                            </span>
                        )}
                    </>
                ) : syncing ? (
                    <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sincronizando dados...</span>
                    </>
                ) : (
                    <>
                        <Cloud className="w-3.5 h-3.5" />
                        <span>
                            {pendingActions} {pendingActions === 1 ? 'ação pendente' : 'ações pendentes'}
                        </span>
                    </>
                )}
            </div>

            <div className="flex items-center gap-3">
                {lastSyncAt && isOnline && (
                    <span className="text-[10px] opacity-60 hidden sm:block">
                        Último sync: {formatRelativeTime(lastSyncAt)}
                    </span>
                )}

                {isOnline && pendingActions > 0 && !syncing && (
                    <button
                        onClick={handleManualSync}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <RefreshCw className="w-3 h-3" />
                        Sincronizar
                    </button>
                )}

                {isOnline && (
                    <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                )}
            </div>
        </div>
    )
}

function formatRelativeTime(date: Date): string {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)

    if (diffMin < 1) return 'agora'
    if (diffMin < 60) return `${diffMin}min atrás`

    const diffHours = Math.floor(diffMin / 60)
    if (diffHours < 24) return `${diffHours}h atrás`

    return date.toLocaleDateString('pt-BR')
}
