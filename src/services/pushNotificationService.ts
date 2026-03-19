import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';

let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;
let currentUserId: string | null = null;

/**
 * Request browser notification permission.
 * Returns true if granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
        logger.warn('[Push] Browser does not support notifications');
        return false;
    }

    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;

    const result = await Notification.requestPermission();
    return result === 'granted';
}

/**
 * Show a native browser notification.
 */
function showNotification(title: string, body: string, osId?: string) {
    // Check if notifications are enabled in settings
    const enabled = localStorage.getItem('notifications_enabled') !== 'false';
    if (!enabled) return;

    if (Notification.permission !== 'granted') return;

    const notification = new Notification(title, {
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: osId || 'visao360',
        silent: false,
    });

    // Play notification sound if enabled
    try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {/* ignore if no audio file */});
    } catch {
        // No audio file, skip silently
    }

    // Navigate to OS on click
    notification.onclick = () => {
        window.focus();
        if (osId) {
            window.location.href = `/editar-os/${osId}`;
        }
        notification.close();
    };

    // Auto-close after 8 seconds
    setTimeout(() => notification.close(), 8000);
}

/**
 * Start the Supabase Realtime listener for new alerts targeting the current user.
 * When a new alert is inserted, it shows a native notification.
 */
export function startPushListener(userId: string) {
    if (realtimeChannel && currentUserId === userId) return; // Already listening

    stopPushListener(); // Clean up any previous channel

    currentUserId = userId;

    logger.log('[Push] Starting realtime listener for user:', userId);

    realtimeChannel = supabase
        .channel(`alertas-push-${userId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'alertas',
                filter: `usuario_id=eq.${userId}`,
            },
            (payload) => {
                const alerta = payload.new as any;
                logger.log('[Push] New alert received:', alerta.titulo);

                showNotification(
                    alerta.titulo || 'Nova Notificação',
                    alerta.mensagem || '',
                    alerta.os_id
                );
            }
        )
        .subscribe((status) => {
            logger.log('[Push] Realtime subscription status:', status);
        });
}

/**
 * Stop the Supabase Realtime listener.
 */
export function stopPushListener() {
    if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
        realtimeChannel = null;
        currentUserId = null;
        logger.log('[Push] Realtime listener stopped');
    }
}
