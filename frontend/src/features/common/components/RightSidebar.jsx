import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTopEngineers } from '@/features/users/api/users.api'
import styles from './RightSidebar.module.css'

const IconTrending = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
)

const IconTrophy = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 21h8"/><path d="M12 17v4"/>
    <path d="M7 4h10c0 4-2 8-5 8s-5-4-5-8z"/>
    <path d="M7 4c-2 0-3 1-3 3 0 2 1 3 3 3"/>
    <path d="M17 4c2 0 3 1 3 3 0 2-1 3-3 3"/>
  </svg>
)

const IconBriefcase = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
)

export default function RightSidebar() {
  const [topUsers, setTopUsers] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    getTopEngineers().then(setTopUsers).catch(console.error)
  }, [])

  return (
    <aside className={styles.sidebar}>
      <div className={styles.widget}>
        <div className={styles.widgetHeader}>
          <IconTrophy />
          <h3>Miembros Destacados</h3>
        </div>
        <div className={styles.topUsersList}>
          {topUsers.map(user => (
            <div key={user.id} className={styles.topUserItem} onClick={() => navigate(`/usuario/${user.id}`)} style={{ cursor: 'pointer', display: 'flex', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} alt={user.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{user.name}</p>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>{user.affiliation || 'Vire'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
