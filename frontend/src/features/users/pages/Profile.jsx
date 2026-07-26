// src/pages/Profile.jsx
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useProjects } from '@/features/projects/context/ProjectContext'
import { startChat } from '@/features/chat/api/chat.api'
import { getUserById } from '@/features/users/api/users.api'
import { useToast } from '@/core/notifications/ToastContext'
import ProjectCard from '@/features/projects/components/ProjectCard'

import ProfileEditModal from '@/features/users/components/ProfileEditModal'
import EditProjectModal from '@/features/projects/components/EditProjectModal'
import { getMyProjects } from '@/features/projects/api/projects.api'
import styles from './Profile.module.css'

/* ── Icons ─────────────────────────────────────────────────────────────── */
const IconEdit = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
const IconMessageSquare = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
const IconVerified = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
const IconFileText = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
const IconGrid = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
const IconPaper = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
const IconBadge = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></svg>
const IconMapPin = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
const IconWhatsApp = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
const IconDownload = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
const IconExternal = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 0 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
const IconChevron = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
const IconChevronUp = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>

/* ── LED availability config ────────────────────────────────────────────── */
const LED_CONFIG = {
  available: { color: '#22c55e', label: 'Disponible para pasantías/empleo', cssVar: '--led-green' },
  research: { color: '#3b82f6', label: 'Abierto a proyectos de investigación', cssVar: '--led-blue' },
  unavailable: { color: '#6b7280', label: 'No disponible', cssVar: '--led-grey' },
}

/* ── Paper Card Rediseñado ──────────────────────────────────────────────── */
function PaperCard({ paper }) {
  const [expanded, setExpanded] = useState(false)
  const [voted, setVoted] = useState(false)

  const handleVote = (e) => {
    e.stopPropagation()
    setVoted(!voted)
  }

  return (
    <div className={styles.paperCardNew} onClick={() => setExpanded(!expanded)}>
      <div className={styles.paperPreview}>
        <IconPaper />
      </div>

      <div className={styles.paperContent}>
        <div className={styles.paperMetaRow}>
          <span className={styles.paperJournal}>{paper.journal ?? 'Revista Independiente'} · {paper.year ?? new Date().getFullYear()}</span>
          {(paper.upvotes ?? 0) >= 0 && (
            <button 
              className={`${styles.paperUpvotes} ${voted ? styles.voted : ''}`}
              onClick={handleVote}
            >
              <IconChevronUp /> {(paper.upvotes ?? 0) + (voted ? 1 : 0)}
            </button>
          )}
        </div>

        <h3 className={styles.paperTitle}>{paper.title ?? 'Paper sin título'}</h3>

        <p className={styles.paperAbstractSmall}>
          {expanded ? (paper.abstract ?? paper.description ?? 'Sin descripción') : `${(paper.abstract ?? paper.description ?? 'Sin descripción').substring(0, 100)}...`}
        </p>

        {(paper.tags ?? []).length > 0 && (
          <div className={styles.paperTags}>
            {(paper.tags ?? []).map(t => <span key={t} className={styles.paperTag}>{t}</span>)}
          </div>
        )}

        {expanded && paper.doi && (
          <a
            href={`https://doi.org/${paper.doi}`}
            target="_blank"
            rel="noreferrer"
            className={styles.paperDoi}
            onClick={e => e.stopPropagation()}
          >
            DOI: {paper.doi} <IconExternal />
          </a>
        )}
      </div>
    </div>
  )
}

/* ── Badge Card ─────────────────────────────────────────────────────────── */
function BadgeCard({ badge }) {
  return (
    <div className={styles.badgeCard}>
      <div className={styles.badgeIcon}>{badge.icon}</div>
      <div className={styles.badgeInfo}>
        <p className={styles.badgeName}>{badge.name}</p>
        <p className={styles.badgeDate}>Certificado · {badge.date}</p>
        <p className={styles.badgeIssuer}>por {badge.issuedBy}</p>
      </div>
      {badge.certified && <div className={styles.certifiedSeal} title="Verificado por Admin">✓</div>}
    </div>
  )
}

