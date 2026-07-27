// src/pages/Project.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useProjects } from '@/features/projects/context/ProjectContext'
import { useToast } from '@/core/notifications/ToastContext'
import styles from './Project.module.css'

/* ---- Icons ---- */
const IconArrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
)
const IconChevronUp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
)
const IconChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)
const IconMessage = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)
const IconDownload = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)
const IconChevronLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)
const IconChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)
const IconFilePdf = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
)
const IconBox = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
)
const IconLink = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
)
const IconSend = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
)

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentUser, isAuthenticated } = useAuth()
  const { projectsState, toggleUpvoteProject, toggleDownvoteProject, addCommentToProject } = useProjects()
  const { error } = useToast()

  const [commentText, setCommentText] = useState('')
  const [currentImageIdx, setCurrentImageIdx] = useState(0)
  const [detailProject, setDetailProject] = useState(null)

  // Fetch full detail (with comments) when entering
  useEffect(() => {
    import('@/features/projects/api/projects.api').then(api => {
      api.getProjectById(id)
        .then(p => {
          if (!p) return
          const mapped = {
            ...p,
            upvotes: p.upvotes || 0,
            downvotes: p.downvotes || 0,
            author: p.authors?.[0]?.user?.name || 'Usuario',
            authorIds: p.authors?.map(a => a.user.id) || [],
            authorsData: p.authors?.map(a => ({ ...a.user, avatar: a.user.avatarUrl || null })) || [],
            upvotedBy: p.upvotedBy || [],
            downvotedBy: p.downvotedBy || [],
            comments: (p.comments || []).map(c => ({
              id: c.id,
              userId: c.userId,
              userName: c.user?.name || 'Usuario',
              avatar: c.user?.avatarUrl || null,
              text: c.text,
              createdAt: c.createdAt,
              isHiddenByAuthor: c.isHiddenByAuthor || false,
            })),
          }
          setDetailProject(mapped)
        })
        .catch(() => {/* fall back to context */})
    })
  }, [id])

  // Merge context state (for optimistic updates) with detail data
  const contextProject = projectsState.find((p) => String(p.id) === String(id))
  // Prefer context for votes (optimistic) but detail for comments
  const project = contextProject
    ? {
        ...detailProject,
        ...contextProject,
        comments: detailProject?.comments || contextProject?.comments || [],
        coverImage: contextProject.coverImage || detailProject?.coverImage,
        files: contextProject.files || detailProject?.files,
      }
    : detailProject

  const author = project?.authorsData?.[0] || null
  const isTeam = project?.authorIds && project.authorIds.length > 1
  const teamNames = isTeam
    ? project.authorsData?.map(u => u.name).filter(Boolean).join(', ')
    : ''

  if (!project) {
    return (
      <div className={styles.page}>
        <div className={styles.notFound}>
          <h2>Cargando proyecto...</h2>
          <p style={{ color: 'var(--text-muted)' }}>Por favor espera un momento.</p>
          <button className="btn btn-secondary" onClick={() => navigate('/explorar')} style={{ marginTop: 12 }}>
            Volver al Feed
          </button>
        </div>
      </div>
    )
  }

  const coverFiles = project.files?.filter(f => f.type === 'COVER') || []
  const imageFiles = project.files?.filter(f => f.type === 'IMAGE') || []
  const carouselImages = [...coverFiles, ...imageFiles].map(f => f.downloadUrl).filter(Boolean)
  if (carouselImages.length === 0 && project.coverImage) {
    carouselImages.push(project.coverImage)
  }

  const otherFiles = project.files?.filter(f => !['COVER', 'IMAGE'].includes(f.type)) || []
  if (project.pdfLink && !otherFiles.some(f => f.downloadUrl === project.pdfLink)) {
    otherFiles.push({ type: 'PDF', downloadUrl: project.pdfLink, originalName: 'Documento Técnico.pdf', size: 0 })
  }
  if (project.cadLink && !otherFiles.some(f => f.downloadUrl === project.cadLink)) {
    otherFiles.push({ type: 'CAD', downloadUrl: project.cadLink, originalName: 'Modelo 3D.zip', size: 0 })
  }

  // ── Adaptive Bento: compute layout ──
  const filesRow = otherFiles.length > 0 ? '"files files"' : ''

  const bentoAreas = [
    '"cover info"',
    '"desc desc"',
    filesRow,
    '"comments comments"'
  ].filter(Boolean).join(' ')

  const isPreview = project.status && project.status !== 'publico';

  const userVote = currentUser && project.upvotedBy?.includes(currentUser.id) ? 'up' : currentUser && project.downvotedBy?.includes(currentUser.id) ? 'down' : null

  const handleVote = async (type) => {
    if (isPreview) return error("La votación está deshabilitada en modo vista previa.")
    if (!isAuthenticated) return error("Debes iniciar sesión para votar.")
    if (type === 'up') {
      await toggleUpvoteProject(project.id, currentUser.id)
    } else if (type === 'down') {
      if (toggleDownvoteProject) await toggleDownvoteProject(project.id, currentUser.id)
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (isPreview) return error("Los comentarios están deshabilitados en modo vista previa.")
    if (!commentText.trim() || !isAuthenticated) return
    try {
      const newCommentData = {
        userId: currentUser.id,
        userName: currentUser.name,
        avatar: currentUser.avatarUrl || currentUser.avatar,
        text: commentText.trim()
      }
      const newComment = await addCommentToProject(project.id, newCommentData)
      
      if (detailProject) {
        setDetailProject(prev => ({
          ...prev,
          commentsCount: (prev.commentsCount || 0) + 1,
          comments: [...(prev.comments || []), { 
            ...newCommentData, 
            id: newComment?.id || Date.now(), 
            createdAt: new Date().toISOString(),
            isHiddenByAuthor: false 
          }]
        }))
      }
      setCommentText('')
    } catch (err) {
      error('No se pudo publicar el comentario.')
    }
  }

  const netScore = project.upvotes - project.downvotes

  const formattedDate = new Date(project.createdAt || Date.now()).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric'
  })

  return (
    <div className={styles.page}>
      {isPreview && (
        <div style={{ background: 'var(--accent-500)', color: 'white', padding: '10px', textAlign: 'center', fontWeight: 'bold', borderRadius: '8px', marginBottom: '16px' }}>
          Vista Previa de Moderación - Opciones de interacción deshabilitadas
        </div>
      )}

      {/* Back button */}
      <button className={styles.backBtn} onClick={() => navigate(-1)} aria-label="Volver">
        <IconArrow /> Volver
      </button>

      {/* Bento Box Grid */}
      <div className={styles.bento} style={{ gridTemplateAreas: bentoAreas }}>

        {/* === A: Cover / Carousel === */}
        <div className={`${styles.bentoItem} ${styles.cover}`} style={{ animationDelay: '0ms' }}>
          {carouselImages.length > 0 ? (
            <div className={styles.carouselContainer}>
              <img
                src={carouselImages[currentImageIdx]}
                alt={`Imagen ${currentImageIdx + 1} del proyecto ${project.title}`}
                className={styles.coverImg}
              />
              {carouselImages.length > 1 && (
                <>
                  <button className={`${styles.carouselBtn} ${styles.prevBtn}`} onClick={() => setCurrentImageIdx(prev => prev === 0 ? carouselImages.length - 1 : prev - 1)}>
                    <IconChevronLeft />
                  </button>
                  <button className={`${styles.carouselBtn} ${styles.nextBtn}`} onClick={() => setCurrentImageIdx(prev => prev === carouselImages.length - 1 ? 0 : prev + 1)}>
                    <IconChevronRight />
                  </button>
                  <div className={styles.carouselIndicators}>
                    {carouselImages.map((_, idx) => (
                      <div key={idx} className={`${styles.indicator} ${idx === currentImageIdx ? styles.active : ''}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
             <div className={styles.coverPlaceholder}>
               <IconBox />
               <span>Sin imágenes</span>
             </div>
          )}
        </div>

        {/* === B: Info Panel === */}
        <div className={`${styles.bentoItem} ${styles.info}`} style={{ animationDelay: '60ms' }}>
          <div className={styles.infoBody}>
            <h1 className={styles.projectTitle}>{project.title}</h1>

            {/* Author card */}
            <div 
              className={styles.authorCard} 
              onClick={() => {
                if (author?.id) navigate(`/usuario/${author.id}`)
              }}
              style={{ cursor: 'pointer' }}
              title={`Ver perfil de ${isTeam ? 'los autores' : project.author}`}
            >
              <div className={styles.authorAvatar}>
                {author?.avatar && <img src={author.avatar} alt={author.name} />}
              </div>
              <div>
                <div className={styles.authorName}>
                  {isTeam ? `Equipo: ${teamNames}` : project.author}
                </div>
                <div className={styles.authorMeta}>{project.university} · {project.branch}</div>
                {project.advisors && project.advisors.length > 0 && (
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>🎓 Asesor:</span>
                    <span style={{ color: 'var(--accent-400)', fontWeight: 500 }}>{project.advisors.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Metadata grid */}
            <div className={styles.metaGrid}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Universidad</span>
                <span className={styles.metaValue}>{project.university}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Publicado</span>
                <span className={styles.metaValue}>{formattedDate}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Votos netos</span>
                <span className={styles.metaValue} style={{ color: netScore >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {netScore >= 0 ? '+' : ''}{netScore}
                </span>
              </div>
            </div>

            {/* Tags */}
            <div className={styles.tagCloud}>
              {project.tags?.map((tag) => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          </div>
        </div>



        {/* === E: Description === */}
        <div className={`${styles.bentoItem} ${styles.desc}`} style={{ animationDelay: '240ms' }}>
          <h2 className={styles.descTitle}>Descripción del Proyecto</h2>
          <p className={styles.descText}>{project.description}</p>
        </div>

        {/* === F: Other Files (Aesthetic Cards) === */}
        {otherFiles.length > 0 && (
          <div className={`${styles.bentoItem} ${styles.files}`} style={{ animationDelay: '270ms' }}>
            <h3 className={styles.filesTitle}>Archivos Adjuntos</h3>
            <div className={styles.filesGrid}>
              {otherFiles.map((file, idx) => (
                <a key={idx} href={file.downloadUrl} download={file.originalName} className={styles.fileCard}>
                  <div className={styles.fileIconWrapper}>
                    {file.type === 'PDF' ? <IconFilePdf /> : file.type === 'ZIP' ? <IconBox /> : <IconFilePdf />}
                  </div>
                  <div className={styles.fileInfo}>
                    <div className={styles.fileName}>{file.originalName}</div>
                    <div className={styles.fileSize}>{(file.size / 1024 / 1024).toFixed(2)} MB • {file.type}</div>
                  </div>
                  <div className={styles.fileDownloadIcon}>
                    <IconDownload />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* === F2: Attached Links === */}
        {project.attachedLinks && project.attachedLinks.length > 0 && (
          <div className={`${styles.bentoItem} ${styles.files}`} style={{ animationDelay: '280ms' }}>
            <h3 className={styles.filesTitle}>Enlaces Adjuntos</h3>
            <div className={styles.filesGrid}>
              {project.attachedLinks.map((link, idx) => (
                <a key={idx} href={link} target="_blank" rel="noopener noreferrer" className={styles.fileCard}>
                  <div className={styles.fileIconWrapper}>
                    <IconLink />
                  </div>
                  <div className={styles.fileInfo}>
                    <div className={styles.fileName}>{link}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* === G: Votes + Comments === */}
        <div className={`${styles.bentoItem} ${styles.comments}`} style={{ animationDelay: '300ms' }}>
          {/* Votes */}
          <div className={styles.votesRow}>
            <div>
              <div className={styles.voteScore} style={{ color: netScore >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {netScore >= 0 ? '+' : ''}{netScore}
              </div>
              <div className={styles.voteScoreLabel}>Score neto</div>
            </div>

            {/* Interaction Bar */}
            <div className={styles.actionBar}>
              <button
                className={`${styles.voteBtn} ${styles.up} ${userVote === 'up' ? styles.voted : ''}`}
                onClick={() => handleVote('up')}
                disabled={!isAuthenticated}
                aria-label="Upvote"
                title={!isAuthenticated ? 'Inicia sesión para votar' : ''}
              >
                <IconChevronUp /> {project.upvotes} Upvote
              </button>
              <button
                className={`${styles.voteBtn} ${styles.down} ${userVote === 'down' ? styles.voted : ''}`}
                onClick={() => handleVote('down')}
                disabled={!isAuthenticated}
                aria-label="Downvote"
                title={!isAuthenticated ? 'Inicia sesión para votar' : ''}
              >
                <IconChevronDown /> {project.downvotes} Downvote
              </button>

              {!isAuthenticated && (
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                  Inicia sesión para votar y comentar
                </span>
              )}
            </div>
          </div>

          {/* Comments */}
          <div className={styles.commentsSection}>
            <h3 className={styles.commentTitle}>
              Comentarios ({(project.comments || []).filter((c) => !c.isHiddenByAuthor).length})
            </h3>

            <div className={styles.commentList}>
              {(project.comments || []).length === 0 && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Aún no hay comentarios. ¡Sé el primero!
                </p>
              )}
              {(project.comments || []).map((c) => {
                if (c.isHiddenByAuthor) return (
                  <div key={c.id} className={styles.comment}>
                    <div className={styles.commentAvatar} />
                    <div className={styles.commentContent}>
                      <span className={styles.commentHidden}>
                        [Comentario eliminado por el autor]
                      </span>
                    </div>
                  </div>
                )
                return (
                  <div key={c.id} className={styles.comment}>
                    <div className={styles.commentAvatar} onClick={() => navigate(`/perfil/${c.userId}`)} style={{ cursor: 'pointer' }}>
                      {c.avatar && <img src={c.avatar} alt={c.userName} loading="lazy" />}
                    </div>
                    <div className={styles.commentContent}>
                      <div className={styles.commentHeader}>
                        <span className={styles.commentAuthor} onClick={() => navigate(`/perfil/${c.userId}`)} style={{ cursor: 'pointer' }}>{c.userName}</span>
                        <span className={styles.commentDate}>
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <p className={styles.commentText}>{c.text}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Comment form */}
            {isAuthenticated ? (
              <form className={styles.commentForm} onSubmit={handleComment}>
                <textarea
                  id="comment-input"
                  className={styles.commentInput}
                  placeholder="Escribe tu comentario..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={2}
                  aria-label="Escribe un comentario"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment(e) }
                  }}
                />
                <button
                  id="comment-submit-btn"
                  type="submit"
                  className="btn btn-primary"
                  disabled={!commentText.trim()}
                  aria-label="Enviar comentario"
                >
                  <IconSend /> Publicar
                </button>
              </form>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>
                <a href="/" style={{ color: 'var(--accent-400)' }}>Inicia sesión</a> para dejar un comentario.
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
