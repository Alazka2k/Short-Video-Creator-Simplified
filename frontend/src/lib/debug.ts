export const createDebugger = (namespace: string) => {
  const debug = process.env.NODE_ENV === 'development';
  
  return {
    log: (...args: any[]) => {
      if (debug) {
        console.log(`[${namespace}]`, ...args);
      }
    },
    error: (...args: any[]) => {
      if (debug) {
        console.error(`[${namespace}]`, ...args);
      }
    },
    group: (label: string) => {
      if (debug) {
        console.group(`[${namespace}] ${label}`);
      }
    },
    groupEnd: () => {
      if (debug) {
        console.groupEnd();
      }
    }
  };
}; 