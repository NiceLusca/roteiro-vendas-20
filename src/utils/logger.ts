/**
 * Production-ready logging utility
 * Structured logging with proper levels and contexts
 */

export interface LogContext {
  userId?: string;
  sessionId?: string;
  feature?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  stack?: string;
}

/**
 * Logger class for structured logging
 */
export class Logger {
  private context: LogContext;
  private logLevel: LogLevel;

  constructor(context: LogContext = {}, logLevel: LogLevel = 'info') {
    this.context = context;
    this.logLevel = this.getLogLevel(logLevel);
  }

  private getLogLevel(level: LogLevel): LogLevel {
    if (process.env.NODE_ENV === 'development') {
      return 'debug';
    }
    return level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private createLogEntry(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...context },
      stack: error?.stack,
    };
  }

  private output(entry: LogEntry): void {
    // In development, use console
    if (process.env.NODE_ENV === 'development') {
      const method = entry.level === 'error' ? 'error' : 
                   entry.level === 'warn' ? 'warn' : 
                   entry.level === 'info' ? 'info' : 'debug';
      
      console[method](`[${entry.level.toUpperCase()}] ${entry.message}`, {
        context: entry.context,
        stack: entry.stack,
      });
      return;
    }

    // In production, send to logging service or store locally
    try {
      // Option 1: Send to external logging service
      if (window.location.origin.includes('production-domain')) {
        fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        }).catch(() => {
          // Fallback to local storage if logging service fails
          this.storeLogLocally(entry);
        });
      } else {
        // Option 2: Store in local storage for development/staging
        this.storeLogLocally(entry);
      }
    } catch (error) {
      // Final fallback - at least show critical errors
      if (entry.level === 'error') {
        console.error(`CRITICAL: ${entry.message}`, entry);
      }
    }
  }

  private storeLogLocally(entry: LogEntry): void {
    try {
      const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
      logs.push(entry);
      
      // Keep only last 100 logs to prevent storage bloat
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      
      localStorage.setItem('app_logs', JSON.stringify(logs));
    } catch (error) {
      // Storage full or unavailable
      console.warn('Failed to store log locally:', error);
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      this.output(this.createLogEntry('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      this.output(this.createLogEntry('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      this.output(this.createLogEntry('warn', message, context));
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (this.shouldLog('error')) {
      this.output(this.createLogEntry('error', message, context, error));
    }
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: LogContext): Logger {
    return new Logger({ ...this.context, ...additionalContext }, this.logLevel);
  }
}

/**
 * Factory function to create loggers
 */
export const createLogger = (feature: string, additionalContext: LogContext = {}): Logger => {
  return new Logger({ feature, ...additionalContext });
};

/**
 * Default application logger
 */
export const logger = createLogger('app');

/**
 * Get stored logs (for debugging)
 */
export const getStoredLogs = (): LogEntry[] => {
  try {
    return JSON.parse(localStorage.getItem('app_logs') || '[]');
  } catch {
    return [];
  }
};

/**
 * Clear stored logs
 */
export const clearStoredLogs = (): void => {
  localStorage.removeItem('app_logs');
};
