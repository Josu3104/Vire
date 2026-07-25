// src/pages/Feed.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useProjects } from '@/features/projects/context/ProjectContext'
import ProjectCard from '@/features/projects/components/ProjectCard'
import SkeletonCard from '@/shared/components/SkeletonCard/SkeletonCard'
import FilterSidebar from '@/features/common/components/FilterSidebar'
import RightSidebar from '@/features/common/components/RightSidebar'
import AuthModal from '@/shared/components/AuthModal/AuthModal'
import styles from './Feed.module.css'

/* ---- Icons ---- */
const IconSearch = () => (
  <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const IconInbox = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
  </svg>
)

// Grid icon (4 squares)
const IconGrid = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
)

// Scroll / List icon
const IconList = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
)

const IconFilter = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
)

const IconFilterOff = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const SORT_OPTIONS = [
  { value: 'upvotes', label: 'Más votados' },
  { value: 'recent',  label: 'Más recientes' },
  { value: 'az',      label: 'A → Z' },
]

const SCROLL_THRESHOLD = 0.55  // 55% of page

export default function Feed() {
  const { isAuthenticated, isAdmin, currentUser } = useAuth()
  const { projectsState: projects } = useProjects()
  const navigate = useNavigate()

  const [searchQuery, setSearchQuery]     = useState('')
  const [searchMode, setSearchMode]       = useState('projects') // 'projects' | 'users'
  const [userResults, setUserResults]     = useState([])
  const [isSearchingUsers, setIsSearchingUsers] = useState(false)
  const [sortBy, setSortBy]               = useState('upvotes')
  const [filters, setFilters]             = useState({ levels: [], universities: [], branches: [], tags: [] })
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [viewMode, setViewMode]           = useState('scroll')
  
  // Layout states
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false)
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  const pageRef = useRef(null)

  useEffect(() => {
    // Simulate initial loading fetch
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (searchMode === 'users' && searchQuery.trim().length >= 2) {
      const timer = setTimeout(() => {
        setIsSearchingUsers(true)
        import('@/features/users/api/users.api').then(({ searchUsers }) => {
          searchUsers(searchQuery)
            .then(res => setUserResults(res))
            .catch(console.error)
            .finally(() => setIsSearchingUsers(false))
        })
      }, 400)
      return () => clearTimeout(timer)
    } else {
      setUserResults([])
    }
  }, [searchQuery, searchMode])

  // Soft-wall: scroll trigger for guests
  useEffect(() => {
    if (isAuthenticated) return

    const handleScroll = () => {
      const el = document.documentElement
      const scrolled = el.scrollTop / (el.scrollHeight - el.clientHeight)
      if (scrolled > SCROLL_THRESHOLD) setShowAuthModal(true)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isAuthenticated])

  const handleCardClick = useCallback((project) => {
    if (!isAuthenticated) { setShowAuthModal(true); return }
    navigate(`/proyecto/${project.id}`)
  }, [isAuthenticated, navigate])

  // ── FIXED: non-admin users only see "Público" projects ──
  const visible = projects
    .filter((p) => p.status === 'Público' || isAdmin || (currentUser && p.authorIds?.includes(currentUser.id)))
    .filter((p) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
        )
      }
      return true
    })
    .filter((p) => {
      if (filters.levels && filters.levels.length && !filters.levels.includes(p.academicLevel)) return false
      if (filters.universities.length && !filters.universities.includes(p.university)) return false
      if (filters.branches.length && !filters.branches.includes(p.branch)) return false
      if (filters.tags.length && !p.tags?.some((t) => filters.tags.includes(t))) return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'upvotes') return b.upvotes - a.upvotes
      if (sortBy === 'recent')  return new Date(b.createdAt) - new Date(a.createdAt)
      if (sortBy === 'az')      return a.title.localeCompare(b.title)
      return 0
    })

  return (
    <div className={styles.page} ref={pageRef}>
      {/* Search hero */}
      <div className={styles.hero}>
        <p className={styles.heroTitle}>
          Explorando <span>{searchMode === 'projects' ? 'proyectos de ingeniería' : 'talento y colegas'}</span>
        </p>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', justifyContent: 'center' }}>
          <button 
            className={`btn btn-sm ${searchMode === 'projects' ? 'btn-primary' : 'btn-secondary'}`} 
            onClick={() => setSearchMode('projects')}
          >
            Proyectos
          </button>
          <button 
            className={`btn btn-sm ${searchMode === 'users' ? 'btn-primary' : 'btn-secondary'}`} 
            onClick={() => setSearchMode('users')}
          >
            Usuarios
          </button>
        </div>
        <div className={styles.searchRow}>
          <div className={styles.searchWrapper}>
            <IconSearch />
            <input
              id="feed-search"
              type="search"
              className={styles.searchInput}
              placeholder={searchMode === 'projects' ? "Buscar proyectos, tecnologías, tags..." : "Buscar por nombre..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Buscar proyectos"
            />
          </div>

          <select
            id="feed-sort"
            className={styles.sortSelect}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Ordenar por"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* ── View mode toggle ── */}
          <div className={styles.viewToggle} role="group" aria-label="Modo de vista">
            <button
              id="view-scroll-btn"
              className={`${styles.viewBtn} ${viewMode === 'scroll' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('scroll')}
              title="Modo Scroll (una columna)"
              aria-pressed={viewMode === 'scroll'}
            >
              <IconList />
            </button>
            <button
              id="view-grid-btn"
              className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('grid')}
              title="Modo Grid (cuadrícula)"
              aria-pressed={viewMode === 'grid'}
            >
              <IconGrid />
            </button>
          </div>
          
          {/* Desktop Filter Toggle */}
          <button
            className={styles.desktopFilterToggle}
            onClick={() => setIsFilterCollapsed(!isFilterCollapsed)}
            title={isFilterCollapsed ? "Mostrar Filtros" : "Ocultar Filtros"}
          >
            {isFilterCollapsed ? <IconFilter /> : <IconFilterOff />}
          </button>
        </div>
        
        {/* Mobile Filter Toggle */}
        <div className={styles.mobileFilterToggle}>
          <button 
            className="btn btn-secondary btn-sm" 
            style={{ width: '100%' }}
            onClick={() => setIsMobileFilterOpen(true)}
          >
            <IconFilter /> Mostrar Filtros
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className={`${styles.layout} ${isFilterCollapsed ? styles.layoutCollapsed : ''}`}>
        
        {/* Sidebar Left: Filters */}
        <div className={`${styles.sidebarCol} ${isFilterCollapsed ? styles.hiddenDesktop : ''}`}>
          <FilterSidebar 
            filters={filters} 
            onChange={setFilters} 
            isOpen={isMobileFilterOpen}
            onClose={() => setIsMobileFilterOpen(false)}
          />
        </div>

        {/* Overlay for mobile drawer */}
        {isMobileFilterOpen && (
          <div 
            className={styles.mobileOverlay} 
            onClick={() => setIsMobileFilterOpen(false)} 
            aria-label="Cerrar overlay de filtros"
          />
        )}

        {/* Content Central */}
        <main className={styles.mainCol}>
          <div className={styles.resultsHeader}>
            <p className={styles.resultCount}>
              {searchMode === 'projects' ? (
                <><strong>{visible.length}</strong> proyecto{visible.length !== 1 ? 's' : ''} encontrado{visible.length !== 1 ? 's' : ''}</>
              ) : (
                <><strong>{userResults.length}</strong> usuario{userResults.length !== 1 ? 's' : ''} encontrado{userResults.length !== 1 ? 's' : ''}</>
              )}
            </p>
            <p className={styles.viewModeLabel}>
              {viewMode === 'scroll' ? '↕ Modo Scroll' : '▦ Modo Grid'}
            </p>
          </div>

          {isLoading || isSearchingUsers ? (
            <div className={viewMode === 'grid' ? styles.grid : styles.scrollList}>
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={`skeleton-${i}`} />
              ))}
            </div>
          ) : (
            <div className={viewMode === 'grid' ? styles.grid : styles.scrollList}>
              {searchMode === 'users' ? (
                userResults.length > 0 ? (
                  userResults.map((u) => (
                    <div 
                      key={u.id} 
                      onClick={() => {
                        if (!isAuthenticated) { setShowAuthModal(true); return; }
                        navigate(`/usuario/${u.id}`)
                      }}
                      style={{
                        background: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '16px',
                        cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: 'var(--shadow-sm)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-400)'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                    >
                      <img src={u.avatarUrl || 'https://api.dicebear.com/8.x/avataaars/svg'} alt={u.name} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-default)' }} />
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>
                          {u.name}
                          {(u.role === 'member' || u.role === 'admin') && <span style={{ color: '#3b82f6', marginLeft: '6px', fontSize: '14px' }}>✓</span>}
                        </h3>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>{u.profile?.university || 'Ingeniero'}</p>
                        {u.profile?.bio && <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{u.profile.bio}</p>}
                      </div>
                    </div>
                  ))
                ) : (
                  searchQuery.length >= 2 && <div className={styles.emptyState}>No se encontraron usuarios para "{searchQuery}"</div>
                )
              ) : (
                visible.length > 0 ? (
                  visible.map((p) => (
                    <ProjectCard key={p.id} project={p} onClick={() => handleCardClick(p)} variant={viewMode} />
                  ))
                ) : (
                  <div className={styles.emptyState}>
                    <p>No se encontraron proyectos con esos filtros.</p>
                    {searchQuery.length > 0 && (
                      <button className="btn btn-secondary btn-sm" style={{ marginTop: '16px' }} onClick={() => setSearchQuery('')}>
                        Limpiar búsqueda
                      </button>
                    )}
                  </div>
                )
              )}
            </div>
          )}

          {/* Guest upsell banner */}
          {!isAuthenticated && (
            <div className={styles.guestBanner}>
              <p className={styles.guestBannerText}>
                <strong>¿Quieres ver más?</strong> Inicia sesión para acceder a todos los proyectos, descargar papers y colaborar.
              </p>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowAuthModal(true)}
                id="feed-cta-login"
              >
                Unirme ahora
              </button>
            </div>
          )}
        </main>
        
        {/* Sidebar Right: Widgets (Desktop Only) */}
        <div className={styles.rightSidebarCol}>
          <RightSidebar />
        </div>
      </div>

      {/* Auth Modal (Soft-Wall) */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  )
}
