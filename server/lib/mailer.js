/* ============================================================================
   Booking e-mails — shared by the Express server and the Vercel function.
   ----------------------------------------------------------------------------
   Resend is the only transport. Configure RESEND_API_KEY and FROM_EMAIL.

   FROM_EMAIL must be an address on a domain verified in Resend. The shared
   `onboarding@resend.dev` sender works for testing but Resend will then only
   deliver to the address that owns the Resend account — student confirmations
   to other addresses are rejected until a domain is verified.
============================================================================ */
import { Resend } from 'resend'

export const OWNER = process.env.OWNER_EMAIL || 'artemijstepanov@gmail.com'
export const BRAND = process.env.BRAND_NAME || 'neko art platform'
const PUBLIC_PHONE = process.env.PUBLIC_PHONE || '+370 624 50896'
const SITE_URL     = process.env.PUBLIC_SITE_URL || 'https://napdj.com'
const FROM         = `${BRAND} <${process.env.FROM_EMAIL || 'onboarding@resend.dev'}>`

const resendReady = !!process.env.RESEND_API_KEY
const resend = resendReady ? new Resend(process.env.RESEND_API_KEY) : null

export const mailerStatus = { resend: resendReady, from: FROM, owner: OWNER }

/* ── Sending ──────────────────────────────────────────────────────────── */

const NOT_CONFIGURED = 'Resend is not configured (set RESEND_API_KEY in .env)'

async function send({ to, replyTo, subject, html }) {
  if (!resend) return { sent: false, error: NOT_CONFIGURED }
  try {
    const r = await resend.emails.send({ from: FROM, to, replyTo, subject, html })
    if (r.error) throw new Error(r.error.message || JSON.stringify(r.error))
    return { sent: true, via: 'resend', id: r.data?.id }
  } catch (err) {
    return { sent: false, via: 'resend', error: err.message }
  }
}

/** Notifies the studio owner. Returns { sent, via, error } — never throws. */
export async function sendOwnerNotification(booking) {
  return send({
    to:      OWNER,
    replyTo: booking.email,
    subject: `New booking — ${booking.name} · ${booking.plan}`,
    html:    ownerHtml(booking),
  })
}

/** Confirmation to the student. Non-critical — failures are reported, not thrown. */
export async function sendClientConfirmation(booking) {
  return send({
    to:      booking.email,
    replyTo: OWNER,
    subject: confirmSubject(booking.lang),
    html:    clientHtml(booking),
  })
}

/* ── Helpers ──────────────────────────────────────────────────────────── */

export function formatDateLabel(booking) {
  const { noPreference, date, time, lang } = booking
  if (noPreference) {
    return { ru: 'Без предпочтений', lt: 'Be pageidavimų', en: 'No preference' }[lang] ?? 'No preference'
  }
  if (!date) return '—'
  try {
    const locale = { ru: 'ru-RU', lt: 'lt-LT', en: 'en-GB' }[lang] ?? 'en-GB'
    // The client sends a plain calendar date (YYYY-MM-DD). Build it from its
    // parts so the server timezone can never shift it to the previous day.
    const parts = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(date))
    const value = parts
      ? new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]))
      : new Date(date)
    const d = new Intl.DateTimeFormat(locale,
      { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(value)
    return time ? `${d} · ${time}` : d
  } catch {
    return String(date)
  }
}

function confirmSubject(lang) {
  return {
    ru: `Заявка принята — ${BRAND}`,
    lt: `Užklausa priimta — ${BRAND}`,
    en: `Booking received — ${BRAND}`,
  }[lang] ?? `Booking received — ${BRAND}`
}

/** Minimal HTML escaping for values that end up inside the templates. */
function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

/* ── Templates (monochrome) ───────────────────────────────────────────── */

