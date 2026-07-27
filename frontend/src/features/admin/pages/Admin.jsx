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
const IconShield = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
const IconCheck = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
const IconX = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
const IconEdit = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
const IconSend = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
const IconRefresh = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
const IconLock = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
const IconInbox = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>
const IconUser = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
const IconGrid = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
const IconAward = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></svg>
const IconLink = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
const IconSettings = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
const IconSave = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
const IconEye = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
const IconFolder = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
const IconClock = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
const IconBan = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18, flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>
const IconFileText = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18, flexShrink: 0 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>

const statusConfig = {
  pending: { label: 'Pendiente', badgeClass: 'status-badge--pendiente' },
  approved: { label: 'Aprobado', badgeClass: 'status-badge--publico' },
  denied: { label: 'Denegado', badgeClass: 'status-badge--cambios' },
  in_review: { label: 'En Revisión', badgeClass: 'status-badge--pendiente' },
}

function ReviewRow({ row, onSendNote, onCancel }) {
  const [note, setNote] = useState(row.reviewNote ?? '')

  return (
    <tr className={styles.reviewRow}>
      <td colSpan="6">
        <div className={styles.reviewBox}>
          <span className={styles.reviewLabel} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><IconFileText /> Justificación de cambios requeridos</span>
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

function DenyRow({ row, onSendNote, onCancel }) {
  const [note, setNote] = useState('')

  return (
    <tr className={styles.reviewRow}>
      <td colSpan="6">
        <div className={styles.reviewBox}>
          <span className={styles.reviewLabel} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><IconBan /> Motivo de denegación</span>
          <textarea
            id={`deny-note-${row.id}`}
            className={styles.reviewTextarea}
            placeholder="Describe el motivo por el cual se deniega la publicación del proyecto..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
          />
          <div className={styles.reviewActions}>
            <button className="btn btn-secondary btn-sm" onClick={onCancel}>
              Cancelar
            </button>
            <button
              id={`deny-send-${row.id}`}
              className="btn btn-danger btn-sm"
              onClick={() => onSendNote(note)}
              disabled={!note.trim()}
            >
              <IconX /> Denegar Proyecto
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
  const [expandedDeny, setExpandedDeny] = useState(null) // project id for deny
  const [activeTab, setActiveTab] = useState('projects')
  const [adminProjects, setAdminProjects] = useState([])
  const [pendingUsers, setPendingUsers] = useState([])
  const [badgeReqs, setBadgeReqs] = useState([])
  const [denyUserModalId, setDenyUserModalId] = useState(null)
  const [denyUserReason, setDenyUserReason] = useState('')
  const [denyModalId, setDenyModalId] = useState(null)
  const [denyReason, setDenyReason] = useState('')
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false)
  const [settings, setSettings] = useState({})

  useEffect(() => {
    if (isAdmin) {
      setIsLoadingAdmin(true)
      Promise.all([
        import('@/features/projects/api/projects.api').then(api => api.getProjects({ status: 'all' })),
        adminApi.getPendingUsers(),
        adminApi.getBadgeRequests().catch(() => []), // fallback if not implemented
        adminApi.getSettings().catch(() => ({ data: {} }))
      ]).then(([projectsRes, users, badges, settingsRes]) => {
        // projectsRes can be array if interceptor unraps it, or { data }
        setAdminProjects(projectsRes.data || projectsRes || [])
        setPendingUsers(users)
        setBadgeReqs(badges || [])
        setSettings(settingsRes.data || {})
      }).catch(console.error)
        .finally(() => setIsLoadingAdmin(false))
    }
  }, [isAdmin])

  const handleUpdateSetting = async (key, value) => {
    try {
      await adminApi.updateSetting(key, value)
      setSettings(prev => ({ ...prev, [key]: value }))
    } catch (e) {
      console.error(e)
    }
  }

  const rows = adminProjects.filter(p => p.status === 'pendiente' || p.status === 'requiere_cambios' || p.status === 'publico' || p.status === 'denegado').map(p => {
    let adminStatus = 'pending'
    if (p.status === 'publico') adminStatus = 'approved'
    else if (p.status === 'denegado') adminStatus = 'denied'
    else if (p.status === 'requiere_cambios') adminStatus = 'in_review'
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

  const openDenyUser = (id) => {
    setDenyUserModalId(id)
    setDenyUserReason('')
  }

  const confirmDenyUser = async () => {
    try {
      await adminApi.rejectUser(denyUserModalId, denyUserReason)
      setPendingUsers(prev => prev.filter(u => u.id !== denyUserModalId))
      setDenyUserModalId(null)
      setDenyUserReason('')
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
    let globalStatus = 'pendiente'
    if (newAdminStatus === 'approved') globalStatus = 'publico'
    else if (newAdminStatus === 'denied') globalStatus = 'denegado'
    else if (newAdminStatus === 'in_review') globalStatus = 'requiere_cambios'

    updateProjectStatus(id, globalStatus, note)
    setAdminProjects(prev => prev.map(p => p.id === id ? { ...p, status: globalStatus } : p))
    setExpandedReview(null)
    setExpandedDeny(null)
  }

  const resetRow = (id) => transition(id, 'pending')

  const countByStatus = (s) => rows.filter((r) => r.adminStatus === s).length
  const totalProjects = adminProjects.length

  const stats = [
    { label: 'Total Proyectos', value: totalProjects, color: 'var(--accent-500)', bg: 'rgba(59,130,246,0.1)', icon: <IconFolder /> },
    { label: 'En Revisión', value: countByStatus('pending'), color: 'var(--warning)', bg: 'var(--warning-bg)', icon: <IconClock /> },
    { label: 'Aprobados', value: countByStatus('approved'), color: 'var(--success)', bg: 'var(--success-bg)', icon: <IconCheck /> },
    { label: 'Denegados/Cambios', value: countByStatus('denied') + countByStatus('in_review'), color: 'var(--danger)', bg: 'var(--danger-bg)', icon: <IconBan /> },
  ]

  const rowClass = (status) => {
    if (status === 'approved') return styles.rowSuccess
    if (status === 'denied') return styles.rowDanger
    if (status === 'in_review') return styles.rowWarning
    return ''
  }

  const statusBadge = (statusStr) => {
    switch (statusStr) {
      case 'approved': return <span className={styles.badgeSuccess}><IconCheck /> Público</span>
      case 'pending': return <span className={styles.badgeWarning}><IconClock /> En Revisión</span>
      case 'denied': return <span className={styles.badgeDanger}><IconBan /> Denegado</span>
      case 'in_review': return <span className={styles.badgeWarning}><IconEdit /> Req. Cambios</span>
      default: return <span className={styles.badge}>Desconocido</span>
    }
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

        <button
          className={`${styles.tab} ${activeTab === 'settings' ? styles.active : ''}`}
          onClick={() => setActiveTab('settings')}
          style={{ padding: '10px 18px', background: 'none', border: 'none', borderBottom: activeTab === 'settings' ? '2px solid var(--accent-500)' : '2px solid transparent', color: activeTab === 'settings' ? 'var(--accent-400)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', fontWeight: 500, marginLeft: 'auto' }}
        >
          <IconSettings /> Configuración
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
                            <span className={styles.dateCell}>{new Date(row.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
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
                                    onClick={() => {
                                      setExpandedDeny(row.id === expandedDeny ? null : row.id)
                                      setExpandedReview(null)
                                    }}
                                    title="Denegar publicación"
                                  >
                                    <IconX /> Denegar
                                  </button>
                                  <button
                                    id={`review-${row.id}`}
                                    className="btn btn-warning btn-sm"
                                    onClick={() => {
                                      setExpandedReview(row.id === expandedReview ? null : row.id)
                                      setExpandedDeny(null)
                                    }}
                                    title="Solicitar cambios al autor"
                                  >
                                    <IconEdit /> Cambios
                                  </button>
                                  <button
                                    id={`view-${row.id}`}
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => navigate(`/proyecto/${row.id}`)}
                                    title="Ver proyecto"
                                  >
                                    <IconEye /> Ver
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
                        {/* Deny expansion row */}
                        {expandedDeny === row.id && (
                          <DenyRow
                            key={`deny-row-${row.id}`}
                            row={row}
                            onSendNote={(note) => transition(row.id, 'denied', note)}
                            onCancel={() => setExpandedDeny(null)}
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
                Solicitudes de Usuarios ({pendingUsers.length} pendientes)
              </span>
            </div>

            {pendingUsers.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}><IconUser /></div>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>¡Todo al día!</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No hay usuarios pendientes de revisión.</p>
              </div>
            ) : (
              <div className={styles.tableWrapper}>
                <table>
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Afiliación</th>
                      <th>Código/ID</th>
                      <th>Fecha de Registro</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingUsers.map(user => {
                      let codes = []
                      if (user.ieeeId) codes.push(`IEEE: ${user.ieeeId}`)
                      if (user.cimeqhId) codes.push(`CIMEQH: ${user.cimeqhId}`)
                      const codesStr = codes.join(' | ') || 'Ninguno'

                      return (
                        <tr key={user.id}>
                          <td>
                            <div className={styles.projectCell}>
                              <img src={user.profile?.avatarUrl || user.avatarUrl} alt={user.name} className={styles.projectThumb} loading="lazy" />
                              <span className={styles.projectName}>{user.name}</span>
                            </div>
                          </td>
                          <td><span className={styles.authorCell} style={{ fontWeight: 'bold' }}>{user.affiliation || 'Pendiente'}</span></td>
                          <td><span className={styles.universityCell}>{codesStr}</span></td>
                          <td>
                            <span className={styles.dateCell}>
                              {new Date(user.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => approveUser(user.id)}
                                title="Aprobar"
                              >
                                <IconCheck /> Aprobar
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => openDenyUser(user.id)}
                                title="Rechazar"
                              >
                                <IconX /> Rechazar
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
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
                        <td><span className={styles.dateCell}>{new Date(req.submittedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span></td>
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
                          {req.status === 'pending' && <span className="status-badge status-badge--pendiente">Pendiente</span>}
                          {req.status === 'approved' && <span className="status-badge status-badge--publico">Aprobada ✓</span>}
                          {req.status === 'denied' && <span className="status-badge status-badge--cambios" title={req.rejectionReason}>Denegada</span>}
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

      {activeTab === 'settings' && (
        <div style={{ background: 'var(--bg-surface)', padding: 32, borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-default)' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <IconSettings /> Configuración del Sistema
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 600 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8 }}>
                Días de Retención (Proyectos Rechazados)
              </label>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                Especifica cuántos días permanecerán en la base de datos los proyectos con estado "Denegado" o "Requiere Cambios" antes de ser eliminados permanentemente por el sistema automático (Cron).
              </p>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <input
                  type="number"
                  min="1"
                  max="365"
                  className={styles.reviewTextarea}
                  style={{ width: 120, height: 40 }}
                  value={settings['rejected_project_retention_days'] || ''}
                  onChange={(e) => setSettings({ ...settings, 'rejected_project_retention_days': e.target.value })}
                />
                <button
                  className="btn btn-primary"
                  onClick={() => handleUpdateSetting('rejected_project_retention_days', settings['rejected_project_retention_days'])}
                >
                  <IconSave /> Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
      {/* User Deny Modal */}
      {denyUserModalId && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Rechazar Validación de Membresía</h3>
              <button className={styles.closeBtn} onClick={() => setDenyUserModalId(null)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Proporciona un motivo de rechazo que se enviará al usuario (ej: "IEEE ID incorrecto"):</p>
              <textarea
                className="form-input"
                style={{ resize: 'vertical' }}
                rows={3}
                placeholder="Motivo..."
                value={denyUserReason}
                onChange={(e) => setDenyUserReason(e.target.value)}
              />
            </div>
            <div className={styles.modalFooter}>
              <button className="btn btn-secondary" onClick={() => setDenyUserModalId(null)}>Cancelar</button>
              <button className="btn btn-danger" disabled={!denyUserReason.trim()} onClick={confirmDenyUser}>Confirmar Rechazo</button>
            </div>
          </div>
        </div>
      )}


    </div>
  )
}
