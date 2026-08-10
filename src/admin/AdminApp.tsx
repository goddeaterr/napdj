/* ============================================================================
   Hidden admin panel — /admin
   ----------------------------------------------------------------------------
   Not linked from anywhere on the site and excluded from search engines.
   Access requires the password set in .env (ADMIN_PASSWORD_HASH).
============================================================================ */
import { useCallback, useEffect, useMemo, useState } from 'react'
import Students from './Students'
import styles from './Admin.module.css'

const TOKEN_KEY = 'nap.admin.token'

const STATUSES = ['new', 'contacted', 'confirmed', 'done', 'cancelled'] as const
type Status = typeof STATUSES[number]

interface Booking {
  id: string
  createdAt: string
  status: Status
  name: string
  email: string
  phone?: string
  plan: string
  genre?: string
  date?: string | null
  time?: string
  noPreference?: boolean
  dateLabel?: string
  message?: string
  lang?: string
  consent?: boolean
  note?: string
  delivery?: { owner?: { via?: string; failed?: string }; client?: { via?: string; failed?: string } }
}

function readToken() {
  try { return sessionStorage.getItem(TOKEN_KEY) || '' } catch { return '' }
}

export default function AdminApp() {
  const [token, setToken]   = useState(readToken)
  const [ready, setReady]   = useState(false)

  /* Keep the panel out of search results even if the URL leaks. */
  useEffect(() => {
    document.title = 'Reservations'
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    setReady(true)
    return () => { document.head.removeChild(meta) }
  }, [])

  const signOut = useCallback(() => {
    try { sessionStorage.removeItem(TOKEN_KEY) } catch { /* ignore */ }
    setToken('')
  }, [])

  if (!ready) return null

  return token
    ? <Dashboard token={token} onSignOut={signOut} />
    : <Login onSuccess={t => {
        try { sessionStorage.setItem(TOKEN_KEY, t) } catch { /* ignore */ }
        setToken(t)
      }} />
}

/* ── Login ────────────────────────────────────────────────────────────── */

function Login({ onSuccess }: { onSuccess: (token: string) => void }) {
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [busy, setBusy]         = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (data.ok && data.token) onSuccess(data.token)
      else setError(data.error || 'Login failed')
    } catch {
      setError('Server unavailable')
    } finally {
      setBusy(false)
      setPassword('')
    }
  }

  return (
    <div className={styles.loginWrap}>
      <form className={styles.loginCard} onSubmit={submit}>
        <div className={styles.loginMark}>◼</div>
        <h1 className={styles.loginTitle}>Reservations</h1>
        <p className={styles.loginHint}>Restricted area</p>
        <input
          type="password"
          className={styles.input}
          value={password}
          autoFocus
          autoComplete="current-password"
          placeholder="Password"
          onChange={e => setPassword(e.target.value)}
        />
        {error && <p className={styles.loginError}>{error}</p>}
        <button type="submit" className={styles.primaryBtn} disabled={busy || !password}>
          {busy ? 'Checking…' : 'Enter'}
        </button>
      </form>
    </div>
  )
}

/* ── Dashboard ────────────────────────────────────────────────────────── */

