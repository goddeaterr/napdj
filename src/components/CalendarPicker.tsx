import { useState, useMemo, useEffect } from 'react'
import { useLang } from '../lib/LangContext'
import { SCHEDULE } from '../config/site'
import styles from './CalendarPicker.module.css'

interface Props {
  selectedDate: Date | null
  selectedTime: string | null
  noPreference: boolean
  onChange: (date: Date | null, time: string | null, noPreference: boolean) => void
  /** Bumping this refetches availability — used after a slot-taken error. */
  refreshKey?: number
}

/** Slots already booked, keyed by YYYY-MM-DD. */
type TakenMap = Record<string, string[]>

/* Time slots are generated from the opening hours in src/config/site.ts */
const DAY_SLOTS = Array.from(
  { length: SCHEDULE.closeHour - SCHEDULE.openHour + 1 },
  (_, i) => `${String(SCHEDULE.openHour + i).padStart(2, '0')}:00`,
)

const OPEN_DAYS: readonly number[] = SCHEDULE.openDays
const isOpenDay = (d: Date) => OPEN_DAYS.includes(d.getDay())

/** Local calendar date as YYYY-MM-DD — never via toISOString, which shifts. */
function toKey(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function sameDay(a: Date | null, b: Date | null) {
  if (!a || !b) return false
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate()
}

export default function CalendarPicker({ selectedDate, selectedTime, noPreference, onChange, refreshKey = 0 }: Props) {
  const { lang, t } = useLang()

  /* Slots other people already booked. Availability is derived from the
     bookings themselves, so a reservation the admin deletes or cancels frees
     its slot here automatically. */
  const [taken, setTaken] = useState<TakenMap>({})

  useEffect(() => {
    let cancelled = false
    fetch('/api/availability')
      .then(r => r.json())
      .then(data => { if (!cancelled && data?.taken) setTaken(data.taken) })
      // A failed lookup just means nothing is greyed out — the server still
      // rejects a double booking on submit.
      .catch(() => {})
    return () => { cancelled = true }
  }, [refreshKey])

  const takenFor  = (d: Date) => taken[toKey(d)] ?? []
  const isSlotTaken = (d: Date, slot: string) => takenFor(d).includes(slot)
  const isDayFull = (d: Date) => DAY_SLOTS.every(s => takenFor(d).includes(s))

  const today = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d
  }, [])

  const [viewMonth, setViewMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))

  const year  = viewMonth.getFullYear()
  const month = viewMonth.getMonth()

  /* Build 7-column grid starting Monday */
  const days = useMemo(() => {
    const first   = new Date(year, month, 1)
    const last    = new Date(year, month + 1, 0)
    const leadDow = (first.getDay() + 6) % 7  // Mon=0
    const grid: (Date | null)[] = []
    for (let i = 0; i < leadDow; i++)       grid.push(null)
    for (let d = 1; d <= last.getDate(); d++) grid.push(new Date(year, month, d))
    while (grid.length % 7 !== 0)           grid.push(null)
    return grid
  }, [year, month])

  const isDisabled = (d: Date) => d < today || !isOpenDay(d)
  const isToday    = (d: Date) => sameDay(d, today)

  /* Navigation */
  const prevMonth = () => setViewMonth(new Date(year, month - 1, 1))
  const nextMonth = () => setViewMonth(new Date(year, month + 1, 1))
  const canPrev   = new Date(year, month - 1, 1) >= new Date(today.getFullYear(), today.getMonth(), 1)

  /* Intl-based labels */
  const monthLabel = new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' }).format(viewMonth)

  const dayHeaders = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(lang, { weekday: 'short' })
    // 2024-01-01 is a Monday — safe anchor
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2024, 0, 1 + i)))
  }, [lang])

  /* Handlers */
  const handleDay = (d: Date) => {
    if (isDisabled(d)) return
    if (sameDay(d, selectedDate)) {
      onChange(null, null, false)
    } else {
      onChange(d, null, false)
    }
  }

  const handleTime = (slot: string) => {
    onChange(selectedDate, selectedTime === slot ? null : slot, false)
  }

  const handleToggleNoPreference = () => {
    onChange(null, null, !noPreference)
  }

  /* Slot grouping */
  const slots = selectedDate ? DAY_SLOTS : []

  const slotGroups = useMemo(() => {
    if (!slots.length) return []
    const morning   = slots.filter(s => parseInt(s) < 13)
    const afternoon = slots.filter(s => parseInt(s) >= 13 && parseInt(s) < 18)
    const evening   = slots.filter(s => parseInt(s) >= 18)
    return [
      { label: t('cal_morning'),   slots: morning   },
      { label: t('cal_afternoon'), slots: afternoon },
      { label: t('cal_evening'),   slots: evening   },
    ].filter(g => g.slots.length)
  }, [slots, lang])

  const selectedDateLabel = selectedDate
    ? new Intl.DateTimeFormat(lang, { weekday: 'long', day: 'numeric', month: 'long' }).format(selectedDate)
    : null

  return (
    <div className={styles.wrapper}>
      <div className={styles.sectionLabel}>{t('cal_label')}</div>

      {/* No-preference toggle */}
      <button
        type="button"
        className={`${styles.skipBtn} ${noPreference ? styles.skipActive : ''}`}
        onClick={handleToggleNoPreference}
      >
        <span className={styles.skipDot} />
        {t('cal_skip')}
      </button>

      {!noPreference && (
        <div className={styles.calBody}>

          {/* ── Month navigation ── */}
          <div className={styles.monthNav}>
            <button type="button" className={styles.navBtn} onClick={prevMonth} disabled={!canPrev} aria-label="Previous month">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <span className={styles.monthLabel}>{monthLabel}</span>
            <button type="button" className={styles.navBtn} onClick={nextMonth} aria-label="Next month">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 2L10 7L5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* ── Day-of-week headers ── */}
          <div className={styles.dayHeaders}>
            {dayHeaders.map((h, i) => (
              <div key={i} className={`${styles.dayHeader} ${i >= 5 ? styles.dayHeaderSun : ''}`}>{h}</div>
            ))}
          </div>

          {/* ── Day grid ── */}
          <div className={styles.dayGrid}>
            {days.map((d, i) => {
              if (!d) return <div key={`e${i}`} className={styles.dayEmpty} />
              const closed    = isDisabled(d)
              const full      = !closed && isDayFull(d)
              const selected  = sameDay(d, selectedDate)
              const isWeekend = !isOpenDay(d)
              const partly    = !closed && !full && takenFor(d).length > 0
              return (
                <button
                  key={d.getTime()}
                  type="button"
                  disabled={closed || full}
                  title={full ? t('cal_day_full') : undefined}
                  onClick={() => handleDay(d)}
                  className={[
                    styles.day,
                    closed    ? styles.dayDisabled  : '',
                    full      ? styles.dayFull      : '',
                    selected  ? styles.daySelected  : '',
                    isToday(d)? styles.dayToday     : '',
                    isWeekend ? styles.daySun       : '',
                  ].join(' ')}
                >
                  {d.getDate()}
                  {selected && <span className={styles.dayDot} />}
                  {partly   && <span className={styles.dayPartial} />}
                </button>
              )
            })}
          </div>

          {/* ── Closed-day hints ── */}
          <div className={styles.hints}>
            <span className={styles.hint}><span className={styles.hintDot} style={{ background: 'rgba(200,200,200,0.5)' }} />{t('cal_sunday_note')}</span>
            <span className={styles.hint}><span className={styles.hintDot} style={{ background: 'rgba(255,255,255,0.7)' }} />{t('cal_hours_note')}</span>
            <span className={styles.hint}><span className={styles.hintDot} style={{ background: 'var(--taken)' }} />{t('cal_taken_note')}</span>
          </div>

          {/* ── Time slots ── */}
          {selectedDate && (
            <div className={styles.timeSection}>
              <div className={styles.timeSectionHeader}>
                <span className={styles.timeSectionDate}>{selectedDateLabel}</span>
                <span className={styles.timeSectionPick}>{t('cal_pick_time')}</span>
              </div>

              {slotGroups.map(group => (
                <div key={group.label} className={styles.slotGroup}>
                  <div className={styles.slotGroupLabel}>{group.label}</div>
                  <div className={styles.slotRow}>
                    {group.slots.map(slot => {
                      const busy = isSlotTaken(selectedDate, slot)
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={busy}
                          title={busy ? t('cal_taken_note') : undefined}
                          className={[
                            styles.slot,
                            busy ? styles.slotTaken : '',
                            selectedTime === slot ? styles.slotActive : '',
                          ].join(' ')}
                          onClick={() => handleTime(slot)}
                        >
                          {slot}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
