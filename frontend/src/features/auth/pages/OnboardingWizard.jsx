// src/pages/OnboardingWizard.jsx
import { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useToast } from '@/core/notifications/ToastContext'
import styles from './OnboardingWizard.module.css'

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

// ─── Main Component ──────────────────────────────────────────────────────────
export default function OnboardingWizard() {
  const { register, updateProfile } = useAuth()
  const { error } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const fileInputRef = useRef(null)

  const [step, setStep] = useState(0) // 0 | 1
  const [showSkipModal, setShowSkipModal] = useState(false)

  // Step 1 data
  const [academicStatus, setAcademicStatus] = useState('')
  const [institution, setInstitution] = useState('')
  const [campus, setCampus] = useState('')
  const [city, setCity] = useState('')

  // Step 2 data
  const [birthdate, setBirthdate] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')

  // ── Validation helpers ────────────────────────────────────────────────────
  const coreFieldsFilled = academicStatus && institution && birthdate

  const handleNext = () => {
    if (step === 1) {
      if (!academicStatus) return error('Debes seleccionar tu estado académico para continuar.')
      if (!institution) return error('Debes seleccionar tu institución para continuar.')
    }
    if (step < STEPS.length - 1) setStep((s) => s + 1)
  }

  const handleCancel = () => {
    navigate('/')
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
    setShowSkipModal(false)
    handleFinish()
  }

  const handleFinish = async () => {
    if (!birthdate) {
      return error('La fecha de nacimiento es obligatoria.')
    }

    const regData = location.state?.registrationData
    if (!regData) {
      error("No hay datos de registro. Por favor vuelve a intentarlo.")
      navigate('/')
      return
    }

    try {
      // 1. Create the user
      const result = await register({
        name: regData.name,
        email: regData.email,
        password: regData.password,
        ieeeId: regData.ieeeId,
        cimeqhId: regData.cimeqhId,
      })

      if (!result.success) {
        throw new Error(result.error || "Error al crear la cuenta")
      }

      // 2. Default avatar
      const finalAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(regData.name)}&background=random`

      // 3. Update profile
      await updateProfile({
        avatarUrl: finalAvatarUrl,
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
      error(e.message || "Hubo un error al guardar tu perfil. Inténtalo de nuevo.")
    }
  }

  const STEPS = [
    { label: 'Datos Académicos' },
    { label: 'Contacto & Bio' },
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
            Paso <strong>{step + 1}</strong> de {STEPS.length} — {STEPS[step].label}
          </p>
          <StepIndicator current={step} total={STEPS.length} />
        </div>

        {/* ── STEP 0: Academic Info ─────────────────────────────────────── */}
        {step === 0 && (
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

        {/* ── STEP 1: Contact & Bio ───────────────────────────────────────── */}
        {step === 1 && (
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
            onClick={() => setShowSkipModal(true)}
            style={{ color: '#ef4444' }}
          >
            Cancelar Registro
          </button>
          <div className={styles.navBtns}>
            {step > 0 && (
              <button type="button" className={styles.backBtn} onClick={handleBack}>
                ← Atrás
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button type="button" className={styles.nextBtn} onClick={handleNext}>
                Siguiente →
              </button>
            ) : (
              <button
                type="button"
                className={styles.finishBtn}
                onClick={handleFinish}
              >
                Completar Perfil
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cancel warning modal */}
      {showSkipModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalIcon}>⚠️</div>
            <h2 className={styles.modalTitle}>¿Cancelar Registro?</h2>
            <p className={styles.modalBody}>
              Toda la información ingresada se perderá y tu cuenta no será creada.
            </p>
            <div className={styles.modalActions}>
              <button className={styles.modalBtnGhost} onClick={() => setShowSkipModal(false)}>
                Volver
              </button>
              <button className={styles.modalBtnPrimary} style={{ background: '#ef4444', borderColor: '#ef4444' }} onClick={handleCancel}>
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