function Dashboard({ token, onSignOut }: { token: string; onSignOut: () => void }) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [filter, setFilter]     = useState<'all' | Status>('all')
  const [query, setQuery]       = useState('')
  const [openId, setOpenId]     = useState<string | null>(null)
  const [tab, setTab]           = useState<'bookings' | 'students'>('bookings')

  const authed = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token])

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/admin/bookings', { headers: authed })
      if (res.status === 401) { onSignOut(); return }
      const data = await res.json()
      if (data.ok) setBookings(data.bookings)
      else setError(data.error || 'Could not load reservations')
    } catch {
      setError('Server unavailable')
    } finally {
      setLoading(false)
    }
  }, [authed, onSignOut])

  useEffect(() => { load() }, [load])

  const setStatus = async (id: string, status: Status) => {
    setBookings(rows => rows.map(r => (r.id === id ? { ...r, status } : r)))
    const res = await fetch(`/api/admin/bookings?id=${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { ...authed, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) load()
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this reservation permanently?')) return
    const res = await fetch(`/api/admin/bookings?id=${encodeURIComponent(id)}`, {
      method: 'DELETE', headers: authed,
    })
    if (res.ok) setBookings(rows => rows.filter(r => r.id !== id))
    else load()
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return bookings.filter(b => {
      if (filter !== 'all' && b.status !== filter) return false
      if (!q) return true
      return [b.name, b.email, b.phone, b.plan, b.genre, b.message]
        .some(v => (v || '').toLowerCase().includes(q))
    })
  }, [bookings, filter, query])

  const counts = useMemo(() => {
    const base: Record<string, number> = { all: bookings.length }
    STATUSES.forEach(s => { base[s] = bookings.filter(b => b.status === s).length })
    return base
  }, [bookings])

  const exportCsv = () => {
    const head = ['Created', 'Status', 'Name', 'Email', 'Phone', 'Plan', 'Genre', 'Requested', 'Message']
    const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const rows = visible.map(b => [
      b.createdAt, b.status, b.name, b.email, b.phone, b.plan, b.genre,
      b.dateLabel || b.date || '', b.message,
    ].map(cell).join(','))
    const blob = new Blob([[head.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reservations-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{tab === 'bookings' ? 'Reservations' : 'Students'}</h1>
          <p className={styles.subtitle}>
            {tab === 'bookings' ? `${counts.all} total · ${counts.new} new` : 'Accounts and lesson credits'}
          </p>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${tab === 'bookings' ? styles.tabOn : ''}`}
              onClick={() => setTab('bookings')}
            >Reservations</button>
            <button
              className={`${styles.tab} ${tab === 'students' ? styles.tabOn : ''}`}
              onClick={() => setTab('students')}
            >Students</button>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.ghostBtn} onClick={load}>Refresh</button>
          <button className={styles.ghostBtn} onClick={exportCsv}>Export CSV</button>
          <button className={styles.ghostBtn} onClick={onSignOut}>Sign out</button>
        </div>
      </header>

      {tab === 'students' ? <Students token={token} /> : <>
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          {(['all', ...STATUSES] as const).map(s => (
            <button
              key={s}
              className={`${styles.filterBtn} ${filter === s ? styles.filterOn : ''}`}
              onClick={() => setFilter(s)}
            >
              {s} <span className={styles.filterCount}>{counts[s] ?? 0}</span>
            </button>
          ))}
        </div>
        <input
          className={styles.search}
          placeholder="Search name, e-mail, phone…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {loading && <p className={styles.muted}>Loading…</p>}
      {!loading && !visible.length && <p className={styles.muted}>Nothing here yet.</p>}

      <div className={styles.list}>
        {visible.map(b => {
          const open = openId === b.id
          return (
            <article key={b.id} className={`${styles.card} ${styles['status_' + b.status] || ''}`}>
              <div className={styles.cardMain} onClick={() => setOpenId(open ? null : b.id)}>
                <div className={styles.cardWho}>
                  <span className={styles.name}>{b.name}</span>
                  <span className={styles.plan}>{b.plan}{b.genre ? ` · ${b.genre}` : ''}</span>
                </div>
                <div className={styles.cardContact}>
                  <a href={`mailto:${b.email}`} onClick={e => e.stopPropagation()}>{b.email}</a>
                  {b.phone && <a href={`tel:${b.phone}`} onClick={e => e.stopPropagation()}>{b.phone}</a>}
                </div>
                <div className={styles.cardWhen}>
                  <span className={styles.requested}>{b.dateLabel || '—'}</span>
                  <span className={styles.created}>{new Date(b.createdAt).toLocaleString()}</span>
                </div>
                <span className={styles.statusTag}>{b.status}</span>
              </div>

              {open && (
                <div className={styles.cardDetail}>
                  {b.message && (
                    <div className={styles.detailBlock}>
                      <span className={styles.detailLabel}>Message</span>
                      <p className={styles.messageText}>{b.message}</p>
                    </div>
                  )}
                  <div className={styles.detailBlock}>
                    <span className={styles.detailLabel}>Details</span>
                    <p className={styles.meta}>
                      Language: {(b.lang || 'en').toUpperCase()} · Consent: {b.consent ? 'yes' : 'no'} · ID: {b.id}
                      {b.delivery?.owner?.failed && <> · <span className={styles.warn}>owner e-mail failed: {b.delivery.owner.failed}</span></>}
                    </p>
                  </div>
                  <div className={styles.actions}>
                    <select
                      className={styles.select}
                      value={b.status}
                      onChange={e => setStatus(b.id, e.target.value as Status)}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button className={styles.dangerBtn} onClick={() => remove(b.id)}>Delete</button>
                  </div>
                </div>
              )}
            </article>
          )
        })}
      </div>
      </>}
    </div>
  )
}