/* ── Main Component ─────────────────────────────────────────────────────── */
export default function Profile() {
  const { currentUser } = useAuth()
  const { id } = useParams()
  const { projectsState: projects } = useProjects()
  const { error, success } = useToast()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('projects')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [myProjectsList, setMyProjectsList] = useState([])
  
  const [profileUser, setProfileUser] = useState(currentUser)
  const [isLoading, setIsLoading] = useState(false)
  
  const isMyProfile = currentUser?.id === profileUser?.id;

  useEffect(() => {
    if (id && id !== currentUser?.id) {
      setIsLoading(true)
      getUserById(id)
        .then(res => {
          const u = res.data || res
          setProfileUser({ ...u, ...u.profile })
        })
        .catch(err => {
          console.error(err)
          error('No se pudo cargar el perfil del usuario.')
        })
        .finally(() => setIsLoading(false))
    } else {
      setProfileUser(currentUser)
    }
  }, [id, currentUser, error])

  useEffect(() => {
    if (isMyProfile) {
      getMyProjects().then(res => setMyProjectsList(res.data || [])).catch(console.error)
    }
  }, [isMyProfile])

  if (isLoading) {
    return <div style={{ display: 'flex', height: '100svh', alignItems: 'center', justifyContent: 'center' }}>Cargando perfil...</div>
  }

  if (!profileUser) {
    return <div style={{ display: 'flex', height: '100svh', alignItems: 'center', justifyContent: 'center' }}>Perfil no encontrado</div>
  }

  const allUserPublications = projects.filter((p) => p.authorIds?.includes(profileUser?.id))
  const userProjects = allUserPublications

  const totalUpvotes = allUserPublications.reduce((acc, p) => acc + p.upvotes, 0)
  const totalComments = allUserPublications.reduce((a, p) => a + (p.comments?.filter(c => !c.isHiddenByAuthor).length ?? 0), 0)

  const led = LED_CONFIG[profileUser?.availabilityState ?? 'unavailable']

  const isPublic = profileUser?.isContactPublic !== false;
  const isAdmin = currentUser?.role === 'admin';
  const canViewFullProfile = isMyProfile || isAdmin || isPublic;
  
  const isVerified = profileUser?.role === 'member' || profileUser?.role === 'admin';

  const roleLabel =
    profileUser?.role === 'admin' ? 'Administrador' :
      profileUser?.role === 'member' ? 'Miembro IEEE' :
        profileUser?.role === 'empleador' ? 'Empleador' :
          'Cuenta Básica'

  const handleProjectClick = (project) => navigate(`/proyecto/${project.id}`)

  const handleWhatsApp = () => {
    if (profileUser?.phone) window.open(`https://wa.me/${profileUser.phone.replace(/\D/g, '')}`, '_blank')
    else error('Número no disponible en este perfil de demo.')
  }

  const handleStartChat = async () => {
    if (!currentUser) return error('Inicia sesión para enviar mensajes.')
    try {
      const room = await startChat(profileUser.id)
      navigate(`/mensajes?chatId=${room.id}`)
    } catch (e) {
      console.error(e)
      error('No se pudo iniciar el chat.')
    }
  }

  const badges = profileUser?.badges ?? []

  return (
    <div className={styles.page}>

      {/* ── Banner ─────────────────────────────────────────────────────── */}
      <div className={styles.bannerWrapper}>
        <img
          src={profileUser?.bannerUrl ?? `https://picsum.photos/seed/${profileUser?.bannerSeed ?? 'banner-1'}/1400/400`}
          alt="Banner de perfil"
          className={styles.bannerImg}
        />
        <div className={styles.bannerOverlay} />
      </div>

      {/* ── Layout: main + ficha lateral ────────────────────────────────── */}
      <div className={styles.profileLayout}>

        {/* ── Header Card ─────────────────────────────────────────────── */}
        <div className={styles.headerCard}>
          <div className={styles.avatarRow}>
            {/* Avatar + LED ring */}
            <div className={styles.avatarWrapper}>
              <img
                src={profileUser?.avatar}
                alt={profileUser?.name}
                className={styles.avatar}
              />
            </div>

            <div className={styles.headerActions}>
              {isMyProfile ? (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsEditModalOpen(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <IconEdit /> Editar Perfil
                </button>
              ) : (
                <>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleStartChat}
                    title="Enviar mensaje directo"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <IconMessageSquare /> Mensaje
                  </button>
                  {profileUser?.phone && canViewFullProfile && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={handleWhatsApp}
                      title={`Contactar a ${profileUser?.name} por WhatsApp`}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <IconWhatsApp /> WhatsApp
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Name, handle, LED label */}
          <div className={styles.nameRow}>
            <h1 className={styles.userName}>
              {profileUser?.name}
              {isVerified && <span title="Cuenta Verificada" style={{ color: '#3b82f6', marginLeft: '6px', display: 'inline-flex', verticalAlign: 'middle', width: '20px' }}><IconVerified /></span>}
            </h1>
            {/* Affiliation Badges */}
            {profileUser?.affiliation?.startsWith('IEEE') && (
              <span className={`${styles.affBadge} ${styles.affIEEE}`}>🔷 IEEE</span>
            )}
            {profileUser?.affiliation?.startsWith('CIMEQH') && (
              <span className={`${styles.affBadge} ${styles.affCIMEQH}`}>🔵 CIMEQH</span>
            )}
          </div>
          <p className={styles.userHandle}>
            @{profileUser?.email?.split('@')[0]} · {roleLabel}
          </p>

          {/* Privacy Indicator */}
          <div className={styles.ledRow}>
            <span className={styles.privacyLabel} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
              {isPublic ? '🌍 Perfil Público' : '🔒 Perfil Privado'}
            </span>
          </div>

          {/* Bio */}
          {profileUser?.bio && (
            <p className={styles.bio}>{profileUser.bio}</p>
          )}

          {/* Location meta */}
          <div className={styles.metaRow}>
            {profileUser?.university && (
              <span className={styles.metaItem}><IconMapPin /> {profileUser.university}</span>
            )}
            {profileUser?.city && (
              <span className={styles.metaItem}>📍 {profileUser.city}</span>
            )}
          </div>
        </div>

        {/* ── Stats Row ─────────────────────────────────────────────────── */}
        <div className={styles.statsRow}>
          {[
            { label: 'Publicaciones', value: userProjects.length },
            { label: 'Upvotes', value: totalUpvotes },
            { label: 'Comentarios', value: totalComments },
            { label: 'Insignias', value: badges.length },
          ].map((s) => (
            <div key={s.label} className={styles.statItem}>
              <div className={styles.statValue}>{s.value}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Content Area + Ficha Técnica ─────────────────────────────── */}
        <div className={styles.contentRow}>

          {/* Tabs + Content */}
          <div className={styles.mainContent}>
            {!canViewFullProfile ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon} style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
                <h3>Perfil Privado</h3>
                <p>Este perfil es privado. Puedes enviar un mensaje directo para contactar a este usuario.</p>
              </div>
            ) : (
              <>
                <div className={styles.tabs} role="tablist">
              <button
                className={`${styles.tab} ${activeTab === 'projects' ? styles.active : ''}`}
                onClick={() => setActiveTab('projects')}
                role="tab"
                aria-selected={activeTab === 'projects'}
              >
                <IconGrid /> Publicaciones ({userProjects.length})
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'badges' ? styles.active : ''}`}
                onClick={() => setActiveTab('badges')}
                role="tab"
                aria-selected={activeTab === 'badges'}
              >
                <IconBadge /> Logros ({badges.length})
              </button>
              {isMyProfile && (
                <button
                  className={`${styles.tab} ${activeTab === 'private' ? styles.active : ''}`}
                  onClick={() => setActiveTab('private')}
                  role="tab"
                  aria-selected={activeTab === 'private'}
                  style={{ color: 'var(--accent-500)', marginLeft: 'auto' }}
                >
                  <IconFileText /> En Revisión ({myProjectsList.filter(p => p.status !== 'publico').length})
                </button>
              )}
            </div>

            {/* ── Tab: Projects ─────────────────────────────────────── */}
            {activeTab === 'projects' && (
              <>
                {userProjects.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}><IconGrid /></div>
                    <p className={styles.emptyTitle}>Sin proyectos publicados</p>
                    <p className={styles.emptyText}>Los proyectos aprobados aparecerán aquí.</p>
                  </div>
                ) : (
                  <div className={styles.projectsGrid}>
                    {userProjects.map((p, i) => (
                      <ProjectCard
                        key={p.id}
                        project={p}
                        onClick={handleProjectClick}
                        animationDelay={i * 60}
                        variant="grid"
                      />
                    ))}
                  </div>
                )}
              </>
            )}


            {/* ── Tab: Badges ───────────────────────────────────────── */}
            {activeTab === 'badges' && (
              <div className={styles.badgesContainer}>
                {badges.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}><IconBadge /></div>
                    <p className={styles.emptyTitle}>Sin logros registrados</p>
                    <p className={styles.emptyText}>Las medallas de competencias certificadas aparecerán aquí.</p>
                  </div>
                ) : (
                  <div className={styles.badgesGrid}>
                    {badges.map((b) => <BadgeCard key={b.id} badge={b} />)}
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: Private ───────────────────────────────────────── */}
            {activeTab === 'private' && isMyProfile && (
              <div className={styles.privateContainer}>
                {myProjectsList.filter(p => p.status !== 'publico').length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}><IconFileText /></div>
                    <p className={styles.emptyTitle}>Todo en orden</p>
                    <p className={styles.emptyText}>No tienes proyectos pendientes, rechazados o que requieran cambios.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {myProjectsList.filter(p => p.status !== 'publico').map((p) => (
                      <div key={p.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            {p.title} 
                            <span className={`status-badge status-badge--${p.status === 'pendiente' ? 'pendiente' : 'cambios'}`}>
                              {p.status === 'pendiente' ? 'Pendiente' : 
                               p.status === 'requiere_cambios' ? 'Requiere Cambios' : 
                               p.status === 'denegado' ? 'Denegado' : p.status}
                            </span>
                          </h4>
                          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                            {p.rejectionReason ? `Nota: ${p.rejectionReason}` : 'En espera de revisión por un administrador.'}
                          </p>
                        </div>
                        {p.status !== 'pendiente' && (
                          <button className="btn btn-primary btn-sm" onClick={() => setEditingProject(p)}>
                            <IconEdit /> Editar y Reenviar
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
              </>
            )}
          </div>

          {/* ── Ficha Técnica Lateral ─────────────────────────────────── */}
          <aside className={styles.fichaPanel}>
            <div className={styles.fichaHeader}>
              <span className={styles.fichaTitle}>// FICHA TÉCNICA</span>
            </div>
            <div className={styles.fichaBody}>
              {[
                { label: 'INSTITUCIÓN', value: profileUser?.university || '—' },
                { label: 'ESTADO', value: profileUser?.academicStatus || '—' },
                { label: 'SEDE', value: profileUser?.campus || '—' },
                { label: 'CIUDAD', value: profileUser?.city || '—' },
                { label: 'AFILIACIÓN', value: profileUser?.affiliation || 'Ninguna' },
                { label: 'CUENTA', value: profileUser?.role === 'member' || profileUser?.role === 'admin' ? '✅ Validada' : '⚠️ Básica' },
              ].map(({ label, value }) => (
                <div key={label} className={styles.fichaRow}>
                  <span className={styles.fichaLabel}>{label}</span>
                  <span className={styles.fichaValue}>{value}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
      <ProfileEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profileUser={profileUser}
      />
      
      {editingProject && (
        <EditProjectModal 
          isOpen={true} 
          onClose={() => {
            setEditingProject(null)
            // Re-fetch to update list
            getMyProjects().then(res => setMyProjectsList(res.data || [])).catch(console.error)
          }}
          projectToEdit={editingProject}
        />
      )}
    </div>
  )
}
