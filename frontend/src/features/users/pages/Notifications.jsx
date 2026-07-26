import React, { useState, useEffect } from 'react'
import { getNotifications, markAsRead } from '@/features/notifications/api/notifications.api'
import { getTopEngineers } from '@/features/users/api/users.api'
import { useGlobalStats } from '@/core/context/GlobalStatsContext'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'

import styles from './Notifications.module.css'

export default function Notifications() {
  const { currentUser } = useAuth()
  const { refreshStats } = useGlobalStats()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [filter, setFilter] = useState('all')
  const [topUsers, setTopUsers] = useState([])

  useEffect(() => {
    getNotifications().then(res => setNotifications(res)).catch(console.error)
    getTopEngineers().then(setTopUsers).catch(console.error)
  }, [])

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
      refreshStats()
    } catch (e) {
      console.error(e)
    }
  }



  const visibleNotifications = filter === 'unread' ? notifications.filter(n => !n.isRead) : notifications

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {/* Center Column - Feed */}
        <main className={styles.mainContent}>
          <div className={styles.card}>
            <div className={styles.filterTabs}>
              <button 
                className={filter === 'all' ? styles.filterBtnActive : styles.filterBtn}
                onClick={() => setFilter('all')}
              >
                Todas
              </button>
              <button 
                className={filter === 'unread' ? styles.filterBtnActive : styles.filterBtn}
                onClick={() => setFilter('unread')}
              >
                No leídas
              </button>
            </div>
            
            <div className={styles.notificationList}>
              {visibleNotifications.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No tienes notificaciones
                </div>
              ) : visibleNotifications.map(notif => (
                <div 
                  key={notif.id} 
                  className={`${styles.notificationItem} ${!notif.isRead ? styles.unread : ''}`}
                  onClick={() => {
                    if (!notif.isRead) handleMarkAsRead(notif.id)
                    if (notif.targetUrl) navigate(notif.targetUrl)
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.notifIconWrapper} style={{
                    background: notif.message?.includes('Aprobado') ? 'rgba(34,197,94,0.1)' :
                      notif.message?.includes('Denegado') || notif.message?.includes('denegado') ? 'rgba(239,68,68,0.1)' :
                      notif.message?.includes('Cambios') || notif.message?.includes('cambios') ? 'rgba(245,158,11,0.1)' :
                      'rgba(59,130,246,0.1)',
                    color: notif.message?.includes('Aprobado') ? '#22c55e' :
                      notif.message?.includes('Denegado') || notif.message?.includes('denegado') ? '#ef4444' :
                      notif.message?.includes('Cambios') || notif.message?.includes('cambios') ? '#f59e0b' :
                      '#3b82f6',
                    width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18
                  }}>
                    {notif.message?.includes('Aprobado') ? '✅' :
                      notif.message?.includes('Denegado') || notif.message?.includes('denegado') ? '❌' :
                      notif.message?.includes('Cambios') || notif.message?.includes('cambios') ? '⚠️' : '🔔'}
                  </div>
                  <div className={styles.notifBody}>
                    <p className={styles.notifText}>
                      {/* message format: "[Título] cuerpo del mensaje" */}
                      {notif.message ? (() => {
                        const match = notif.message.match(/^\[([^\]]+)\]\s*(.+)$/s)
                        if (match) return <><strong style={{color:'var(--text-primary)'}}>{match[1]}</strong><br />{match[2]}</>
                        return notif.message
                      })() : 'Sin contenido'}
                    </p>
                    <span className={styles.notifTime}>{new Date(notif.createdAt).toLocaleDateString()}</span>
                  </div>
                  {!notif.isRead && <div className={styles.unreadDot}></div>}
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Right Column */}
        <aside className={styles.rightSidebar}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Sugerencias para ti</h3>
            <p className={styles.cardSubtitle}>Compañeros destacados</p>
            
            {topUsers.filter(u => u.id !== currentUser?.id).map(u => (
              <div key={u.id} className={styles.suggestionItem}>
                <img src={u.avatarUrl || 'https://api.dicebear.com/8.x/avataaars/svg'} alt={u.name} className={styles.suggestionAvatarImg} />
                <div className={styles.suggestionInfo}>
                  <div className={styles.suggestionName}>{u.name}</div>
                  <div className={styles.suggestionDesc}>{u.profile?.university || 'Ingeniero'}</div>
                  <button className={styles.followBtn} onClick={() => navigate(`/usuario/${u.id}`)}>Ver Perfil</button>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
