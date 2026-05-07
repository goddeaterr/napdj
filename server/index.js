import 'dotenv/config'
import express    from 'express'
import cors       from 'cors'
import { Resend } from 'resend'
import nodemailer  from 'nodemailer'

const app  = express()
const port = process.env.API_PORT || 3001

/* ── Resend (уведомление владельцу) ── */
const resend = new Resend(process.env.RESEND_API_KEY)
const OWNER  = process.env.OWNER_EMAIL || 'pinciuk404@gmail.com'
const FROM   = `${process.env.FROM_NAME || 'neko art platform'} <${process.env.FROM_EMAIL || 'onboarding@resend.dev'}>`

/* ── Gmail SMTP (подтверждение клиенту) ── */
const gmailReady = !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD &&
                      !process.env.GMAIL_APP_PASSWORD.startsWith('xxxx'))

const gmail = gmailReady
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD.replace(/\s/g, ''),
      },
    })
  : null

console.log('\n──────────────────────────────────────────')
console.log('  neko art platform · Email Server')
console.log(`  Resend  → владельцу : ${OWNER}`)
console.log(`  Gmail   → клиентам  : ${gmailReady ? `✅ ${process.env.GMAIL_USER}` : '⚠️  не настроен (см. .env)'}`)
console.log('──────────────────────────────────────────\n')

app.use(cors({ origin: '*' }))
app.use(express.json())

/* ── health ── */
app.get('/api/health', (_req, res) =>
  res.json({ ok: true, gmail: gmailReady, owner: OWNER }))

/* ══════════════════════════════════════════════════════════
   POST /api/send-booking
══════════════════════════════════════════════════════════ */
app.post('/api/send-booking', async (req, res) => {
  const { name, email, phone, plan, genre, date, time, noPreference, message, lang } = req.body

  if (!name || !email || !plan)
    return res.status(400).json({ ok: false, error: 'Заполни обязательные поля' })

  const dateLabel = noPreference
    ? { ru:'Без предпочтений', lt:'Be pageidavimų', en:'No preference' }[lang] ?? 'No preference'
    : date ? fmtDate(date, lang, time) : 'Не указано'

  console.log(`📬  ${name} <${email}> · ${plan} · ${dateLabel}`)

  /* ── 1. Уведомление владельцу (Resend) ── */
  try {
    const r = await resend.emails.send({
      from: FROM, to: OWNER, replyTo: email,
      subject: `📋 Новая запись — ${name} · ${plan}`,
      html: ownerHtml({ name, email, phone, plan, genre, dateLabel, message }),
    })
    if (r.error) throw new Error(JSON.stringify(r.error))
    console.log(`  ✅ Владелец   id=${r.data?.id}`)
  } catch (err) {
    console.error('  ❌ Владелец:', err.message)
    return res.status(500).json({ ok: false, error: 'Ошибка отправки уведомления: ' + err.message })
  }

  /* ── 2. Подтверждение клиенту (Gmail SMTP) ── */
  if (gmail) {
    try {
      const info = await gmail.sendMail({
        from:    `"neko art platform" <${process.env.GMAIL_USER}>`,
        to:      `"${name}" <${email}>`,
        replyTo: OWNER,
        subject: confirmSubject(lang),
        html:    clientHtml({ name, plan, genre, dateLabel, message, lang }),
      })
      console.log(`  ✅ Клиент     id=${info.messageId}`)
    } catch (err) {
      // Не блокируем успех — владелец уже получил уведомление
      console.warn('  ⚠️  Клиент (Gmail):', err.message)
    }
  } else {
    console.log('  ℹ️  Gmail не настроен → клиенту письмо не отправлено')
    console.log('      Добавь GMAIL_APP_PASSWORD в .env')
  }

  res.json({ ok: true })
})

app.listen(port, () =>
  console.log(`🚀  http://localhost:${port}\n`))

/* ─────────────────────────────── helpers ─── */

function fmtDate(iso, lang, time) {
  try {
    const locale = { ru:'ru-RU', lt:'lt-LT', en:'en-GB' }[lang] ?? 'en-GB'
    const d = new Intl.DateTimeFormat(locale,
      { weekday:'long', day:'numeric', month:'long', year:'numeric' }).format(new Date(iso))
    return time ? `${d} · ${time}` : d
  } catch { return String(iso) }
}

function confirmSubject(lang) {
  return { ru:'✅ Заявка принята — neko art platform',
           lt:'✅ Užklausa priimta — neko art platform',
           en:'✅ Booking Confirmed — neko art platform' }[lang]
    ?? '✅ Booking Confirmed — neko art platform'
}

