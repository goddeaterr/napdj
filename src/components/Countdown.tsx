import { scrollTo } from '../lib/scroll'
import MagneticButton from './MagneticButton'
import { useEffect, useState } from 'react'
import { useLang } from '../lib/LangContext'
import { useScrollAnimation } from '../hooks/useScrollAnimation'
import styles from './Countdown.module.css'

function getNextMonday() {
  const now  = new Date()
  const day  = now.getDay()
  const diff = day === 0 ? 1 : day === 1 ? 7 : 8 - day
  const next = new Date(now)
  next.setDate(now.getDate() + diff)
  next.setHours(18, 0, 0, 0)
  return next
}

export default function Countdown() {
  const { t } = useLang()
  const [time,  setTime]  = useState({ days:0, hours:0, minutes:0, seconds:0 })
  const [flash, setFlash] = useState(false)
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>(0.1)

  useEffect(() => {
    const target = getNextMonday()
    const tick = () => {
      const diff = target.getTime() - Date.now()
      if (diff <= 0) return
      setTime({
        days:    Math.floor(diff / 86400000),
        hours:   Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      })
      setFlash(f => !f)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const pad = (n: number) => String(n).padStart(2, '0')

  const units = [
    { val: pad(time.days),    label: t('cd_days')    },
    { val: pad(time.hours),   label: t('cd_hours')   },
    { val: pad(time.minutes), label: t('cd_minutes') },
    { val: pad(time.seconds), label: t('cd_seconds') },
  ]

  return (
    <div ref={ref} id="countdown" className={`${styles.wrap} ${isVisible ? styles.in : ''}`}>
      <div className={styles.bgGlow} />
      <div className="container">
        <div className={styles.inner}>

          <div className={styles.left}>
            <span className="label">{t('cd_label')}</span>
            <h3 className={styles.heading}>
              {t('cd_title1')}<br />
              <span className={styles.accent}>{t('cd_title2')}</span>
            </h3>
            <p className={styles.sub}>{t('cd_sub')}</p>
            <MagneticButton>
              <button className="btn btn-primary" onClick={() => scrollTo('book')}>
                {t('cd_cta')}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7H12M8 3L12 7L8 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </MagneticButton>
          </div>

          <div className={styles.right}>
            <div className={styles.clock}>
              {units.map((u, i) => (
                <div key={u.label} className={styles.unit}>
                  <div className={`${styles.digits} ${u.label === t('cd_seconds') ? styles.tickFlash : ''}`}>
                    {u.val.split('').map((d, j) => (
                      <span key={j} className={styles.digit}>{d}</span>
                    ))}
                  </div>
                  <div className={styles.unitLabel}>{u.label}</div>
                  {i < 3 && <div className={`${styles.colon} ${flash ? styles.colonOn : ''}`}>:</div>}
                </div>
              ))}
            </div>
            <div className={styles.clockBase}>
              <div className={styles.spotsRow}>
                <span className={styles.spotsDot} />
                <span className={styles.spotsText}>{t('cd_spots')}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
