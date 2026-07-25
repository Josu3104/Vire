import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/features/auth/context/AuthContext'
import { ProjectProvider } from '@/features/projects/context/ProjectContext'
import { ThemeProvider } from '@/core/theme/ThemeContext'
import { ToastProvider } from '@/core/notifications/ToastContext'
import { ChatProvider } from '@/features/chat/context/ChatContext'
import { GlobalStatsProvider } from '@/core/context/GlobalStatsContext'
import Navbar from '@/shared/components/Navbar/Navbar'
import ChatWidget from '@/features/chat/components/ChatWidget'

import Auth from '@/features/auth/pages/Auth'
import Feed from '@/features/projects/pages/Feed'
import ProjectDetail from '@/features/projects/pages/Project'
import Profile from '@/features/users/pages/Profile'
import AdminDashboard from '@/features/admin/pages/Admin'
import OnboardingWizard from '@/features/auth/pages/OnboardingWizard'
import Notifications from '@/features/users/pages/Notifications'
import Messages from '@/features/chat/pages/Messages'

// ---- Protected Route ----
function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div style={{ display: 'flex', height: '100svh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Cargando perfil...</div>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/" replace />
  if (requireAdmin && !isAdmin) return <Navigate to="/explorar" replace />

  return children
}

// ---- App Shell ----
function AppShell() {
  const location = useLocation()
  const noNavbar = ['/', '/onboarding']
  const hideNav = noNavbar.includes(location.pathname)

  return (
    <>
      {!hideNav && <Navbar />}
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/explorar" element={<Feed />} />
        <Route path="/proyecto/:id" element={<ProjectDetail />} />
        <Route path="/perfil" element={
          <ProtectedRoute><Profile /></ProtectedRoute>
        } />
        <Route path="/usuario/:id" element={
          <ProtectedRoute><Profile /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="/onboarding" element={
          <ProtectedRoute><OnboardingWizard /></ProtectedRoute>
        } />
        <Route path="/notifications" element={
          <ProtectedRoute><Notifications /></ProtectedRoute>
        } />
        <Route path="/mensajes" element={
          <ProtectedRoute><Messages /></ProtectedRoute>
        } />
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/explorar" replace />} />
      </Routes>
      <ChatWidget />
    </>
  )
}

// ---- Root ----
export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <ProjectProvider>
            <ChatProvider>
              <GlobalStatsProvider>
                <AppShell />
              </GlobalStatsProvider>
            </ChatProvider>
          </ProjectProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
