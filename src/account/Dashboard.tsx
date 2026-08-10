import { useEffect, useState } from 'react'
import { useLang } from '../lib/LangContext'
import { useAuth, type LessonEntry } from '../lib/AuthContext'
import { navigate } from '../lib/router'
import { CONTACT } from '../config/site'
import { DASH_COPY } from './copy'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const { lang } = useLang()
  const { user, ready, balance, lessons, bookings, signOut, resendVerification } = useAuth()
  const c = DASH_COPY[lang] ?? DASH_COPY.en
  const [resent, setResent] = useState(false)

  /* Not signed in → the sign-in screen, once we actually know. */
  useEffect(() => {
    if (ready && !user) navigate('/signin')
  }, [ready, user])

  useEffect(() => { document.title = `${c.title} — neko art platform` }, [c.title])

  if (!ready) return <div className={styles.loading} />
  if (!user) return null

  const fmtDate = (iso: string | null, time?: string) => {
    if (!iso) return '—'
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
    const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(iso)
    const label = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', year: 'numeric' }).format(d)
    return time ? `${label} · ${time}` : label
  }

  const fmtWhen = (iso: string) =>
    new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))

  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <button className={styles.brand} onClick={() => navigate('/')}>
          <span>neko</span><span className={styles.brandDim}>art</span>
        </button>
        <div className={styles.topRight}>
          <span className={styles.who}>{user.name}</span>
          <button className={styles.signOut} onClick={async () => { await signOut(); navigate('/') }}>
            {c.signOut}
          </button>
        </div>
      </header>

      <div className={styles.container}>
        {!user.emailVerified && (
          <div className={styles.warning}>
            <div>
              <strong className={styles.warningTitle}>{c.verifyTitle}</strong>
              <p className={styles.warningBody}>{c.verifyBody.replace('{email}', user.email)}</p>
            </div>
            <button
              className={styles.warningBtn}
              onClick={async () => { await resendVerification(user.email); setResent(true) }}
            >
              {resent ? c.verifySent : c.verifyResend}
            </button>
          </div>
        )}

        <h1 className={styles.title}>{c.greeting.replace('{name}', user.name.split(' ')[0])}</h1>
        <p className={styles.sub}>{c.subtitle}</p>

        {/* ── Lesson balance ── */}
        <section className={styles.balanceCard}>
          <div className={styles.balanceMain}>
            <span className={styles.balanceNum}>{balance}</span>
            <span className={styles.balanceLabel}>{balance === 1 ? c.lessonLeftOne : c.lessonsLeft}</span>
          </div>
          <p className={styles.balanceNote}>
            {balance > 0 ? c.balanceReady : c.balanceEmpty}
          </p>
          <button className={`btn btn-primary ${styles.bookBtn}`} onClick={() => navigate('/#book')}>
            {c.bookLesson}
          </button>
        </section>

        <div className={styles.grid}>
          {/* ── Bookings ── */}
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>{c.yourBookings}</h2>
            {bookings.length === 0 ? (
              <p className={styles.empty}>{c.noBookings}</p>
            ) : (
              <ul className={styles.list}>
                {bookings.map(b => (
                  <li key={b.id} className={styles.item}>
                    <div className={styles.itemMain}>
                      <span className={styles.itemTitle}>{b.plan}</span>
                      <span className={styles.itemMeta}>
                        {b.noPreference ? c.noPreference : fmtDate(b.date, b.time)}
                      </span>
                    </div>
                    <span className={`${styles.status} ${styles['status_' + b.status] || ''}`}>
                      {c.statuses[b.status] ?? b.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ── Lesson history ── */}
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>{c.lessonHistory}</h2>
            {lessons.length === 0 ? (
              <p className={styles.empty}>{c.noLessons}</p>
            ) : (
              <ul className={styles.list}>
                {lessons.map((e: LessonEntry) => (
                  <li key={e.id} className={styles.item}>
                    <div className={styles.itemMain}>
                      <span className={styles.itemTitle}>
                        {e.note || c.kinds[e.kind] || c.kinds.adjustment}
                      </span>
                      <span className={styles.itemMeta}>
                        {fmtWhen(e.createdAt)} · {c.kinds[e.kind] ?? e.kind}
                      </span>
                    </div>
                    <span className={`${styles.delta} ${e.delta > 0 ? styles.deltaUp : styles.deltaDown}`}>
                      {e.delta > 0 ? `+${e.delta}` : e.delta}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className={styles.details}>
          <h2 className={styles.panelTitle}>{c.yourDetails}</h2>
          <dl className={styles.detailList}>
            <div><dt>{c.name}</dt><dd>{user.name}</dd></div>
            <div><dt>{c.email}</dt><dd>{user.email}</dd></div>
            {user.phone && <div><dt>{c.phone}</dt><dd>{user.phone}</dd></div>}
            <div><dt>{c.memberSince}</dt><dd>{fmtWhen(user.createdAt)}</dd></div>
          </dl>
          <p className={styles.help}>
            {c.needHelp}{' '}
            <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
            {' · '}
            <a href={`tel:${CONTACT.phoneHref}`}>{CONTACT.phone}</a>
          </p>
        </section>
      </div>
    </main>
  )
}