function shell(headline, content) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;padding:36px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">
  <tr><td style="background:#141414;border:1px solid rgba(255,255,255,0.18);border-radius:12px 12px 0 0;padding:30px 40px;text-align:center;">
    <p style="margin:0 0 6px;font-size:10px;letter-spacing:.35em;text-transform:uppercase;color:rgba(255,255,255,0.45);">${esc(BRAND)}</p>
    <h1 style="margin:0;font-size:26px;font-weight:900;letter-spacing:.04em;color:#FFFFFF;text-transform:uppercase;">${headline}</h1>
  </td></tr>
  <tr><td style="background:#101010;border-left:1px solid rgba(255,255,255,0.1);border-right:1px solid rgba(255,255,255,0.1);padding:36px 40px;">${content}</td></tr>
  <tr><td style="background:#0C0C0C;border:1px solid rgba(255,255,255,0.1);border-top:none;border-radius:0 0 12px 12px;padding:18px 40px;text-align:center;">
    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.3);letter-spacing:.04em;">${esc(BRAND)} · Klaipėda, Lithuania · ${esc(PUBLIC_PHONE)}</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`
}

function row(label, value) {
  if (!value) return ''
  return `<tr><td style="padding:11px 0;border-bottom:1px solid rgba(255,255,255,0.07);vertical-align:top;">
    <span style="display:inline-block;min-width:120px;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,0.4);font-weight:700;">${label}</span>
    <span style="font-size:14px;color:rgba(255,255,255,0.85);">${value}</span>
  </td></tr>`
}

function ownerHtml(booking) {
  const dateLabel = formatDateLabel(booking)
  return shell('New Booking', `
    <p style="margin:0 0 22px;font-size:14px;color:rgba(255,255,255,0.45);line-height:1.75;">
      A new booking request came in through the website.
    </p>
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.14);border-radius:10px;padding:22px 24px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${row('Name',      esc(booking.name))}
        ${row('E-mail',    `<a href="mailto:${esc(booking.email)}" style="color:#FFFFFF;">${esc(booking.email)}</a>`)}
        ${row('Phone',     booking.phone ? `<a href="tel:${esc(booking.phone)}" style="color:#FFFFFF;">${esc(booking.phone)}</a>` : '—')}
        ${row('Course',    esc(booking.plan))}
        ${row('Genre',     esc(booking.genre) || '—')}
        ${row('Date/Time', esc(dateLabel))}
        ${row('Language',  esc((booking.lang || 'en').toUpperCase()))}
      </table>
    </div>
    ${booking.message ? `<div style="background:rgba(255,255,255,0.03);border-left:3px solid rgba(255,255,255,0.5);padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:24px;">
      <p style="margin:0 0 5px;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,0.4);">Student message</p>
      <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.7);line-height:1.65;">${esc(booking.message)}</p>
    </div>` : ''}
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="mailto:${esc(booking.email)}?subject=Re%3A%20${encodeURIComponent(BRAND)}%20booking"
         style="display:inline-block;background:#FFFFFF;color:#0A0A0A;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:12px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;">
        Reply to student
      </a>
    </td></tr></table>
    <p style="margin:22px 0 0;font-size:11px;color:rgba(255,255,255,0.28);text-align:center;">
      All reservations: <a href="${SITE_URL}/admin" style="color:rgba(255,255,255,0.6);">${SITE_URL}/admin</a>
    </p>
  `)
}

