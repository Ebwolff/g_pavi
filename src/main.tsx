import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import { logError } from './services/errorLogService'
import './index.css'

// Captura erros não tratados (fora do ciclo de render do React, que o ErrorBoundary não pega)
window.addEventListener('error', (event) => {
    logError({
        message: event.message,
        stack: event.error?.stack,
        context: 'window_error',
    })
})

window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    logError({
        message: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
        context: 'unhandled_rejection',
    })
})

// Registrar Service Worker para PWA
// autoUpdate: atualiza automaticamente quando nova versão disponível
registerSW({
    onNeedRefresh() {
        // Nova versão disponível — atualiza silenciosamente
        console.log('[PWA] Nova versão disponível, atualizando...')
    },
    onOfflineReady() {
        console.log('[PWA] App pronto para uso offline')
    },
    onRegisteredSW(_swUrl, registration) {
        // Verifica atualizações a cada hora
        if (registration) {
            setInterval(() => {
                registration.update()
            }, 60 * 60 * 1000)
        }
    },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
    <App />,
)
