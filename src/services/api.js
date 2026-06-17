import axios from 'axios'

// Module-level bridge to React context — populated by LoadingProvider on mount.
// Using a plain object ref avoids any circular dependency with React.
const _loader = { show: null, hide: null }
let _count = 0  // in-flight requests that are NOT skipGlobalLoader

export function registerLoader(show, hide) {
  _loader.show = show
  _loader.hide = hide
}

// Centralized axios instance for all global ERP operations.
// Pages that use the local fetch-based `api` helper remain untouched.
const api = axios.create({
  baseURL: '/',
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    // Inject Authorization header if a token exists in localStorage
    try {
      const raw = localStorage.getItem('velson_auth')
      if (raw) {
        const { token } = JSON.parse(raw)
        if (token && token !== 'bypass') {
          config.headers.Authorization = `Bearer ${token}`
        }
      }
    } catch (err) {
      // Ignore parse/read errors
    }

    // Pass `skipGlobalLoader: true` in config to bypass the overlay entirely.
    // Useful for autocomplete, polling, or silent background refreshes.
    // Pass `loadingMessage: 'Saving...'` to display a custom message in the overlay.
    if (!config.skipGlobalLoader) {
      _count++
      // console.log('api request interceptor:', {
      //   url: config.url,
      //   count: _count,
      //   loadingMessage: config.loadingMessage
      // })
      if (_count === 1 && _loader.show) {
        _loader.show(config.loadingMessage || '')
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor (success) ──────────────────────────────────────────
api.interceptors.response.use(
  (response) => {
    if (!response.config.skipGlobalLoader) {
      _count = Math.max(0, _count - 1)
      if (_count === 0 && _loader.hide) _loader.hide()
    }
    return response
  },
  (error) => {
    if (!error.config?.skipGlobalLoader) {
      _count = Math.max(0, _count - 1)
      if (_count === 0 && _loader.hide) _loader.hide()
    }
    const msg = error.response?.data?.message || error.message
    window.dispatchEvent(new CustomEvent('app-toast', {
      detail: { message: msg, type: 'error', title: 'System Error' }
    }))
    return Promise.reject(error)
  }
)

export default api
