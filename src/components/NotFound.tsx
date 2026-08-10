import { useEffect } from 'react'
import { useLang } from '../lib/LangContext'
import { navigate } from '../lib/router'
import { LEGAL } from '../config/site'
import styles from './NotFound.module.css'

const COPY = {
  en: { title: 'Page not found', body: 'That page does not exist — it may have been moved or the link is out of date.', cta: 'Back to the site' },
  ru: { title: 'Страница не найдена', body: 'Такой страницы нет — возможно, она была перемещена или ссылка устарела.', cta: 'Вернуться на сайт' },
  lt: { title: 'Puslapis nerastas', body: 'Tokio puslapio nėra — jis galėjo būti perkeltas arba nuoroda pasenusi.', cta: 'Grįžti į svetainę' },
}

export default function NotFound() {
  const { lang } = useLang()
  const copy = COPY[lang] ?? COPY.en

  useEffect(() => {
    document.title = `404 — ${LEGAL.brand}`
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex'
    document.head.appendChild(meta)
    return () => { document.head.removeChild(meta) }
  }, [])

  return (
    <main className={styles.wrap}>
      <span className={styles.code}>404</span>
      <h1 className={styles.title}>{copy.title}</h1>
      <p className={styles.body}>{copy.body}</p>
      <button className="btn btn-primary" onClick={() => navigate('/')}>{copy.cta}</button>
    </main>
  )
}
