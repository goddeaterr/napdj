import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { LangProvider } from './lib/LangContext'
import { usePath } from './lib/router'
import { findLegalPage } from './legal/pages'
import LegalPageView from './legal/LegalPageView'
import ErrorBoundary from './components/ErrorBoundary'
import NotFound from './components/NotFound'
import './styles/global.css'

/* The admin panel is loaded as a separate chunk — it is never part of the
   public bundle and is only fetched when /admin is opened directly. */
const AdminApp = React.lazy(() => import('./admin/AdminApp'))

function Root() {
  const path = usePath()

  if (path === '/admin') {
    return (
      <Suspense fallback={null}>
        <AdminApp />
      </Suspense>
    )
  }

  const legal = findLegalPage(path)
  if (legal) return <LegalPageView page={legal} />

  if (path !== '/') return <NotFound />

  return <App />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <LangProvider>
        <Root />
      </LangProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
