const DEBUG_ENABLED = process.env.NODE_ENV === 'development';

/**
 * A simple namespaced logger for client-side debugging.
 * It will only output logs in development mode.
 * 
 * @example
 * const logger = new Logger('Auth');
 * logger.log('User authenticated');
 * logger.error('Failed to get token', { code: 'E401' });
 */
export class Logger {
  private namespace: string;

  constructor(namespace: string) {
    this.namespace = namespace;
  }

  private doLog(level: 'log' | 'warn' | 'error', message: string, data?: any) {
    if (!DEBUG_ENABLED) {
      return;
    }

    const prefix = `[${this.namespace}]`;
    const consoleMethod = console[level];

    if (data) {
      consoleMethod(prefix, message, data);
    } else {
      consoleMethod(prefix, message);
    }
  }

  log(message: string, data?: any) {
    this.doLog('log', message, data);
  }

  warn(message: string, data?: any) {
    this.doLog('warn', message, data);
  }

  error(message: string, data?: any) {
    this.doLog('error', message, data);
  }
} 