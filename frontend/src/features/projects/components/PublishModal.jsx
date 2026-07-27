// src/components/PublishModal.jsx
import { useState } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useProjects } from '@/features/projects/context/ProjectContext'
import { useToast } from '@/core/notifications/ToastContext'
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

function CoverUploader({ file, onFileChange, isUploading, setUploading }) {
  const [uploadProgress, setUploadProgress] = useState(null)
  const [uploadPercentage, setUploadPercentage] = useState(0)

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    setUploading(true)
    try {
      const { requestPresignedUrl, directS3Upload } = await import('@/features/projects/api/projects.api')
      
      setUploadProgress(`Subiendo portada...`)
      
      const mimeType = selectedFile.type || 'image/jpeg'
      const res = await requestPresignedUrl(selectedFile.name, mimeType, `projects/covers`)
      const { uploadUrl, fileKey } = res

      await directS3Upload(uploadUrl, selectedFile, (progress) => {
        setUploadPercentage(progress);
      }, mimeType)

      onFileChange({
        filename: selectedFile.name,
        originalName: selectedFile.name,
        mimeType: selectedFile.type || 'image/jpeg',
        size: selectedFile.size,
        storageKey: fileKey,
        type: 'COVER'
      })
    } catch (error) {
      console.error('Error subiendo portada', error)
      alert('Error subiendo la portada.')
    } finally {
      setUploading(false)
      setUploadProgress(null)
      setUploadPercentage(0)
      e.target.value = ''
    }
  }

  return (
    <div className="form-group">
      <label className="form-label">Miniatura / Portada Obligatoria <span style={{color: 'var(--danger)'}}>*</span></label>
      <div className={`${styles.uploaderContainer} ${file ? styles.hasCover : ''}`}>
        {isUploading && (
           <div style={{ width: '100%', padding: '0 1rem', marginBottom: '1rem' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <span className={styles.uploadText}>{uploadProgress}</span>
               <span className={styles.uploadText}>{uploadPercentage}%</span>
             </div>
             <div className={styles.progressContainer}>
               <div className={styles.progressBar} style={{ width: `${uploadPercentage}%` }} />
             </div>
           </div>
        )}
        
        {file && !isUploading && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
              <IconCheck />
              <span style={{ fontSize: '0.85rem', color: 'var(--text)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {file.originalName}
              </span>
            </div>
            <button type="button" onClick={() => onFileChange(null)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex' }}>
              <IconX />
            </button>
          </div>
        )}

        {!file && !isUploading && (
          <>
            <IconUpload />
            <span className={styles.uploadText}>Sube una imagen atractiva</span>
            <span className={styles.uploadSubtext}>Formato JPG, PNG o WEBP</span>
            <input 
              type="file" 
              accept="image/*"
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

function MultiFileUploader({ files, onFilesChange, isUploading, setUploading }) {
  const [uploadProgress, setUploadProgress] = useState(null)
  const [uploadPercentage, setUploadPercentage] = useState(0)

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
        
        console.log('[PublishModal] Solicitando URL para', file.name)
        const mimeType = file.type || 'application/octet-stream'
        // 1. Pedir ticket
        const res = await requestPresignedUrl(file.name, mimeType, `projects/${fileTypeEnum.toLowerCase()}s`)
        const { uploadUrl, fileKey } = res
        console.log('[PublishModal] URL obtenida:', uploadUrl)

        // 2. Subir
        console.log('[PublishModal] Iniciando subida directa a S3...')
        await directS3Upload(uploadUrl, file, (progress) => {
          console.log('[PublishModal] Progreso:', progress)
          setUploadPercentage(progress);
        }, mimeType)
        console.log('[PublishModal] Subida terminada para', file.name)

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
      setUploadPercentage(0)
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className={styles.uploadText}>{uploadProgress}</span>
              <span className={styles.uploadText}>{uploadPercentage}%</span>
            </div>
            <div className={styles.progressContainer}>
              <div className={styles.progressBar} style={{ width: `${uploadPercentage}%` }} />
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

export default function PublishModal({ isOpen, onClose }) {
  const { addProject } = useProjects()
  const { currentUser } = useAuth()
  const { success, error } = useToast()
  const [activeTab, setActiveTab] = useState('project') // 'project' | 'paper'
  const [uploadingFields, setUploadingFields] = useState({})

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: [],
    advisors: [],
    attachedLinks: [],
    cover: null,
    files: [], // Unified files array
    // Paper specific
    coauthors: [],
    abstract: '',
    doi: ''
  })
  
  const isAnyUploading = Object.values(uploadingFields).some(Boolean)

  const handleTabSwitch = (tab) => {
    setActiveTab(tab)
    // Reset mode-specific fields to avoid bleeding
    setFormData(prev => ({
      ...prev,
      description: '',
      abstract: '',
      doi: '',
      advisors: tab === 'paper' ? [] : prev.advisors,
    }))
  }

  if (!isOpen) return null

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.cover) {
      error('La miniatura de portada es obligatoria.')
      return
    }

    const finalFiles = [formData.cover, ...formData.files]

    try {
      if (activeTab === 'project') {
        await addProject({
          type: 'project',
          title: formData.title,
          description: formData.description,
          tags: formData.tags,
          coauthors: formData.coauthors?.length > 0 ? formData.coauthors.map(u => u.name).join(', ') : undefined,
          university: currentUser.university || 'Independiente',
          branch: 'Ingeniería',
          advisors: formData.advisors,
          attachedLinks: formData.attachedLinks,
          files: finalFiles
        })
      } else {
        const paperFiles = finalFiles;
        await addProject({
          type: 'paper',
          title: formData.title,
          coauthors: formData.coauthors?.length > 0 ? formData.coauthors.map(u => u.name).join(', ') : undefined,
          description: formData.abstract, // mapped to description
          doi: formData.doi || null,
          files: paperFiles,
          university: currentUser.university || 'Independiente',
          branch: currentUser.branch || 'Ingeniería',
          journal: 'Publicación Independiente',
          year: new Date().getFullYear(),
          advisors: [],
          attachedLinks: formData.attachedLinks
        })
      }
      success('Enviado a revisión. Puedes ver su estado en tu Perfil.')
      onClose()
    } catch (err) {
      console.error(err)
      error('Ocurrió un error al publicar el proyecto.')
    }
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
            onClick={() => handleTabSwitch('project')}
          >
            Proyecto Técnico
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'paper' ? styles.active : ''}`}
            onClick={() => handleTabSwitch('paper')}
          >
            Paper de Investigación
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <CoverUploader 
            file={formData.cover}
            onFileChange={(file) => setFormData(p => ({ ...p, cover: file }))}
            isUploading={uploadingFields.cover}
            setUploading={(val) => setUploadingFields(p => ({...p, cover: val}))}
          />

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

              <UserSearchInput 
                label="Añadir Co-autores / Equipo"
                selectedUsers={formData.coauthors}
                onChange={(val) => setFormData(p => ({ ...p, coauthors: val }))}
              />

              <TagInput 
                label="Docentes Asesores"
                placeholder="Ej: Ing. Carlos Martínez (Presiona Enter)"
                value={formData.advisors}
                onChange={(val) => setFormData(p => ({ ...p, advisors: val }))}
              />

              <TagInput 
                label="Enlaces Adjuntos (Opcional)"
                placeholder="Ej: https://github.com/tu-repo (Presiona Enter)"
                value={formData.attachedLinks}
                onChange={(val) => setFormData(p => ({ ...p, attachedLinks: val }))}
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
                  <label className="form-label">DOI (Opcional)</label>
                  <input name="doi" value={formData.doi} onChange={handleChange} className="form-input" placeholder="Ej: 10.1109/TCS.2023.1234567" />
                </div>
              </div>

              <TagInput 
                label="Enlaces Adjuntos (Opcional)"
                placeholder="Ej: https://github.com/tu-repo (Presiona Enter)"
                value={formData.attachedLinks}
                onChange={(val) => setFormData(p => ({ ...p, attachedLinks: val }))}
              />

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
            <button type="submit" className="btn btn-primary" disabled={isAnyUploading}>
              {isAnyUploading ? 'Cargando archivos...' : 'Enviar a Revisión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
