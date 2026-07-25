import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import styles from './ProfileEditModal.module.css'

const PREDEFINED_AVATARS = [
  'https://api.dicebear.com/8.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/8.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/8.x/avataaars/svg?seed=Jude',
  'https://api.dicebear.com/8.x/avataaars/svg?seed=Leo',
  'https://api.dicebear.com/8.x/avataaars/svg?seed=Max'
]

const PREDEFINED_BANNERS = [
  'https://picsum.photos/seed/banner-1/1400/400',
  'https://picsum.photos/seed/banner-2/1400/400',
  'https://picsum.photos/seed/banner-3/1400/400',
  'https://picsum.photos/seed/tech-1/1400/400'
]
const IconX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

export default function ProfileEditModal({ isOpen, onClose, profileUser }) {
  const { updateProfile } = useAuth()
  
  const [formData, setFormData] = useState({
    bio: '',
    city: '',
    campus: '',
    avatarUrl: '',
    bannerUrl: '',
    isContactPublic: false
  })

  // Load user data when modal opens
  useEffect(() => {
    if (isOpen && profileUser) {
      setFormData({
        bio: profileUser.bio || '',
        city: profileUser.city || '',
        campus: profileUser.campus || '',
        avatarUrl: profileUser.avatarUrl || profileUser.avatar || PREDEFINED_AVATARS[0],
        bannerUrl: profileUser.bannerUrl || PREDEFINED_BANNERS[0],
        isContactPublic: profileUser.isContactPublic || false
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

          <div className={styles.formGroup}>
            <label className={styles.label}>Avatar</label>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {PREDEFINED_AVATARS.map((url, i) => (
                <img 
                  key={i} 
                  src={url} 
                  alt={`Avatar ${i}`} 
                  onClick={() => setFormData(prev => ({ ...prev, avatarUrl: url }))}
                  style={{ 
                    width: '50px', height: '50px', borderRadius: '50%', cursor: 'pointer',
                    border: formData.avatarUrl === url ? '3px solid var(--accent-500)' : '2px solid transparent',
                    background: 'var(--bg-elevated)', objectFit: 'cover'
                  }} 
                />
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Banner</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {PREDEFINED_BANNERS.map((url, i) => (
                <img 
                  key={i} 
                  src={url} 
                  alt={`Banner ${i}`} 
                  onClick={() => setFormData(prev => ({ ...prev, bannerUrl: url }))}
                  style={{ 
                    width: '100%', height: '60px', borderRadius: '8px', cursor: 'pointer',
                    border: formData.bannerUrl === url ? '3px solid var(--accent-500)' : '2px solid transparent',
                    objectFit: 'cover'
                  }} 
                />
              ))}
            </div>
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