function clientHtml(booking) {
  const { name, plan, genre, message, lang } = booking
  const dateLabel = formatDateLabel(booking)

  const S = {
    ru: { hi:`Привет, ${esc(name)}!`, intro:'Твоя заявка принята. Свяжемся в течение 24 часов, чтобы подтвердить время.', cap:'Детали записи', lPlan:'Курс', lGenre:'Жанр', lDate:'Дата / время', lMsg:'Твоё сообщение', next:'Что дальше?', steps:['Проверим свободное время и подтвердим.','Напишем тебе в течение 24 часов.','DJ-путь начинается. Оплата на месте.'], guar:'Гарантия возврата 100%, если первый урок не понравится.', foot:'Вопросы? Просто ответь на это письмо.' },
    lt: { hi:`Sveiki, ${esc(name)}!`, intro:'Jūsų užklausa gauta. Susisieksime per 24 val. laikui patvirtinti.', cap:'Rezervacijos duomenys', lPlan:'Kursas', lGenre:'Žanras', lDate:'Data / laikas', lMsg:'Jūsų žinutė', next:'Kas toliau?', steps:['Patikrinsime galimybes ir patvirtinsime.','Susisieksime per 24 val.','DJ kelionė prasideda. Mokėjimas vietoje.'], guar:'100% pinigų grąžinimas, jei pirmoji pamoka netiks.', foot:'Klausimai? Atsakykite į šį laišką.' },
    en: { hi:`Hi ${esc(name)}!`, intro:"Your request has been received. We'll be in touch within 24 hours to confirm the time.", cap:'Booking Details', lPlan:'Course', lGenre:'Genre', lDate:'Date / Time', lMsg:'Your message', next:"What's next?", steps:["We'll check availability and confirm.","You'll hear from us within 24 hours.",'Your DJ journey begins. Pay on arrival.'], guar:'100% refund guarantee if the first lesson is not right for you.', foot:'Questions? Just reply to this e-mail.' },
  }
  const s = S[lang] || S.en

  const stepsHtml = s.steps.map((step, i) => `
    <tr><td style="padding:9px 0;"><table cellpadding="0" cellspacing="0"><tr>
      <td style="width:28px;height:28px;min-width:28px;border-radius:50%;text-align:center;vertical-align:middle;line-height:28px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.3);font-size:11px;font-weight:800;color:#FFFFFF;">${i + 1}</td>
      <td style="padding-left:14px;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.6;">${step}</td>
    </tr></table></td></tr>`).join('')

  const headline = lang === 'ru' ? 'Заявка принята' : lang === 'lt' ? 'Užklausa gauta' : 'Booking received'

  return shell(headline, `
    <p style="margin:0 0 5px;font-size:21px;font-weight:800;color:#fff;">${s.hi}</p>
    <p style="margin:0 0 28px;font-size:14px;color:rgba(255,255,255,0.45);line-height:1.75;">${s.intro}</p>
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.14);border-radius:10px;padding:20px 24px;margin-bottom:26px;">
      <p style="margin:0 0 14px;font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:rgba(255,255,255,0.4);font-weight:700;">${s.cap}</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${row(s.lPlan, esc(plan))}
        ${genre ? row(s.lGenre, esc(genre)) : ''}
        ${row(s.lDate, esc(dateLabel))}
        ${message ? row(s.lMsg, `<em style="color:rgba(255,255,255,0.6);">"${esc(message)}"</em>`) : ''}
      </table>
    </div>
    <p style="margin:0 0 10px;font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:rgba(255,255,255,0.4);font-weight:700;">${s.next}</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:22px;">${stepsHtml}</table>
    <div style="padding:14px 18px;border:1px solid rgba(255,255,255,0.14);border-radius:8px;background:rgba(255,255,255,0.03);margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.6);line-height:1.65;">${s.guar}</p>
    </div>
    <div style="padding:20px 24px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid rgba(255,255,255,0.08);text-align:center;">
      <p style="margin:0 0 4px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,0.3);">${esc(BRAND)}</p>
      <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.5);">${esc(OWNER)} · ${esc(PUBLIC_PHONE)}</p>
    </div>
    <p style="margin:20px 0 0;font-size:12px;color:rgba(255,255,255,0.28);text-align:center;">${s.foot}</p>
  `)
}

/* ══════════════════════════════════════════════════════════════════════════
   Account e-mails
══════════════════════════════════════════════════════════════════════════ */

