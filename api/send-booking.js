import { submitBooking } from '../server/lib/booking.js'
import { clientIp } from '../server/lib/auth.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }

  const result = await submitBooking(req.body, clientIp(req))

  if (!result.ok) {
    res.status(result.status).json({ ok: false, error: result.error })
    return
  }

  if (result.warning) console.error(result.warning)

  res.json({ ok: true })
}
