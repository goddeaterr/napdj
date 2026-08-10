import 'dotenv/config'
import express from 'express'
import cors    from 'cors'

import { submitBooking }                 from './lib/booking.js'
import { getAvailability }               from './lib/availability.js'
import { handleAuth }                    from './lib/accountApi.js'
import { currentUser }                   from './lib/accounts.js'
import { mailerStatus, OWNER }           from './lib/mailer.js'
import { loginHandler, bookingsHandler, studentsHandler } from './lib/adminApi.js'
import { adminConfigured, clientIp }      from './lib/auth.js'
import { storeName, storeDescription, storeIsPersistent } from './lib/store.js'

const app  = express()
const port = process.env.API_PORT || 3001

console.log('\n──────────────────────────────────────────')
console.log('  neko art platform · API')
console.log(`  Owner notifications → ${OWNER}`)
console.log(`  Resend              : ${mailerStatus.resend ? '✅ ' + mailerStatus.from : '⚠️  not configured (set RESEND_API_KEY)'}`)
console.log(`  Admin panel         : ${adminConfigured ? '✅ /admin' : '⚠️  locked (set ADMIN_PASSWORD_HASH)'}`)
console.log(`  Booking store       : ${storeName} → ${storeDescription}`)
if (!storeIsPersistent) console.log('  ⚠️  Storage is temporary here — set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY')
console.log('──────────────────────────────────────────\n')

app.use(cors({ origin: '*' }))
app.use(express.json({ limit: '64kb' }))

/* ── health ── */
app.get('/api/health', (_req, res) => res.json({
  ok:     true,
  resend:     mailerStatus.resend,
  owner:      OWNER,
  admin:      adminConfigured,
  store:      storeName,
  persistent: storeIsPersistent,
}))

/* ── student accounts ── */
app.all('/api/auth/:action', async (req, res) => {
  try {
    await handleAuth(req.params.action, req, res)
  } catch (err) {
    console.error(`  ❌ auth/${req.params.action}:`, err.message)
    if (!res.headersSent) res.status(500).json({ ok: false, error: 'server_error' })
  }
})

/* ── public availability (dates and times only) ── */
app.get('/api/availability', async (_req, res) => {
  try {
    res.json(await getAvailability())
  } catch (err) {
    console.error('  ⚠️  availability:', err.message)
    res.json({ ok: false, taken: {} })
  }
})

/* ── public booking endpoint ── */
app.post('/api/send-booking', async (req, res) => {
  const result = await submitBooking(req.body, clientIp(req), await currentUser(req))

  if (!result.ok) {
    console.error('  ❌ booking failed:', result.error, result.storageError || '')
    return res.status(result.status).json({ ok: false, error: result.error, code: result.code })
  }

  if (result.discarded) return res.json({ ok: true })

  console.log(`📬  ${result.booking.name} <${result.booking.email}> · ${result.booking.plan} · ${result.booking.dateLabel}`)
  console.log(`  ${result.stored ? `✅ stored (${storeName})` : `❌ NOT stored: ${result.warning}`}`)
  console.log(`  ${result.owner.sent  ? `✅ owner  (${result.owner.via})`  : `❌ owner: ${result.owner.error}`}`)
  console.log(`  ${result.client.sent ? `✅ client (${result.client.via})` : `⚠️  client: ${result.client.error}`}`)

  res.json({ ok: true })
})

/* ── admin (hidden panel at /admin) ── */
app.post('/api/admin/login',   loginHandler)
app.all('/api/admin/bookings', bookingsHandler)
app.all('/api/admin/students', studentsHandler)

app.listen(port, () => console.log(`🚀  http://localhost:${port}\n`))