function button(href, label) {
  return `<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <a href="${href}" style="display:inline-block;background:#FFFFFF;color:#0A0A0A;text-decoration:none;
       padding:14px 34px;border-radius:6px;font-size:12px;font-weight:800;letter-spacing:.18em;
       text-transform:uppercase;">${label}</a>
  </td></tr></table>`
}

function fallbackLink(href, label) {
  return `<p style="margin:22px 0 0;font-size:12px;color:rgba(255,255,255,0.35);line-height:1.7;">
    ${label}<br/>
    <a href="${href}" style="color:rgba(255,255,255,0.6);word-break:break-all;">${href}</a>
  </p>`
}

const VERIFY_COPY = {
  en: {
    subject: `Confirm your e-mail — ${BRAND}`,
    headline: 'Confirm your e-mail',
    hi: name => `Hi ${name},`,
    body: 'Confirm this address to finish creating your account and book your lessons.',
    cta: 'Confirm e-mail',
    fallback: 'If the button does not work, paste this link into your browser:',
    note: 'The link works for 24 hours. If you did not create an account, ignore this e-mail.',
  },
  ru: {
    subject: `Подтвердите e-mail — ${BRAND}`,
    headline: 'Подтвердите e-mail',
    hi: name => `Привет, ${name}!`,
    body: 'Подтвердите адрес, чтобы завершить создание аккаунта и записываться на уроки.',
    cta: 'Подтвердить e-mail',
    fallback: 'Если кнопка не работает, вставьте ссылку в браузер:',
    note: 'Ссылка действует 24 часа. Если вы не создавали аккаунт, просто проигнорируйте письмо.',
  },
  lt: {
    subject: `Patvirtinkite el. paštą — ${BRAND}`,
    headline: 'Patvirtinkite el. paštą',
    hi: name => `Sveiki, ${name},`,
    body: 'Patvirtinkite šį adresą, kad baigtumėte kurti paskyrą ir galėtumėte registruotis į pamokas.',
    cta: 'Patvirtinti el. paštą',
    fallback: 'Jei mygtukas neveikia, nukopijuokite nuorodą į naršyklę:',
    note: 'Nuoroda galioja 24 valandas. Jei paskyros nekūrėte, tiesiog ignoruokite šį laišką.',
  },
}

export async function sendVerificationEmail({ email, name, lang }, link) {
  const c = VERIFY_COPY[lang] || VERIFY_COPY.en
  return send({
    to: email,
    subject: c.subject,
    html: shell(c.headline, `
      <p style="margin:0 0 6px;font-size:20px;font-weight:800;color:#fff;">${esc(c.hi(name))}</p>
      <p style="margin:0 0 26px;font-size:14px;color:rgba(255,255,255,0.45);line-height:1.75;">${c.body}</p>
      ${button(link, c.cta)}
      ${fallbackLink(link, c.fallback)}
      <p style="margin:22px 0 0;font-size:12px;color:rgba(255,255,255,0.28);line-height:1.7;">${c.note}</p>
    `),
  })
}

const RESET_COPY = {
  en: {
    subject: `Reset your password — ${BRAND}`,
    headline: 'Reset your password',
    hi: name => `Hi ${name},`,
    body: 'We received a request to reset your password. Choose a new one here:',
    cta: 'Choose a new password',
    fallback: 'If the button does not work, paste this link into your browser:',
    note: 'The link works for 1 hour and can be used once. If you did not ask for this, ignore this e-mail — your password stays as it is.',
  },
  ru: {
    subject: `Восстановление пароля — ${BRAND}`,
    headline: 'Восстановление пароля',
    hi: name => `Привет, ${name}!`,
    body: 'Мы получили запрос на смену пароля. Задайте новый здесь:',
    cta: 'Задать новый пароль',
    fallback: 'Если кнопка не работает, вставьте ссылку в браузер:',
    note: 'Ссылка действует 1 час и работает один раз. Если вы это не запрашивали — проигнорируйте письмо, пароль останется прежним.',
  },
  lt: {
    subject: `Slaptažodžio atkūrimas — ${BRAND}`,
    headline: 'Slaptažodžio atkūrimas',
    hi: name => `Sveiki, ${name},`,
    body: 'Gavome prašymą pakeisti slaptažodį. Naują nustatykite čia:',
    cta: 'Nustatyti naują slaptažodį',
    fallback: 'Jei mygtukas neveikia, nukopijuokite nuorodą į naršyklę:',
    note: 'Nuoroda galioja 1 valandą ir veikia vieną kartą. Jei to neprašėte, ignoruokite laišką — slaptažodis nepasikeis.',
  },
}

