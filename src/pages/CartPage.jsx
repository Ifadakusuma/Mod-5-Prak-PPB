import { useState } from 'react'
import {
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ExternalLink,
  MessageCircle,
} from 'lucide-react'
import useCart from '../hooks/useCart'
import userService from '../services/userService'
import { formatPrice } from '../utils/helpers'

/**
 * CartPage — Shopping Cart with WhatsApp Direct Order Integration.
 */
export default function CartPage({ onBack, onNavigateCatalog }) {
  const { items, itemCount, totalPrice, updateQuantity, removeFromCart, clearCart } =
    useCart()
  const userProfile = userService.getUserProfile()

  const [customerName, setCustomerName] = useState(userProfile.username || '')
  const [customerNotes, setCustomerNotes] = useState('')
  const [waNumber, setWaNumber] = useState(
    import.meta.env.VITE_WHATSAPP_NUMBER || '6281515731562',
  )
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const handleCheckoutWA = (e) => {
    e.preventDefault()
    if (items.length === 0) return

    setIsCheckingOut(true)

    // Construct the formatted message
    const orderLines = items.map(
      (item, idx) =>
        `${idx + 1}. ${item.name} (${item.caliber || item.type || 'Standard'}) x${item.quantity} - ${formatPrice(item.price * item.quantity)}`,
    )

    const rawMessage = [
      'Hi, aku mau pesan:',
      '',
      ...orderLines,
      '----------------------------------',
      `Total Pembayaran: ${formatPrice(totalPrice)}`,
      '',
      `Nama Pemesan: ${customerName.trim() || 'Pelanggan'}`,
      customerNotes.trim() ? `Catatan: ${customerNotes.trim()}` : '',
      '',
      'Mohon konfirmasi ketersediaan barang dan instruksi pembayarannya. Terima kasih!',
    ]
      .filter((line) => line !== undefined && line !== null)
      .join('\n')

    // Clean phone number (strip +, spaces, dashes, and convert 08 to 628)
    let cleanPhone = waNumber.replace(/[^0-9]/g, '')
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1)
    }
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(rawMessage)}`

    // Open WhatsApp
    window.open(waUrl, '_blank')
    setIsCheckingOut(false)
  }

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <button type="button" className="detail-back" onClick={onBack}>
          <ArrowLeft size={18} /> Back
        </button>

        <section className="cart-empty-state">
          <div className="cart-empty-icon">
            <ShoppingBag size={48} strokeWidth={1.5} />
          </div>
          <h2 className="display">Your Armory Cart is Empty</h2>
          <p className="lede">
            Explore our catalog of fine pistols, rifles, and shotguns and add hardware to your requisitions.
          </p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={onNavigateCatalog || onBack}
          >
            Browse Catalog
          </button>
        </section>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <button type="button" className="detail-back" onClick={onBack}>
        <ArrowLeft size={18} /> Back
      </button>

      <section className="masthead">
        <h1 className="display">Hardware Requisition Cart</h1>
        <p className="lede">
          Review your selected hardware before dispatching an order directly to the armorer via WhatsApp.
        </p>
      </section>

      <div className="cart-layout">
        {/* Cart items list */}
        <div className="cart-items-panel">
          <div className="cart-header-row">
            <h2>Selected Items ({itemCount})</h2>
            <button
              type="button"
              className="btn btn--subtle btn--sm"
              onClick={() => {
                if (window.confirm('Clear all items from your cart?')) clearCart()
              }}
            >
              Clear Cart
            </button>
          </div>

          <ul className="cart-list">
            {items.map((item) => (
              <li key={item.id} className="cart-item">
                <img
                  src={item.image_url || '/guns/pistol.svg'}
                  alt={item.name}
                  className="cart-item-img"
                  loading="lazy"
                />

                <div className="cart-item-info">
                  <h3 className="display cart-item-title">{item.name}</h3>
                  <p className="type">
                    {item.type} {item.caliber ? `· ${item.caliber}` : ''}
                  </p>
                  <p className="price cart-item-price">{formatPrice(item.price)} each</p>
                </div>

                {/* Qty controls */}
                <div className="qty-control cart-item-qty">
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="qty-num">{item.quantity}</span>
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <div className="cart-item-subtotal">
                  <span className="price">{formatPrice(item.price * item.quantity)}</span>
                  <button
                    type="button"
                    className="btn-icon-subtle btn-icon-subtle--danger"
                    onClick={() => removeFromCart(item.id)}
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Order Summary & WhatsApp Checkout */}
        <div className="cart-summary-panel">
          <h2>Order Summary</h2>

          <div className="summary-row">
            <span>Items Subtotal</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>
          <div className="summary-row">
            <span>Transfer &amp; Verification</span>
            <span style={{ color: 'var(--brass)' }}>Free</span>
          </div>

          <div className="summary-total-divider" />

          <div className="summary-row summary-total">
            <span>Total Requisition</span>
            <span className="price">{formatPrice(totalPrice)}</span>
          </div>

          <form className="cart-checkout-form" onSubmit={handleCheckoutWA}>
            <label className="form-label" htmlFor="cust-name">
              Customer Name / Operator Handle
            </label>
            <input
              id="cust-name"
              type="text"
              className="text-input"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. John Doe / Operator 07"
              required
            />

            <label className="form-label" htmlFor="wa-dest">
              Destination WhatsApp Number
            </label>
            <input
              id="wa-dest"
              type="text"
              className="text-input"
              value={waNumber}
              onChange={(e) => setWaNumber(e.target.value)}
              placeholder="6281234567890"
              required
            />

            <label className="form-label" htmlFor="cust-notes">
              Order Notes (Optional)
            </label>
            <textarea
              id="cust-notes"
              className="text-input"
              rows="3"
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="Any specific requests, range delivery, or transfer instructions..."
            />

            <button
              type="submit"
              className="btn btn--primary btn--checkout-wa"
              disabled={isCheckingOut}
            >
              <MessageCircle size={18} />
              <span>Checkout via WhatsApp</span>
              <ExternalLink size={16} />
            </button>
            <p className="checkout-hint">
              Clicking will open WhatsApp with your pre-filled order message ready to send.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
