import { isTauri } from './core';

// Interfaces para os módulos do Tauri (carregados dinamicamente)
// Isso previne que o webpack/vite inclua o código do Tauri no bundle Web se não for usado
let tauriApp: any = null;
let tauriProcess: any = null;

// Carregamento dinâmico dos módulos Tauri apenas se estiver no Desktop
const loadTauriModules = async () => {
    if (isTauri() && !tauriApp) {
        try {
            // @ts-ignore
            const { getVersion } = await import('@tauri-apps/api/app');
            // @ts-ignore
            const { exit } = await import('@tauri-apps/plugin-process'); // Tauri v2 usa plugin-process

            tauriApp = { getVersion };
            tauriProcess = { exit };
        } catch (e) {
            console.warn('Falha ao carregar módulos Tauri:', e);
        }
    }
};

// Inicializa módulos (pode ser chamado no bootstrap do app)
loadTauriModules();

/**
 * Retorna a versão da aplicação.
 * Web: Lê do package.json (via import.meta.env ou hardcoded se necessário)
 * Desktop: Lê da API do Tauri
 */
export const getAppVersion = async (): Promise<string> => {
    if (isTauri()) {
        await loadTauriModules();
        if (tauriApp?.getVersion) {
            return await tauriApp.getVersion();
        }
    }
    // Fallback para Web (Vite define isso normalmente no define ou env)
    return '0.1.0'; // Fallback seguro
};

/**
 * Fecha a aplicação.
 * Web: Tenta fechar a aba (geralmente bloqueado pelo browser) ou redireciona
 * Desktop: Encerra o processo nativamente
 */
export const exitApp = async (): Promise<void> => {
    if (isTauri()) {
        await loadTauriModules();
        if (tauriProcess?.exit) {
            return await tauriProcess.exit(0);
        }
    }

    // Web behavior
    console.log('Aplicação Web: Solicitação de fechamento.');
    // Tenta fechar (pode não funcionar se não foi aberto por script)
    window.close();
    // Alternativa: Redirecionar para uma página de "Sair" ou Home
    // window.location.href = 'about:blank';
};