export async function sendPasswordResetEmail({ email, name, lang }, link) {
  const c = RESET_COPY[lang] || RESET_COPY.en
  return send({
    to: email,
    subject: c.subject,
    html: shell(c.headline, `
      <p style="margin:0 0 6px;font-size:20px;font-weight:800;color:#fff;">${esc(c.hi(name))}</p>
      <p style="margin:0 0 26px;font-size:14px;color:rgba(255,255,255,0.45);line-height:1.75;">${c.body}</p>
      ${button(link, c.cta)}
      ${fallbackLink(link, c.fallback)}
      <p style="margin:22px 0 0;font-size:12px;color:rgba(255,255,255,0.28);line-height:1.7;">${c.note}</p>
    `),
  })
}

const CHANGED_COPY = {
  en: { subject: `Your password was changed — ${BRAND}`, headline: 'Password changed',
        body: 'Your password was just changed and every device has been signed out. If this was not you, contact us immediately.' },
  ru: { subject: `Пароль изменён — ${BRAND}`, headline: 'Пароль изменён',
        body: 'Ваш пароль только что изменён, все устройства вышли из аккаунта. Если это были не вы — немедленно свяжитесь с нами.' },
  lt: { subject: `Slaptažodis pakeistas — ${BRAND}`, headline: 'Slaptažodis pakeistas',
        body: 'Jūsų slaptažodis ką tik pakeistas, iš visų įrenginių atsijungta. Jei tai buvote ne jūs, nedelsdami susisiekite su mumis.' },
}

/** Security notice — tells someone their account was taken over. */
export async function sendPasswordChangedEmail({ email, name, lang }) {
  const c = CHANGED_COPY[lang] || CHANGED_COPY.en
  return send({
    to: email,
    subject: c.subject,
    html: shell(c.headline, `
      <p style="margin:0 0 6px;font-size:20px;font-weight:800;color:#fff;">${esc(name)}</p>
      <p style="margin:0 0 22px;font-size:14px;color:rgba(255,255,255,0.45);line-height:1.75;">${c.body}</p>
      <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.5);">
        <a href="mailto:${esc(OWNER)}" style="color:#fff;">${esc(OWNER)}</a> · ${esc(PUBLIC_PHONE)}
      </p>
    `),
  })
}

/** New account notice for the studio. A registration is a lead worth knowing. */
export async function sendNewAccountNotice({ name, email, phone, lang }) {
  return send({
    to: OWNER,
    replyTo: email,
    subject: `New account — ${name}`,
    html: shell('New account', `
      <p style="margin:0 0 22px;font-size:14px;color:rgba(255,255,255,0.45);line-height:1.75;">
        Someone created an account. They have not booked yet.
      </p>
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.14);
                  border-radius:10px;padding:22px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${row('Name',     esc(name))}
          ${row('E-mail',   `<a href="mailto:${esc(email)}" style="color:#FFFFFF;">${esc(email)}</a>`)}
          ${row('Phone',    phone ? `<a href="tel:${esc(phone)}" style="color:#FFFFFF;">${esc(phone)}</a>` : '—')}
          ${row('Language', esc((lang || 'en').toUpperCase()))}
        </table>
      </div>
    `),
  })
}
