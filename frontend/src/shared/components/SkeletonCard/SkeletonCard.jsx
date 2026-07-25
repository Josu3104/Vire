import styles from './SkeletonCard.module.css'

export default function SkeletonCard() {
  return (
    <article className={styles.skeletonCard} aria-hidden="true">
      {/* Cover image skeleton */}
      <div className={`${styles.cover} ${styles.shimmerBox}`} />

      {/* Footer info skeleton */}
      <div className={styles.info}>
        <div className={`${styles.title} ${styles.shimmerBox}`} />
        <div className={`${styles.subtitle} ${styles.shimmerBox}`} />

        <div className={styles.meta}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div className={`${styles.avatar} ${styles.shimmerBox}`} />
            <div className={`${styles.subtitle} ${styles.shimmerBox}`} style={{ width: '80px' }} />
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <div className={`${styles.tag} ${styles.shimmerBox}`} />
            <div className={`${styles.tag} ${styles.shimmerBox}`} />
          </div>
        </div>
      </div>
    </article>
  )
}
