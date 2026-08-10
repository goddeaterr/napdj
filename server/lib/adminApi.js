/* ============================================================================
   Admin API handlers — written against the plain (req, res) signature so the
   same code serves both Express and Vercel functions.
============================================================================ */
import { listBookings, updateBooking, deleteBooking } from './store.js'
import {
  adminConfigured, verifyPassword, createToken, isAuthorised,
  rateLimit, resetRateLimit, clientIp,
} from './auth.js'

const VALID_STATUS = ['new', 'contacted', 'confirmed', 'done', 'cancelled']

function noStore(res) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Robots-Tag', 'noindex, nofollow')
}

/* POST /api/admin/login  { password } → { ok, token } */
export async function loginHandler(req, res) {
  noStore(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })

  if (!adminConfigured) {
    return res.status(503).json({
      ok: false,
      error: 'Admin access is not configured. Set ADMIN_PASSWORD_HASH (or ADMIN_PASSWORD) in .env',
    })
  }

  const ip = clientIp(req)
  const limit = rateLimit(ip)
  if (!limit.allowed) {
    res.setHeader('Retry-After', String(limit.retryAfterSeconds))
    return res.status(429).json({ ok: false, error: 'Too many attempts. Try again later.' })
  }

  const password = req.body?.password
  if (!verifyPassword(password)) {
    return res.status(401).json({ ok: false, error: 'Wrong password' })
  }

  resetRateLimit(ip)
  return res.status(200).json({ ok: true, token: createToken() })
}

/* /api/admin/bookings
   GET               → { ok, bookings }
   PATCH ?id=…       → { ok, booking }   body: { status?, note? }
   DELETE ?id=…      → { ok } */
export async function bookingsHandler(req, res) {
  noStore(res)
  if (req.method === 'OPTIONS') return res.status(204).end()

  if (!isAuthorised(req)) {
    return res.status(401).json({ ok: false, error: 'Not authorised' })
  }

  if (req.method === 'GET') {
    const bookings = await listBookings()
    return res.status(200).json({ ok: true, bookings })
  }

  const id = req.query?.id || req.body?.id
  if (!id) return res.status(400).json({ ok: false, error: 'Missing booking id' })

  if (req.method === 'PATCH') {
    const patch = {}
    if (req.body?.status !== undefined) {
      if (!VALID_STATUS.includes(req.body.status)) {
        return res.status(400).json({ ok: false, error: 'Unknown status' })
      }
      patch.status = req.body.status
    }
    if (typeof req.body?.note === 'string') patch.note = req.body.note

    const booking = await updateBooking(id, patch)
    if (!booking) return res.status(404).json({ ok: false, error: 'Booking not found' })
    return res.status(200).json({ ok: true, booking })
  }

  if (req.method === 'DELETE') {
    const removed = await deleteBooking(id)
    if (!removed) return res.status(404).json({ ok: false, error: 'Booking not found' })
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' })
}

export { VALID_STATUS }
