import { Plus, ShoppingCart } from 'lucide-react'
import { useFavorites } from '../hooks/useFavorites'
import useCart from '../hooks/useCart'

const NAV_ITEMS = [
  { id: 'Catalog', label: 'Catalog' },
  { id: 'Cart', label: 'Cart', isCart: true },
  { id: 'Favorites', label: 'Favorites', isFav: true },
  { id: 'Profile', label: 'Profile' },
]

function Header({ tab, onTab, onNavigateCreate }) {
  const { favorites } = useFavorites()
  const { itemCount } = useCart()
  const favCount = favorites ? favorites.length : 0

  return (
    <header className="header">
      <div
        className="header-brand-wrap"
        onClick={() => onTab('Catalog')}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
      >
        <div className="header-logo-badge">
          <img src="/logo.png" alt="Bore & Barrel" />
        </div>
        <span className="brand display">Bore &amp; Barrel</span>
      </div>

      <nav className="nav">
        {NAV_ITEMS.map((item) => {
          const isActive = tab === item.id
          let badgeVal = 0
          if (item.isCart) badgeVal = itemCount
          if (item.isFav) badgeVal = favCount

          return (
            <button
              key={item.id}
              type="button"
              className={isActive ? 'nav-link active' : 'nav-link'}
              onClick={() => onTab(item.id)}
            >
              {item.isCart && <ShoppingCart size={14} style={{ marginRight: '4px' }} />}
              {item.label}
              {badgeVal > 0 && <span className="nav-badge">{badgeVal}</span>}
            </button>
          )
        })}
      </nav>

      {onNavigateCreate && (
        <button
          type="button"
          className="btn btn--primary btn--sm header-cta"
          onClick={onNavigateCreate}
          title="Register new hardware"
        >
          <Plus size={15} /> Add Hardware
        </button>
      )}
    </header>
  )
}

export default Header
