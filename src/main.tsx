import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { LangProvider } from './lib/LangContext'
import { usePath } from './lib/router'
import { findLegalPage } from './legal/pages'
import LegalPageView from './legal/LegalPageView'
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

  return <App />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LangProvider>
      <Root />
    </LangProvider>
  </React.StrictMode>,
)
