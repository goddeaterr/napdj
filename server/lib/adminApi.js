/* ============================================================================
   Admin API handlers — written against the plain (req, res) signature so the
   same code serves both Express and Vercel functions.
============================================================================ */
import {
  listBookings, updateBooking, deleteBooking,
  listUsers, deleteUser, lessonBalances, listLessonEntries, listBookingsForUser,
} from './store.js'
import { adjustLessons } from './accounts.js'
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

/* ══════════════════════════════════════════════════════════════════════════
   GET    /api/admin/students            → every account with its balance
   POST   /api/admin/students            → { userId, delta, kind, note }
   DELETE /api/admin/students?id=<uuid>  → remove an account
══════════════════════════════════════════════════════════════════════════ */
export async function studentsHandler(req, res) {
  noStore(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (!isAuthorised(req)) return res.status(401).json({ ok: false, error: 'Not authorised' })

  if (req.method === 'GET') {
    const [users, balances] = await Promise.all([listUsers(), lessonBalances()])
    const rows = await Promise.all(users.map(async u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone ?? '',
      lang: u.lang ?? 'en',
      emailVerified: Boolean(u.emailVerified),
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt ?? null,
      balance: balances[u.id] || 0,
      lessons: await listLessonEntries(u.id),
      bookings: (await listBookingsForUser(u.id)).map(b => ({
        id: b.id, status: b.status, plan: b.plan,
        date: b.date, time: b.time, dateLabel: b.dateLabel, createdAt: b.createdAt,
      })),
    })))
    return res.json({ ok: true, students: rows })
  }

  if (req.method === 'POST') {
    const { userId, delta, kind, note } = req.body || {}
    const result = await adjustLessons({ userId, delta, kind, note, createdBy: 'admin' })
    if (!result.ok) return res.status(result.status).json({ ok: false, error: result.error })
    return res.json({ ok: true, balance: result.balance })
  }

  if (req.method === 'DELETE') {
    const id = req.query?.id || req.body?.id
    if (!id) return res.status(400).json({ ok: false, error: 'Missing id' })
    // Deleting the account cascades to its lessons and tokens; bookings are
    // kept but unlinked, so the studio does not lose its own records.
    const removed = await deleteUser(String(id))
    if (!removed) return res.status(404).json({ ok: false, error: 'Not found' })
    return res.json({ ok: true })
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' })
}
