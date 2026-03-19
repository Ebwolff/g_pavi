import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './index.css'

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
