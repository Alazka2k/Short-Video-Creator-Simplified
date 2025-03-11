interface StorageOptions {
  useLocalStorage?: boolean  // If true, uses localStorage, otherwise sessionStorage
  prefix?: string           // Optional prefix for keys to avoid collisions
}

class StorageManager {
  private storage: Storage
  private prefix: string

  constructor(options: StorageOptions = {}) {
    const { useLocalStorage = false, prefix = 'app_' } = options
    this.storage = useLocalStorage ? localStorage : sessionStorage
    this.prefix = prefix
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`
  }

  set<T>(key: string, value: T): void {
    try {
      const serializedValue = JSON.stringify({
        data: value,
        timestamp: Date.now()
      })
      this.storage.setItem(this.getKey(key), serializedValue)
    } catch (error) {
      console.error('Error saving to storage:', error)
    }
  }

  get<T>(key: string): T | null {
    try {
      const item = this.storage.getItem(this.getKey(key))
      if (!item) return null

      const { data } = JSON.parse(item)
      return data as T
    } catch (error) {
      console.error('Error reading from storage:', error)
      return null
    }
  }

  remove(key: string): void {
    this.storage.removeItem(this.getKey(key))
  }

  clear(onlyWithPrefix = true): void {
    if (onlyWithPrefix) {
      // Only clear items with our prefix
      const keys = Object.keys(this.storage)
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          this.storage.removeItem(key)
        }
      })
    } else {
      this.storage.clear()
    }
  }

  // Helper method to check if data exists
  has(key: string): boolean {
    return this.storage.getItem(this.getKey(key)) !== null
  }

  // Get all items with our prefix
  getAll(): Record<string, any> {
    const result: Record<string, any> = {}
    const keys = Object.keys(this.storage)
    
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        const rawKey = key.slice(this.prefix.length)
        result[rawKey] = this.get(rawKey)
      }
    })
    
    return result
  }
}

// Create instances for different storage types
export const localStore = new StorageManager({ useLocalStorage: true, prefix: 'svc_' })
export const sessionStore = new StorageManager({ useLocalStorage: false, prefix: 'svc_' }) 