import { useState, useEffect, useCallback } from 'react'

// ---------------------------------------------------------------------------
// useCart.js — Shopping Cart State & Persistence
// Stores cart items in localStorage and synchronizes across components.
// ---------------------------------------------------------------------------

const CART_KEY = 'bore_barrel_cart'

const getStoredCart = () => {
  try {
    const raw = localStorage.getItem(CART_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const saveStoredCart = (items) => {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
    window.dispatchEvent(new CustomEvent('bore_barrel_cart_updated', { detail: items }))
  } catch {
    /* ignore */
  }
}

export function useCart() {
  const [items, setItems] = useState(getStoredCart)

  const syncCart = useCallback(() => {
    setItems(getStoredCart())
  }, [])

  useEffect(() => {
    const handleUpdate = () => syncCart()
    window.addEventListener('bore_barrel_cart_updated', handleUpdate)
    window.addEventListener('storage', handleUpdate)
    return () => {
      window.removeEventListener('bore_barrel_cart_updated', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [syncCart])

  const addToCart = useCallback((gun, quantity = 1) => {
    if (!gun || !gun.id) return

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => String(item.id) === String(gun.id))
      let updated
      if (existingIndex > -1) {
        updated = [...prevItems]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        }
      } else {
        const newItem = {
          id: gun.id,
          name: gun.name || 'Hardware Piece',
          type: gun.type || gun.category || 'Hardware',
          caliber: gun.caliber || '',
          price: Number(gun.price ?? gun.cook_time ?? 0),
          image_url: gun.image_url || gun.image || '/guns/pistol.svg',
          quantity: Math.max(1, quantity),
        }
        updated = [...prevItems, newItem]
      }
      saveStoredCart(updated)
      return updated
    })
  }, [])

  const removeFromCart = useCallback((id) => {
    setItems((prevItems) => {
      const updated = prevItems.filter((item) => String(item.id) !== String(id))
      saveStoredCart(updated)
      return updated
    })
  }, [])

  const updateQuantity = useCallback((id, newQty) => {
    setItems((prevItems) => {
      let updated
      if (newQty <= 0) {
        updated = prevItems.filter((item) => String(item.id) !== String(id))
      } else {
        updated = prevItems.map((item) =>
          String(item.id) === String(id) ? { ...item, quantity: newQty } : item,
        )
      }
      saveStoredCart(updated)
      return updated
    })
  }, [])

  const clearCart = useCallback(() => {
    saveStoredCart([])
    setItems([])
  }, [])

  const itemCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0)
  const totalPrice = items.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1),
    0,
  )

  return {
    items,
    itemCount,
    totalPrice,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  }
}

export default useCart
