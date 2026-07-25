// src/components/AuthModal.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'
import styles from './AuthModal.module.css'

const IconLock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

const IconInfo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
)

const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

export default function AuthModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('login')
  const [formData, setFormData] = useState({ name: '', email: '', password: '', ieeeId: '', cimeqhId: '' })
  const { login, register, isLoading, authError, clearError } = useAuth()
  const navigate = useNavigate()

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const handleChange = (e) => {
    clearError()
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    let result
    if (activeTab === 'login') {
      result = await login(formData.email, formData.password)
    } else {
      result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        ieeeId: formData.ieeeId,
        cimeqhId: formData.cimeqhId,
      })
    }
    if (result.success) {
      onClose?.()
      navigate('/explorar')
    }
  }

  const switchTab = (tab) => {
    setActiveTab(tab)
    clearError()
    setFormData({ name: '', email: '', password: '', ieeeId: '', cimeqhId: '' })
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Autenticación requerida">
      <div className={styles.modal}>
        <div className={styles.topBar} />
        <div className={styles.body}>
          {/* Lock icon */}
          <div className={styles.lockIcon}><IconLock /></div>

          <h2 className={styles.title}>Contenido exclusivo</h2>
          <p className={styles.subtitle}>
            Únete a la comunidad IEEE para ver proyectos completos, descargar papers y colaborar con ingenieros de toda la región.
          </p>

          {/* Tabs */}
          <div className={styles.tabs} role="tablist">
            <button
              className={`${styles.tab} ${activeTab === 'login' ? styles.active : ''}`}
              onClick={() => switchTab('login')}
              role="tab"
              aria-selected={activeTab === 'login'}
              id="tab-login"
            >
              Iniciar Sesión
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'register' ? styles.active : ''}`}
              onClick={() => switchTab('register')}
              role="tab"
              aria-selected={activeTab === 'register'}
              id="tab-register"
            >
              Registrarse
            </button>
          </div>

          {/* Form */}
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {activeTab === 'register' && (
              <div className="form-group">
                <label className="form-label" htmlFor="modal-name">Nombre completo</label>
                <input
                  id="modal-name"
                  name="name"
                  type="text"
                  className="form-input"
                  placeholder="Ej: María Fernanda Suazo"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="modal-email">Correo electrónico</label>
              <input
                id="modal-email"
                name="email"
                type="email"
                className="form-input"
                placeholder="usuario@universidad.edu.hn"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="modal-password">Contraseña</label>
              <input
                id="modal-password"
                name="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {activeTab === 'register' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="modal-ieee-id">
                      ID IEEE <em style={{ color: 'var(--text-muted)', fontStyle: 'normal' }}>(opcional)</em>
                    </label>
                    <input
                      id="modal-ieee-id"
                      name="ieeeId"
                      type="text"
                      className="form-input"
                      placeholder="Ej: 48213"
                      value={formData.ieeeId}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="modal-cimeqh-id">
                      ID CIMEQH <em style={{ color: 'var(--text-muted)', fontStyle: 'normal' }}>(opcional)</em>
                    </label>
                    <input
                      id="modal-cimeqh-id"
                      name="cimeqhId"
                      type="text"
                      className="form-input"
                      placeholder="Ej: 1024"
                      value={formData.cimeqhId}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className={styles.membershipNote}>
                  <IconInfo />
                  <span>Proporcionar tu ID permite validar tu cuenta para <strong>publicar proyectos</strong> y acceder a <strong>descargas exclusivas</strong>. Ambos campos son opcionales.</span>
                </div>
              </>
            )}

            {authError && <div className={styles.error} role="alert">{authError}</div>}

            <button
              id="auth-modal-submit"
              type="submit"
              className={styles.submitBtn}
              disabled={isLoading}
            >
              {isLoading ? (
                <><div className={styles.spinner} /> Verificando...</>
              ) : (
                activeTab === 'login' ? 'Entrar a Vire' : 'Crear mi cuenta'
              )}
            </button>
          </form>

          {/* Feature list */}
          <div className={styles.features}>
            {[
              'Acceso completo a papers y archivos CAD',
              'Participa en la comunidad de ingeniería',
              'Publica y promociona tus proyectos',
            ].map((f) => (
              <div key={f} className={styles.feature}>
                <IconCheck /> {f}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
