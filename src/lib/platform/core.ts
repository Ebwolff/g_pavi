/**
 * Detecta se a aplicação está rodando dentro do ambiente Tauri (Desktop).
 * Verifica a presença do objeto window.__TAURI_INTERNALS__.
 */
export const isTauri = (): boolean => {
    // @ts-ignore
    return !!window.__TAURI_INTERNALS__;
};

/**
 * Detecta se a aplicação está rodando no navegador (Web).
 */
export const isWeb = (): boolean => {
    return !isTauri();
};

/**
 * Tipagem segura para window object com propriedades do Tauri
 */
declare global {
    interface Window {
        __TAURI_INTERNALS__?: unknown;
    }
}
