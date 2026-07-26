// src/components/PublishModal.jsx
import { useState } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useProjects } from '@/features/projects/context/ProjectContext'
import styles from './PublishModal.module.css'
import { TagInput, UserSearchInput } from './FormInputs'

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

function MultiFileUploader({ files, onFilesChange, isUploading, setUploading }) {
  const [uploadProgress, setUploadProgress] = useState(null)

  const getFileType = (file) => {
    if (file.type.includes('image')) return 'IMAGE'
    if (file.type.includes('pdf')) return 'PDF'
    if (file.type.includes('video')) return 'VIDEO'
    const ext = file.name.split('.').pop().toLowerCase()
    if (['step', 'stp', 'stl', 'obj', 'sldprt'].includes(ext)) return 'CAD'
    if (['zip', 'rar', '7z'].includes(ext)) return 'ZIP'
    return 'OTHER'
  }

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files)
    if (!selectedFiles.length) return

    setUploading(true)
    
    try {
      const { requestPresignedUrl, directS3Upload } = await import('@/features/projects/api/projects.api')
      
      const uploadedFiles = []

      for (const file of selectedFiles) {
        setUploadProgress(`Subiendo ${file.name}...`)
        const fileTypeEnum = getFileType(file)
        
        // 1. Pedir ticket
        const res = await requestPresignedUrl(file.name, file.type || 'application/octet-stream', `projects/${fileTypeEnum.toLowerCase()}s`)
        const { uploadUrl, fileKey } = res

        // 2. Subir
        await directS3Upload(uploadUrl, file)

        // 3. Guardar metadatos
        uploadedFiles.push({
          filename: file.name,
          originalName: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          storageKey: fileKey,
          type: fileTypeEnum
        })
      }

      onFilesChange([...files, ...uploadedFiles])
    } catch (error) {
      console.error('Error subiendo archivo', error)
      alert('Error subiendo el archivo. Por favor intenta de nuevo.')
    } finally {
      setUploading(false)
      setUploadProgress(null)
      // Reset input
      e.target.value = ''
    }
  }

  const removeFile = (indexToRemove) => {
    onFilesChange(files.filter((_, idx) => idx !== indexToRemove))
  }

  return (
    <div className="form-group">
      <label className="form-label">Archivos del Proyecto (Múltiples permitidos)</label>
      <div className={`${styles.uploaderContainer}`}>
        {isUploading && (
          <div style={{ width: '100%', padding: '0 1rem', marginBottom: '1rem' }}>
            <span className={styles.uploadText}>{uploadProgress}</span>
            <div className={styles.progressContainer}>
              <div className={styles.progressBar} />
            </div>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginBottom: files.length > 0 ? '1rem' : '0' }}>
          {files.map((f, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <IconCheck />
                <span style={{ fontSize: '0.85rem', color: 'var(--text)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {f.originalName} ({f.type})
                </span>
              </div>
              <button type="button" onClick={() => removeFile(idx)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex' }}>
                <IconX />
              </button>
            </div>
          ))}
        </div>
        
        {!isUploading && (
          <>
            <IconUpload />
            <span className={styles.uploadText}>Haz clic para adjuntar archivos</span>
            <span className={styles.uploadSubtext}>Imágenes, PDFs, CADs, ZIPs...</span>
            <input 
              type="file" 
              multiple
              className={styles.fileInput} 
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </>
        )}
      </div>
    </div>
  )
}

export default function EditProjectModal({ isOpen, onClose, projectToEdit }) {
  const { currentUser } = useAuth()
  const { editProject } = useProjects()
  const [activeTab, setActiveTab] = useState(projectToEdit?.type === 'paper' ? 'paper' : 'project')
  const [uploadingFields, setUploadingFields] = useState({})
  
  const isAnyUploading = Object.values(uploadingFields).some(Boolean)

  // Form State
  const [formData, setFormData] = useState({
    title: projectToEdit?.title || '',
    description: projectToEdit?.description || '',
    tags: Array.isArray(projectToEdit?.tags) ? projectToEdit.tags : (projectToEdit?.tags ? JSON.parse(projectToEdit.tags) : []),
    advisors: Array.isArray(projectToEdit?.advisors) ? projectToEdit.advisors : [],
    files: Array.isArray(projectToEdit?.files) ? projectToEdit.files : (projectToEdit?.files ? JSON.parse(projectToEdit.files) : []),
    coauthors: typeof projectToEdit?.coauthors === 'string' && projectToEdit.coauthors 
      ? projectToEdit.coauthors.split(',').map(name => ({ id: name.trim(), name: name.trim() })) 
      : [],
    abstract: projectToEdit?.abstract || projectToEdit?.description || '',
    doi: projectToEdit?.doi || ''
  })

  if (!isOpen) return null

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (activeTab === 'project') {
      editProject(projectToEdit.id, {
        type: 'project',
        title: formData.title,
        description: formData.description,
        tags: formData.tags,
        advisors: formData.advisors,
        files: formData.files
      })
    } else {
      editProject(projectToEdit.id, {
        type: 'paper',
        title: formData.title,
        coauthors: formData.coauthors.map(u => u.name).join(', '),
        abstract: formData.abstract, // mapped to description
        doi: formData.doi || null,
        files: formData.files,
      })
    }

    onClose()
  }
  
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Editar Publicación Rechazada</h2>
          <button className={styles.closeBtn} onClick={onClose}><IconX /></button>
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
              <TagInput 
                label="Etiquetas *" 
                placeholder="Ej: Robótica, Visión Artificial (Presiona Enter)"
                value={formData.tags}
                onChange={(val) => setFormData(p => ({ ...p, tags: val }))}
              />

              <TagInput 
                label="Docentes Asesores"
                placeholder="Ej: Ing. Carlos Martínez (Presiona Enter)"
                value={formData.advisors}
                onChange={(val) => setFormData(p => ({ ...p, advisors: val }))}
              />

              <MultiFileUploader 
                files={formData.files}
                onFilesChange={(files) => setFormData(p => ({ ...p, files }))}
                isUploading={uploadingFields.files}
                setUploading={(val) => setUploadingFields(p => ({...p, files: val}))}
              />
            </>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Título del Paper <span style={{color: 'var(--danger)'}}>*</span></label>
                <input name="title" required value={formData.title} onChange={handleChange} className="form-input" placeholder="Ej: Control Adaptativo..." />
              </div>
              <UserSearchInput 
                label="Coautores"
                selectedUsers={formData.coauthors}
                onChange={(val) => setFormData(p => ({ ...p, coauthors: val }))}
              />
              <div className="form-group">
                <label className="form-label">Abstract <span style={{color: 'var(--danger)'}}>*</span></label>
                <textarea name="abstract" required value={formData.abstract} onChange={handleChange} className="form-input" rows={4} placeholder="Resumen de la investigación..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Código DOI</label>
                  <input name="doi" value={formData.doi} onChange={handleChange} className="form-input" placeholder="Ej: 10.1109/..." />
                </div>
              </div>
              <MultiFileUploader 
                files={formData.files}
                onFilesChange={(files) => setFormData(p => ({ ...p, files }))}
                isUploading={uploadingFields.files}
                setUploading={(val) => setUploadingFields(p => ({...p, files: val}))}
              />
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
