// src/pages/Project.jsx
import { useState } from 'react'
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
const IconSend = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
)

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentUser, isAuthenticated } = useAuth()
  const { projectsState, toggleUpvoteProject, addCommentToProject } = useProjects()
  const { error, info } = useToast()

  // Match string or number ID
  const project = projectsState.find((p) => String(p.id) === String(id))
  const author = project?.authorsData?.[0] || null
  const isTeam = project?.authorIds && project.authorIds.length > 1
  const teamNames = isTeam
    ? project.authorsData?.map(u => u.name).filter(Boolean).join(', ')
    : ''

  const [commentText, setCommentText] = useState('')

  if (!project) {
    return (
      <div className={styles.page}>
        <div className={styles.notFound}>
          <h2>Proyecto no encontrado</h2>
          <p style={{ color: 'var(--text-muted)' }}>El proyecto que buscas no existe o fue eliminado.</p>
          <button className="btn btn-secondary" onClick={() => navigate('/explorar')} style={{ marginTop: 12 }}>
            Volver al Feed
          </button>
        </div>
      </div>
    )
  }

  // ── Adaptive Bento: compute which iFrame panels exist ──
  const hasPdf = Boolean(project.pdfLink)
  const hasCad = Boolean(project.cadLink)

  const bentoAreas = !hasPdf && !hasCad
    ? '"cover info" "desc desc" "comments comments"'
    : !hasCad
      ? '"cover info" "pdf pdf" "desc desc" "comments comments"'
      : !hasPdf
        ? '"cover info" "cad cad" "desc desc" "comments comments"'
        : '"cover info" "pdf cad" "desc desc" "comments comments"'

  const userVote = currentUser && project.upvotedBy?.includes(currentUser.id) ? 'up' : currentUser && project.downvotedBy?.includes(currentUser.id) ? 'down' : null

  const handleVote = (type) => {
    if (!isAuthenticated) return error("Debes iniciar sesión para votar.")
    if (type === 'up') {
      toggleUpvoteProject(project.id, currentUser.id)
    } else if (type === 'down') {
      if (toggleDownvoteProject) toggleDownvoteProject(project.id, currentUser.id)
    }
  }

  const handleComment = (e) => {
    e.preventDefault()
    if (!commentText.trim() || !isAuthenticated) return
    addCommentToProject(project.id, {
      userId: currentUser.id,
      userName: currentUser.name,
      avatar: currentUser.avatar,
      text: commentText.trim()
    })
    setCommentText('')
  }

  const netScore = project.upvotes - project.downvotes

  return (
    <div className={styles.page}>
      {/* Back button */}
      <button className={styles.backBtn} onClick={() => navigate('/explorar')} aria-label="Volver al feed">
        <IconArrow /> Explorar
      </button>

      {/* Bento Box Grid */}
      <div className={styles.bento} style={{ gridTemplateAreas: bentoAreas }}>

        {/* === A: Cover Image === */}
        <div className={`${styles.bentoItem} ${styles.cover}`} style={{ animationDelay: '0ms' }}>
          <img
            src={project.coverImage}
            alt={`Portada del proyecto: ${project.title}`}
            className={styles.coverImg}
          />
        </div>

        {/* === B: Info Panel === */}
        <div className={`${styles.bentoItem} ${styles.info}`} style={{ animationDelay: '60ms' }}>
          <div className={styles.infoBody}>
            <h1 className={styles.projectTitle}>{project.title}</h1>

            {/* Author card */}
            <div className={styles.authorCard}>
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
                <span className={styles.metaValue}>{project.createdAt}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Estado</span>
                <span
                  className={`status-badge ${project.status === 'Público' ? 'status-badge--publico' :
                      project.status === 'Pendiente' ? 'status-badge--pendiente' :
                        'status-badge--cambios'
                    }`}
                  style={{ fontSize: 11, padding: '2px 8px' }}
                >
                  {project.status}
                </span>
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

        {/* === C: PDF iFrame === */}
        <div className={`${styles.bentoItem} ${styles.pdf}`} style={{ animationDelay: '120ms' }}>
          <div className={styles.iframeHeader}>
            <div className={styles.iframeHeaderIcon} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
              <IconFilePdf />
            </div>
            <div>
              <div className={styles.iframeTitle}>Paper / Documentación</div>
              <div className={styles.iframeSubtitle}>PDF técnico del proyecto</div>
            </div>
          </div>
          <div className={styles.iframeBody}>
            {project.pdfLink ? (
              project.pdfLink.startsWith('/storage/local') ? (
                <div className={styles.iframePlaceholder} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--success)' }}>
                  <div style={{ color: 'var(--success)', marginBottom: '8px' }}>
                    <IconFilePdf />
                  </div>
                  <p className={styles.iframePlaceholderTitle}>Visualizando Archivo Local</p>
                  <p style={{ color: 'var(--success)' }}>{project.pdfLink.split('/').pop()}</p>
                  <button className="btn btn-secondary btn-sm" style={{ marginTop: '16px' }} onClick={() => info('Descargando archivo simulado...')}>Simular Descarga</button>
                </div>
              ) : (
                <iframe
                  src={project.pdfLink}
                  title={`PDF del proyecto: ${project.title}`}
                  allow="autoplay"
                  loading="lazy"
                />
              )
            ) : (
              <div className={styles.iframePlaceholder}>
                <IconFilePdf />
                <p className={styles.iframePlaceholderTitle}>Paper no disponible</p>
                <p>El autor no ha adjuntado un documento técnico todavía.</p>
              </div>
            )}
          </div>
        </div>

        {/* === D: CAD iFrame === */}
        <div className={`${styles.bentoItem} ${styles.cad}`} style={{ animationDelay: '180ms' }}>
          <div className={styles.iframeHeader}>
            <div className={styles.iframeHeaderIcon} style={{ background: 'rgba(6,182,212,0.1)', color: 'var(--cyan-400)' }}>
              <IconBox />
            </div>
            <div>
              <div className={styles.iframeTitle}>Archivo CAD / 3D</div>
              <div className={styles.iframeSubtitle}>Modelo de diseño técnico</div>
            </div>
          </div>
          <div className={styles.iframeBody}>
            {project.cadLink ? (
              project.cadLink.startsWith('/storage/local') ? (
                <div className={styles.iframePlaceholder} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--cyan-500)' }}>
                  <div style={{ color: 'var(--cyan-400)', marginBottom: '8px' }}>
                    <IconBox />
                  </div>
                  <p className={styles.iframePlaceholderTitle}>Visualizando CAD Local</p>
                  <p style={{ color: 'var(--cyan-400)' }}>{project.cadLink.split('/').pop()}</p>
                  <button className="btn btn-secondary btn-sm" style={{ marginTop: '16px' }} onClick={() => info('Abriendo visor CAD simulado...')}>Simular Visor 3D</button>
                </div>
              ) : (
                <iframe
                  src={project.cadLink}
                  title={`Archivo CAD del proyecto: ${project.title}`}
                  allow="autoplay"
                  loading="lazy"
                />
              )
            ) : (
              <div className={styles.iframePlaceholder}>
                <IconBox />
                <p className={styles.iframePlaceholderTitle}>Archivo CAD no disponible</p>
                <p>No se adjuntó un modelo de diseño para este proyecto.</p>
              </div>
            )}
          </div>
        </div>

        {/* === E: Description === */}
        <div className={`${styles.bentoItem} ${styles.desc}`} style={{ animationDelay: '240ms' }}>
          <h2 className={styles.descTitle}>Descripción del Proyecto</h2>
          <p className={styles.descText}>{project.description}</p>
        </div>

        {/* === F: Votes + Comments === */}
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
                    <div className={styles.commentAvatar}>
                      {c.avatar && <img src={c.avatar} alt={c.userName} loading="lazy" />}
                    </div>
                    <div className={styles.commentContent}>
                      <div className={styles.commentHeader}>
                        <span className={styles.commentAuthor}>{c.userName}</span>
                        <span className={styles.commentDate}>{c.createdAt}</span>
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
                  className="btn btn-primary btn-sm"
                  disabled={!commentText.trim()}
                  aria-label="Enviar comentario"
                >
                  <IconSend />
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
