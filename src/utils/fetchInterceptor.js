// Patches global fetch to inject Authorization header for all /api calls.
// Called once at app startup — no individual page changes needed.
const STORAGE_KEY = 'velson_auth'

const originalFetch = window.fetch.bind(window)

window.fetch = function (input, init = {}) {
  const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input)

  if (url.startsWith('/api/') && !url.startsWith('/api/auth/')) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const { token } = JSON.parse(raw)
        // 'bypass' is the dev/demo bypass token — don't send it to the backend
        if (token && token !== 'bypass') {
          init = {
            ...init,
            headers: {
              ...(init.headers || {}),
              Authorization: `Bearer ${token}`,
            },
          }
        }
      }
    } catch {
      // ignore parse errors
    }
  }

  return originalFetch(input, init)
}
