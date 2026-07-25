// src/components/RightSidebar.jsx
import { useState } from 'react'
import styles from './RightSidebar.module.css'

const trendingTags = []
const topEngineers = { national: [], university: [] }
const jobListings = []

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
  const [engineerTab, setEngineerTab] = useState('national') // 'national' | 'university'

  return (
    <aside className={styles.sidebar}>
      
      {/* Widget 1: Trends */}
      <div className={styles.widget}>
        <div className={styles.widgetHeader}>
          <IconTrending />
          <h3>Tendencias (Top 5)</h3>
        </div>
        <div className={styles.widgetBody}>
          {trendingTags.map((tag, i) => (
            <div key={tag.name} className={styles.trendRow}>
              <span className={styles.trendRank}>#{i + 1}</span>
              <span className={styles.trendName}>{tag.name}</span>
              <span className={styles.trendCount}>{tag.count} proyectos</span>
            </div>
          ))}
        </div>
      </div>

      {/* Widget 2: Top Engineers */}
      <div className={styles.widget}>
        <div className={styles.widgetHeader}>
          <IconTrophy />
          <h3>Top Engineers</h3>
        </div>
        <div className={styles.tabs}>
          <button 
            className={`${styles.tabBtn} ${engineerTab === 'national' ? styles.tabActive : ''}`}
            onClick={() => setEngineerTab('national')}
          >
            Nacional
          </button>
          <button 
            className={`${styles.tabBtn} ${engineerTab === 'university' ? styles.tabActive : ''}`}
            onClick={() => setEngineerTab('university')}
          >
            Universidad
          </button>
        </div>
        <div className={styles.widgetBody}>
          {topEngineers[engineerTab].map((eng, i) => (
            <div key={eng.id} className={styles.engRow}>
              <img src={eng.avatar} alt={eng.name} className={styles.engAvatar} loading="lazy" />
              <div className={styles.engInfo}>
                <span className={styles.engName}>{eng.name}</span>
                <span className={styles.engScore}>{eng.score} pts</span>
              </div>
              <div className={styles.engRank}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Widget 3: Job Board */}
      <div className={styles.widget}>
        <div className={styles.widgetHeader}>
          <IconBriefcase />
          <h3>Empleo & Oportunidades</h3>
        </div>
        <div className={styles.widgetBody}>
          {jobListings.map(job => (
            <div key={job.id} className={styles.jobCard}>
              <h4 className={styles.jobTitle}>{job.title}</h4>
              <p className={styles.jobCompany}>{job.company}</p>
              <div className={styles.jobMeta}>
                <span>{job.location}</span>
                <span>•</span>
                <span>{job.type}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </aside>
  )
}
