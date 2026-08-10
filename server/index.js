import 'dotenv/config'
import express from 'express'
import cors    from 'cors'

import { submitBooking }                 from './lib/booking.js'
import { mailerStatus, OWNER }           from './lib/mailer.js'
import { loginHandler, bookingsHandler } from './lib/adminApi.js'
import { adminConfigured }               from './lib/auth.js'
import { STORE_PATH }                    from './lib/store.js'

const app  = express()
const port = process.env.API_PORT || 3001

console.log('\n──────────────────────────────────────────')
console.log('  neko art platform · API')
console.log(`  Owner notifications → ${OWNER}`)
console.log(`  Resend              : ${mailerStatus.resend ? '✅ ' + mailerStatus.from : '⚠️  not configured (set RESEND_API_KEY)'}`)
console.log(`  Admin panel         : ${adminConfigured ? '✅ /admin' : '⚠️  locked (set ADMIN_PASSWORD_HASH)'}`)
console.log(`  Bookings file       : ${STORE_PATH}`)
console.log('──────────────────────────────────────────\n')

app.use(cors({ origin: '*' }))
app.use(express.json({ limit: '64kb' }))

/* ── health ── */
app.get('/api/health', (_req, res) => res.json({
  ok:     true,
  resend: mailerStatus.resend,
  owner:  OWNER,
  admin:  adminConfigured,
}))

/* ── public booking endpoint ── */
app.post('/api/send-booking', async (req, res) => {
  const result = await submitBooking(req.body)

  if (!result.ok) {
    console.error('  ❌ booking rejected:', result.error)
    return res.status(result.status).json({ ok: false, error: result.error })
  }

  console.log(`📬  ${result.booking.name} <${result.booking.email}> · ${result.booking.plan} · ${result.booking.dateLabel}`)
  console.log(`  ${result.owner.sent  ? `✅ owner  (${result.owner.via})`  : `❌ owner: ${result.owner.error}`}`)
  console.log(`  ${result.client.sent ? `✅ client (${result.client.via})` : `⚠️  client: ${result.client.error}`}`)

  res.json({ ok: true })
})

/* ── admin (hidden panel at /admin) ── */
app.post('/api/admin/login',   loginHandler)
app.all('/api/admin/bookings', bookingsHandler)

app.listen(port, () => console.log(`🚀  http://localhost:${port}\n`))
