import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import { getInbox, getHistory, startChat, markChatAsRead } from '@/features/chat/api/chat.api'
import { searchUsers } from '@/features/users/api/users.api'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useGlobalStats } from '@/core/context/GlobalStatsContext'
import { useNavigate } from 'react-router-dom'
import EmojiPicker from 'emoji-picker-react'
import styles from './Messages.module.css'

export default function Messages() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const initialChatId = searchParams.get('chatId')
  const { currentUser } = useAuth()
  const { refreshStats } = useGlobalStats()
  const [inbox, setInbox] = useState([])
  const [activeChat, setActiveChat] = useState(null) 
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [topUsers, setTopUsers] = useState([])
  const socketRef = useRef(null)
  const messagesEndRef = useRef(null)
  const activeChatRef = useRef(null)

  useEffect(() => {
    activeChatRef.current = activeChat
  }, [activeChat])

  useEffect(() => {
    // 1. Fetch inbox
    getInbox().then(res => {
      setInbox(res)
      if (initialChatId) {
        const chat = res.find(c => c.id === Number(initialChatId))
        if (chat) {
          const partner = getChatPartner(chat, currentUser?.id)
          if (partner) setActiveChat({ ...partner, chatId: chat.id })
        }
      }
    }).catch(console.error)

    // 2. Connect socket
    const token = localStorage.getItem('access_token')
    const rawApiUrl = import.meta.env.VITE_API_URL
    const socketUrl = rawApiUrl && rawApiUrl.startsWith('http')
      ? rawApiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '')
      : '/'

    socketRef.current = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
    })

    socketRef.current.on('connect', () => {
      console.log('Socket connected:', socketRef.current.id)
    })

    socketRef.current.on('newMessage', (msg) => {
      const isCurrentlyActive = activeChatRef.current?.chatId === msg.chatId;

      // If the message belongs to the current active chat, append it
      setMessages((prev) => {
        if (isCurrentlyActive) {
          return [...prev, msg]
        }
        return prev
      })
      
      // Update the inbox to show the latest message and time
      setInbox(prev => prev.map(c => {
        if (c.id === msg.chatId) {
          const msgToStore = isCurrentlyActive ? { ...msg, isRead: true } : msg;
          
          if (isCurrentlyActive) {
            markChatAsRead(msg.chatId).then(() => refreshStats()).catch(console.error)
          }

          return { ...c, messages: [msgToStore] }
        }
        return c
      }))
    })

    socketRef.current.on('userStatusChanged', ({ userId, isOnline, lastSeen }) => {
      setInbox(prev => prev.map(c => {
        let modified = false;
        if (c.participant1?.id === userId) { c.participant1.isOnline = isOnline; c.participant1.lastSeen = lastSeen; modified = true; }
        if (c.participant2?.id === userId) { c.participant2.isOnline = isOnline; c.participant2.lastSeen = lastSeen; modified = true; }
        return modified ? { ...c } : c;
      }));
      setActiveChat(prev => (prev?.id === userId ? { ...prev, isOnline, lastSeen } : prev));
    });

    socketRef.current.on('messagesRead', ({ chatId }) => {
      if (activeChatRef.current?.chatId === chatId) {
        setMessages(prev => prev.map(m => (!m.isRead ? { ...m, isRead: true } : m)));
      }
      setInbox(prev => prev.map(c => {
        if (c.id === chatId && c.messages?.length > 0 && !c.messages[0].isRead) {
          return { ...c, messages: [{ ...c.messages[0], isRead: true }] };
        }
        return c;
      }));
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect()
    }
  }, [])

  useEffect(() => {
    if (activeChat) {
      getHistory(activeChat.chatId).then(res => {
        setMessages(res.messages || [])
        scrollToBottom()
      }).catch(console.error)

      // Mark chat as read and refresh stats
      markChatAsRead(activeChat.chatId).then(() => refreshStats()).catch(console.error)
      if (socketRef.current) socketRef.current.emit('markAsRead', { chatId: activeChat.chatId });
      
      // Mark as read in local inbox state
      setInbox(prev => prev.map(c => {
        if (c.id === activeChat.chatId && c.messages?.length > 0) {
          return { ...c, messages: [{ ...c.messages[0], isRead: true }] }
        }
        return c
      }))
    }
  }, [activeChat])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Sync activeChat with URL so browser Back button works
  useEffect(() => {
    const currentChatId = searchParams.get('chatId')
    if (!currentChatId && activeChat) {
      setActiveChat(null)
    } else if (currentChatId && inbox.length > 0) {
      const chat = inbox.find(c => c.id === Number(currentChatId))
      if (chat && (!activeChat || activeChat.chatId !== chat.id)) {
        const partner = getChatPartner(chat, currentUser?.id)
        if (partner) setActiveChat({ ...partner, chatId: chat.id })
      }
    }
  }, [searchParams, inbox, activeChat, currentUser?.id])

  const handleSend = (e) => {
    e.preventDefault()
    if (inputMessage.trim() && activeChat) {
      const payload = {
        chatId: activeChat.chatId,
        receiverId: activeChat.id,
        text: inputMessage,
      }
      
      // Optimistic update
      const newMsg = {
        id: Date.now(),
        senderId: currentUser.id,
        receiverId: activeChat.id,
        chatId: activeChat.chatId,
        text: inputMessage,
        createdAt: new Date().toISOString()
      }
      setMessages(prev => [...prev, newMsg])

      setInbox(prev => prev.map(c => {
        if (c.id === activeChat.chatId) {
          return { ...c, messages: [newMsg] }
        }
        return c
      }))

      socketRef.current.emit('sendMessage', payload)
      setInputMessage('')
      setShowEmojiPicker(false)
    }
  }

  const getChatPartner = (chat, uid = currentUser?.id) => {
    return chat.participant1Id === uid ? chat.participant2 : chat.participant1
  }

  const handleStartNewChat = async (targetUserId) => {
    try {
      const chat = await startChat(targetUserId)
      setIsModalOpen(false)
      // Check if chat is already in inbox state
      const exists = inbox.find(c => c.id === chat.id)
      if (!exists) {
        // Optimistic update of inbox
        setInbox(prev => [chat, ...prev])
      }
      const partner = getChatPartner(chat, currentUser.id)
      setActiveChat({ ...partner, chatId: chat.id })
      navigate(`/mensajes?chatId=${chat.id}`, { replace: true })
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className={styles.page}>
      <div className={`${styles.layout} ${activeChat ? styles.showChatOnMobile : ''}`}>
        {/* Left Panel - Inbox */}
        <div className={styles.inboxPanel}>
          <div className={styles.inboxHeader}>
            <h2>Mensajes</h2>
            <button className={styles.newChatBtn} title="Nuevo mensaje" onClick={() => setIsModalOpen(true)}>
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
          </div>
          
          <div className={styles.chatList}>
            {inbox.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '8px' }}>Aún no tienes mensajes</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>Contacta a tus colegas para empezar a hacer networking.</p>
                <button className="btn btn-primary btn-sm" onClick={() => setIsModalOpen(true)}>
                  Iniciar Chat
                </button>
              </div>
            ) : inbox.map(chat => {
              const partner = getChatPartner(chat, currentUser?.id)
              if(!partner) return null;
              
              const lastMessage = chat.messages?.[0];
              const isUnread = lastMessage && !lastMessage.isRead && lastMessage.senderId !== currentUser.id;
              
              return (
                <div 
                  key={chat.id} 
                  className={`${styles.chatListItem} ${activeChat?.id === partner.id ? styles.active : ''} ${isUnread ? styles.unreadItem : ''}`}
                  onClick={() => {
                    setActiveChat({ ...partner, chatId: chat.id })
                    setSearchParams({ chatId: chat.id })
                  }}
                >
                  <img src={partner.avatarUrl || 'https://api.dicebear.com/8.x/avataaars/svg'} alt={partner.name} className={styles.chatListAvatar} />
                  <div className={styles.chatListInfo}>
                    <div className={styles.chatListTop}>
                      <span className={styles.chatListName}>{partner.name}</span>
                      <span className={styles.chatListTime}>
                        {lastMessage ? new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className={`${styles.chatListPreview} ${isUnread ? styles.unreadText : ''}`}>
                      {lastMessage ? lastMessage.text : 'No hay mensajes'}
                    </p>
                  </div>
                  {isUnread && <div className={styles.unreadDot} />}
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Panel - Active Chat */}
        <div className={styles.chatPanel}>
          {activeChat ? (
            <>
              <div className={styles.chatHeader}>
                <div className={styles.chatHeaderInfo}>
                  <button className={styles.backBtn} onClick={() => {
                    setActiveChat(null)
                    setSearchParams({})
                  }}>
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none" strokeWidth="2">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>
                  <img src={activeChat.avatarUrl || 'https://api.dicebear.com/8.x/avataaars/svg'} alt={activeChat.name} className={styles.chatHeaderAvatar} />
                  <div>
                    <h3 className={styles.chatHeaderName}>{activeChat.name}</h3>
                    <p className={styles.chatHeaderStatus}>
                      {activeChat.isOnline ? (
                        <><span className={styles.onlineDot}></span> En línea</>
                      ) : (
                        activeChat.lastSeen ? `Última vez: ${new Date(activeChat.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Desconectado'
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className={styles.chatMessages}>
                {messages.map(msg => {
                  const isMine = msg.senderId === currentUser?.id
                  return (
                    <div key={msg.id} className={isMine ? styles.messageSent : styles.messageReceived}>
                      {msg.text}
                      <span className={styles.messageTime}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isMine && (
                          <span className={`${styles.readReceipt} ${msg.isRead ? styles.read : ''}`}>
                            ✓✓
                          </span>
                        )}
                      </span>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              <div style={{ position: 'relative' }}>
                <form className={styles.chatInputArea} onSubmit={handleSend}>
                  <button type="button" className={styles.attachBtn} onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                  </button>
                  <div className={styles.inputWrapper}>
                    <input 
                      type="text" 
                      placeholder="Escribe un mensaje..." 
                      className={styles.input}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                    />
                  </div>
                  <button type="submit" className={styles.sendBtn} disabled={!inputMessage.trim()}>
                    Enviar
                  </button>
                </form>
                {showEmojiPicker && (
                  <div style={{ position: 'absolute', bottom: '100%', left: '16px', zIndex: 50, marginBottom: '8px' }}>
                    <EmojiPicker 
                      onEmojiClick={(emojiData) => setInputMessage(prev => prev + emojiData.emoji)} 
                      theme="auto"
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className={styles.emptyChat}>
              <p>Selecciona un chat para empezar a mensajear</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal de Nuevo Mensaje */}
      {isModalOpen && (
        <NewChatModal 
          onClose={() => setIsModalOpen(false)} 
          onSelectUser={handleStartNewChat} 
        />
      )}
    </div>
  )
}

function NewChatModal({ onClose, onSelectUser }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([])
      return
    }
    const timer = setTimeout(() => {
      setIsSearching(true)
      searchUsers(query)
        .then(res => setResults(res))
        .catch(console.error)
        .finally(() => setIsSearching(false))
    }, 400)
    return () => clearTimeout(timer)
  }, [query])

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div style={{ backgroundColor: 'var(--bg-surface)', width: '100%', maxWidth: 450, borderRadius: 'var(--radius-lg)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          <input 
            autoFocus
            type="text" 
            placeholder="Buscar por nombre..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: '100%', border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '16px', outline: 'none' }}
          />
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {isSearching ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Buscando...</div>
          ) : results.length > 0 ? (
            results.map(u => (
              <div 
                key={u.id} 
                onClick={() => onSelectUser(u.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: 'pointer', borderRadius: 'var(--radius-md)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <img src={u.avatarUrl || 'https://api.dicebear.com/8.x/avataaars/svg'} alt={u.name} style={{ width: 40, height: 40, borderRadius: '50%' }} />
                <div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{u.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{u.profile?.university || 'Ingeniero'}</div>
                </div>
              </div>
            ))
          ) : query.length >= 2 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron usuarios</div>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Escribe un nombre para buscar compañeros</div>
          )}
        </div>
      </div>
    </div>
  )
}
