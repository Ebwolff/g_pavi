/**
 * Logger utility — silences all output in production builds.
 * In development, proxies to native console methods.
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.log('message');   // only in dev
 *   logger.error('err');     // only in dev
 *   logger.warn('warning');  // only in dev
 */

const isDev = import.meta.env.DEV;

const noop = (..._args: unknown[]) => {};

export const logger = {
    log: isDev ? console.log.bind(console) : noop,
    warn: isDev ? console.warn.bind(console) : noop,
    error: isDev ? console.error.bind(console) : noop,
    info: isDev ? console.info.bind(console) : noop,
    debug: isDev ? console.debug.bind(console) : noop,
};
