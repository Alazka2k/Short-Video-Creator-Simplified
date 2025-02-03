const AUTH_LOG_KEY = 'auth_debug_log';
const MAX_LOGS = 100; // Limit the number of stored logs
const DEBUG_MODE = true; // Set to true to enable persistent console logging

interface AuthLogEntry {
  timestamp: string;
  type: 'info' | 'error' | 'warning';
  message: string;
  data?: any;
}

export const AuthLogger = {
  debugMode: false,

  setDebugMode(enabled: boolean) {
    this.debugMode = enabled;
    if (!enabled) {
      this.clearAll();
    }
  },

  clearAll() {
    // Clear localStorage
    localStorage.removeItem(AUTH_LOG_KEY);
    // Clear console
    console.clear();
    // Reset internal state
    this.debugMode = false;
    // Clear any existing console groups
    console.groupEnd();
    console.log('[Auth] All logs cleared and debugging disabled');
  },

  log(message: string, data?: any) {
    this._addEntry('info', message, data);
  },

  error(message: string, error?: any) {
    this._addEntry('error', message, error);
  },

  warning(message: string, data?: any) {
    this._addEntry('warning', message, data);
  },

  _addEntry(type: AuthLogEntry['type'], message: string, data?: any) {
    if (!this.debugMode) return; // Don't log if debug mode is disabled

    const timestamp = new Date().toISOString();
    const logEntry: AuthLogEntry = {
      timestamp,
      type,
      message,
      data
    };

    try {
      // Get existing logs
      const existingLogs: AuthLogEntry[] = JSON.parse(localStorage.getItem(AUTH_LOG_KEY) || '[]');
      
      // Add new log and limit size
      existingLogs.push(logEntry);
      if (existingLogs.length > MAX_LOGS) {
        existingLogs.shift(); // Remove oldest log
      }
      
      // Save back to localStorage
      localStorage.setItem(AUTH_LOG_KEY, JSON.stringify(existingLogs));
      
      // Console output with color coding
      const style = type === 'error' ? 'color: red; font-weight: bold' :
                   type === 'warning' ? 'color: orange' :
                   'color: blue';
      
      console.log(`%c[Auth] ${message}`, style, data);
    } catch (error) {
      console.error('[Auth Logger Error]', error);
    }
  },

  getAll() {
    return JSON.parse(localStorage.getItem(AUTH_LOG_KEY) || '[]') as AuthLogEntry[];
  },

  showInConsole() {
    const logs = this.getAll();
    console.group('Auth Debug Logs (Most Recent First)');
    console.log('----------------------------------------');
    [...logs].reverse().forEach((log: AuthLogEntry) => {
      const style = log.type === 'error' ? 'color: red; font-weight: bold' :
                   log.type === 'warning' ? 'color: orange' :
                   'color: blue';
      console.log(
        `%c${new Date(log.timestamp).toLocaleTimeString()} [${log.type.toUpperCase()}]: ${log.message}`,
        style,
        log.data || ''
      );
    });
    console.log('----------------------------------------');
    console.groupEnd();
  },

  // Helper to expose logger to window for debugging
  exposeToWindow() {
    if (typeof window !== 'undefined') {
      (window as any).AuthLogger = this;
      console.log('Auth Logger available globally as window.AuthLogger');
      console.log('Try: window.AuthLogger.showInConsole()');
    }
  }
}; 