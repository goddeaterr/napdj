import { useState } from 'react'
import { useLang } from '../lib/LangContext'
import { useScrollAnimation } from '../hooks/useScrollAnimation'
import styles from './BookingForm.module.css'
import CalendarPicker from './CalendarPicker'

type Plan  = 'Basic' | 'Pro Course' | 'Elite'
type Genre = 'Techno' | 'House' | 'Hip-Hop' | 'Drum & Bass' | 'Other'

interface FormState {
  name: string; email: string; phone: string
  plan: Plan | ''; genre: Genre | ''; message: string
  date: Date | null; time: string | null; noPreference: boolean
}

export default function BookingForm() {
  const { t, lang } = useLang()
  const [form,    setForm]    = useState<FormState>({ name:'', email:'', phone:'', plan:'', genre:'', message:'', date: null, time: null, noPreference: false })
  const [errors,  setErrors]  = useState<Partial<Record<keyof FormState, string>>>({})
  const [status,  setStatus]  = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [focused, setFocused] = useState<string | null>(null)
  const { ref: secRef, isVisible } = useScrollAnimation<HTMLDivElement>(0.05)

  const set = (k: keyof FormState, v: string) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: '' }))
  }

  const setCalendar = (date: Date | null, time: string | null, noPreference: boolean) => {
    setForm(f => ({ ...f, date, time, noPreference }))
  }

  const validate = () => {
    const e: typeof errors = {}
    if (!form.name.trim())  e.name  = t('book_name') + ' — ' + t('book_required')
    if (!form.email.trim()) e.email = t('book_email') + ' — ' + t('book_required')
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = t('book_email_invalid')
    if (!form.plan) e.plan = t('book_plan_required')
    return e
  }

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setStatus('submitting')
    try {
      const res = await fetch('/api/send-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:         form.name,
          email:        form.email,
          phone:        form.phone,
          plan:         form.plan,
          genre:        form.genre,
          date:         form.date?.toISOString() ?? null,
          time:         form.time,
          noPreference: form.noPreference,
          message:      form.message,
          lang,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setStatus('success')
      } else {
        console.error('Email error:', data.error)
        setStatus('error')
      }
    } catch (err) {
      console.error('Network error:', err)
      setStatus('error')
    }
  }

  const PLANS: { id: Plan; label: string; badge?: string }[] = [
    { id: 'Basic',      label: t('pricing_basic_name') },
    { id: 'Pro Course', label: t('pricing_pro_name'),   badge: t('pricing_popular') },
    { id: 'Elite',      label: t('pricing_elite_name') },
  ]

  const GENRES: { id: Genre; label: string }[] = [
    { id: 'Techno',      label: 'Techno'      },
    { id: 'House',       label: 'House'       },
    { id: 'Hip-Hop',     label: 'Hip-Hop'     },
    { id: 'Drum & Bass', label: 'Drum & Bass' },
    { id: 'Other',       label: t('book_genre_other') },
  ]

  return (
    <section className={`section ${styles.booking}`} id="book">
      <div className={styles.bgGlow1} />
      <div className={styles.bgGlow2} />
      <div className="container">
        <div className={styles.layout}>

          {/* Left: info panel */}
          <div ref={secRef} className={`${styles.left} ${isVisible ? styles.in : ''}`}>
            <span className="label">{t('book_label')}</span>
            <h2 className={`section-title ${styles.title}`}>
              {t('book_title1')}<br />
              <span className={styles.accent}>{t('book_title2')}</span>
            </h2>
            <p className={styles.sub}>{t('book_sub')}</p>

            <div className={styles.promises}>
              {[t('book_p1'), t('book_p2'), t('book_p3'), t('book_p4')].map((p, i) => (
                <div key={i} className={styles.promise}>
                  <span className={styles.promiseIcon}>✦</span>
                  <span>{p}</span>
                </div>
              ))}
            </div>

            <div className={styles.directContact}>
              <div className={styles.dcLabel}>{t('book_direct')}</div>
              <a href="mailto:napdjschool@gmail.com" className={styles.dcLink}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M2 5L8 9L14 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                napdjschool@gmail.com
              </a>
            </div>
          </div>

          {/* Right: form */}
          <div className={`${styles.right} ${isVisible ? styles.in : ''}`} style={{ transitionDelay: '0.2s' }}>
            {status === 'success' ? (
              <div className={styles.success}>
                <div className={styles.successIcon}>
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <circle cx="24" cy="24" r="22" stroke="#9B30FF" strokeWidth="1.5"/>
                    <path d="M14 24L21 31L34 17" stroke="#9B30FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className={styles.successTitle}>{t('book_success_title')}</h3>
                <p className={styles.successText}>{t('book_success_text')}</p>
                {(form.date || form.noPreference) && (
                  <div className={styles.successDateBadge}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect x="1" y="2" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M4 1V3M10 1V3M1 6H13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    {form.noPreference
                      ? t('cal_skip')
                      : `${new Intl.DateTimeFormat(lang, { weekday: 'short', day: 'numeric', month: 'long' }).format(form.date!)}${form.time ? ` · ${form.time}` : ''}`
                    }
                  </div>
                )}
              </div>
            ) : status === 'error' ? (
              <div className={styles.errorState}>
                <div className={styles.errorIcon}>
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <circle cx="24" cy="24" r="22" stroke="#FF2D78" strokeWidth="1.5"/>
                    <path d="M24 14V26M24 32V34" stroke="#FF2D78" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3 className={styles.errorTitle}>{t('book_error_title')}</h3>
                <p className={styles.errorText}>{t('book_error_text')}</p>
                <button
                  type="button"
                  className={`btn btn-outline ${styles.errorRetry}`}
                  onClick={() => setStatus('idle')}
                >{t('book_error_retry')}</button>
              </div>
            ) : (
              <form className={styles.form} onSubmit={submit} noValidate>

                {/* Name + Email row */}
                <div className={styles.row}>
                  <Field
                    label={t('book_name')} type="text" value={form.name}
                    error={errors.name} focused={focused === 'name'}
                    placeholder={t('book_name')}
                    onFocus={() => setFocused('name')} onBlur={() => setFocused(null)}
                    onChange={v => set('name', v)}
                  />
                  <Field
                    label={t('book_email')} type="email" value={form.email}
                    error={errors.email} focused={focused === 'email'}
                    placeholder={t('book_email')}
                    onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                    onChange={v => set('email', v)}
                  />
                </div>

                {/* Phone */}
                <div className={styles.row}>
                  <Field
                    label={t('book_phone')} type="tel" value={form.phone}
                    focused={focused === 'phone'} placeholder="+370..."
                    onFocus={() => setFocused('phone')} onBlur={() => setFocused(null)}
                    onChange={v => set('phone', v)}
                  />
                </div>

                {/* Plan selector */}
                <div className={`${styles.fieldGroup} ${errors.plan ? styles.fieldError : ''}`}>
                  <label className={styles.fieldLabel}>
                    {t('book_plan')}
                    {errors.plan && <span className={styles.errorMsg}>{errors.plan}</span>}
                  </label>
                  <div className={styles.planGrid}>
                    {PLANS.map(p => (
                      <button
                        key={p.id} type="button"
                        className={`${styles.planCard} ${form.plan === p.id ? styles.planActive : ''}`}
                        onClick={() => set('plan', p.id)}
                      >
                        {p.badge && <span className={styles.planBadge}>{p.badge}</span>}
                        <span className={styles.planName}>{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Genre */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>{t('book_genre')}</label>
                  <div className={styles.pills}>
                    {GENRES.map(g => (
                      <button
                        key={g.id} type="button"
                        className={`${styles.pill} ${form.genre === g.id ? styles.pillActive : ''}`}
                        onClick={() => set('genre', g.id)}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Calendar */}
                <CalendarPicker
                  selectedDate={form.date}
                  selectedTime={form.time}
                  noPreference={form.noPreference}
                  onChange={setCalendar}
                />

                {/* Message */}
                <div className={`${styles.fieldGroup} ${focused === 'message' ? styles.focused : ''}`}>
                  <label className={styles.fieldLabel}>{t('book_message')}</label>
                  <textarea
                    className={styles.textarea} rows={3}
                    placeholder={t('book_msg_ph')}
                    value={form.message}
                    onFocus={() => setFocused('message')} onBlur={() => setFocused(null)}
                    onChange={e => set('message', e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className={`btn btn-primary ${styles.submitBtn} ${status === 'submitting' ? styles.submitting : ''}`}
                  disabled={status === 'submitting'}
                >
                  {status === 'submitting' ? (
                    <><span className={styles.spinner} />{t('book_sending')}</>
                  ) : (
                    <>
                      {t('book_submit')}
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8H13M9 4L13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </>
                  )}
                </button>

                <p className={styles.formNote}>{t('book_note')}</p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function Field({
  label, type, value, error, focused, placeholder,
  onFocus, onBlur, onChange,
}: {
  label: string; type: string; value: string; error?: string
  focused: boolean; placeholder: string
  onFocus: () => void; onBlur: () => void; onChange: (v: string) => void
}) {
  return (
    <div className={`${styles.fieldGroup} ${focused ? styles.focused : ''} ${error ? styles.fieldError : ''}`}>
      <label className={styles.fieldLabel}>
        {label}
        {error && <span className={styles.errorMsg}>{error}</span>}
      </label>
      <input
        type={type} value={value} placeholder={placeholder}
        className={styles.input}
        onFocus={onFocus} onBlur={onBlur}
        onChange={e => onChange(e.target.value)}
      />
      <div className={styles.fieldLine} />
    </div>
  )
}
