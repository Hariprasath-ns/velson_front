import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import api from '../services/api'
import { initSocket, disconnectSocket } from '../services/socket'

const AuthContext = createContext(null)

const STORAGE_KEY = 'velson_auth'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => loadFromStorage())

  const syncPermissions = useCallback(async () => {
    try {
      const res = await api.get('/api/auth/permissions', { skipGlobalLoader: true })
      if (res.data && res.data.permissions) {
        setAuth(prev => {
          if (!prev) return prev;
          const updated = {
            ...prev,
            user: {
              ...prev.user,
              permissions: res.data.permissions
            }
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
          return updated
        })
      }
    } catch (err) {
      console.warn('Failed to sync permissions:', err)
    }
  }, [])

  useEffect(() => {
    const handleRefreshed = (e) => {
      setAuth(e.detail)
    }
    const handleLogoutEvent = () => {
      setAuth(null)
      disconnectSocket()
    }
    window.addEventListener('velson:auth_refreshed', handleRefreshed)
    window.addEventListener('velson:logout', handleLogoutEvent)
    return () => {
      window.removeEventListener('velson:auth_refreshed', handleRefreshed)
      window.removeEventListener('velson:logout', handleLogoutEvent)
    }
  }, [])

  // Setup WebSocket sync
  useEffect(() => {
    if (auth && auth.token && auth.token !== 'bypass') {
      // Sync on initial mount/token load
      syncPermissions()

      // Setup Socket.IO listener
      const socket = initSocket()

      // Ensure socket token is up-to-date and socket is connected
      if (socket.auth?.token !== auth.token) {
        socket.auth = { token: auth.token }
        if (socket.connected) {
          socket.disconnect().connect()
        } else {
          socket.connect()
        }
      } else if (!socket.connected) {
        socket.connect()
      }

      const handlePermissionUpdate = (data) => {
        if (!data) return;
        const matchesRole = data.role && auth.user?.role?.toUpperCase() === data.role.toUpperCase()
        const matchesUser = data.userId && auth.user?.id === data.userId

        if (matchesRole || matchesUser) {
          console.log('[Socket] Detected permission update. Syncing with database...')
          syncPermissions()
        }
      }

      socket.on('permission.updated', handlePermissionUpdate)

      return () => {
        socket.off('permission.updated', handlePermissionUpdate)
      }
    }
  }, [auth?.token, auth?.user?.id, auth?.user?.role, syncPermissions])

  const login = useCallback((data) => {
    // data: { token, refreshToken, user }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    setAuth(data)
  }, [])

  const logout = useCallback(async () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed.refreshToken) {
          // Fire-and-forget or await logout api call
          await api.post('/api/auth/logout', { refreshToken: parsed.refreshToken }, { skipGlobalLoader: true })
        }
      }
    } catch (err) {
      console.warn('Logout API request failed:', err)
    }
    localStorage.removeItem(STORAGE_KEY)
    setAuth(null)
    disconnectSocket()
  }, [])

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

// Returns the Authorization header value for fetch/axios calls
export function authHeader() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const { token } = JSON.parse(raw)
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}
