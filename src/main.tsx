import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { LangProvider } from './lib/LangContext'
import { AuthProvider } from './lib/AuthContext'
import { usePath } from './lib/router'
import { findLegalPage } from './legal/pages'
import LegalPageView from './legal/LegalPageView'
import ErrorBoundary from './components/ErrorBoundary'
import NotFound from './components/NotFound'
import AuthPage, { type AuthMode } from './auth/AuthPage'
import './styles/global.css'

/* The admin panel and the dashboard are separate chunks — neither is part of
   the public bundle, and the admin one is only fetched when /admin is opened. */
const AdminApp  = React.lazy(() => import('./admin/AdminApp'))
const Dashboard = React.lazy(() => import('./account/Dashboard'))

const AUTH_ROUTES: Record<string, AuthMode> = {
  '/signin': 'signin',
  '/signup': 'signup',
  '/forgot': 'forgot',
  '/reset':  'reset',
  '/verify': 'verify',
}

function Root() {
  const path = usePath()

  if (path === '/admin') {
    return <Suspense fallback={null}><AdminApp /></Suspense>
  }

  if (path === '/account') {
    return <Suspense fallback={null}><Dashboard /></Suspense>
  }

  const authMode = AUTH_ROUTES[path]
  // Keyed by mode so moving between the auth screens remounts the component.
  // Without it React reuses the instance and every piece of state survives the
  // navigation — a finished panel keeps rendering over the next screen, and the
  // button keeps the sphere styling from the animation that just ran.
  if (authMode) return <AuthPage key={authMode} mode={authMode} />

  const legal = findLegalPage(path)
  if (legal) return <LegalPageView page={legal} />

  if (path !== '/') return <NotFound />

  return <App />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <LangProvider>
        <AuthProvider>
          <Root />
        </AuthProvider>
      </LangProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
