import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { getUnreadChatCount } from '@/features/chat/api/chat.api';
import { getUnreadNotificationCount } from '@/features/notifications/api/notifications.api';
import { io } from 'socket.io-client';

const GlobalStatsContext = createContext();

export function GlobalStatsProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const socketRef = useRef(null);

  const fetchStats = async () => {
    if (!isAuthenticated) return;
    try {
      const [chatRes, notifRes] = await Promise.all([
        getUnreadChatCount(),
        getUnreadNotificationCount()
      ]);
      setUnreadMessages(chatRes.unreadMessages || 0);
      setUnreadNotifications(notifRes.unreadNotifications || 0);
    } catch (e) {
      console.error('Error fetching global stats', e);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();

      // Connect socket globally for stats updates
      const token = localStorage.getItem('access_token');
      socketRef.current = io('/', {
        auth: { token },
        transports: ['websocket'],
      });

      socketRef.current.on('newMessage', () => {
        // We could just increment, but it's safer to re-fetch or increment
        setUnreadMessages(prev => prev + 1);
      });

      socketRef.current.on('newNotification', () => {
        setUnreadNotifications(prev => prev + 1);
      });
    }

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [isAuthenticated]);

  return (
    <GlobalStatsContext.Provider value={{
      unreadMessages,
      setUnreadMessages,
      unreadNotifications,
      setUnreadNotifications,
      refreshStats: fetchStats
    }}>
      {children}
    </GlobalStatsContext.Provider>
  );
}

export const useGlobalStats = () => useContext(GlobalStatsContext);
