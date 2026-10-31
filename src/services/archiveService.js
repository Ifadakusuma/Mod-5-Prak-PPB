import gunService from './gunService'
import queryCache from '../utils/queryCache'

// ---------------------------------------------------------------------------
// archiveService.js — Soft Delete / Archive Management
// Stores soft-deleted guns locally so users can review, restore, or hard-delete.
// ---------------------------------------------------------------------------

const ARCHIVE_KEY = 'bore_barrel_archived_guns'

class ArchiveService {
  /**
   * Get all archived records map: { [id]: { ...gun, archivedAt } }
   */
  getArchiveMap() {
    try {
      const raw = localStorage.getItem(ARCHIVE_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  }

  /**
   * Save archive map
   */
  saveArchiveMap(map) {
    try {
      localStorage.setItem(ARCHIVE_KEY, JSON.stringify(map))
      queryCache.invalidate('guns_')
      window.dispatchEvent(new CustomEvent('bore_barrel_archive_changed'))
      return true
    } catch {
      return false
    }
  }

  /**
   * Return array of all archived items sorted by archivedAt desc
   */
  getArchivedGuns() {
    const map = this.getArchiveMap()
    return Object.values(map).sort(
      (a, b) => new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime(),
    )
  }

  /**
   * Check if a specific gun ID is archived
   */
  isArchived(id) {
    if (!id) return false
    const map = this.getArchiveMap()
    return Boolean(map[String(id)])
  }

  /**
   * Soft-delete / Archive a gun
   * @param {Object} gun
   */
  archiveGun(gun) {
    if (!gun || !gun.id) return false
    const map = this.getArchiveMap()
    map[String(gun.id)] = {
      ...gun,
      is_archived: true,
      archivedAt: new Date().toISOString(),
    }
    return this.saveArchiveMap(map)
  }

  /**
   * Restore an archived gun back to active catalog
   * @param {string|number} id
   */
  restoreGun(id) {
    if (!id) return false
    const map = this.getArchiveMap()
    if (!map[String(id)]) return false

    delete map[String(id)]
    return this.saveArchiveMap(map)
  }

  /**
   * Permanently delete a gun (Hard Delete) from both archive and backend
   * @param {string|number} id
   */
  async hardDeleteGun(id) {
    if (!id) return false
    const map = this.getArchiveMap()
    delete map[String(id)]
    this.saveArchiveMap(map)

    try {
      await gunService.deleteGun(id)
    } catch (err) {
      console.warn('Backend permanent delete failed or item was local only:', err)
    }
    return true
  }

  /**
   * Get total count of archived items
   */
  getArchivedCount() {
    return Object.keys(this.getArchiveMap()).length
  }
}

export const archiveService = new ArchiveService()
export default archiveService
