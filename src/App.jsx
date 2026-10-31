import { useState, useEffect, lazy, Suspense } from 'react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import PWABadge from './components/PWABadge.jsx'
import ConfirmModal from './components/modals/ConfirmModal.jsx'
import SplashScreen from './components/common/SplashScreen.jsx'
import gunService from './services/gunService.js'
import archiveService from './services/archiveService.js'
import GUNS_LOCAL from './data/guns.js'
import './App.css'

// ---------------------------------------------------------------------------
// Lazy Loaded Components (Fitur 2: Lazy Loading)
// ---------------------------------------------------------------------------
const Catalog = lazy(() => import('./pages/Catalog.jsx'))
const FavoritesPage = lazy(() => import('./pages/FavoritesPage.jsx'))
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'))
const CartPage = lazy(() => import('./pages/CartPage.jsx'))
const CreateGunPage = lazy(() => import('./pages/CreateGunPage.jsx'))
const EditGunPage = lazy(() => import('./pages/EditGunPage.jsx'))
const EditProfilePage = lazy(() => import('./pages/EditProfilePage.jsx'))
const ArchivePage = lazy(() => import('./pages/ArchivePage.jsx'))
const GunDetail = lazy(() => import('./components/gun/GunDetail.jsx'))

function LoadingFallback() {
  return (
    <div className="state-box" style={{ minHeight: '40vh' }}>
      <div className="spin" style={{ width: 28, height: 28, border: '3px solid var(--line)', borderTopColor: 'var(--brass)', borderRadius: '50%' }} />
      <p style={{ color: 'var(--steel)', marginTop: 12 }}>Loading Armory Station…</p>
    </div>
  )
}

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [tab, setTab] = useState('Catalog') // 'Catalog' | 'Cart' | 'Favorites' | 'Profile'
  const [mode, setMode] = useState('list') // 'list' | 'create' | 'edit' | 'detail' | 'edit-profile' | 'archive'
  const [selectedGun, setSelectedGun] = useState(null)
  const [editingGun, setEditingGun] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // ---------------------------------------------------------------------------
  // Deep Linking & Browser History (Fitur 1)
  // Reads ?gun=<id> from URL on initial load and synchronizes navigation.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search)
      const gunId = params.get('gun')
      if (gunId) {
        loadGunById(gunId)
      } else {
        setMode('list')
        setSelectedGun(null)
      }
    }

    const loadInitialDeepLink = async () => {
      const params = new URLSearchParams(window.location.search)
      const gunId = params.get('gun')
      if (gunId) {
        await loadGunById(gunId)
        setShowSplash(false)
      }
    }

    const loadGunById = async (id) => {
      try {
        const res = await gunService.getGunById(id)
        if (res?.data) {
          setSelectedGun(res.data)
          setMode('detail')
          return
        }
      } catch {
        // Fallback search in local data
        const local = GUNS_LOCAL.find((g, idx) => String(g.id || `local-${idx}`) === String(id))
        if (local) {
          setSelectedGun(local)
          setMode('detail')
        }
      }
    }

    loadInitialDeepLink()
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Unified navigation handler
  const handleNavigate = (target, payload) => {
    if (target === 'Create') {
      setMode('create')
      window.history.pushState({}, '', window.location.pathname)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'Edit') {
      setEditingGun(payload)
      setMode('edit')
      window.history.pushState({}, '', window.location.pathname)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'Detail') {
      setSelectedGun(payload)
      setMode('detail')
      if (payload?.id) {
        window.history.pushState({ gunId: payload.id }, '', `?gun=${encodeURIComponent(payload.id)}`)
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'EditProfile') {
      setMode('edit-profile')
      window.history.pushState({}, '', window.location.pathname)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'Archive') {
      setMode('archive')
      window.history.pushState({}, '', window.location.pathname)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'ResumeDraft') {
      if (payload?.isCreate) {
        setMode('create')
      } else {
        setEditingGun({ id: payload?.id, ...(payload?.data || {}) })
        setMode('edit')
      }
      window.history.pushState({}, '', window.location.pathname)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // Top-level tab change (Catalog, Cart, Favorites, Profile)
      setTab(target)
      setMode('list')
      setSelectedGun(null)
      setEditingGun(null)
      window.history.pushState({}, '', window.location.pathname)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBackToList = () => {
    setMode('list')
    setSelectedGun(null)
    setEditingGun(null)
    window.history.pushState({}, '', window.location.pathname)
  }

  return (
    <div className="shell">
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      <Header
        tab={mode === 'list' ? tab : ''}
        onTab={(newTab) => handleNavigate(newTab)}
        onNavigateCreate={() => handleNavigate('Create')}
      />

      <main className="main">
        <Suspense fallback={<LoadingFallback />}>
          {/* Sub-page views */}
          {mode === 'create' && (
            <CreateGunPage
              onBack={handleBackToList}
              onSuccess={() => {
                handleBackToList()
                setTab('Catalog')
              }}
            />
          )}

          {mode === 'edit' && (
            <EditGunPage
              gun={editingGun}
              gunId={editingGun?.id}
              onBack={handleBackToList}
              onSuccess={() => {
                handleBackToList()
                setTab('Catalog')
              }}
            />
          )}

          {mode === 'edit-profile' && (
            <EditProfilePage
              onBack={() => setMode('list')}
              onSuccess={() => {
                setMode('list')
                setTab('Profile')
              }}
            />
          )}

          {mode === 'archive' && (
            <ArchivePage
              onBack={() => setMode('list')}
              onNavigateCatalog={() => {
                setMode('list')
                setTab('Catalog')
              }}
            />
          )}

          {mode === 'detail' && selectedGun && (
            <GunDetail
              gun={selectedGun}
              onBack={handleBackToList}
              onEdit={(g) => handleNavigate('Edit', g)}
              onDelete={(g) => setDeleteTarget(g)}
            />
          )}

          {/* Top-level Tabs */}
          {mode === 'list' && (
            <>
              {tab === 'Catalog' && (
                <Catalog
                  onNavigate={(destination, payload) => handleNavigate(destination, payload)}
                />
              )}
              {tab === 'Cart' && (
                <CartPage
                  onBack={() => setTab('Catalog')}
                  onNavigateCatalog={() => setTab('Catalog')}
                />
              )}
              {tab === 'Favorites' && (
                <FavoritesPage
                  onSelectGun={(g) => handleNavigate('Detail', g)}
                  onNavigateCatalog={() => setTab('Catalog')}
                />
              )}
              {tab === 'Profile' && (
                <ProfilePage
                  onReplaySplash={() => setShowSplash(true)}
                  onNavigateEditProfile={() => handleNavigate('EditProfile')}
                  onNavigateArchive={() => handleNavigate('Archive')}
                  onNavigateCart={() => handleNavigate('Cart')}
                  onNavigateFavorites={() => handleNavigate('Favorites')}
                  onResumeDraft={(draft) => handleNavigate('ResumeDraft', draft)}
                />
              )}
            </>
          )}
        </Suspense>
      </main>

      {/* Global Soft-Delete / Archive Confirmation */}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Archive Hardware Record"
        message={`Are you sure you want to archive "${deleteTarget?.name}"? It will be moved to the Archived Armory repository where it can be recovered anytime.`}
        confirmLabel="Archive"
        loading={deleting}
        onConfirm={async () => {
          if (!deleteTarget) return
          try {
            setDeleting(true)
            archiveService.archiveGun(deleteTarget)
            setDeleteTarget(null)
            handleBackToList()
            setTab('Catalog')
          } catch (err) {
            alert(err.message || 'Failed to archive record.')
          } finally {
            setDeleting(false)
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <PWABadge />
      <Footer />
    </div>
  )
}

export default App
