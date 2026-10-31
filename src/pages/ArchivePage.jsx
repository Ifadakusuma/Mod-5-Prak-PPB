import { useState, useEffect } from 'react'
import { ArrowLeft, RotateCcw, Trash2, Archive, PackageOpen, AlertTriangle } from 'lucide-react'
import archiveService from '../services/archiveService'
import ConfirmModal from '../components/modals/ConfirmModal'
import { formatPrice } from '../utils/helpers'

/**
 * ArchivePage — Soft-Deleted / Archived Hardware Repository.
 * Allows operators to inspect archived records, restore them, or permanently delete them.
 */
export default function ArchivePage({ onBack, onNavigateCatalog }) {
  const [archivedGuns, setArchivedGuns] = useState([])
  const [targetHardDelete, setTargetHardDelete] = useState(null)
  const [hardDeleting, setHardDeleting] = useState(false)
  const [notice, setNotice] = useState('')

  const reloadArchived = () => {
    setArchivedGuns(archiveService.getArchivedGuns())
  }

  useEffect(() => {
    reloadArchived()
  }, [])

  const handleRestore = (gun) => {
    archiveService.restoreGun(gun.id)
    reloadArchived()
    setNotice(`"${gun.name}" restored to active catalog!`)
    setTimeout(() => setNotice(''), 3000)
  }

  const handleConfirmHardDelete = async () => {
    if (!targetHardDelete) return
    try {
      setHardDeleting(true)
      await archiveService.hardDeleteGun(targetHardDelete.id)
      setTargetHardDelete(null)
      reloadArchived()
      setNotice(`"${targetHardDelete.name}" permanently deleted.`)
      setTimeout(() => setNotice(''), 3000)
    } catch (err) {
      alert(err.message || 'Failed to hard delete.')
    } finally {
      setHardDeleting(false)
    }
  }

  return (
    <div className="archive-page">
      <button type="button" className="detail-back" onClick={onBack}>
        <ArrowLeft size={18} /> Back
      </button>

      <section className="masthead">
        <h1 className="display">Archived Hardware Repository</h1>
        <p className="lede">
          Items soft-deleted from the armory catalog are preserved here. You can restore them back to the active catalog or permanently wipe their records.
        </p>
      </section>

      {notice && (
        <div className="alert-box alert-box--success">
          <span>{notice}</span>
        </div>
      )}

      {archivedGuns.length === 0 ? (
        <section className="cart-empty-state">
          <div className="cart-empty-icon">
            <Archive size={48} strokeWidth={1.5} />
          </div>
          <h2 className="display">No Archived Records</h2>
          <p className="lede">
            All your armory records are currently active. When you archive or delete a piece of hardware, it safely lands here for recovery.
          </p>
          <button
            type="button"
            className="btn btn--outline"
            onClick={onNavigateCatalog || onBack}
          >
            Return to Catalog
          </button>
        </section>
      ) : (
        <div className="archive-list-panel">
          <div className="cart-header-row">
            <h2>Archived Records ({archivedGuns.length})</h2>
          </div>

          <ul className="cart-list">
            {archivedGuns.map((gun) => (
              <li key={gun.id} className="cart-item">
                <img
                  src={gun.image_url || gun.image || '/guns/pistol.svg'}
                  alt={gun.name}
                  className="cart-item-img"
                  loading="lazy"
                />

                <div className="cart-item-info">
                  <h3 className="display cart-item-title">{gun.name}</h3>
                  <p className="type">
                    {gun.type} {gun.caliber ? `· ${gun.caliber}` : ''}
                  </p>
                  <p className="price cart-item-price">{formatPrice(gun.price)}</p>
                  <span className="archive-time-stamp">
                    Archived: {new Date(gun.archivedAt || Date.now()).toLocaleDateString()}
                  </span>
                </div>

                <div className="archive-actions-row">
                  <button
                    type="button"
                    className="btn btn--outline btn--sm"
                    onClick={() => handleRestore(gun)}
                    title="Restore back to catalog"
                  >
                    <RotateCcw size={14} /> Restore
                  </button>

                  <button
                    type="button"
                    className="btn btn--danger btn--sm"
                    onClick={() => setTargetHardDelete(gun)}
                    title="Permanently erase record"
                  >
                    <Trash2 size={14} /> Erase
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Confirmation modal for Permanent Erase */}
      <ConfirmModal
        open={Boolean(targetHardDelete)}
        title="Permanently Erase Record"
        message={`Are you sure you want to permanently delete "${targetHardDelete?.name}"? This action bypasses the archive and CANNOT be undone.`}
        confirmLabel="Erase Permanently"
        danger
        loading={hardDeleting}
        onConfirm={handleConfirmHardDelete}
        onCancel={() => setTargetHardDelete(null)}
      />
    </div>
  )
}
