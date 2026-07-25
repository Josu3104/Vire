// src/pages/OnboardingWizard.jsx
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useToast } from '@/core/notifications/ToastContext'
import styles from './OnboardingWizard.module.css'

// ─── Avatar Options ────────────────────────────────────────────────────────
const AVATARS = [
  { id: 'av1', url: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Engineer1&backgroundColor=1e3a5f', label: 'Ingeniero Azul' },
  { id: 'av2', url: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Engineer2&backgroundColor=0f3d2e', label: 'Investigador Verde' },
  { id: 'av3', url: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Robotic1&backgroundColor=2d1b69', label: 'Robótica Púrpura' },
  { id: 'av4', url: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Circuit1&backgroundColor=3d1a1a', label: 'Circuito Rojo' },
  { id: 'av5', url: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Gear1&backgroundColor=1a3d3d', label: 'Engranaje Cyan' },
  { id: 'av6', url: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Tech1&backgroundColor=2d2d0f', label: 'Techie Dorado' },
]

const BANNERS = [
  { id: 'bn1', url: 'https://picsum.photos/seed/circuit-board/1400/400', label: 'Circuito PCB' },
  { id: 'bn2', url: 'https://picsum.photos/seed/robotics-lab/1400/400', label: 'Lab de Robótica' },
  { id: 'bn3', url: 'https://picsum.photos/seed/drone-sky/1400/400', label: 'Drones' },
  { id: 'bn4', url: 'https://picsum.photos/seed/code-dark/1400/400', label: 'Código' },
]

const ACADEMIC_STATUSES = [
  'Estudiante Universitario',
  'Estudiante de Colegio Técnico',
  'Estudiante de Postgrado',
  'Ingeniero Colegiado',
  'Doctor/Investigador',
]

const TECHNICAL_COLLEGES = [
  'ITEE',
  'Instituto Técnico Eléctrico Alemán (Técnico Alemán)',
  'INFOP',
]

const UNIVERSITIES = [
  'UNITEC',
  'UNAH',
  'UJCV',
  'UTH',
  'UNICAH',
]

const GLOBAL_OPTIONS = [
  'Otro',
  'Ninguno',
]

// ─── Step Indicator ─────────────────────────────────────────────────────────
function StepIndicator({ current, total }) {
  return (
    <div className={styles.stepIndicator}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`${styles.stepDot} ${i < current ? styles.stepDone : ''} ${i === current ? styles.stepActive : ''}`}
        />
      ))}
    </div>
  )
}

// ─── Skip Warning Modal ──────────────────────────────────────────────────────
function SkipModal({ onComplete, onSkip }) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalIcon}>⚠️</div>
        <h2 className={styles.modalTitle}>¡Perfil Incompleto!</h2>
        <p className={styles.modalBody}>
          Si decides saltar, tu cuenta quedará con rol <strong>Común</strong>. No
          podrás realizar publicaciones, subir papers ni interactuar con la bolsa de
          empleo hasta completar estos datos.
        </p>
        <div className={styles.modalActions}>
          <button className={styles.modalBtnPrimary} onClick={onComplete}>
            Completar ahora
          </button>
          <button className={styles.modalBtnGhost} onClick={onSkip}>
            Saltar de todos modos
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function OnboardingWizard() {
  const { currentUser, updateProfile } = useAuth()
  const { error } = useToast()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [step, setStep] = useState(0) // 0 | 1 | 2
  const [showSkipModal, setShowSkipModal] = useState(false)

  // Step 1 data
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0].url)
  const [selectedBanner, setSelectedBanner] = useState(BANNERS[0].url)

  // Step 2 data
  const [academicStatus, setAcademicStatus] = useState('')
  const [institution, setInstitution] = useState('')
  const [campus, setCampus] = useState('')
  const [city, setCity] = useState('')

  // Step 3 data
  const [birthdate, setBirthdate] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')

  // ── Validation helpers ────────────────────────────────────────────────────
  const coreFieldsFilled = academicStatus && institution && birthdate

  const handleNext = () => {
    if (step < 2) setStep((s) => s + 1)
  }

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1)
  }

  const handleAcademicStatusChange = (status) => {
    setAcademicStatus(status)
    setInstitution('') // Reset institution
  }

  const getFilteredInstitutions = () => {
    if (!academicStatus) return []
    if (academicStatus === 'Estudiante de Colegio Técnico') {
      return [...TECHNICAL_COLLEGES, ...GLOBAL_OPTIONS]
    }
    return [...UNIVERSITIES, ...GLOBAL_OPTIONS]
  }

  const handleSkipAttempt = () => {
    if (!coreFieldsFilled) {
      setShowSkipModal(true)
    } else {
      handleFinish()
    }
  }

  const handleForceSkip = () => {
    try {
      setShowSkipModal(false)
      updateProfile({ role: 'comun',  isContactPublic: true,
      onboardingComplete: true 
      })
      navigate('/explorar')
    } catch (e) {
      console.error("Error in handleForceSkip:", e)
      navigate('/explorar')
    }
  }

  const handleFinish = () => {
    try {
      updateProfile({
        avatarUrl: selectedAvatar || null,
        bannerUrl: selectedBanner || null,
        academicStatus: academicStatus || null,
        university: institution || null,
        campus: campus ? campus.trim() : null,
        city: city ? city.trim() : null,
        birthdate: birthdate || null,
        phone: phone ? phone.trim() : null,
        bio: bio ? bio.trim() : null,
        availabilityState: "available",
        isContactPublic: true,         
        onboardingComplete: true, 
      })
      navigate('/explorar')
    } catch (e) {
      console.error("Error in handleFinish:", e)
      error("Hubo un error al guardar tu perfil. Inténtalo de nuevo.")
    }
  }

  const STEPS = [
    { label: 'Identidad Visual', emoji: '🎨' },
    { label: 'Datos Académicos', emoji: '🎓' },
    { label: 'Contacto & Bio', emoji: '📋' },
  ]

  return (
    <div className={styles.page}>
      {/* BG decoration */}
      <div className={styles.bgOrb1} />
      <div className={styles.bgOrb2} />

      {/* Card */}
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.cardHeader}>
          <div className={styles.logoRow}>
            <img src="/Vire-logo.png" alt="Vire Logo" style={{ width: 24, height: 24, objectFit: 'contain' }} />
            <span className={styles.logoLabel}>Vire</span>
          </div>
          <h1 className={styles.title}>Configura tu Perfil</h1>
          <p className={styles.subtitle}>
            Paso <strong>{step + 1}</strong> de {STEPS.length} — {STEPS[step].emoji} {STEPS[step].label}
          </p>
          <StepIndicator current={step} total={STEPS.length} />
        </div>

        {/* ── STEP 0: Identity ────────────────────────────────────────────── */}
        {step === 0 && (
          <div className={styles.stepBody}>
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Elige tu Avatar</h3>
              <div className={styles.avatarGrid}>
                {AVATARS.map((av) => (
                  <button
                    key={av.id}
                    className={`${styles.avatarOption} ${selectedAvatar === av.url ? styles.avatarSelected : ''}`}
                    onClick={() => setSelectedAvatar(av.url)}
                    title={av.label}
                    type="button"
                  >
                    <img src={av.url} alt={av.label} />
                    {selectedAvatar === av.url && <div className={styles.avatarCheck}>✓</div>}
                  </button>
                ))}
              </div>
              {/* TODO: Conectar con Storage real para imágenes personalizadas */}
              <input type="file" accept="image/*" style={{ display: 'none' }} ref={fileInputRef} />
              <button
                type="button"
                className={styles.uploadHint}
                onClick={() => fileInputRef.current?.click()}
              >
                📁 Subir foto personalizada (próximamente)
              </button>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Elige tu Banner de Portada</h3>
              <div className={styles.bannerGrid}>
                {BANNERS.map((bn) => (
                  <button
                    key={bn.id}
                    className={`${styles.bannerOption} ${selectedBanner === bn.url ? styles.bannerSelected : ''}`}
                    onClick={() => setSelectedBanner(bn.url)}
                    type="button"
                  >
                    <img src={bn.url} alt={bn.label} />
                    <span className={styles.bannerLabel}>{bn.label}</span>
                    {selectedBanner === bn.url && <div className={styles.bannerCheck}>✓</div>}
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ── STEP 1: Academic Info ─────────────────────────────────────── */}
        {step === 1 && (
          <div className={styles.stepBody}>
            <div className={styles.formGrid}>
              <div className="form-group">
                <label className="form-label" htmlFor="ob-status">
                  Estado Académico <span className={styles.required}>*</span>
                </label>
                <select
                  id="ob-status"
                  className="form-input"
                  value={academicStatus}
                  onChange={(e) => handleAcademicStatusChange(e.target.value)}
                >
                  <option value="">Selecciona tu estado...</option>
                  {ACADEMIC_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ob-institution">
                  Institución <span className={styles.required}>*</span>
                </label>
                <select
                  id="ob-institution"
                  className="form-input"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  disabled={!academicStatus}
                >
                  <option value="">Selecciona tu institución...</option>
                  {getFilteredInstitutions().map((ins) => (
                    <option key={ins} value={ins}>{ins}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ob-campus">
                  Sede / Campus
                </label>
                <input
                  id="ob-campus"
                  type="text"
                  className="form-input"
                  placeholder="Ej: Campus Tegucigalpa Norte"
                  value={campus}
                  onChange={(e) => setCampus(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ob-city">
                  Ciudad
                </label>
                <input
                  id="ob-city"
                  type="text"
                  className="form-input"
                  placeholder="Ej: Tegucigalpa"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Contact & Bio ─────────────────────────────────────── */}
        {step === 2 && (
          <div className={styles.stepBody}>
            <div className={styles.formGrid}>
              <div className="form-group">
                <label className="form-label" htmlFor="ob-birthdate">
                  Fecha de Nacimiento <span className={styles.required}>*</span>
                </label>
                <input
                  id="ob-birthdate"
                  type="date"
                  className="form-input"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ob-phone">
                  Teléfono Profesional <span className={styles.optional}>(opcional)</span>
                </label>
                <input
                  id="ob-phone"
                  type="tel"
                  className="form-input"
                  placeholder="Ej: +504 9999-8888"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 8 }}>
              <label className="form-label" htmlFor="ob-bio">
                Descripción / Bio Breve <span className={styles.optional}>(opcional)</span>
              </label>
              <textarea
                id="ob-bio"
                className="form-input"
                placeholder="Cuéntanos brevemente sobre ti: ¿en qué área te especializas? ¿qué proyectos te apasionan?"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>
          </div>
        )}

        {/* ── Footer Actions ────────────────────────────────────────────── */}
        <div className={styles.cardFooter}>
          <button
            type="button"
            className={styles.skipBtn}
            onClick={handleSkipAttempt}
          >
            Saltar por ahora
          </button>
          <div className={styles.navBtns}>
            {step > 0 && (
              <button type="button" className={styles.backBtn} onClick={handleBack}>
                ← Atrás
              </button>
            )}
            {step < 2 ? (
              <button type="button" className={styles.nextBtn} onClick={handleNext}>
                Siguiente →
              </button>
            ) : (
              <button
                type="button"
                className={styles.finishBtn}
                onClick={handleFinish}
              >
                🚀 Completar Perfil
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Skip warning modal */}
      {showSkipModal && (
        <SkipModal
          onComplete={() => setShowSkipModal(false)}
          onSkip={handleForceSkip}
        />
      )}
    </div>
  )
}
