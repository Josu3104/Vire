import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@/features/auth/context/AuthContext';
import * as chatApi from '@/features/chat/api/chat.api'; // Assuming you have a chat API for inbox

const ChatContext = createContext();

export function useChat() {
  return useContext(ChatContext);
}

export function ChatProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [isWidgetExpanded, setIsWidgetExpanded] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState(null);
  
  const [socket, setSocket] = useState(null);
  const [inbox, setInbox] = useState([]);

  useEffect(() => {
    // let newSocket;
    // const token = localStorage.getItem('access_token');
    // if (isAuthenticated && token) {
    //   newSocket = io('/', {
    //     auth: { token }
    //   });
    //   setSocket(newSocket);
    // }

    // Mocked Socket for Placeholder
    const mockSocket = {
      emit: (event, data) => console.log(`[Mock Socket] Emit '${event}':`, data),
      on: (event, callback) => console.log(`[Mock Socket] Subscribed to '${event}'`),
      off: (event) => console.log(`[Mock Socket] Unsubscribed from '${event}'`),
      disconnect: () => console.log(`[Mock Socket] Disconnected`),
    };
    if (isAuthenticated) {
      setSocket(mockSocket);
    }

    return () => {
      // if (newSocket) newSocket.disconnect();
      mockSocket.disconnect();
    };
  }, [isAuthenticated]);

  const openChatWith = (user) => {
    setActiveChatUser(user);
    setIsWidgetOpen(true);
    setIsWidgetExpanded(true);
  };

  const closeWidget = () => {
    setIsWidgetOpen(false);
    setIsWidgetExpanded(false);
    setActiveChatUser(null);
  };

  const toggleWidgetSize = () => {
    setIsWidgetExpanded((prev) => !prev);
  };

  const sendMessage = (chatId, receiverId, text) => {
    if (socket) {
      socket.emit('sendMessage', { chatId, receiverId, text });
    }
  };

  return (
    <ChatContext.Provider
      value={{
        isWidgetOpen,
        isWidgetExpanded,
        activeChatUser,
        socket,
        inbox,
        setInbox,
        openChatWith,
        closeWidget,
        toggleWidgetSize,
        sendMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
