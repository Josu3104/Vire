// src/pages/Admin.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useProjects } from '@/features/projects/context/ProjectContext'
import * as adminApi from '@/features/admin/api/admin.api'
import styles from './Admin.module.css'

/* ---- State Machine Types ----
   pending → approved | denied | in_review
   in_review → pending (can reset)
*/

/* ---- Icons ---- */
const IconShield  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
const IconCheck   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const IconX       = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IconEdit    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const IconSend    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
const IconRefresh = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
const IconLock    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
const IconInbox   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
const IconUser    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const IconGrid    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
const IconAward   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
const IconLink    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>

const statusConfig = {
  pending:   { label: 'Pendiente',      badgeClass: 'status-badge--pendiente' },
  approved:  { label: 'Aprobado',       badgeClass: 'status-badge--publico'   },
  denied:    { label: 'Denegado',       badgeClass: 'status-badge--cambios'   },
  in_review: { label: 'En Revisión',    badgeClass: 'status-badge--pendiente' },
}

function ReviewRow({ row, onSendNote, onCancel }) {
  const [note, setNote] = useState(row.reviewNote ?? '')

  return (
    <tr className={styles.reviewRow}>
      <td colSpan="5">
        <div className={styles.reviewBox}>
          <span className={styles.reviewLabel}>📝 Justificación de cambios requeridos</span>
          <textarea
            id={`review-note-${row.id}`}
            className={styles.reviewTextarea}
            placeholder="Describe los cambios que el autor debe realizar antes de publicar..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
          />
          <div className={styles.reviewActions}>
            <button className="btn btn-secondary btn-sm" onClick={onCancel}>
              Cancelar
            </button>
            <button
              id={`review-send-${row.id}`}
              className="btn btn-warning btn-sm"
              onClick={() => onSendNote(note)}
              disabled={!note.trim()}
            >
              <IconSend /> Enviar Solicitud de Revisión
            </button>
          </div>
        </div>
      </td>
    </tr>
  )
}

