import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChat } from '@/features/chat/context/ChatContext'
import styles from './ChatWidget.module.css'

export default function ChatWidget() {
  const { isWidgetOpen, isWidgetExpanded, activeChatUser, closeWidget, toggleWidgetSize } = useChat()
  const navigate = useNavigate()
  const [message, setMessage] = useState('')

  if (!isWidgetOpen) return null

  const handleNavigateToMessages = () => {
    closeWidget()
    navigate('/mensajes')
  }

  const handleSend = (e) => {
    e.preventDefault()
    if (message.trim()) {
      // Mock sending message
      setMessage('')
    }
  }

  if (!isWidgetExpanded) {
    return (
      <div className={styles.collapsedWidget} onClick={toggleWidgetSize}>
        <div className={styles.collapsedHeader}>
          <div className={styles.avatarMini}>
            {activeChatUser?.avatar ? (
              <img src={activeChatUser.avatar} alt={activeChatUser.name} />
            ) : (
              <div className={styles.avatarPlaceholder}>{activeChatUser?.name?.[0] || '?'}</div>
            )}
          </div>
          <span className={styles.collapsedTitle}>Mensajes (2)</span>
        </div>
        <div className={styles.actions}>
          <button className={styles.iconBtn} onClick={(e) => { e.stopPropagation(); closeWidget(); }}>
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.expandedWidget}>
      <div className={styles.header}>
        <div className={styles.headerInfo} onClick={toggleWidgetSize}>
          <div className={styles.avatar}>
            {activeChatUser?.avatar ? (
              <img src={activeChatUser.avatar} alt={activeChatUser.name} />
            ) : (
              <div className={styles.avatarPlaceholder}>{activeChatUser?.name?.[0] || '?'}</div>
            )}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{activeChatUser?.name || 'Usuario'}</span>
            <span className={styles.userStatus}>En línea</span>
          </div>
        </div>
        <div className={styles.actions}>
          <button className={styles.iconBtn} onClick={handleNavigateToMessages} title="Abrir en pantalla completa">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
          </button>
          <button className={styles.iconBtn} onClick={toggleWidgetSize} title="Minimizar">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
          <button className={styles.iconBtn} onClick={closeWidget} title="Cerrar">
             <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>

      <div className={styles.chatBody}>
        <div className={styles.messageReceived}>
          Hola, me pareció muy interesante tu proyecto. ¿Podríamos colaborar?
        </div>
        <div className={styles.messageSent}>
          ¡Hola! Claro que sí, estoy buscando equipo para la próxima fase.
        </div>
      </div>

      <form className={styles.footer} onSubmit={handleSend}>
        <button type="button" className={styles.attachBtn}>
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
        </button>
        <input 
          type="text" 
          placeholder="Escribe un mensaje..." 
          className={styles.input}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button type="submit" className={styles.sendBtn} disabled={!message.trim()}>
          Enviar
        </button>
      </form>
    </div>
  )
}
