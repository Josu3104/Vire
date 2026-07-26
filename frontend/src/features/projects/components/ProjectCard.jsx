import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useProjects } from '@/features/projects/context/ProjectContext'
import { useToast } from '@/core/notifications/ToastContext'
import { useChat } from '@/features/chat/context/ChatContext'
import styles from './ProjectCard.module.css'

/* ---- Icons ---- */
const IconChevronUp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
)

const IconFilePdf = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="12" y1="13" x2="8" y2="13" />
    <line x1="12" y1="17" x2="8" y2="17" />
  </svg>
)

const IconBox = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
  </svg>
)

const IconCode = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
  </svg>
)

/* ---- Status mapping ---- */
const statusClass = {
  'Público': styles.statusPublico,
  'Pendiente': styles.statusPendiente,
  'Requiere Cambios': styles.statusCambios,
}

const statusLabel = {
  'Público': 'Público',
  'Pendiente': 'Pendiente',
  'Requiere Cambios': 'Rev. requerida',
}

export default function ProjectCard({ project, onClick, animationDelay = 0, variant = 'grid' }) {
  const author = project?.authorsData?.[0] || null
  const isTeam = project?.authorIds && project.authorIds.length > 1
  const teamNames = isTeam
    ? project.authorsData?.map(u => u.name).filter(Boolean).join(', ')
    : ''

  const isScroll = variant === 'scroll'
  const [isHovered, setIsHovered] = useState(false)
  const { currentUser, isAuthenticated } = useAuth()
  const { toggleUpvoteProject } = useProjects()
  const { error } = useToast()
  const { openChatWith } = useChat()
  const navigate = useNavigate()

  const hasUpvoted = currentUser ? project.upvotedBy?.includes(currentUser.id) : false

  const handleUpvote = (e) => {
    e.stopPropagation()
    if (!isAuthenticated) return error("Debes iniciar sesión para votar.")
    toggleUpvoteProject(project.id, currentUser.id)
  }

  const handleContact = (e) => {
    e.stopPropagation()
    if (!isAuthenticated) return error("Debes iniciar sesión para mensajear.")
    if (author) {
      if (window.innerWidth < 768) {
        navigate('/mensajes')
      } else {
        openChatWith(author)
      }
    }
  }

  const handleClick = () => onClick?.(project)

  return (
    <article
      className={`${styles.card} ${isScroll ? styles.cardScroll : ''}`}
      style={{ animationDelay: `${animationDelay}ms` }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={0}
      role="button"
      aria-label={`Ver proyecto: ${project.title}`}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {isScroll ? (
        // ── SCROLL / SOCIAL VARIANT ──
        <>
          {/* Header */}
          <div className={styles.socialHeader}>
            <div className={styles.socialAuthor}>
              <div className={styles.authorAvatar}>
                {author?.avatar ? (
                  <img src={author.avatar} alt={author.name} loading="lazy" />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'var(--accent-subtle)' }} />
                )}
              </div>
              <div className={styles.socialAuthorInfo}>
                <span className={styles.authorName}>
                  {isTeam ? `${author?.name} + coautores` : project.author}
                </span>
                <span className={styles.socialDate}>
                  {project.createdAt} <span style={{ opacity: 0.6, marginLeft: '6px' }}>• {project.academicLevel || 'Universitario'}</span>
                </span>
              </div>
            </div>
            <span className={`${styles.statusBadgeInline} ${statusClass[project.status] ?? ''}`}>
              {statusLabel[project.status] ?? project.status}
            </span>
          </div>

          {/* Media */}
          <div className={styles.socialMedia}>
            {project.videoUrl && isHovered ? (
              <video
                src={project.videoUrl}
                autoPlay
                loop
                muted
                playsInline
                className={styles.hoverVideo}
              />
            ) : (
              <img src={project.coverImage} alt={project.title} loading="lazy" />
            )}
          </div>

          {/* Footer & Lite Bento */}
          <div className={styles.socialFooter}>
            <h3 className={styles.socialTitle}>{project.title}</h3>
            {isTeam && (
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>👥 Equipo:</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{teamNames}</span>
              </div>
            )}
            {project.advisors && project.advisors.length > 0 && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>🎓 Asesor / Docente:</span>
                <span style={{ color: 'var(--accent-400)', fontWeight: 500 }}>{project.advisors.join(', ')}</span>
              </div>
            )}

            <div className={styles.indicators}>
              {project.pdfLink && (
                <span className={`${styles.indicator} ${styles.indicatorPdf}`} title="Incluye Paper PDF">
                  <IconFilePdf /> Paper PDF
                </span>
              )}
              {project.cadLink && (
                <span className={`${styles.indicator} ${styles.indicatorCad}`} title="Incluye Modelo CAD/3D">
                  <IconBox /> Modelo 3D
                </span>
              )}
              {Array.isArray(project.tags) && project.tags.some(t => ['IoT', 'ESP32', 'Machine Learning', 'Deep Learning', 'Robótica'].includes(t)) && (
                <span className={`${styles.indicator} ${styles.indicatorCode}`} title="Proyecto incluye software/código">
                  <IconCode /> Código
                </span>
              )}
            </div>

            {/* Interaction */}
            <div className={styles.socialInteraction}>
              <button
                className={`${styles.socialActionBtn} ${hasUpvoted ? styles.upvoted : ''}`}
                onClick={handleUpvote}
                aria-label="Upvote"
              >
                <IconChevronUp /> <span style={{ fontWeight: 600 }}>{project.upvotes}</span>
              </button>
              <button
                className={styles.socialActionBtn}
                onClick={(e) => { e.stopPropagation(); /* Comment logic */ }}
                aria-label="Comentar"
              >
                Comentar ({project.comments?.length || 0})
              </button>
              <button
                className={styles.socialActionBtn}
                onClick={handleContact}
                aria-label="Contactar"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" strokeWidth="2" style={{ marginRight: '4px', verticalAlign: 'middle' }}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                Contactar
              </button>
            </div>
          </div>
        </>
      ) : (
        // ── GRID VARIANT (Original) ──
        <>
          {/* Cover image */}
          <div className={styles.coverWrapper}>
            {project.videoUrl && isHovered ? (
              <video
                src={project.videoUrl}
                autoPlay
                loop
                muted
                playsInline
                className={styles.hoverVideo}
              />
            ) : (
              <img
                src={project.coverImage}
                alt={project.title}
                className={styles.coverImg}
                loading="lazy"
              />
            )}
            <div className={styles.overlay} />

            {/* Status badge */}
            <span className={`${styles.statusBadge} ${statusClass[project.status] ?? ''}`}>
              {statusLabel[project.status] ?? project.status}
            </span>

            {/* Upvote pill & Contact */}
            <div style={{ position: 'absolute', bottom: '10px', right: '10px', display: 'flex', gap: '8px' }}>
              <button
                className={styles.voteBtn}
                onClick={handleContact}
                style={{ position: 'static', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}
                title="Contactar"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
              </button>
              <button
                className={`${styles.voteBtn} ${styles.up} ${hasUpvoted ? styles.voted : ''}`}
                onClick={handleUpvote}
                style={{ position: 'static' }}
              >
                <IconChevronUp /> {project.upvotes ?? 0}
              </button>
            </div>
          </div>

          {/* Footer info */}
          <div className={styles.info}>
            <h3 className={styles.title}>{project.title}</h3>
            {isTeam && (
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                👥 Equipo: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{teamNames}</span>
              </div>
            )}
            {project.advisors && project.advisors.length > 0 && (
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                🎓 Asesor: <span style={{ color: 'var(--accent-400)' }}>{project.advisors.join(', ')}</span>
              </div>
            )}

            <div className={styles.meta}>
              <div className={styles.authorRow}>
                <div className={styles.authorAvatar}>
                  {author?.avatar && (
                    <img src={author.avatar} alt={author.name} loading="lazy" />
                  )}
                </div>
                <span className={styles.authorName}>
                  {project.author}
                  <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)' }}>
                    {project.academicLevel || 'Universitario'}
                  </span>
                </span>
              </div>
              <div className={styles.tags}>
                {project.tags?.slice(0, 2).map((tag) => (
                  <span key={tag} className={styles.tagItem}>{tag}</span>
                ))}
              </div>
            </div>

            {/* ── File indicators ── */}
            <div className={styles.indicators} aria-label="Archivos disponibles">
              {project.type === 'paper' && (
                <span className={`${styles.indicator} ${styles.indicatorPdf}`} title="Paper académico">
                  <IconFilePdf /> Paper
                </span>
              )}
              {project.pdfLink && project.type !== 'paper' && (
                <span className={`${styles.indicator} ${styles.indicatorPdf}`} title="Incluye Paper PDF">
                  <IconFilePdf /> PDF
                </span>
              )}
              {project.cadLink && (
                <span className={`${styles.indicator} ${styles.indicatorCad}`} title="Incluye Modelo CAD/3D">
                  <IconBox /> CAD/3D
                </span>
              )}
              {Array.isArray(project.tags) && project.tags.some(t => ['IoT', 'ESP32', 'Machine Learning', 'Deep Learning', 'Robótica'].includes(t)) && (
                <span className={`${styles.indicator} ${styles.indicatorCode}`} title="Proyecto incluye software/código">
                  <IconCode /> Código
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </article>
  )
}