export default function AdminDashboard() {
  const { isAdmin } = useAuth()
  const { projectsState: projects, updateProjectStatus } = useProjects()
  const navigate = useNavigate()

  const [expandedReview, setExpandedReview] = useState(null) // project id
  const [activeTab, setActiveTab] = useState('projects')
  const [pendingUsers, setPendingUsers] = useState([])
  const [badgeReqs, setBadgeReqs] = useState([])
  const [denyModalId, setDenyModalId] = useState(null)  // badge request id being denied
  const [denyReason, setDenyReason]   = useState('')
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false)

  useEffect(() => {
    if (isAdmin) {
      setIsLoadingAdmin(true)
      Promise.all([
        adminApi.getPendingUsers(),
        adminApi.getBadgeRequests().catch(() => []) // fallback if not implemented
      ]).then(([users, badges]) => {
        setPendingUsers(users)
        setBadgeReqs(badges || [])
      }).catch(console.error)
      .finally(() => setIsLoadingAdmin(false))
    }
  }, [isAdmin])

  const rows = projects.filter(p => p.status === 'Pendiente' || p.status === 'Requiere Cambios' || p.status === 'Público' || p.status === 'Denegado').map(p => {
    let adminStatus = 'pending'
    if (p.status === 'Público') adminStatus = 'approved'
    else if (p.status === 'Denegado') adminStatus = 'denied'
    else if (p.status === 'Requiere Cambios') adminStatus = 'in_review'
    return { ...p, adminStatus }
  })

  const approveUser = async (id) => {
    try {
      await adminApi.approveUser(id)
      setPendingUsers(prev => prev.filter(u => u.id !== id))
    } catch (e) {
      console.error(e)
    }
  }

  const approveBadge = async (id) => {
    try {
      await adminApi.approveBadge(id)
      setBadgeReqs(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r))
    } catch (e) {
      console.error(e)
    }
  }

  const openDenyBadge = (id) => {
    setDenyModalId(id)
    setDenyReason('')
  }

  const confirmDenyBadge = async () => {
    try {
      await adminApi.denyBadge(denyModalId, denyReason)
      setBadgeReqs(prev => prev.map(r =>
        r.id === denyModalId ? { ...r, status: 'denied', rejectionReason: denyReason } : r
      ))
      setDenyModalId(null)
      setDenyReason('')
    } catch (e) {
      console.error(e)
    }
  }

  if (!isAdmin) {
    return (
      <div className={styles.denied}>
        <div className={styles.deniedIcon}><IconLock /></div>
        <h2 style={{ color: 'var(--text-primary)' }}>Acceso Restringido</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: 340 }}>
          Esta área es exclusiva para administradores de Vire. Tu cuenta no tiene los permisos necesarios.
        </p>
        <button className="btn btn-secondary" onClick={() => navigate('/explorar')}>
          Volver al Feed
        </button>
      </div>
    )
  }

  const transition = (id, newAdminStatus, note = null) => {
    let globalStatus = 'Pendiente'
    if (newAdminStatus === 'approved') globalStatus = 'Público'
    else if (newAdminStatus === 'denied') globalStatus = 'Denegado'
    else if (newAdminStatus === 'in_review') globalStatus = 'Requiere Cambios'

    updateProjectStatus(id, globalStatus)
    setExpandedReview(null)
  }

  const resetRow = (id) => transition(id, 'pending')

  const countByStatus = (s) => rows.filter((r) => r.adminStatus === s).length
  const totalProjects = projects.length

  const stats = [
    { label: 'Total Proyectos',  value: totalProjects, color: 'var(--accent-500)',  bg: 'rgba(59,130,246,0.1)',  icon: '📁' },
    { label: 'Pendientes',       value: countByStatus('pending'),   color: 'var(--warning)', bg: 'var(--warning-bg)',  icon: '⏳' },
    { label: 'Aprobados',        value: countByStatus('approved'),  color: 'var(--success)', bg: 'var(--success-bg)', icon: '✅' },
    { label: 'Denegados/Rev.',   value: countByStatus('denied') + countByStatus('in_review'), color: 'var(--danger)', bg: 'var(--danger-bg)', icon: '🚫' },
  ]

  const rowClass = (status) => {
    if (status === 'approved') return styles.rowApproved
    if (status === 'denied')   return styles.rowDenied
    if (status === 'in_review') return styles.rowReview
    return ''
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.breadcrumb}>
          <IconShield /> Panel de Administración
        </div>
        <h1 className={styles.pageTitle}>Revisión de Proyectos</h1>
        <p className={styles.pageSubtitle}>
          Gestiona el estado de publicación de los proyectos enviados por la comunidad.
        </p>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        {stats.map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: s.bg, color: s.color }}>
              {s.icon}
            </div>
            <div className={styles.statBody}>
              <div className={styles.statValue} style={{ color: s.color }}>{s.value}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className={styles.tabs} style={{ margin: '0 0 20px 0', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: '4px' }}>
        <button
          className={`${styles.tab} ${activeTab === 'projects' ? styles.active : ''}`}
          onClick={() => setActiveTab('projects')}
          style={{ padding: '10px 18px', background: 'none', border: 'none', borderBottom: activeTab === 'projects' ? '2px solid var(--accent-500)' : '2px solid transparent', color: activeTab === 'projects' ? 'var(--accent-400)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', fontWeight: 500 }}
        >
          <IconGrid /> Proyectos
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'users' ? styles.active : ''}`}
          onClick={() => setActiveTab('users')}
          style={{ padding: '10px 18px', background: 'none', border: 'none', borderBottom: activeTab === 'users' ? '2px solid var(--accent-500)' : '2px solid transparent', color: activeTab === 'users' ? 'var(--accent-400)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', fontWeight: 500 }}
        >
          <IconUser /> Usuarios ({pendingUsers.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'badges' ? styles.active : ''}`}
          onClick={() => setActiveTab('badges')}
          style={{ padding: '10px 18px', background: 'none', border: 'none', borderBottom: activeTab === 'badges' ? '2px solid var(--accent-500)' : '2px solid transparent', color: activeTab === 'badges' ? 'var(--accent-400)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', fontWeight: 500 }}
        >
          <IconAward /> Insignias ({badgeReqs.filter(r => r.status === 'pending').length})
        </button>
      </div>

      {/* Table */}
      <div className={styles.tablePanel}>
        {activeTab === 'projects' ? (
          <>
            <div className={styles.tablePanelHeader}>
              <span className={styles.tablePanelTitle}>
                Cola de Revisión ({rows.filter((r) => r.adminStatus === 'pending' || r.adminStatus === 'in_review').length} pendientes)
              </span>
            </div>

        {rows.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><IconInbox /></div>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>¡Todo al día!</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No hay proyectos pendientes de revisión.</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table>
              <thead>
                <tr>
                  <th>Proyecto</th>
                  <th>Autor</th>
                  <th>Universidad</th>
                  <th>Enviado</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <>
                    <tr key={row.id} className={rowClass(row.adminStatus)}>
                      {/* Project */}
                      <td>
                        <div className={styles.projectCell}>
                          <img
                            src={row.coverImage}
                            alt={row.title}
                            className={styles.projectThumb}
                            loading="lazy"
                          />
                          <span className={styles.projectName}>{row.title}</span>
                        </div>
                      </td>

                      {/* Author */}
                      <td>
                        <span className={styles.authorCell}>{row.author}</span>
                      </td>

                      {/* University */}
                      <td>
                        <span className={styles.universityCell}>{row.university}</span>
                      </td>

                      {/* Date */}
                      <td>
                        <span className={styles.dateCell}>{row.createdAt}</span>
                      </td>

                      {/* Status badge */}
                      <td>
                        <span className={`status-badge ${statusConfig[row.adminStatus].badgeClass}`}>
                          {statusConfig[row.adminStatus].label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className={styles.actionsCell}>
                          {row.adminStatus === 'pending' && (
                            <>
                              <button
                                id={`approve-${row.id}`}
                                className="btn btn-success btn-sm"
                                onClick={() => transition(row.id, 'approved')}
                                title="Aprobar y publicar proyecto"
                              >
                                <IconCheck /> Aprobar
                              </button>
                              <button
                                id={`deny-${row.id}`}
                                className="btn btn-danger btn-sm"
                                onClick={() => transition(row.id, 'denied')}
                                title="Denegar publicación"
                              >
                                <IconX /> Denegar
                              </button>
                              <button
                                id={`review-${row.id}`}
                                className="btn btn-warning btn-sm"
                                onClick={() => setExpandedReview(row.id === expandedReview ? null : row.id)}
                                title="Solicitar cambios al autor"
                              >
                                <IconEdit /> Revisar
                              </button>
                            </>
                          )}

                          {(row.adminStatus === 'approved' || row.adminStatus === 'denied' || row.adminStatus === 'in_review') && (
                            <button
                              id={`reset-${row.id}`}
                              className="btn btn-ghost btn-sm"
                              onClick={() => resetRow(row.id)}
                              title="Resetear a pendiente"
                            >
                              <IconRefresh /> Resetear
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Review expansion row */}
                    {expandedReview === row.id && (
                      <ReviewRow
                        key={`review-row-${row.id}`}
                        row={row}
                        onSendNote={(note) => transition(row.id, 'in_review', note)}
                        onCancel={() => setExpandedReview(null)}
                      />
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
          </>
        ) : activeTab === 'users' ? (
          <>
            <div className={styles.tablePanelHeader}>
              <span className={styles.tablePanelTitle}>
                Usuarios Pendientes ({pendingUsers.length} por verificar)
              </span>
            </div>

            {pendingUsers.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}><IconUser /></div>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>¡Todo al día!</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No hay usuarios pendientes de verificación.</p>
              </div>
            ) : (
              <div className={styles.tableWrapper}>
                <table>
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Correo</th>
                      <th>Afiliación Proporcionada</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingUsers.map(user => (
                      <tr key={user.id}>
                        <td>
                          <div className={styles.projectCell}>
                            <img src={user.avatar} alt={user.name} className={styles.projectThumb} loading="lazy" />
                            <span className={styles.projectName}>{user.name}</span>
                          </div>
                        </td>
                        <td><span className={styles.authorCell}>{user.email}</span></td>
                        <td><span className={styles.universityCell} style={{ fontWeight: 'bold' }}>{user.affiliation}</span></td>
                        <td>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => approveUser(user.id)}
                            title="Aprobar Membresía"
                          >
                            <IconCheck /> Aprobar Membresía
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          /* ── BADGE REQUESTS TAB ───────────────────────────────────────── */
          <>
            <div className={styles.tablePanelHeader}>
              <span className={styles.tablePanelTitle}>
                Solicitudes de Insignias ({badgeReqs.filter(r => r.status === 'pending').length} pendientes)
              </span>
            </div>
            {badgeReqs.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}><IconAward /></div>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Sin solicitudes</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No hay solicitudes de insignias pendientes.</p>
              </div>
            ) : (
              <div className={styles.tableWrapper}>
                <table>
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Insignia / Competencia</th>
                      <th>Fecha</th>
                      <th>Evidencia</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {badgeReqs.map(req => (
                      <tr key={req.id} className={req.status === 'approved' ? styles.rowApproved : req.status === 'denied' ? styles.rowDenied : ''}>
                        <td>
                          <div className={styles.projectCell}>
                            <img src={req.userAvatar} alt={req.userName} className={styles.projectThumb} loading="lazy" />
                            <span className={styles.projectName}>{req.userName}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 20 }}>{req.badgeIcon}</span>
                            <span className={styles.projectName} style={{ fontSize: 12 }}>{req.badgeName}</span>
                          </div>
                        </td>
                        <td><span className={styles.dateCell}>{req.submittedAt}</span></td>
                        <td>
                          <a
                            href={req.evidence}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <IconLink /> Ver evidencia
                          </a>
                        </td>
                        <td>
                          {req.status === 'pending'  && <span className="status-badge status-badge--pendiente">Pendiente</span>}
                          {req.status === 'approved' && <span className="status-badge status-badge--publico">Aprobada ✓</span>}
                          {req.status === 'denied'   && <span className="status-badge status-badge--cambios" title={req.rejectionReason}>Denegada</span>}
                        </td>
                        <td>
                          <div className={styles.actionsCell}>
                            {req.status === 'pending' && (
                              <>
                                <button className="btn btn-success btn-sm" onClick={() => approveBadge(req.id)}>
                                  <IconCheck /> Aprobar
                                </button>
                                <button className="btn btn-danger btn-sm" onClick={() => openDenyBadge(req.id)}>
                                  <IconX /> Denegar
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Deny Badge Modal ──────────────────────────────────────────────── */}
      {denyModalId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 24 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', padding: 32, maxWidth: 480, width: '100%', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>❌ Denegar Solicitud de Insignia</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
              Proporciona una justificación obligatoria. El usuario podrá verla en su perfil.
            </p>
            <textarea
              className={styles.reviewTextarea}
              placeholder='Ej: "La evidencia no cuenta con el sello oficial del comité organizador."'
              value={denyReason}
              onChange={(e) => setDenyReason(e.target.value)}
              rows={4}
              style={{ width: '100%', marginBottom: 16 }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setDenyModalId(null)}>Cancelar</button>
              <button
                className="btn btn-danger btn-sm"
                onClick={confirmDenyBadge}
                disabled={!denyReason.trim()}
              >
                <IconX /> Confirmar Denegación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
