import { useState, useEffect, useCallback } from 'react'
import gunService from '../services/gunService'
import queryCache from '../utils/queryCache'
import archiveService from '../services/archiveService'

// ---------------------------------------------------------------------------
// useGuns — fetch product list from API with true Stale-While-Revalidate (SWR)
// and soft-delete archive filtering.
// ---------------------------------------------------------------------------

export function useGuns(params = {}) {
  const [guns, setGuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState(null)

  const paramKey = JSON.stringify(params)
  const cacheKey = `guns_${paramKey}`

  const fetchGuns = useCallback(
    async (forceFetch = false) => {
      // 1. Show cached data immediately if available (Fast UI)
      if (!forceFetch) {
        const cached = queryCache.get(cacheKey, true)
        if (cached && cached.data && Array.isArray(cached.data) && cached.data.length > 0) {
          const visible = cached.data.filter((g) => !archiveService.isArchived(g.id))
          setGuns(visible)
          setLoading(false)
        }
      }

      // 2. ALWAYS execute API request in background to revalidate (SWR)
      try {
        const response = await gunService.getGuns(params)

        if (response && response.success) {
          const rawList = response.data || []
          queryCache.set(cacheKey, rawList)
          const visible = rawList.filter((g) => !archiveService.isArchived(g.id))
          setGuns(visible)
          setPagination(response.pagination || null)
          setError(null)
        } else {
          const msg = response?.message || 'Failed to fetch products from API.'
          setError(msg)
        }
      } catch (err) {
        console.error('[useGuns API error]:', err)
        setError(err.message || 'Unable to connect to server API.')
      } finally {
        setLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paramKey, cacheKey],
  )

  useEffect(() => {
    fetchGuns()

    // Listen for archive/restore events
    const handleArchiveChanged = () => {
      fetchGuns(true)
    }
    window.addEventListener('bore_barrel_archive_changed', handleArchiveChanged)
    return () => {
      window.removeEventListener('bore_barrel_archive_changed', handleArchiveChanged)
    }
  }, [fetchGuns])

  return { guns, loading, error, pagination, refetch: () => fetchGuns(true) }
}

// ---------------------------------------------------------------------------
// useGunById — fetch a single product with query caching.
// ---------------------------------------------------------------------------

export function useGunById(id) {
  const [gun, setGun] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const cacheKey = `gun_${id}`

  const fetchGun = useCallback(
    async (forceFetch = false) => {
      if (!id) {
        setLoading(false)
        return
      }

      // 1. Check cache
      if (!forceFetch) {
        const cached = queryCache.get(cacheKey, true)
        if (cached && cached.data) {
          setGun(cached.data)
          setLoading(false)
        }
      }

      // 2. Revalidate from server
      try {
        const response = await gunService.getGunById(id)

        if (response && response.success) {
          setGun(response.data)
          queryCache.set(cacheKey, response.data)
          setError(null)
        } else {
          setError(response?.message || 'Product not found.')
        }
      } catch (err) {
        console.error('[useGunById API error]:', err)
        setError(err.message || 'Failed to load product details.')
      } finally {
        setLoading(false)
      }
    },
    [id, cacheKey],
  )

  useEffect(() => {
    fetchGun()
  }, [fetchGun])

  return { gun, loading, error, refetch: () => fetchGun(true) }
}
