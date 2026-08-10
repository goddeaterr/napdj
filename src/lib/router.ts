import { useEffect, useState } from 'react'

/** Current pathname without trailing slashes ('/' for the home page). */
export function currentPath(): string {
  const p = window.location.pathname.replace(/\/+$/, '')
  return p === '' ? '/' : p
}

/** Client-side navigation without a router dependency. */
export function navigate(path: string) {
  if (currentPath() === path) return
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo(0, 0)
}

/** Re-renders the component whenever the path changes. */
export function usePath(): string {
  const [path, setPath] = useState(currentPath)
  useEffect(() => {
    const onPop = () => setPath(currentPath())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  return path
}
