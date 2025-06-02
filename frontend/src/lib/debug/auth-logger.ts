const DEBUG_ENABLED = process.env.NODE_ENV === 'development';

class AuthDebugLogger {
  private logs: Array<{ timestamp: string; level: string; message: string; data?: any }> = [];
  private maxLogs = 50;
  private lastMessage = '';
  private lastMessageCount = 0;
  private lastMessageTime = 0;

  private shouldLog(level: string, message: string): boolean {
    // Only log essential events
    const essentialKeywords = [
      'authenticated', 'failed', 'error', 'successful', 'redirecting',
      'token exchange', 'backend sync', 'logout', 'profile fetch',
      'social auth', 'M2M token', 'Auth0 not authenticated'
    ];

    // Always log errors and warnings
    if (level === 'error' || level === 'warning') {
      return true;
    }

    // Filter out routine/verbose messages
    const routineKeywords = [
      'Auth0 still loading', 'Activity updated', 'Using cached',
      'Auth0 state unclear', 'User activity check', 'Token refreshed'
    ];

    if (routineKeywords.some(keyword => message.toLowerCase().includes(keyword.toLowerCase()))) {
      return false;
    }

    // Only log if message contains essential keywords
    return essentialKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private isDuplicateMessage(message: string): boolean {
    const now = Date.now();
    const timeDiff = now - this.lastMessageTime;

    if (this.lastMessage === message && timeDiff < 5000) { // 5 second debounce
      this.lastMessageCount++;
      this.lastMessageTime = now;
      return true;
    }

    // If we had duplicates, log the count
    if (this.lastMessageCount > 0) {
      const duplicateMsg = `Previous message repeated ${this.lastMessageCount} times`;
      this.addLogEntry('info', duplicateMsg);
    }

    this.lastMessage = message;
    this.lastMessageCount = 0;
    this.lastMessageTime = now;
    return false;
  }

  private addLogEntry(level: string, message: string, data?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };
    
    // Add to in-memory logs
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console logging (only for important events)
    if (DEBUG_ENABLED) {
      const consoleMethod = level === 'error' ? console.error : level === 'warning' ? console.warn : console.log;
      if (data) {
        consoleMethod(`[Auth] ${message}`, data);
      } else {
        consoleMethod(`[Auth] ${message}`);
      }
    }

    // Reduced localStorage logging frequency
    if (level === 'error' || level === 'warning' || Math.random() < 0.3) {
      try {
        const persistentLogs = this.getPersistentLogs();
        persistentLogs.push(logEntry);
        if (persistentLogs.length > this.maxLogs) {
          persistentLogs.shift();
        }
        localStorage.setItem('auth_debug_logs', JSON.stringify(persistentLogs));
      } catch (error) {
        // Silent fail for localStorage issues
      }
    }
  }

  private addLog(level: string, message: string, data?: any) {
    // Filter out non-essential logs
    if (!this.shouldLog(level, message)) {
      return;
    }

    // Prevent duplicate message spam
    if (this.isDuplicateMessage(message)) {
      return;
    }

    this.addLogEntry(level, message, data);
  }

  private getPersistentLogs() {
    try {
      const stored = localStorage.getItem('auth_debug_logs');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }

  log(message: string, data?: any) {
    this.addLog('info', message, data);
  }

  warning(message: string, data?: any) {
    this.addLog('warning', message, data);
  }

  error(message: string, data?: any) {
    this.addLog('error', message, data);
  }

  // Get all logs (useful for debugging)
  getAllLogs() {
    return this.getPersistentLogs();
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
    try {
      localStorage.removeItem('auth_debug_logs');
    } catch (error) {
      // Silent fail
    }
  }

  // Print recent logs to console (useful after page refresh)
  printRecentLogs(count = 10) {
    const logs = this.getPersistentLogs().slice(-count);
    if (logs.length === 0) {
      console.log('No auth debug logs found');
      return;
    }
    
    console.group(`Recent Auth Logs (${logs.length})`);
    logs.forEach((log: { timestamp: string; level: string; message: string; data?: any }) => {
      const consoleMethod = log.level === 'error' ? console.error : log.level === 'warning' ? console.warn : console.log;
      consoleMethod(`${log.timestamp.split('T')[1].split('.')[0]} [${log.level.toUpperCase()}] ${log.message}`, log.data || '');
    });
    console.groupEnd();
  }
}

export const AuthLogger = new AuthDebugLogger();

// Expose to window for debugging (simplified)
if (typeof window !== 'undefined' && DEBUG_ENABLED) {
  (window as any).checkAuthLogs = function() {
    try {
      const logs = JSON.parse(localStorage.getItem('auth_debug_logs') || '[]');
      console.group(`Auth Debug Logs (Last 10 of ${logs.length})`);
      logs.slice(-10).forEach((log: any) => {
        const method = log.level === 'error' ? console.error : log.level === 'warning' ? console.warn : console.log;
        const time = log.timestamp.split('T')[1].split('.')[0];
        method(`${time} [${log.level.toUpperCase()}] ${log.message}`, log.data || '');
      });
      console.groupEnd();
      return logs;
    } catch (error) {
      console.error('Failed to load auth logs:', error);
      return [];
    }
  };
  
  (window as any).clearAuthLogs = function() {
    localStorage.removeItem('auth_debug_logs');
    console.log('Auth debug logs cleared');
  };
} 