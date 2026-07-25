// src/context/ToastContext.jsx
import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import styles from './Toast.module.css'

/* ---- Icons ---- */
const IconSuccess = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)

const IconError = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
)

const IconInfo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
)

const IconX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const ToastContext = createContext()

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, closing: true } : t))
    )
    // Remove completely after animation finishes
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 300)
  }, [])

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, message, type, closing: false }])

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration)
    }
  }, [removeToast])

  const success = useCallback((msg, duration) => addToast(msg, 'success', duration), [addToast])
  const error = useCallback((msg, duration) => addToast(msg, 'error', duration), [addToast])
  const info = useCallback((msg, duration) => addToast(msg, 'info', duration), [addToast])

  const contextValue = useMemo(() => ({
    success, error, info
  }), [success, error, info])

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className={styles.toastContainer} aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${styles.toast} ${styles[t.type]} ${t.closing ? styles.closing : ''}`}
            role="alert"
          >
            <div className={styles.toastIcon}>
              {t.type === 'success' && <IconSuccess />}
              {t.type === 'error' && <IconError />}
              {t.type === 'info' && <IconInfo />}
            </div>
            <div className={styles.toastMessage}>{t.message}</div>
            <button className={styles.closeBtn} onClick={() => removeToast(t.id)} aria-label="Cerrar notificación">
              <IconX />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