/* ══════════════════════════════════════════
   EMAIL TEMPLATES
══════════════════════════════════════════ */

function shell(headline, content) {
  return `<!DOCTYPE html><html lang="ru">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#080810;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#080810;padding:36px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">

  <tr><td style="background:linear-gradient(160deg,#0e0e20,#13132a);
                  border:1px solid rgba(155,48,255,0.35);border-radius:12px 12px 0 0;
                  padding:30px 40px;text-align:center;">
    <p style="margin:0 0 6px;font-size:10px;letter-spacing:.35em;text-transform:uppercase;
               color:rgba(155,48,255,0.55);">neko art platform</p>
    <h1 style="margin:0;font-size:26px;font-weight:900;letter-spacing:.04em;
                color:#ffffff;text-transform:uppercase;">${headline}</h1>
  </td></tr>

  <tr><td style="background:#09091a;border-left:1px solid rgba(155,48,255,0.12);
                  border-right:1px solid rgba(155,48,255,0.12);padding:36px 40px;">
    ${content}
  </td></tr>

  <tr><td style="background:#070710;border:1px solid rgba(155,48,255,0.1);border-top:none;
                  border-radius:0 0 12px 12px;padding:18px 40px;text-align:center;">
    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.18);letter-spacing:.04em;">
      neko art platform · Klaipėda, Lithuania
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`
}

function row(label, value) {
  if (!value) return ''
  return `<tr><td style="padding:11px 0;border-bottom:1px solid rgba(255,255,255,0.05);vertical-align:top;">
    <span style="display:inline-block;min-width:115px;font-size:10px;letter-spacing:.2em;
                 text-transform:uppercase;color:rgba(155,48,255,0.5);font-weight:700;">${label}</span>
    <span style="font-size:14px;color:rgba(255,255,255,0.82);">${value}</span>
  </td></tr>`
}

/* ── Владелец ── */
function ownerHtml({ name, email, phone, plan, genre, dateLabel, message }) {
  return shell('📋 Новая запись', `
    <p style="margin:0 0 22px;font-size:14px;color:rgba(255,255,255,0.38);line-height:1.75;">
      Новый запрос на запись. Нажмите кнопку ниже чтобы ответить студенту.
    </p>

    <div style="background:rgba(155,48,255,0.05);border:1px solid rgba(155,48,255,0.2);
                border-radius:10px;padding:22px 24px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${row('Имя',          name)}
        ${row('E-mail',       `<a href="mailto:${email}" style="color:#9B30FF;text-decoration:none;">${email}</a>`)}
        ${row('Телефон',      phone || '—')}
        ${row('Курс',         plan)}
        ${row('Жанр',         genre || '—')}
        ${row('Дата / время', dateLabel)}
      </table>
    </div>

    ${message ? `<div style="background:rgba(255,255,255,0.025);border-left:3px solid rgba(155,48,255,0.55);
                              padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:24px;">
      <p style="margin:0 0 5px;font-size:10px;letter-spacing:.18em;text-transform:uppercase;
                 color:rgba(155,48,255,0.45);">Сообщение студента</p>
      <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.65);line-height:1.65;">${message}</p>
    </div>` : ''}

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <a href="mailto:${email}?subject=Re%3A%20neko%20art%20platform%20%E2%80%94%20%D0%B7%D0%B0%D0%BF%D0%B8%D1%81%D1%8C"
           style="display:inline-block;background:linear-gradient(135deg,#9B30FF 0%,#6B10CF 100%);
                  color:#fff;text-decoration:none;padding:14px 32px;border-radius:6px;
                  font-size:12px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;
                  box-shadow:0 4px 24px rgba(155,48,255,0.35);">
          Ответить студенту →
        </a>
      </td></tr>
    </table>
  `)
}

