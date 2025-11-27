import { config } from './config.js';

type LogLevel = 'info' | 'debug' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  info: 1,
  debug: 2,
};

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] <= LOG_LEVELS[config.logLevel];
}

function getTimestamp(): string {
  return new Date().toISOString();
}

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (shouldLog('info')) {
      console.log(`[${getTimestamp()}] [INFO]`, message, ...args);
    }
  },

  warn: (message: string, ...args: unknown[]) => {
    if (shouldLog('info')) {
      console.warn(`[${getTimestamp()}] [WARN]`, message, ...args);
    }
  },

  debug: (message: string, ...args: unknown[]) => {
    if (shouldLog('debug')) {
      console.log(`[${getTimestamp()}] [DEBUG]`, message, ...args);
    }
  },

  error: (message: string, error?: unknown) => {
    if (shouldLog('error')) {
      console.error(`[${getTimestamp()}] [ERROR]`, message, error);
    }
  },
};
