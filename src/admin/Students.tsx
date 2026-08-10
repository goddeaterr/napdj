import { useCallback, useEffect, useMemo, useState } from 'react'
import styles from './Admin.module.css'

interface LessonEntry {
  id: string; delta: number; kind: string; note: string; createdAt: string
}
interface StudentBooking {
  id: string; status: string; plan: string
  date: string | null; time: string; dateLabel: string; createdAt: string
}
export interface Student {
  id: string; name: string; email: string; phone: string; lang: string
  emailVerified: boolean; createdAt: string; lastLoginAt: string | null
  balance: number; lessons: LessonEntry[]; bookings: StudentBooking[]
}

/** Quick-grant buttons — the amounts actually sold, plus a free lesson. */
const PRESETS: { label: string; delta: number; kind: string; note: string }[] = [
  { label: '+1 lesson',   delta: 1,  kind: 'purchase', note: 'Single lesson'   },
  { label: '+4 Starter',  delta: 4,  kind: 'purchase', note: 'Starter course'  },
  { label: '+8 Pro',      delta: 8,  kind: 'purchase', note: 'Pro course'      },
  { label: '+1 free',     delta: 1,  kind: 'free',     note: 'Free lesson'     },
  { label: '−1 used',     delta: -1, kind: 'used',     note: 'Lesson taken'    },
]

export default function Students({ token }: { token: string }) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [query, setQuery]       = useState('')
  const [openId, setOpenId]     = useState<string | null>(null)
  const [busyId, setBusyId]     = useState<string | null>(null)

  const authed = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/students', { headers: authed })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || 'Could not load students')
      setStudents(data.students)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load students')
    } finally {
      setLoading(false)
    }
  }, [authed])

  useEffect(() => { load() }, [load])

  const adjust = async (userId: string, delta: number, kind: string, note: string) => {
    setBusyId(userId)
    try {
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { ...authed, 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, delta, kind, note }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || 'Could not update lessons')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update lessons')
    } finally {
      setBusyId(null)
    }
  }

  const removeStudent = async (s: Student) => {
    if (!confirm(`Delete the account for ${s.name} (${s.email})?\n\nTheir lesson history goes with it. Bookings are kept but no longer linked to an account.`)) return
    setBusyId(s.id)
    try {
      const res = await fetch(`/api/admin/students?id=${encodeURIComponent(s.id)}`, {
        method: 'DELETE', headers: authed,
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || 'Could not delete')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete')
    } finally {
      setBusyId(null)
    }
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return students
    return students.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.phone.toLowerCase().includes(q))
  }, [students, query])

  const fmt = (iso: string | null) =>
    iso ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso)) : '—'

  const withLessons = students.filter(s => s.balance > 0).length

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <span className={styles.filterBtn}>{students.length} accounts</span>
          <span className={styles.filterBtn}>{withLessons} with lessons left</span>
          <button className={styles.ghostBtn} onClick={load}>Refresh</button>
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
      {!loading && !visible.length && <p className={styles.muted}>No accounts yet.</p>}

      <div className={styles.list}>
        {visible.map(s => {
          const open = openId === s.id
          return (
            <article key={s.id} className={styles.card}>
              <div className={styles.cardMain} onClick={() => setOpenId(open ? null : s.id)}>
                <div className={styles.cardWho}>
                  <span className={styles.name}>
                    {s.name}
                    {!s.emailVerified && <span className={styles.unverified} title="E-mail not confirmed">unconfirmed</span>}
                  </span>
                  <span className={styles.meta}>{s.email}{s.phone ? ` · ${s.phone}` : ''}</span>
                </div>
                <div className={styles.cardRight}>
                  <span className={styles.balancePill} title="Lessons remaining">{s.balance}</span>
                  <span className={styles.meta}>{s.bookings.length} bookings</span>
                </div>
              </div>

              {open && (
                <div className={styles.cardBody}>
                  <div className={styles.grantRow}>
                    {PRESETS.map(p => (
                      <button
                        key={p.label}
                        className={styles.grantBtn}
                        disabled={busyId === s.id}
                        onClick={() => adjust(s.id, p.delta, p.kind, p.note)}
                      >{p.label}</button>
                    ))}
                    <CustomGrant disabled={busyId === s.id} onGrant={(d, note) => adjust(s.id, d, 'adjustment', note)} />
                  </div>

                  <div className={styles.twoCol}>
                    <div>
                      <h4 className={styles.sectionTitle}>Lesson history</h4>
                      {s.lessons.length === 0
                        ? <p className={styles.muted}>No entries.</p>
                        : (
                          <ul className={styles.ledger}>
                            {s.lessons.map(e => (
                              <li key={e.id}>
                                <span className={e.delta > 0 ? styles.up : styles.down}>
                                  {e.delta > 0 ? `+${e.delta}` : e.delta}
                                </span>
                                <span className={styles.ledgerNote}>{e.note || e.kind}</span>
                                <span className={styles.ledgerDate}>{fmt(e.createdAt)}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                    </div>

                    <div>
                      <h4 className={styles.sectionTitle}>Bookings</h4>
                      {s.bookings.length === 0
                        ? <p className={styles.muted}>None.</p>
                        : (
                          <ul className={styles.ledger}>
                            {s.bookings.map(b => (
                              <li key={b.id}>
                                <span className={styles.ledgerNote}>{b.plan}</span>
                                <span className={styles.ledgerDate}>
                                  {b.dateLabel || (b.date ? `${b.date} ${b.time}` : '—')} · {b.status}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                    </div>
                  </div>

                  <div className={styles.cardFooter}>
                    <span className={styles.muted}>
                      Joined {fmt(s.createdAt)} · Last sign-in {fmt(s.lastLoginAt)} · {s.lang.toUpperCase()}
                    </span>
                    <button className={styles.deleteBtn} disabled={busyId === s.id} onClick={() => removeStudent(s)}>
                      Delete account
                    </button>
                  </div>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </>
  )
}

/** Free-form adjustment for anything the presets do not cover. */
function CustomGrant({ onGrant, disabled }: { onGrant: (delta: number, note: string) => void; disabled: boolean }) {
  const [value, setValue] = useState('')
  const [note, setNote]   = useState('')

  const apply = () => {
    const n = parseInt(value, 10)
    if (!Number.isFinite(n) || n === 0) return
    onGrant(n, note.trim() || 'Manual adjustment')
    setValue(''); setNote('')
  }

  return (
    <span className={styles.customGrant}>
      <input
        className={styles.grantInput}
        type="number"
        placeholder="±"
        value={value}
        onChange={e => setValue(e.target.value)}
      />
      <input
        className={styles.grantNote}
        placeholder="Reason (optional)"
        value={note}
        onChange={e => setNote(e.target.value)}
      />
      <button className={styles.grantBtn} disabled={disabled || !value} onClick={apply}>Apply</button>
    </span>
  )
}
