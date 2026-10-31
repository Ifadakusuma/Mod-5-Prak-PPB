import { useState } from 'react'
import { Share2, Check } from 'lucide-react'

/**
 * ShareButton — Generates a unique link to the gun item.
 * Supports Web Share API (mobile/PWA native) with automatic fallback
 * to clipboard copying and toast notification.
 */
export default function ShareButton({ gun, className = '', showText = false }) {
  const [copied, setCopied] = useState(false)

  if (!gun || !gun.id) return null

  const getShareUrl = () => {
    const origin = window.location.origin
    const path = window.location.pathname
    return `${origin}${path}?gun=${encodeURIComponent(gun.id)}`
  }

  const handleShare = async (e) => {
    e.stopPropagation()
    const shareUrl = getShareUrl()
    const shareData = {
      title: `${gun.name} — Bore & Barrel`,
      text: `Take a look at ${gun.name} (${gun.type || gun.category || 'Hardware'}) on Bore & Barrel:`,
      url: shareUrl,
    }

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData)
        return
      } catch (err) {
        if (err.name === 'AbortError') return
      }
    }

    // Fallback: Copy to Clipboard
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl)
      } else {
        const input = document.createElement('input')
        input.value = shareUrl
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch (err) {
      console.warn('Failed to copy to clipboard:', err)
    }
  }

  return (
    <button
      type="button"
      className={`share-btn ${copied ? 'share-btn--copied' : ''} ${className}`}
      onClick={handleShare}
      title={copied ? 'Tautan disalin ke clipboard!' : 'Bagikan tautan unik produk'}
      aria-label={`Bagikan ${gun.name}`}
    >
      {copied ? <Check size={16} className="share-icon" /> : <Share2 size={16} className="share-icon" />}
      {showText && <span>{copied ? 'Tautan Disalin!' : 'Bagikan'}</span>}
    </button>
  )
}
