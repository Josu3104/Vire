import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import styles from './ProfileEditModal.module.css'

import { useRef } from 'react'
const IconX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

export default function ProfileEditModal({ isOpen, onClose, profileUser }) {
  const { updateProfile } = useAuth()
  
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    bio: '',
    city: '',
    campus: '',
    university: '',
    ieeeId: '',
    cimeqhId: '',
    avatarUrl: '',
    bannerUrl: '',
    isContactPublic: false
  })

  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Load user data when modal opens
  useEffect(() => {
    if (isOpen && profileUser) {
      setFormData({
        name: profileUser.name || '',
        password: '',
        bio: profileUser.profile?.bio || profileUser.bio || '',
        city: profileUser.profile?.city || profileUser.city || '',
        campus: profileUser.profile?.campus || profileUser.campus || '',
        university: profileUser.profile?.university || profileUser.university || '',
        ieeeId: profileUser.ieeeId || '',
        cimeqhId: profileUser.cimeqhId || '',
        avatarUrl: profileUser.profile?.avatarUrl || profileUser.avatarUrl || '',
        bannerUrl: profileUser.profile?.bannerUrl || profileUser.bannerUrl || '',
        isContactPublic: profileUser.profile?.isContactPublic || profileUser.isContactPublic || false
      })
    }
  }, [isOpen, profileUser])

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleFileChange = (e, field) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      setFormData(prev => ({ ...prev, [field]: event.target.result }))
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Call the AuthContext to update current user state
    updateProfile(formData)
    onClose()
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Editar Perfil</h2>
          <button className={styles.closeBtn} onClick={onClose}><IconX /></button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div className={styles.formGroup} style={{ marginBottom: 0 }}>
              <label className={styles.label}>Foto de Perfil (Avatar)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: 8 }}>
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width: 16, height: 16, marginRight: 6}}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Subir Foto
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'avatarUrl')} hidden />
                </label>
                {formData.avatarUrl && <img src={formData.avatarUrl} alt="Avatar Preview" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-subtle)' }} />}
              </div>
            </div>

            <div className={styles.formGroup} style={{ marginBottom: 0 }}>
              <label className={styles.label}>Fondo de Portada (Banner)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: 8 }}>
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width: 16, height: 16, marginRight: 6}}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Subir Fondo
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'bannerUrl')} hidden />
                </label>
                {formData.bannerUrl && <img src={formData.bannerUrl} alt="Banner Preview" style={{ width: 80, height: 44, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--border-subtle)' }} />}
              </div>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Nombre completo</label>
            <input 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              className={styles.input} 
              placeholder="Tu nombre real"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Biografía corta</label>
            <textarea 
              name="bio" 
              value={formData.bio} 
              onChange={handleChange} 
              className={styles.textarea} 
              placeholder="Cuéntanos un poco sobre ti y tus metas..."
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Universidad / Institución</label>
            <input 
              name="university" 
              value={formData.university} 
              onChange={handleChange} 
              className={styles.input} 
              placeholder="Ej: Universidad Nacional Autónoma de Honduras"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Ciudad</label>
              <input 
                name="city" 
                value={formData.city} 
                onChange={handleChange} 
                className={styles.input} 
                placeholder="Ej: Tegucigalpa"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Sede / Campus</label>
              <input 
                name="campus" 
                value={formData.campus} 
                onChange={handleChange} 
                className={styles.input} 
                placeholder="Ej: UNITEC TGU"
              />
            </div>
          </div>

          <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', marginBottom: '24px', border: '1px solid var(--border-default)' }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Afiliaciones Institucionales
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Si modificas estos valores, tu cuenta pasará a estado de <strong style={{ color: 'var(--warning)' }}>pendiente de validación</strong> y perderás temporalmente algunos accesos hasta que un administrador verifique los nuevos datos.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                <label className={styles.label}>ID de IEEE</label>
                <input 
                  name="ieeeId" 
                  value={formData.ieeeId} 
                  onChange={handleChange} 
                  className={styles.input} 
                  placeholder="ID de membresía IEEE"
                />
              </div>
              <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                <label className={styles.label}>ID de CIMEQH</label>
                <input 
                  name="cimeqhId" 
                  value={formData.cimeqhId} 
                  onChange={handleChange} 
                  className={styles.input} 
                  placeholder="ID de agremiado CIMEQH"
                />
              </div>
            </div>
          </div>

          <div style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', marginBottom: '24px', border: '1px solid var(--border-default)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setIsChangingPassword(!isChangingPassword)}>
              <h4 style={{ color: 'var(--text-primary)', fontSize: '14px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                Cambiar Contraseña
              </h4>
              <span style={{ color: 'var(--text-muted)' }}>
                {isChangingPassword ? (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                )}
              </span>
            </div>
            
            {isChangingPassword && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <label className={styles.label}>Nueva Contraseña</label>
                  <input 
                    name="password" 
                    type="password"
                    value={formData.password} 
                    onChange={handleChange} 
                    className={styles.input} 
                    placeholder="Escribe tu nueva contraseña..."
                  />
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', marginBottom: 0 }}>
                    Si no deseas cambiarla, puedes dejar este campo en blanco o simplemente cerrar esta sección.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className={styles.switchContainer}>
            <div className={styles.switchText}>
              <span className={styles.switchTitle}>Perfil Público</span>
              <span className={styles.switchDesc}>
                Si lo activas, cualquiera podrá ver tu portafolio de proyectos y papers.
              </span>
            </div>
            <label className={styles.switchLabel}>
              <input 
                type="checkbox" 
                name="isContactPublic"
                checked={formData.isContactPublic}
                onChange={handleChange}
              />
              <span className={styles.slider}></span>
            </label>
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.submitBtn}>Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  )
}
