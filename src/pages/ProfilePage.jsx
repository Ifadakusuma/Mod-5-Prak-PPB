import { useState, useEffect } from 'react'
import {
  Shield,
  Copy,
  Check,
  Heart,
  FileText,
  Play,
  Edit2,
  Archive,
  ShoppingCart,
  MapPin,
  Clock,
  Phone,
  Mail,
  MessageCircle,
  ExternalLink,
  Trash2,
  PlayCircle,
  PackageOpen,
  Info,
  HelpCircle,
} from 'lucide-react'
import userService from '../services/userService'
import { useFavorites } from '../hooks/useFavorites'
import useCart from '../hooks/useCart'
import archiveService from '../services/archiveService'
import { getAllDraftsWithDetails, deleteDraft } from '../utils/draftStorage'
import { formatPrice } from '../utils/helpers'

/**
 * ProfilePage — Operator credentials, drafts manager, archive repository access,
 * and integrated About & Contact sections.
 */
export default function ProfilePage({
  onReplaySplash,
  onNavigateEditProfile,
  onNavigateArchive,
  onNavigateCart,
  onNavigateFavorites,
  onResumeDraft,
}) {
  const [profile, setProfile] = useState(() => userService.getUserProfile())
  const [copied, setCopied] = useState(false)
  const [drafts, setDrafts] = useState(() => getAllDraftsWithDetails())
  const [archivedCount, setArchivedCount] = useState(() => archiveService.getArchivedCount())

  const { favorites } = useFavorites()
  const { itemCount } = useCart()

  const reloadDrafts = () => {
    setDrafts(getAllDraftsWithDetails())
  }

  useEffect(() => {
    setProfile(userService.getUserProfile())
    reloadDrafts()
    setArchivedCount(archiveService.getArchivedCount())

    const handleStorageChange = () => {
      reloadDrafts()
      setArchivedCount(archiveService.getArchivedCount())
    }
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('bore_barrel_archive_changed', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('bore_barrel_archive_changed', handleStorageChange)
    }
  }, [])

  const handleCopyId = () => {
    if (profile.userId) {
      navigator.clipboard.writeText(profile.userId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDeleteDraft = (draftId) => {
    if (window.confirm('Discard this draft permanently?')) {
      deleteDraft(draftId)
      reloadDrafts()
    }
  }

  return (
    <div className="profile-page">
      {/* Header */}
      <section
        className="masthead"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1 className="display">Operator Profile &amp; Armory Station</h1>
          <p className="lede">
            Operator credentials, draft workpieces, archive repository, and armory details.
          </p>
        </div>
        {onReplaySplash && (
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={onReplaySplash}
            title="Replay introductory splash animation"
          >
            <Play size={14} /> Replay Intro
          </button>
        )}
      </section>

      {/* Operator Card */}
      <div className="profile-card">
        <div className="profile-card-top">
          <div className="avatar-wrap">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.username} className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">
                <Shield size={36} stroke="var(--brass)" />
              </div>
            )}
          </div>

          <div className="profile-identity">
            <div className="profile-identity-header">
              <h2 className="display">{profile.username || 'Shooter'}</h2>
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={onNavigateEditProfile}
                title="Edit name, bio, and avatar on dedicated page"
              >
                <Edit2 size={14} /> Edit Profile
              </button>
            </div>

            <div className="profile-id-row">
              <span className="mono-badge">{profile.userId}</span>
              <button
                type="button"
                className="icon-btn"
                onClick={handleCopyId}
                title="Copy User ID to clipboard"
              >
                {copied ? <Check size={14} color="var(--brass)" /> : <Copy size={14} />}
              </button>
            </div>

            {profile.bio ? (
              <p className="profile-bio-text">{profile.bio}</p>
            ) : (
              <p className="profile-bio-text profile-bio-empty">
                No operator bio provided. Click &quot;Edit Profile&quot; to set up your callsign and qualifications.
              </p>
            )}
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="profile-stats">
          <button
            type="button"
            className="stat-item stat-item--interactive"
            onClick={onNavigateFavorites}
            title="View Procurement Favorites"
          >
            <Heart size={20} className="stat-icon" stroke="var(--brass)" />
            <div className="stat-val">{favorites.length}</div>
            <div className="stat-label">Favorites</div>
          </button>

          <div className="stat-item">
            <FileText size={20} className="stat-icon" stroke="var(--steel)" />
            <div className="stat-val">{drafts.length}</div>
            <div className="stat-label">Saved Drafts</div>
          </div>

          <button
            type="button"
            className="stat-item stat-item--interactive"
            onClick={onNavigateArchive}
            title="View Soft-Deleted / Archived Hardware"
          >
            <Archive size={20} className="stat-icon" stroke="var(--brass)" />
            <div className="stat-val">{archivedCount}</div>
            <div className="stat-label">Archived Guns</div>
          </button>

          <button
            type="button"
            className="stat-item stat-item--interactive"
            onClick={onNavigateCart}
            title="View Hardware Cart"
          >
            <ShoppingCart size={20} className="stat-icon" stroke="var(--steel)" />
            <div className="stat-val">{itemCount}</div>
            <div className="stat-label">Cart Items</div>
          </button>
        </div>
      </div>

      {/* Quick Jump Sub-Navigation */}
      <div className="profile-quick-nav">
        <button
          type="button"
          className="profile-quick-btn"
          onClick={() => document.getElementById('profile-about')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <Info size={15} /> About Armory
        </button>
        <button
          type="button"
          className="profile-quick-btn"
          onClick={() => document.getElementById('profile-contact')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <Phone size={15} /> Contact &amp; Support
        </button>
        <button
          type="button"
          className="profile-quick-btn"
          onClick={() => document.getElementById('profile-drafts')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <FileText size={15} /> Saved Drafts ({drafts.length})
        </button>
        <button
          type="button"
          className="profile-quick-btn"
          onClick={() => document.getElementById('profile-archive')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <Archive size={15} /> Archived Armory ({archivedCount})
        </button>
      </div>

      {/* SECTION: Active Form Drafts Manager (Fitur 5) */}
      <section id="profile-drafts" className="profile-section-panel">
        <div className="panel-header-row">
          <div>
            <h2 className="section-title">Saved Hardware Drafts</h2>
            <p className="section-subtitle">
              Workpieces auto-saved to your browser. You can resume editing or discard them anytime.
            </p>
          </div>
        </div>

        {drafts.length === 0 ? (
          <div className="drafts-empty-box">
            <FileText size={32} stroke="var(--steel)" />
            <p>No active offline drafts. Start creating or editing a piece of hardware to auto-save work.</p>
          </div>
        ) : (
          <ul className="profile-drafts-list">
            {drafts.map((draft) => (
              <li key={draft.id} className="draft-card-item">
                <div className="draft-info">
                  <div className="draft-type-tag">
                    {draft.isCreate ? 'New Hardware Draft' : 'Edit Modification Draft'}
                  </div>
                  <h3 className="display draft-title">{draft.name}</h3>
                  <div className="draft-meta">
                    <span>{draft.type}</span>
                    {draft.caliber && draft.caliber !== '—' && <span>· {draft.caliber}</span>}
                    {draft.price > 0 && <span>· {formatPrice(draft.price)}</span>}
                    <span className="draft-time-pill">Saved {draft.timeAgo}</span>
                  </div>
                </div>

                <div className="draft-item-actions">
                  <button
                    type="button"
                    className="btn btn--primary btn--sm"
                    onClick={() => onResumeDraft && onResumeDraft(draft)}
                  >
                    Resume Edit
                  </button>
                  <button
                    type="button"
                    className="btn-icon-subtle btn-icon-subtle--danger"
                    onClick={() => handleDeleteDraft(draft.id)}
                    title="Discard draft"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* SECTION: Soft Delete & Archive Access (Fitur 6) */}
      <section id="profile-archive" className="profile-section-panel archive-banner-panel">
        <div className="archive-banner-content">
          <div className="archive-banner-text">
            <h2 className="section-title">Archived Armory Repository</h2>
            <p className="section-subtitle">
              Records soft-deleted from the main catalog are preserved in the archive. Currently holding{' '}
              <strong>{archivedCount}</strong> archived item(s).
            </p>
          </div>
          <button
            type="button"
            className="btn btn--outline"
            onClick={onNavigateArchive}
          >
            <Archive size={16} /> Open Archive Repository
          </button>
        </div>
      </section>

      {/* SECTION: About Bore & Barrel (Fitur 4) */}
      <section id="profile-about" className="profile-section-panel">
        <h2 className="section-title">About Bore &amp; Barrel</h2>

        <div className="about-content-box">
          <h3 className="display about-subhead">A one-room armory.</h3>
          <p className="lede">
            Bore &amp; Barrel sells a short, honest list of firearms. Each piece is priced from the bench — no markup theatre, no filler.
          </p>
          <div className="about-pillars-grid">
            <div className="about-pillar">
              <span className="pillar-num">01</span>
              <h4>Bench-Inspected</h4>
              <p>Every firearm is chamber-checked, stripped, and timed by an armorer before listing.</p>
            </div>
            <div className="about-pillar">
              <span className="pillar-num">02</span>
              <h4>Spec Sheet Honesty</h4>
              <p>Caliber, capacity, trigger pull, and finish. We list hardware as it measures, without hyperbole.</p>
            </div>
            <div className="about-pillar">
              <span className="pillar-num">03</span>
              <h4>Offline Reliability</h4>
              <p>Built as a Progressive Web App so field operators can access catalog specs without an active data link.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: Contact & Support (Fitur 4) */}
      <section id="profile-contact" className="profile-section-panel">
        <h2 className="section-title">Contact &amp; Armory Support</h2>
        <div className="contact-grid">
          <div className="contact-card">
            <div className="contact-icon-wrap">
              <MapPin size={22} stroke="var(--brass)" />
            </div>
            <div>
              <h4>Armory Location</h4>
              <p>123 Range Road, Sector 4</p>
              <span className="contact-sub">Walk-ins welcome for range transfers</span>
            </div>
          </div>

          <div className="contact-card">
            <div className="contact-icon-wrap">
              <Clock size={22} stroke="var(--brass)" />
            </div>
            <div>
              <h4>Operating Hours</h4>
              <p>Tuesday – Saturday</p>
              <span className="contact-sub">10:00 AM – 6:00 PM Local Time</span>
            </div>
          </div>

          <div className="contact-card">
            <div className="contact-icon-wrap">
              <Phone size={22} stroke="var(--brass)" />
            </div>
            <div>
              <h4>Direct Wire</h4>
              <p>(555) 010-0100</p>
              <span className="contact-sub">Secure armory telephone line</span>
            </div>
          </div>

          <div className="contact-card">
            <div className="contact-icon-wrap">
              <MessageCircle size={22} stroke="var(--brass)" />
            </div>
            <div>
              <h4>WhatsApp Dispatch</h4>
              <p>Quick Requisitions</p>
              <a
                href={`https://wa.me/${(import.meta.env.VITE_WHATSAPP_NUMBER || '6281515731562').replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hi, aku ingin bertanya mengenai stok dan spesifikasi senjata di Bore & Barrel.')}`}
                target="_blank"
                rel="noreferrer"
                className="contact-link"
              >
                Chat on WhatsApp <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
