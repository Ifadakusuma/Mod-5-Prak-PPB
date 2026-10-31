// ---------------------------------------------------------------------------
// queryCache.js — Lightweight in-memory & sessionStorage query caching
// Supports TTL (Time To Live), Stale-While-Revalidate (SWR), and key invalidation.
// ---------------------------------------------------------------------------

const DEFAULT_TTL_MS = 5 * 60 * 1000 // 5 minutes
const memoryCache = new Map()

class QueryCache {
  /**
   * Set a key in memory and sessionStorage
   */
  set(key, data, ttlMs = DEFAULT_TTL_MS) {
    const entry = {
      data,
      expiresAt: Date.now() + ttlMs,
      cachedAt: Date.now(),
    }
    memoryCache.set(key, entry)

    try {
      sessionStorage.setItem(`qcache_${key}`, JSON.stringify(entry))
    } catch {
      // Ignore quota errors in private browsing
    }
  }

  /**
   * Get cached data. Returns null if expired or not found.
   * If allowStale is true, returns data even if expired (for SWR).
   */
  get(key, allowStale = false) {
    let entry = memoryCache.get(key)

    if (!entry) {
      try {
        const raw = sessionStorage.getItem(`qcache_${key}`)
        if (raw) {
          entry = JSON.parse(raw)
          memoryCache.set(key, entry)
        }
      } catch {
        entry = null
      }
    }

    if (!entry) return null

    const isExpired = Date.now() > entry.expiresAt
    if (isExpired && !allowStale) {
      this.delete(key)
      return null
    }

    return {
      data: entry.data,
      isExpired,
      cachedAt: entry.cachedAt,
    }
  }

  /**
   * Delete specific key
   */
  delete(key) {
    memoryCache.delete(key)
    try {
      sessionStorage.removeItem(`qcache_${key}`)
    } catch {
      /* ignore */
    }
  }

  /**
   * Invalidate all keys matching a prefix or pattern (e.g. 'guns_')
   */
  invalidate(prefixOrPattern) {
    for (const key of memoryCache.keys()) {
      if (typeof prefixOrPattern === 'string' ? key.startsWith(prefixOrPattern) : prefixOrPattern.test(key)) {
        memoryCache.delete(key)
      }
    }

    try {
      const keysToRemove = []
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i)
        if (k && k.startsWith('qcache_')) {
          const rawKey = k.replace('qcache_', '')
          if (typeof prefixOrPattern === 'string' ? rawKey.startsWith(prefixOrPattern) : prefixOrPattern.test(rawKey)) {
            keysToRemove.push(k)
          }
        }
      }
      keysToRemove.forEach((k) => sessionStorage.removeItem(k))
    } catch {
      /* ignore */
    }
  }

  /**
   * Clear all cache
   */
  clear() {
    memoryCache.clear()
    try {
      const toRemove = []
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i)
        if (k && k.startsWith('qcache_')) toRemove.push(k)
      }
      toRemove.forEach((k) => sessionStorage.removeItem(k))
    } catch {
      /* ignore */
    }
  }
}

export const queryCache = new QueryCache()
export default queryCache
