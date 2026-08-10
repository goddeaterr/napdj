import { useEffect } from 'react'
import { useLang } from '../lib/LangContext'
import { navigate } from '../lib/router'
import { CONTACT, LEGAL } from '../config/site'
import { LEGAL_PAGES, type LegalPage } from './pages'
import styles from './LegalPage.module.css'

const LANGS = [
  { id: 'en', label: 'EN' },
  { id: 'ru', label: 'RU' },
  { id: 'lt', label: 'LT' },
] as const

const BACK = { en: '← Back to site', ru: '← Вернуться на сайт', lt: '← Grįžti į svetainę' }
const DETAILS = { en: 'Company details', ru: 'Реквизиты', lt: 'Rekvizitai' }

export default function LegalPageView({ page }: { page: LegalPage }) {
  const { lang, setLang } = useLang()

  useEffect(() => {
    document.title = `${page.title[lang]} — ${LEGAL.brand}`
  }, [page, lang])

  const sections = page.sections[lang]

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <button className={styles.back} onClick={() => navigate('/')}>{BACK[lang]}</button>
        <div className={styles.langs}>
          {LANGS.map(l => (
            <button
              key={l.id}
              className={`${styles.langBtn} ${lang === l.id ? styles.langActive : ''}`}
              onClick={() => setLang(l.id)}
            >
              {l.label}
            </button>
          ))}
        </div>
      </header>

      <main className={styles.body}>
        <h1 className={styles.title}>{page.title[lang]}</h1>
        <p className={styles.intro}>{page.intro[lang]}</p>
        <div className={styles.rule} />

        {sections.map(section => (
          <section key={section.heading} className={styles.section}>
            <h2 className={styles.heading}>{section.heading}</h2>
            {section.body.map((paragraph, i) => (
              <p
                key={i}
                className={paragraph.startsWith('•') ? styles.bullet : styles.paragraph}
              >
                {paragraph}
              </p>
            ))}
          </section>
        ))}

        <div className={styles.rule} />

        <section className={styles.section}>
          <h2 className={styles.heading}>{DETAILS[lang]}</h2>
          <p className={styles.paragraph}>
            {LEGAL.companyName || LEGAL.brand}
            {LEGAL.companyCode && ` · ${LEGAL.companyCode}`}
            {LEGAL.vatCode && ` · ${LEGAL.vatCode}`}
            <br />
            {LEGAL.registeredAddress || `${CONTACT.city}, ${CONTACT.country}`}
            <br />
            <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
            {' · '}
            <a href={`tel:${CONTACT.phoneHref}`}>{CONTACT.phone}</a>
          </p>
        </section>

        <nav className={styles.otherPages}>
          {LEGAL_PAGES.filter(p => p.path !== page.path).map(p => (
            <a
              key={p.path}
              href={p.path}
              onClick={e => { e.preventDefault(); navigate(p.path) }}
            >
              {p.title[lang]}
            </a>
          ))}
        </nav>
      </main>
    </div>
  )
}
