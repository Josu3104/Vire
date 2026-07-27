// src/pages/Auth.jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useTheme } from '@/core/theme/ThemeContext'
import { checkEmail } from '@/features/auth/api/auth.api'
import styles from './Auth.module.css'

const IconInfo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
)

const IconEye = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const IconEyeOff = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

const getPasswordStrength = (pass) => {
  if (!pass) return { score: 0, text: '', color: 'transparent', tips: [] };
  
  let score = 0;
  const tips = [];
  
  if (pass.length < 6) {
    tips.push('Mínimo 6 caracteres');
  } else {
    score += 1;
    if (pass.length >= 8) score += 1;
  }
  
  const hasNum = /\d/.test(pass);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
  const hasUpper = /[A-Z]/.test(pass);
  const hasLower = /[a-z]/.test(pass);
  
  if (score > 0) {
    let varieties = 0;
    if (hasNum) varieties++;
    else tips.push('Incluye números');
    
    if (hasSpecial) varieties++;
    else tips.push('Incluye caracteres especiales (!@#$)');
    
    if (hasUpper && hasLower) varieties++;
    else tips.push('Usa mayúsculas y minúsculas');
    
    if (varieties >= 1) score = Math.max(score, 2);
    if (varieties >= 3 && pass.length >= 8) score = 3;
  }

  if (score === 1) return { score, color: '#ef4444', text: 'Débil', tips };
  if (score === 2) return { score, color: '#eab308', text: 'Media', tips };
  if (score >= 3) return { score, color: '#22c55e', text: 'Fuerte', tips };
  
  return { score: 0, color: 'transparent', text: '', tips };
}

export default function Auth() {
  const { login, register, isLoading, authError, clearError, isAuthenticated } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('login')
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', ieeeId: '', cimeqhId: '' })
  const [localError, setLocalError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [emailStatus, setEmailStatus] = useState(null)
  
  const passStrength = getPasswordStrength(formData.password)
  
  // Track if we just registered to suppress the useEffect redirect
  const justRegisteredRef = useRef(false)

  // Redirect if already logged in (but NOT right after registering — we handle that in handleSubmit)
  useEffect(() => {
    if (isAuthenticated && !justRegisteredRef.current) navigate('/explorar', { replace: true })
  }, [isAuthenticated, navigate])

  const handleChange = (e) => {
    clearError()
    setLocalError(null)
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleEmailBlur = async () => {
    if (activeTab !== 'register' || !formData.email) return
    setEmailStatus('checking')
    try {
      const data = await checkEmail(formData.email)
      setEmailStatus(data.available ? 'available' : 'taken')
      if (!data.available) {
        setLocalError('El correo electrónico ya está en uso')
      }
    } catch (e) {
      setEmailStatus(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    let result
    if (activeTab === 'login') {
      result = await login(formData.email, formData.password)
      if (result.success) {
        navigate('/explorar')
      }
    } else {
      if (emailStatus === 'taken') {
        setLocalError('El correo electrónico ya está en uso')
        return
      }
      if (formData.password.length < 6) {
        setLocalError('La contraseña debe tener al menos 6 caracteres')
        return
      }
      if (formData.password !== formData.confirmPassword) {
        setLocalError('Las contraseñas no coinciden')
        return
      }
      navigate('/onboarding', { state: { registrationData: formData } })
    }
  }

  const switchTab = (tab) => {
    setActiveTab(tab)
    clearError()
    setLocalError(null)
    setEmailStatus(null)
    setFormData({ name: '', email: '', password: '', confirmPassword: '', ieeeId: '', cimeqhId: '' })
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
                  onBlur={handleEmailBlur}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="auth-password">Contraseña</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="auth-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex'
                    }}
                  >
                    {showPassword ? <IconEyeOff /> : <IconEye />}
                  </button>
                </div>
                {activeTab === 'register' && formData.password.length > 0 && (
                  <div style={{ marginTop: '8px', fontSize: '0.85rem', width: '100%' }}>
                    <div style={{ display: 'flex', gap: '4px', height: '4px', marginBottom: '6px' }}>
                      <div style={{ flex: 1, backgroundColor: passStrength.score >= 1 ? passStrength.color : 'var(--border-subtle)', borderRadius: '2px', transition: 'all 0.3s' }} />
                      <div style={{ flex: 1, backgroundColor: passStrength.score >= 2 ? passStrength.color : 'var(--border-subtle)', borderRadius: '2px', transition: 'all 0.3s' }} />
                      <div style={{ flex: 1, backgroundColor: passStrength.score >= 3 ? passStrength.color : 'var(--border-subtle)', borderRadius: '2px', transition: 'all 0.3s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: passStrength.color, fontWeight: 500, fontSize: '0.85rem' }}>
                      <span>{passStrength.text}</span>
                    </div>
                    {passStrength.tips.length > 0 && (
                      <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {passStrength.tips.map((t, i) => <li key={i}>{t}</li>)}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {activeTab === 'register' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="auth-confirm-password">Confirmar Contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="auth-confirm-password"
                      name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      autoComplete="new-password"
                      style={{ paddingRight: '40px' }}
                    />
                  </div>
                </div>
              )}

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

              {(authError || localError) && (
                <div className={styles.errorBox} role="alert">{authError || localError}</div>
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
                  'Continuar'
                )}
              </button>
            </form>


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
