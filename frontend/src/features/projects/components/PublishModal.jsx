// src/components/PublishModal.jsx
import { useState } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useProjects } from '@/features/projects/context/ProjectContext'
import styles from './PublishModal.module.css'

const IconX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const IconUpload = () => (
  <svg className={styles.uploadIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
)

const IconCheck = () => (
  <svg className={styles.successIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

function FileUploader({ label, name, accept, onFileUploaded, currentPath, isUploading, setUploading }) {
  const [fileName, setFileName] = useState('')

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setFileName(file.name)
    setUploading(true)

    try {
      const { requestPresignedUrl, directS3Upload } = await import('@/features/projects/api/projects.api')
      
      // 1. Pedir ticket de subida al backend
      const res = await requestPresignedUrl(file.name, file.type, `projects/${name}`)
      const { uploadUrl, fileKey } = res.data

      // 2. Subir archivo directo a S3 / SeaweedFS
      await directS3Upload(uploadUrl, file)

      // 3. Notificar que terminó (devolvemos la KEY de S3)
      onFileUploaded(name, fileKey)
    } catch (error) {
      console.error('Error subiendo archivo', error)
      alert('Error subiendo el archivo. Por favor intenta de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  const hasFile = Boolean(currentPath)

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className={`${styles.uploaderContainer} ${hasFile && !isUploading ? styles.success : ''}`}>
        {!hasFile && !isUploading && (
          <>
            <IconUpload />
            <span className={styles.uploadText}>Haz clic para adjuntar archivo</span>
            <span className={styles.uploadSubtext}>Extensiones: {accept}</span>
          </>
        )}
        {isUploading && (
          <div style={{ width: '100%', padding: '0 1rem' }}>
            <span className={styles.uploadText}>Subiendo {fileName}...</span>
            <div className={styles.progressContainer}>
              <div className={styles.progressBar} />
            </div>
          </div>
        )}
        {hasFile && !isUploading && (
          <>
            <IconCheck />
            <span className={styles.uploadText}>Archivo cargado exitosamente</span>
            <span className={styles.uploadSubtext}>{fileName || currentPath.split('/').pop()}</span>
          </>
        )}
        <input 
          type="file" 
          accept={accept}
          className={styles.fileInput} 
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </div>
    </div>
  )
}

export default function PublishModal({ isOpen, onClose }) {
  const { currentUser } = useAuth()
  const { addProject } = useProjects()
  const [activeTab, setActiveTab] = useState('project') // 'project' | 'paper'
  const [uploadingFields, setUploadingFields] = useState({})
  
  const isAnyUploading = Object.values(uploadingFields).some(Boolean)

  // Dropdown & Multiselect State
  const [selectedCoauthors, setSelectedCoauthors] = useState([])
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    coverImage: '',
    pdfLink: '',
    cadLink: '',
    advisors: '',
    // Paper specific
    coauthors: '',
    abstract: '',
    doi: ''
  })

  if (!isOpen) return null

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (activeTab === 'project') {
      addProject({
        type: 'project',
        title: formData.title,
        description: formData.description,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        coverImageKey: formData.coverImage || null,
        pdfKey: formData.pdfLink || null,
        cadKey: formData.cadLink || null,
        authorIds: [currentUser.id, ...selectedCoauthors],
        author: currentUser.name,
        university: currentUser.university || 'Independiente',
        branch: 'Ingeniería',
        advisors: formData.advisors.split(',').map(a => a.trim()).filter(Boolean)
      })
    } else {
      addProject({
        type: 'paper',
        title: formData.title,
        coauthors: formData.coauthors.split(',').map(t => t.trim()).filter(Boolean),
        description: formData.abstract, // mapped to description
        doi: formData.doi || null,
        pdfKey: formData.pdfLink, // Required
        authorIds: [currentUser.id],
        author: currentUser.name,
        university: currentUser.university || 'Independiente',
        journal: 'Publicación Independiente',
        year: new Date().getFullYear(),
        advisors: []
      })
    }

    setSelectedCoauthors([])
    setDropdownOpen(false)
    onClose()
  }
  const otherUsers = [] // users.filter((u) => u.id !== currentUser?.id && u.role !== 'empleador')
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Nueva Publicación</h2>
          <button className={styles.closeBtn} onClick={onClose}><IconX /></button>
        </div>

        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'project' ? styles.active : ''}`}
            onClick={() => setActiveTab('project')}
          >
            Proyecto Técnico
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'paper' ? styles.active : ''}`}
            onClick={() => setActiveTab('paper')}
          >
            Paper de Investigación
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {activeTab === 'project' ? (
            <>
              <div className="form-group">
                <label className="form-label">Título del Proyecto <span style={{color: 'var(--danger)'}}>*</span></label>
                <input name="title" required value={formData.title} onChange={handleChange} className="form-input" placeholder="Ej: Brazo Robótico Articulado" />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción <span style={{color: 'var(--danger)'}}>*</span></label>
                <textarea name="description" required value={formData.description} onChange={handleChange} className="form-input" rows={3} placeholder="Describe el funcionamiento y objetivos del prototipo..." />
              </div>
              <div className="form-group">
                <label className="form-label">Etiquetas (separadas por coma) <span style={{color: 'var(--danger)'}}>*</span></label>
                <input name="tags" required value={formData.tags} onChange={handleChange} className="form-input" placeholder="Ej: Robótica, Visión Artificial, Python" />
              </div>
              <div className="form-group">
                <label className="form-label">URL de Portada (Opcional)</label>
                <input name="coverImage" type="url" value={formData.coverImage} onChange={handleChange} className="form-input" placeholder="https://..." />
              </div>

              {/* Coauthors Selector */}
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">Añadir Co-autores / Equipo</label>
                <div className={styles.multiselectBox} onClick={() => setDropdownOpen(!dropdownOpen)}>
                  {selectedCoauthors.length === 0 ? (
                    <span className={styles.placeholder}>Selecciona co-autores...</span>
                  ) : (
                    <div className={styles.pillsContainer}>
                      {selectedCoauthors.map(id => {
                        const user = { name: 'Unknown User' } // Mock object since we don't have user search yet
                        return (
                          <span 
                            key={id} 
                            className={styles.pill}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCoauthors(prev => prev.filter(uid => uid !== id))
                            }}
                          >
                            <img src={user?.avatar} alt={user?.name} className={styles.pillAvatar} />
                            {user?.name}
                            <span className={styles.pillClose}>×</span>
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>

                {dropdownOpen && (
                  <>
                    <div className={styles.dropdownOverlay} onClick={() => setDropdownOpen(false)} />
                    <div className={styles.multiselectDropdown}>
                      {otherUsers.map(user => {
                        const isSelected = selectedCoauthors.includes(user.id)
                        return (
                          <div 
                            key={user.id} 
                            className={`${styles.dropdownItem} ${isSelected ? styles.itemSelected : ''}`}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedCoauthors(prev => prev.filter(uid => uid !== user.id))
                              } else {
                                setSelectedCoauthors(prev => [...prev, user.id])
                              }
                            }}
                          >
                            <img src={user.avatar} alt={user.name} className={styles.dropdownAvatar} />
                            <div className={styles.dropdownUserInfo}>
                              <span className={styles.dropdownUserName}>{user.name}</span>
                              <span className={styles.dropdownUserUni}>{user.university || 'Independiente'}</span>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={isSelected} 
                              readOnly 
                              className={styles.dropdownCheckbox} 
                            />
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Advisors Input */}
              <div className="form-group">
                <label className="form-label">Docentes Asesores (separados por coma)</label>
                <input 
                  name="advisors" 
                  value={formData.advisors} 
                  onChange={handleChange} 
                  className="form-input" 
                  placeholder="Ej: Ing. Carlos Martínez, Dra. Susana Argeñal" 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FileUploader 
                  label="Documento PDF"
                  name="pdfLink"
                  accept=".pdf"
                  currentPath={formData.pdfLink}
                  isUploading={uploadingFields.pdfLink}
                  setUploading={(val) => setUploadingFields(p => ({...p, pdfLink: val}))}
                  onFileUploaded={(name, path) => setFormData(p => ({...p, [name]: path}))}
                />
                <FileUploader 
                  label="Modelo 3D CAD"
                  name="cadLink"
                  accept=".stl,.obj,.step,.cad"
                  currentPath={formData.cadLink}
                  isUploading={uploadingFields.cadLink}
                  setUploading={(val) => setUploadingFields(p => ({...p, cadLink: val}))}
                  onFileUploaded={(name, path) => setFormData(p => ({...p, [name]: path}))}
                />
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Título del Paper <span style={{color: 'var(--danger)'}}>*</span></label>
                <input name="title" required value={formData.title} onChange={handleChange} className="form-input" placeholder="Ej: Control Adaptativo..." />
              </div>
              <div className="form-group">
                <label className="form-label">Coautores (separados por coma)</label>
                <input name="coauthors" value={formData.coauthors} onChange={handleChange} className="form-input" placeholder="Ej: M. F. Suazo, Dr. R. Fernández" />
              </div>
              <div className="form-group">
                <label className="form-label">Abstract <span style={{color: 'var(--danger)'}}>*</span></label>
                <textarea name="abstract" required value={formData.abstract} onChange={handleChange} className="form-input" rows={4} placeholder="Resumen de la investigación..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Código DOI</label>
                  <input name="doi" value={formData.doi} onChange={handleChange} className="form-input" placeholder="Ej: 10.1109/..." />
                </div>
                <FileUploader 
                  label="Documento PDF *"
                  name="pdfLink"
                  accept=".pdf"
                  currentPath={formData.pdfLink}
                  isUploading={uploadingFields.pdfLink}
                  setUploading={(val) => setUploadingFields(p => ({...p, pdfLink: val}))}
                  onFileUploaded={(name, path) => setFormData(p => ({...p, [name]: path}))}
                />
              </div>
            </>
          )}

          <div className={styles.footer}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.submitBtn} disabled={isAnyUploading}>
              {isAnyUploading ? 'Cargando archivos...' : 'Enviar a Revisión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
