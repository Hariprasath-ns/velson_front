import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import api from '../services/api'

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

  useEffect(() => {
    const handleRefreshed = (e) => {
      setAuth(e.detail)
    }
    const handleLogoutEvent = () => {
      setAuth(null)
    }
    window.addEventListener('velson:auth_refreshed', handleRefreshed)
    window.addEventListener('velson:logout', handleLogoutEvent)
    return () => {
      window.removeEventListener('velson:auth_refreshed', handleRefreshed)
      window.removeEventListener('velson:logout', handleLogoutEvent)
    }
  }, [])

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
