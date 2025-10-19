/**
 * Sistema centralizado de logging para toda a aplicação
 * Registra todas as ações importantes com contexto e timestamps
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';
export type LogCategory = 
  | 'auth' 
  | 'admin' 
  | 'job' 
  | 'negotiation' 
  | 'payment' 
  | 'ordem_servico'
  | 'evaluation'
  | 'notification'
  | 'wallet'
  | 'system';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
  userId?: string;
  error?: Error;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;

  private formatLog(entry: LogEntry): string {
    const emoji = {
      info: '📘',
      warn: '⚠️',
      error: '❌',
      debug: '🔍'
    }[entry.level];

    return `${emoji} [${entry.category}] ${entry.message}`;
  }

  private log(entry: LogEntry) {
    const formattedMessage = this.formatLog(entry);

    switch (entry.level) {
      case 'error':
        console.error(formattedMessage, entry.data || '', entry.error || '');
        break;
      case 'warn':
        console.warn(formattedMessage, entry.data || '');
        break;
      case 'debug':
        if (this.isDevelopment) {
          console.debug(formattedMessage, entry.data || '');
        }
        break;
      default:
        console.info(formattedMessage, entry.data || '');
    }

    // Aqui poderia integrar com serviços externos de logging
    // como Sentry, LogRocket, etc.
  }

  info(category: LogCategory, message: string, data?: any, userId?: string) {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'info',
      category,
      message,
      data,
      userId
    });
  }

  warn(category: LogCategory, message: string, data?: any, userId?: string) {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'warn',
      category,
      message,
      data,
      userId
    });
  }

  error(category: LogCategory, message: string, error?: Error, data?: any, userId?: string) {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'error',
      category,
      message,
      data,
      error,
      userId
    });
  }

  debug(category: LogCategory, message: string, data?: any, userId?: string) {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'debug',
      category,
      message,
      data,
      userId
    });
  }

  // Helpers para casos de uso comuns
  authAction(message: string, userId?: string, data?: any) {
    this.info('auth', message, data, userId);
  }

  adminAction(message: string, userId?: string, data?: any) {
    this.info('admin', message, data, userId);
  }

  jobAction(message: string, jobId?: string, userId?: string) {
    this.info('job', message, { jobId }, userId);
  }

  paymentAction(message: string, paymentId?: string, amount?: number, userId?: string) {
    this.info('payment', message, { paymentId, amount }, userId);
  }

  apiError(category: LogCategory, endpoint: string, error: any, userId?: string) {
    this.error(category, `API Error: ${endpoint}`, error, { endpoint }, userId);
  }
}

export const logger = new Logger();
