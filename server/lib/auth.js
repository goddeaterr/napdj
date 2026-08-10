/* ============================================================================
   Admin authentication.
   ----------------------------------------------------------------------------
   • Password is verified against ADMIN_PASSWORD_HASH (scrypt) when set,
     otherwise against the plain ADMIN_PASSWORD. Both comparisons are
     constant-time. If neither is configured the admin area stays locked.
   • A successful login returns a signed, expiring token (HMAC-SHA256).
     No session state is kept on the server, so it works on serverless too.
   • Login attempts are rate limited per IP.
============================================================================ */
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const HASH     = process.env.ADMIN_PASSWORD_HASH || ''
const PLAIN    = process.env.ADMIN_PASSWORD || ''
const TTL_MS   = Number(process.env.ADMIN_SESSION_HOURS || 8) * 60 * 60 * 1000

/* Signing secret. Set ADMIN_SECRET in production, otherwise tokens are only
   valid until the process restarts. */
const SECRET = process.env.ADMIN_SECRET || randomBytes(32).toString('hex')

export const adminConfigured = Boolean(HASH || PLAIN)

/* ── Password ─────────────────────────────────────────────────────────── */

function safeEqual(a, b) {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) {
    // Still compare to keep the timing profile flat.
    timingSafeEqual(bufA, bufA)
    return false
  }
  return timingSafeEqual(bufA, bufB)
}

/** Hash format: scrypt$<saltHex>$<keyHex> — produced by npm run admin:password */
export function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const key = scryptSync(password, salt, 64).toString('hex')
  return `scrypt$${salt}$${key}`
}

export function verifyPassword(password) {
  if (typeof password !== 'string' || password.length === 0) return false

  if (HASH) {
    const [scheme, salt, key] = HASH.split('$')
    if (scheme !== 'scrypt' || !salt || !key) return false
    const candidate = scryptSync(password, salt, 64).toString('hex')
    return safeEqual(candidate, key)
  }

  if (PLAIN) return safeEqual(password, PLAIN)

  return false
}

/* ── Tokens ───────────────────────────────────────────────────────────── */

function sign(payload) {
  return createHmac('sha256', SECRET).update(payload).digest('base64url')
}

export function createToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + TTL_MS })).toString('base64url')
  return `${payload}.${sign(payload)}`
}

export function verifyToken(token) {
  if (typeof token !== 'string' || !token.includes('.')) return false
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return false
  if (!safeEqual(signature, sign(payload))) return false
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    return typeof exp === 'number' && Date.now() < exp
  } catch {
    return false
  }
}

/** Reads the bearer token from a request and validates it. */
export function isAuthorised(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  return verifyToken(token)
}

/* ── Rate limiting ────────────────────────────────────────────────────── */

const WINDOW_MS   = 15 * 60 * 1000
const MAX_ATTEMPTS = 5
const attempts = new Map()   // ip -> { count, resetAt }

export function clientIp(req) {
  const fwd = req.headers?.['x-forwarded-for']
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim()
  return req.socket?.remoteAddress || req.ip || 'unknown'
}

/** Returns { allowed, retryAfterSeconds }. Call before checking the password. */
export function rateLimit(ip) {
  const now = Date.now()
  const entry = attempts.get(ip)

  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true }
  }

  entry.count++
  if (entry.count > MAX_ATTEMPTS) {
    return { allowed: false, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) }
  }
  return { allowed: true }
}

/** Clears the counter for an IP after a successful login. */
export function resetRateLimit(ip) {
  attempts.delete(ip)
}
