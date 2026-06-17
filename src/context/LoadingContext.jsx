import { useState, useCallback, useEffect, createContext, useContext } from 'react'
import { Loader2 } from 'lucide-react'
import { DotmTriangle6 } from '../components/ui/dotm-triangle-6'
import { registerLoader } from '../services/api'

const LoadingContext = createContext(null)

export function LoadingProvider({ children }) {
  const [state, setState] = useState({ visible: false, message: '' })

  const show = useCallback((message = '') => {
    // console.log('LoadingContext: show called with message:', message)
    setState({ visible: true, message })
  }, [])

  const hide = useCallback(() => {
    // console.log('LoadingContext: hide called')
    setState({ visible: false, message: '' })
  }, [])

  // Bridge: wire the axios interceptors in api.js to this React context.
  // show/hide are stable references (useCallback with no deps), so this
  // effect runs once on mount and cleans up on unmount.
  useEffect(() => {
    registerLoader(show, hide)
    return () => registerLoader(null, null)
  }, [show, hide])

  return (
    <LoadingContext.Provider value={{ show, hide }}>
      {children}
      {state.visible && (
        <div
          className="fixed inset-0 flex flex-col items-center justify-center"
          style={{ zIndex: 9998, backgroundColor: 'rgba(0,0,0,0.45)' }}
          aria-live="polite"
          aria-label="Loading"
        >
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl px-10 py-8 flex flex-col items-center gap-4 min-w-[180px]">
            {/* Old spinner loader: */}
            {/* <Loader2
              size={35}
              className="animate-spin"
              style={{ color: '#0097A7' }}
            /> */}
           
            <DotmTriangle6
              size={35}
              dotSize={5}
              color="#0097A7"
              bloom={true}
              halo={0.3}
            />
            <p
              className="text-center leading-snug"
              style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#475569',
                marginTop: '4px',
              }}
            >
              {state.message || 'Loading...'}
            </p>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const ctx = useContext(LoadingContext)
  if (!ctx) throw new Error('useLoading must be used within LoadingProvider')
  return ctx
}