/* ── Клиент ── */
function clientHtml({ name, plan, genre, dateLabel, message, lang }) {
  const S = {
    ru: {
      hi:    `Привет, ${name}!`,
      intro: 'Твоя заявка принята — мы уже готовимся к встрече. Свяжемся в течение 24 часов для подтверждения.',
      cap:   'Детали записи',
      lPlan:'Курс', lGenre:'Жанр', lDate:'Дата / время', lMsg:'Твоё сообщение',
      next:  'Что дальше?',
      steps: ['Проверим свободное время и подтвердим.', 'Напишем тебе в течение 24 часов.', 'DJ-путь начинается. Оплата только на месте.'],
      guar:  '✦ Гарантия возврата 100% если первый урок не понравится — без вопросов.',
      foot:  'Вопросы? Просто ответь на это письмо.',
    },
    lt: {
      hi:    `Sveiki, ${name}!`,
      intro: 'Jūsų rezervacija priimta! Susisieksime per 24 val. patvirtinti laiką.',
      cap:   'Rezervacijos duomenys',
      lPlan:'Kursas', lGenre:'Žanras', lDate:'Data / laikas', lMsg:'Jūsų žinutė',
      next:  'Kas toliau?',
      steps: ['Patikrinsime galimybes ir patvirtinsime.', 'Susisieksime per 24 val.', 'DJ kelionė prasideda. Mokėjimas vietoje.'],
      guar:  '✦ 100% pinigų grąžinimas jei pirmoji pamoka netiks.',
      foot:  'Klausimai? Atsakykite į šį laišką.',
    },
    en: {
      hi:    `Hi ${name}!`,
      intro: 'Your booking is confirmed — we\'re already preparing for your session. We\'ll be in touch within 24 hours.',
      cap:   'Booking Details',
      lPlan:'Course', lGenre:'Genre', lDate:'Date / Time', lMsg:'Your message',
      next:  'What\'s next?',
      steps: ['We\'ll check availability and confirm.', 'You\'ll hear from us within 24 hours.', 'Your DJ journey begins. Pay on arrival.'],
      guar:  '✦ 100% refund guarantee if the first lesson isn\'t right for you.',
      foot:  'Questions? Just reply to this email.',
    },
  }
  const s = S[lang] || S.en

  const stepsHtml = s.steps.map((st, i) => `
    <tr><td style="padding:9px 0;">
      <table cellpadding="0" cellspacing="0"><tr>
        <td style="width:28px;height:28px;min-width:28px;border-radius:50%;text-align:center;
                   vertical-align:middle;line-height:28px;
                   background:rgba(155,48,255,0.1);border:1px solid rgba(155,48,255,0.28);
                   font-size:11px;font-weight:800;color:#9B30FF;">${i + 1}</td>
        <td style="padding-left:14px;font-size:14px;color:rgba(255,255,255,0.48);line-height:1.6;">${st}</td>
      </tr></table>
    </td></tr>`).join('')

  return shell('✅ ' + (lang === 'ru' ? 'Заявка принята' : lang === 'lt' ? 'Rezervacija priimta' : 'Booking Confirmed'), `

    <p style="margin:0 0 5px;font-size:21px;font-weight:800;color:#fff;">${s.hi}</p>
    <p style="margin:0 0 28px;font-size:14px;color:rgba(255,255,255,0.38);line-height:1.75;">${s.intro}</p>

    <div style="background:rgba(155,48,255,0.05);border:1px solid rgba(155,48,255,0.2);
                border-radius:10px;padding:20px 24px;margin-bottom:26px;">
      <p style="margin:0 0 14px;font-size:10px;letter-spacing:.24em;text-transform:uppercase;
                 color:rgba(155,48,255,0.5);font-weight:700;">${s.cap}</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${row(s.lPlan,  plan)}
        ${genre   ? row(s.lGenre, genre) : ''}
        ${          row(s.lDate,  dateLabel)}
        ${message ? row(s.lMsg, `<em style="color:rgba(255,255,255,0.45);">"${message}"</em>`) : ''}
      </table>
    </div>

    <p style="margin:0 0 10px;font-size:10px;letter-spacing:.24em;text-transform:uppercase;
               color:rgba(155,48,255,0.5);font-weight:700;">${s.next}</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:22px;">${stepsHtml}</table>

    <div style="padding:14px 18px;border:1px solid rgba(57,255,20,0.2);border-radius:8px;
                background:rgba(57,255,20,0.03);margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:rgba(57,255,20,0.7);line-height:1.65;">${s.guar}</p>
    </div>

    <div style="padding:20px 24px;background:rgba(255,255,255,0.02);border-radius:8px;
                border:1px solid rgba(255,255,255,0.06);text-align:center;">
      <p style="margin:0 0 4px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;
                 color:rgba(255,255,255,0.2);">neko art platform</p>
      <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.35);">napdjschool@gmail.com</p>
    </div>

    <p style="margin:20px 0 0;font-size:12px;color:rgba(255,255,255,0.18);text-align:center;">${s.foot}</p>
  `)
}
