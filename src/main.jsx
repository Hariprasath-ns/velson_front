import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import './utils/fetchInterceptor.js'
import App from './App.jsx'
import { ToastProvider } from './components/Toast.jsx'
import { LoadingProvider } from './context/LoadingContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { viewFileBeforeDownload, initializeDownloadInterceptor } from './utils/fileViewer.js'
import { initializeKeyboardShortcuts } from './utils/keyboardShortcuts.js'

window.viewFileBeforeDownload = viewFileBeforeDownload
initializeDownloadInterceptor()
initializeKeyboardShortcuts()


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes default staleTime
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <LoadingProvider>
              <App />
            </LoadingProvider>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)

