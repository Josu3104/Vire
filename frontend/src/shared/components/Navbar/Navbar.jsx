// src/components/Navbar.jsx
import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useTheme } from '@/core/theme/ThemeContext'
import { useGlobalStats } from '@/core/context/GlobalStatsContext'
import PublishModal from '@/features/projects/components/PublishModal'
import styles from './Navbar.module.css'

/* ---- Icons ---- */
const IconSun = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
)

const IconMoon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
)

const IconCompass = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
  </svg>
)

const IconHome = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)

const IconMessage = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
  </svg>
)

const IconBell = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
)

const IconShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)

const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)

const IconLogOut = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

const IconX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const IconMenu = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="6"  x2="21" y2="6"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
)

export default function Navbar() {
  const { currentUser, isAdmin, isAuthenticated, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { unreadMessages, unreadNotifications } = useGlobalStats()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [publishModalOpen, setPublishModalOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    setDropdownOpen(false)
    navigate('/')
  }

  const navLinks = [
    { to: '/explorar', label: 'Inicio', icon: <IconHome /> },
    { to: '/mensajes', label: 'Mensajes', icon: (
        <div style={{ position: 'relative', display: 'flex' }}>
          <IconMessage />
          {unreadMessages > 0 && <span className={styles.notificationBadge}>{unreadMessages}</span>}
        </div>
      ) 
    },
    { to: '/notifications', label: 'Notificaciones', icon: (
        <div style={{ position: 'relative', display: 'flex' }}>
          <IconBell />
          {unreadNotifications > 0 && <span className={styles.notificationBadge}>{unreadNotifications}</span>}
        </div>
      ) 
    },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin', icon: <IconShield /> }] : []),
  ]

  return (
    <>
      <nav className={styles.navbar}>
        {/* Logo */}
        <NavLink to="/explorar" className={styles.logo}>
          <img src="/Vire-logo.png" alt="Vire Logo" className={styles.logoImg} />
          <div className={styles.logoText}>
            Vire
            <span>By BALAM</span>
          </div>
        </NavLink>

        {/* Desktop nav links */}
        <div className={styles.nav}>
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
            >
              {link.icon} {link.label}
            </NavLink>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className={styles.actions}>
          <button 
            onClick={toggleTheme} 
            className="btn btn-secondary" 
            style={{ padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? <IconSun /> : <IconMoon />}
          </button>
          
          {isAuthenticated && (
            <button className={styles.publishBtn} onClick={() => setPublishModalOpen(true)}>
              ➕ Publicar
            </button>
          )}
          {isAdmin && <span className={styles.adminBadge}>Admin</span>}

          {/* Avatar + Dropdown */}
          <div className={styles.avatar} ref={dropdownRef}>
            <div
              className={styles.avatarImg}
              onClick={() => setDropdownOpen((v) => !v)}
              role="button"
              tabIndex={0}
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
              aria-label="Menú de usuario"
              onKeyDown={(e) => e.key === 'Enter' && setDropdownOpen((v) => !v)}
            >
              {currentUser?.avatarUrl || currentUser?.avatar ? (
                <img src={currentUser.avatarUrl || currentUser.avatar} alt={currentUser.name} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-400)', fontSize: 14 }}>
                  {currentUser?.name?.[0] ?? '?'}
                </div>
              )}
            </div>

            {dropdownOpen && (
              <div className={styles.dropdown} role="menu">
                <div className={styles.dropdownHeader}>
                  <div className={styles.dropdownName}>{currentUser?.name}</div>
                  <div className={styles.dropdownEmail}>{currentUser?.email}</div>
                </div>
                <button
                  className={styles.dropdownItem}
                  onClick={() => { setDropdownOpen(false); navigate('/perfil') }}
                  role="menuitem"
                >
                  <IconUser /> Mi Perfil
                </button>
                <button
                  className={`${styles.dropdownItem} ${styles.danger}`}
                  onClick={handleLogout}
                  role="menuitem"
                >
                  <IconLogOut /> Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Publish Modal */}
      {publishModalOpen && <PublishModal isOpen={publishModalOpen} onClose={() => setPublishModalOpen(false)} />}
    </>
  )
}
