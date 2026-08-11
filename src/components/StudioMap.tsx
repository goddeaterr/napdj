import { useState } from 'react'
import { useLang } from '../lib/LangContext'
import { CONTACT } from '../config/site'
import styles from './StudioMap.module.css'

const COPY: Record<string, { title: string; show: string; open: string; note: string }> = {
  en: { title: 'Find the studio', show: 'Show map', open: 'Open in Google Maps',
        note: 'Loading the map connects you to Google.' },
  ru: { title: 'Как нас найти', show: 'Показать карту', open: 'Открыть в Google Maps',
        note: 'Загрузка карты создаёт соединение с Google.' },
  lt: { title: 'Kaip mus rasti', show: 'Rodyti žemėlapį', open: 'Atidaryti Google Maps',
        note: 'Įkėlus žemėlapį prisijungiama prie Google.' },
}

const QUERY = `${CONTACT.address}, ${CONTACT.city}, ${CONTACT.country}`
const EMBED  = `https://www.google.com/maps?q=${encodeURIComponent(QUERY)}&z=16&output=embed`
const LINK   = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(QUERY)}`

/**
 * Studio location.
 *
 * The map is click-to-load on purpose. A Google Maps iframe sets cookies and
 * hands Google the visitor's IP the moment the page opens, which would drag a
 * consent banner onto a site that otherwise needs none. Nothing contacts Google
 * until someone asks for the map.
 */
export default function StudioMap() {
  const { lang } = useLang()
  const c = COPY[lang] ?? COPY.en
  const [loaded, setLoaded] = useState(false)

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <span className={styles.title}>{c.title}</span>
        <a className={styles.open} href={LINK} target="_blank" rel="noreferrer">
          {c.open}
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M2 8L8 2M8 2H3.5M8 2v4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
      </div>

      <div className={styles.frame}>
        {loaded ? (
          <iframe
            className={styles.map}
            src={EMBED}
            title={`${CONTACT.address}, ${CONTACT.city}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        ) : (
          <button type="button" className={styles.placeholder} onClick={() => setLoaded(true)}>
            {/* A drawn stand-in so the card looks intentional before consent. */}
            <span className={styles.grid} aria-hidden="true" />
            <span className={styles.pin} aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M12 22s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z"
                      stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                <circle cx="12" cy="11" r="2.4" stroke="currentColor" strokeWidth="1.4"/>
              </svg>
            </span>
            <span className={styles.cta}>{c.show}</span>
            <span className={styles.note}>{c.note}</span>
          </button>
        )}
      </div>

      <address className={styles.address}>
        {CONTACT.address}, {CONTACT.city}
      </address>
    </div>
  )
}
