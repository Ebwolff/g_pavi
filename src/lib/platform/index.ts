export * from './core';
export * from './app';

/**
 * Platform - Visão 360 Abstraction Layer
 * 
 * Utilize este módulo para todas as interações que podem variar
 * entre o ambiente Web (Vercel) e Desktop (Tauri).
 * 
 * Exemplo:
 * import { platform } from '@/lib/platform';
 * 
 * if (platform.isTauri()) { ... }
 */

import * as core from './core';
import * as app from './app';

export const platform = {
    ...core,
    ...app
};
