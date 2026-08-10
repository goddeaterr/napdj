import { useState, useRef, useCallback, useEffect } from 'react'
import { useLang } from '../lib/LangContext'
import { useAuth } from '../lib/AuthContext'
import { navigate } from '../lib/router'
import { authCopy, authError } from './copy'
import BlackHole, { type HolePhase } from './BlackHole'
import styles from './Auth.module.css'

export type AuthMode = 'signin' | 'signup' | 'forgot' | 'reset' | 'verify'

/** How long the collapse/hold animation is allowed to play before we move on. */
const PULL_MIN_MS = 950
const HOLD_MS     = 900
const COLLAPSE_MS = 1000

const wait = (ms: number) => new Promise(r => setTimeout(r, ms))

export default function AuthPage({ mode }: { mode: AuthMode }) {
  const { lang, setLang } = useLang()
  const auth = useAuth()
  const c = authCopy(lang)

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')
  const [phone, setPhone]       = useState('')
  const [consent, setConsent]   = useState(false)

  const [phase, setPhase]   = useState<HolePhase>('drift')
  const [busy, setBusy]     = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [done, setDone]     = useState<null | 'registered' | 'reset-sent' | 'verified'>(null)
  const [resent, setResent] = useState(false)
  const [resendable, setResendable] = useState(false)

  const buttonRef = useRef<HTMLButtonElement>(null)

  /** Where the particles are dragged to — the centre of the submit button. */
  const target = useCallback(() => {
    const el = buttonRef.current
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  }, [])

  const token = new URLSearchParams(window.location.search).get('token') || ''

  /* The verify link lands here with a token and nothing to fill in. */
  useEffect(() => {
    if (mode !== 'verify') return
    let cancelled = false
    setPhase('pull')
    setBusy(true)
    ;(async () => {
      const [err] = await Promise.all([auth.verifyEmail(token), wait(PULL_MIN_MS)])
      if (cancelled) return
      if (err) {
        setError(authError(lang, err))
        setPhase('collapse')
        await wait(COLLAPSE_MS)
        if (!cancelled) setPhase('drift')
      } else {
        setPhase('hold')
        setDone('verified')
      }
      if (!cancelled) setBusy(false)
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  /** Runs the whole animation around whatever the server says. */
  const runWithAnimation = async (action: () => Promise<string | null>, onSuccess: () => void) => {
    setError(null)
    setBusy(true)
    setPhase('pull')

    // Never finish before the pull has had time to read as an animation.
    const [err] = await Promise.all([action(), wait(PULL_MIN_MS)])

    if (err) {
      setPhase('collapse')
      setError(authError(lang, err))
      await wait(COLLAPSE_MS)
      setPhase('drift')
      setBusy(false)
      return
    }

    setPhase('hold')
    await wait(HOLD_MS)
    setBusy(false)
    onSuccess()
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return

    if (mode === 'signin') {
      runWithAnimation(
        async () => {
          const err = await auth.signIn(email, password)
          // A locked account is usually someone who forgot their password —
          // offer the confirmation link too, in case that is the real problem.
          setResendable(err === 'account_locked')
          return err
        },
        () => navigate('/account'),
      )
    }

    if (mode === 'signup') {
      runWithAnimation(
        () => auth.signUp({ name, email, password, phone, lang, consent }),
        () => setDone('registered'),
      )
    }

    if (mode === 'forgot') {
      runWithAnimation(
        () => auth.forgotPassword(email),
        () => setDone('reset-sent'),
      )
    }

    if (mode === 'reset') {
      runWithAnimation(
        () => auth.resetPassword(token, password),
        () => navigate('/account'),
      )
    }
  }

  /** Blows the particles apart, then navigates. */
  const leaveWithBurst = async (to: string) => {
    if (busy) return
    setBusy(true)
    setPhase('collapse')
    await wait(620)
    navigate(to)
  }

  /* ── Finished states ─────────────────────────────────────────────────── */

  if (done) {
    const panels = {
      registered: { title: c.checkInbox,      body: c.checkInboxBody,  cta: c.backToSignIn, go: '/signin' },
      'reset-sent': { title: c.resetSentTitle, body: c.resetSentBody,  cta: c.backToSignIn, go: '/signin' },
      verified:   { title: c.verifiedTitle,   body: c.verifiedBody,    cta: c.goToAccount,  go: '/account' },
    }[done]

    return (
      <Shell phase={phase} target={target} lang={lang} setLang={setLang}>
        <div className={styles.doneMark} aria-hidden="true">✓</div>
        <h1 className={styles.title}>{panels.title}</h1>
        <p className={styles.sub}>{panels.body}</p>
        <button
          ref={buttonRef}
          className={`${styles.submit} ${phaseClass(phase, styles)}`}
          onClick={() => leaveWithBurst(panels.go)}
        >
          <span className={styles.submitLabel}>{panels.cta}</span>
          <span className={styles.core} aria-hidden="true" />
        </button>
      </Shell>
    )
  }

  /* ── Verify screen has no form ───────────────────────────────────────── */

  if (mode === 'verify') {
    return (
      <Shell phase={phase} target={target} lang={lang} setLang={setLang}>
        <h1 className={styles.title}>{c.verifyTitle}</h1>
        {error && <p className={styles.error} role="alert">{error}</p>}
        {/* Anchors the collapse animation even though there is no real button */}
        <button ref={buttonRef} className={`${styles.submit} ${styles.ghostAnchor} ${phaseClass(phase, styles)}`} disabled>
          <span className={styles.submitLabel}>{c.verifyTitle}</span>
        </button>
        {error && (
          <button className={styles.textLink} onClick={() => navigate('/signin')}>{c.backToSignIn}</button>
        )}
      </Shell>
    )
  }

  const titles = {
    signin: [c.signInTitle, c.signInSub],
    signup: [c.signUpTitle, c.signUpSub],
    forgot: [c.forgotTitle, c.forgotSub],
    reset:  [c.resetTitle,  c.resetSub],
  }[mode]

  const cta = {
    signin: c.signIn, signup: c.signUp, forgot: c.sendLink, reset: c.savePassword,
  }[mode]

  return (
    <Shell phase={phase} target={target} lang={lang} setLang={setLang}>
      <h1 className={styles.title}>{titles[0]}</h1>
      <p className={styles.sub}>{titles[1]}</p>

      <form className={styles.form} onSubmit={submit} noValidate>
        {mode === 'signup' && (
          <Field label={c.name} value={name} onChange={setName} autoComplete="name" required />
        )}

        {mode !== 'reset' && (
          <Field
            label={c.email} value={email} onChange={setEmail}
            type="email" autoComplete="email" required
          />
        )}

        {mode === 'signup' && (
          <Field label={c.phone} value={phone} onChange={setPhone} type="tel" autoComplete="tel" placeholder="+370…" />
        )}

        {(mode === 'signin' || mode === 'signup' || mode === 'reset') && (
          <Field
            label={mode === 'reset' ? c.newPassword : c.password}
            value={password} onChange={setPassword}
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            hint={mode === 'signin' ? undefined : c.passwordHint}
            required
          />
        )}

        {mode === 'signup' && (
          <Consent checked={consent} onToggle={() => setConsent(v => !v)} copy={c} />
        )}

        {error && <p className={styles.error} role="alert">{error}</p>}

        <button
          ref={buttonRef}
          type="submit"
          disabled={busy}
          className={`${styles.submit} ${phaseClass(phase, styles)}`}
        >
          <span className={styles.submitLabel}>{cta}</span>
          <span className={styles.core} aria-hidden="true" />
        </button>
      </form>

      <div className={styles.links}>
        {mode === 'signin' && (
          <>
            <button className={styles.textLink} onClick={() => navigate('/forgot')}>{c.forgotLink}</button>
            <span className={styles.linkRow}>
              {c.noAccount}{' '}
              <button className={styles.textLinkStrong} onClick={() => navigate('/signup')}>{c.signUp}</button>
            </span>
          </>
        )}
        {mode === 'signup' && (
          <span className={styles.linkRow}>
            {c.haveAccount}{' '}
            <button className={styles.textLinkStrong} onClick={() => navigate('/signin')}>{c.signIn}</button>
          </span>
        )}
        {(mode === 'forgot' || mode === 'reset') && (
          <button className={styles.textLink} onClick={() => navigate('/signin')}>{c.backToSignIn}</button>
        )}
        {resendable && !resent && (
          <button
            className={styles.textLink}
            onClick={async () => { await auth.resendVerification(email); setResent(true) }}
          >{c.resendLink}</button>
        )}
        {resent && <span className={styles.notice}>{c.resendDone}</span>}
      </div>
    </Shell>
  )
}

/* ── Layout shell shared by every auth screen ───────────────────────────── */

function Shell({
  children, phase, target, lang, setLang,
}: {
  children: React.ReactNode
  phase: HolePhase
  target: () => { x: number; y: number } | null
  lang: string
  setLang: (l: never) => void
}) {
  return (
    <main className={styles.page}>
      <BlackHole phase={phase} target={target} />

      <div className={styles.langRow}>
        {(['en', 'ru', 'lt'] as const).map(l => (
          <button
            key={l}
            className={`${styles.langBtn} ${lang === l ? styles.langActive : ''}`}
            onClick={() => setLang(l as never)}
          >{l.toUpperCase()}</button>
        ))}
      </div>

      <div className={`${styles.card} ${phase !== 'drift' ? styles.cardBusy : ''}`}>
        <button className={styles.brand} onClick={() => navigate('/')}>
          <span className={styles.brandNeko}>neko</span>
          <span className={styles.brandArt}>art</span>
        </button>
        {children}
      </div>
    </main>
  )
}

const phaseClass = (phase: HolePhase, s: Record<string, string>) => ({
  drift: '',
  pull: s.submitPulling,
  hold: s.submitHold,
  collapse: s.submitCollapse,
}[phase] || '')

/* ── Small pieces ───────────────────────────────────────────────────────── */

function Field({
  label, value, onChange, type = 'text', autoComplete, placeholder, hint, required,
}: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; autoComplete?: string; placeholder?: string; hint?: string; required?: boolean
}) {
  const [focused, setFocused] = useState(false)
  return (
    <label className={`${styles.field} ${focused ? styles.fieldFocused : ''}`}>
      <span className={styles.fieldLabel}>{label}</span>
      <input
        className={styles.input}
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={e => onChange(e.target.value)}
      />
      {hint && <span className={styles.hint}>{hint}</span>}
    </label>
  )
}

function Consent({
  checked, onToggle, copy,
}: {
  checked: boolean; onToggle: () => void; copy: ReturnType<typeof authCopy>
}) {
  const parts = copy.consent.split(/(\{privacy\}|\{terms\})/)
  return (
    <button type="button" className={styles.consent} onClick={onToggle} role="checkbox" aria-checked={checked}>
      <span className={`${styles.check} ${checked ? styles.checkOn : ''}`} aria-hidden="true">
        {checked && '✓'}
      </span>
      <span className={styles.consentText}>
        {parts.map((p, i) => {
          if (p === '{privacy}') {
            return <a key={i} href="/privacy" target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>{copy.consentPrivacy}</a>
          }
          if (p === '{terms}') {
            return <a key={i} href="/terms" target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>{copy.consentTerms}</a>
          }
          return <span key={i}>{p}</span>
        })}
      </span>
    </button>
  )
}
