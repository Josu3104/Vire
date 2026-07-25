// src/pages/Auth.jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useTheme } from '@/core/theme/ThemeContext'
import styles from './Auth.module.css'

const IconInfo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
)

export default function Auth() {
  const { login, register, isLoading, authError, clearError, isAuthenticated } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('login')
  const [formData, setFormData] = useState({ name: '', email: '', password: '', ieeeId: '', cimeqhId: '' })
  // Track if we just registered to suppress the useEffect redirect
  const justRegisteredRef = useRef(false)

  // Redirect if already logged in (but NOT right after registering — we handle that in handleSubmit)
  useEffect(() => {
    if (isAuthenticated && !justRegisteredRef.current) navigate('/explorar', { replace: true })
  }, [isAuthenticated, navigate])

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
      justRegisteredRef.current = true
      result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        ieeeId: formData.ieeeId,
        cimeqhId: formData.cimeqhId,
      })
    }
    if (result.success) {
      if (activeTab === 'register') {
        navigate('/onboarding')
      } else {
        navigate('/explorar')
      }
    }
  }

  const switchTab = (tab) => {
    setActiveTab(tab)
    clearError()
    setFormData({ name: '', email: '', password: '', ieeeId: '', cimeqhId: '' })
  }

  return (
    <div className={styles.page}>
      {/* Background decorations */}
      <div className={styles.bgDecor}>
        <div className={styles.bgGrid} />
        <div className={styles.bgOrb1} />
        <div className={styles.bgOrb2} />
      </div>

      <div className={styles.authCard}>
        {/* Left brand panel */}
        <div className={styles.leftPanel}>
          <div className={styles.brandSection}>
            <div className={styles.logoRow}>
              <img src="/Vire-logo.png" alt="Vire Logo" className={styles.logoImg} />
              <div className={styles.logoLabel}>
                <strong style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: '2.5rem', lineHeight: '1', color: '#ffffff' }}>Vire</strong>
                <span style={{ fontFamily: 'monospace, sans-serif', fontSize: '10px', fontWeight: 600, color: 'var(--cyan-400)', letterSpacing: '0.15em' }}>By BALAM</span>
              </div>
            </div>

            <h1 className={styles.headline}>
              La Vitrina Independiente de{' '}
              <span className={styles.headlineHighlight}>Ingeniería</span>, Investigación y Tecnología
            </h1>

            <p className={styles.tagline}>
              Descubre proyectos innovadores, accede a papers técnicos y conecta con la comunidad de ingeniería de Honduras en un hub totalmente soberano.
            </p>

            <div className={styles.stats}>
              <div className={styles.stat}>
                <div className={styles.statValue}><span>8</span>+</div>
                <div className={styles.statLabel}>Proyectos</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}><span>4</span></div>
                <div className={styles.statLabel}>Universidades</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}><span>5</span></div>
                <div className={styles.statLabel}>Ingenieros</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className={styles.rightPanel}>
          <div className={styles.formCard}>
            <h2 className={styles.formTitle}>
              {activeTab === 'login' ? 'Bienvenido de vuelta' : 'Crear cuenta'}
            </h2>
            <p className={styles.formSubtitle}>
              {activeTab === 'login'
                ? 'Ingresa tus credenciales para acceder.'
                : 'Únete a la comunidad de ingeniería.'}
            </p>

            {/* Tabs */}
            <div className={styles.tabs} role="tablist">
              <button
                className={`${styles.tab} ${activeTab === 'login' ? styles.active : ''}`}
                onClick={() => switchTab('login')}
                role="tab"
                aria-selected={activeTab === 'login'}
                id="auth-tab-login"
              >
                Iniciar Sesión
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'register' ? styles.active : ''}`}
                onClick={() => switchTab('register')}
                role="tab"
                aria-selected={activeTab === 'register'}
                id="auth-tab-register"
              >
                Registrarse
              </button>
            </div>

            {/* Form */}
            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              {activeTab === 'register' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="auth-name">Nombre completo</label>
                  <input
                    id="auth-name"
                    name="name"
                    type="text"
                    className="form-input"
                    placeholder="Ej: María Fernanda Suazo"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    autoComplete="name"
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="auth-email">Correo electrónico</label>
                <input
                  id="auth-email"
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
                <label className="form-label" htmlFor="auth-password">Contraseña</label>
                <input
                  id="auth-password"
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="auth-ieee-id">
                        ID IEEE <em style={{ color: 'var(--text-muted)', fontStyle: 'normal' }}>(opcional)</em>
                      </label>
                      <input
                        id="auth-ieee-id"
                        name="ieeeId"
                        type="text"
                        className="form-input"
                        placeholder="Ej: 48213"
                        value={formData.ieeeId}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="auth-cimeqh-id">
                        ID CIMEQH <em style={{ color: 'var(--text-muted)', fontStyle: 'normal' }}>(opcional)</em>
                      </label>
                      <input
                        id="auth-cimeqh-id"
                        name="cimeqhId"
                        type="text"
                        className="form-input"
                        placeholder="Ej: 1024"
                        value={formData.cimeqhId}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className={styles.membershipHint}>
                    <IconInfo />
                    <span>
                      Proporcionar tu ID permite validar tu cuenta para <strong>publicar proyectos</strong> y acceder a <strong>descargas exclusivas</strong>. Ambos campos son opcionales.
                    </span>
                  </div>
                </>
              )}

              {authError && (
                <div className={styles.errorBox} role="alert">{authError}</div>
              )}

              <button
                id="auth-submit-btn"
                type="submit"
                className={styles.submitBtn}
                disabled={isLoading}
              >
                {isLoading ? (
                  <><div className={styles.spinner} /> Verificando...</>
                ) : activeTab === 'login' ? (
                  'Entrar a Vire'
                ) : (
                  'Crear mi cuenta'
                )}
              </button>
            </form>

            {/* Demo hint */}
            <div style={{ marginTop: 16 }} className={styles.divider}>Cuentas de demo</div>
            <div className={styles.demoHint}>
              <strong>Regular:</strong> <code>diego.rivera@unitec.edu.hn</code> / <code>password123</code><br />
              <strong>Admin:</strong> <code>admin@ieee.hn</code> / <code>admin123</code>
            </div>

            {/* Allied Orgs */}
            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Organizaciones Aliadas de Certificación
              </span>
              <div className={styles.footerLogos} style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '14px', opacity: 0.85 }}>
                <img src={theme === 'light' ? '/ieee-logo-azul.png' : '/ieee-logo.png'} alt="IEEE Logo" style={{ height: 32, objectFit: 'contain' }} />
                <img src={theme === 'light' ? '/logo-cimeqh-color.avif' : '/logo-cimeqh-blanco.avif'} alt="CIMEQH Logo" style={{ height: 32, objectFit: 'contain' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
