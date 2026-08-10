/* ============================================================================
   Student account security.
   ----------------------------------------------------------------------------
   Decisions worth knowing about:

   • Passwords are hashed with scrypt and a per-user random salt. The plain
     password is never stored, logged, or put in an e-mail.
   • Sessions are stateless HMAC-signed tokens carrying { uid, ver, exp }, so
     they work on serverless. `ver` is checked against the account's
     token_version, which is bumped on password change — that instantly kills
     every session issued before, everywhere.
   • The session travels in an httpOnly, SameSite=Lax, Secure cookie so page
     scripts cannot read it. That is the main defence if an XSS ever lands.
   • Verification and reset links are 32 random bytes. Only their SHA-256 hash
     is stored, so a database leak cannot be replayed into an account takeover.
     They are single use and expire.
   • Sign-in is rate limited per IP *and* per account, and the account locks
     temporarily after repeated failures.
   • Nothing anywhere reveals whether an e-mail address is registered.
============================================================================ */
import {
  createHmac, createHash, randomBytes, scryptSync, timingSafeEqual,
} from 'node:crypto'

const SECRET = process.env.AUTH_SECRET
  || process.env.ADMIN_SECRET
  || randomBytes(32).toString('hex')

export const SESSION_COOKIE = 'nap_session'
const SESSION_DAYS   = Number(process.env.SESSION_DAYS || 30)
const SESSION_MS     = SESSION_DAYS * 24 * 60 * 60 * 1000

export const VERIFY_TTL_MS = 24 * 60 * 60 * 1000   // 24 hours
export const RESET_TTL_MS  = 60 * 60 * 1000        // 1 hour

/* ── Constant-time helpers ────────────────────────────────────────────── */

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a))
  const bufB = Buffer.from(String(b))
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, bufA)      // keep the timing profile flat
    return false
  }
  return timingSafeEqual(bufA, bufB)
}

/* ── Passwords ────────────────────────────────────────────────────────── */

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString('hex')}`
}

export function checkPassword(password, stored) {
  if (typeof password !== 'string' || typeof stored !== 'string') return false
  const [scheme, salt, key] = stored.split('$')
  if (scheme !== 'scrypt' || !salt || !key) return false
  return safeEqual(scryptSync(password, salt, 64).toString('hex'), key)
}

/**
 * Password rules. Deliberately length-first: a long passphrase beats a short
 * password full of symbols, and fussy rules push people towards "Passw0rd!".
 */
export function passwordProblem(password) {
  if (typeof password !== 'string' || password.length < 8) return 'too_short'
  if (password.length > 200) return 'too_long'
  const weak = [
    'password', '12345678', 'qwerty123', 'password1', '11111111',
    'iloveyou', 'admin123', 'letmein1', 'welcome1', 'abc12345',
  ]
  if (weak.includes(password.toLowerCase())) return 'too_common'
  return null
}

/* ── One-time e-mail tokens ───────────────────────────────────────────── */

/** Returns { token, tokenHash }. Only the hash is ever stored. */
export function createEmailToken() {
  const token = randomBytes(32).toString('base64url')
  return { token, tokenHash: hashToken(token) }
}

export const hashToken = token =>
  createHash('sha256').update(String(token)).digest('hex')

/* ── Session tokens ───────────────────────────────────────────────────── */

const sign = payload => createHmac('sha256', SECRET).update(payload).digest('base64url')

export function createSession(user) {
  const payload = Buffer.from(JSON.stringify({
    uid: user.id,
    ver: user.tokenVersion ?? 1,
    exp: Date.now() + SESSION_MS,
  })).toString('base64url')
  return `${payload}.${sign(payload)}`
}

/** Returns { uid, ver } or null. Signature and expiry only — no database hit. */
export function readSession(token) {
  if (typeof token !== 'string' || !token.includes('.')) return null
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null
  if (!safeEqual(signature, sign(payload))) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (typeof data.exp !== 'number' || Date.now() >= data.exp) return null
    return { uid: data.uid, ver: data.ver }
  } catch {
    return null
  }
}

/* ── Cookies ──────────────────────────────────────────────────────────── */

export function parseCookies(req) {
  const raw = req.headers?.cookie || ''
  const out = {}
  for (const part of raw.split(';')) {
    const i = part.indexOf('=')
    if (i === -1) continue
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim())
  }
  return out
}

const isProd = () => process.env.VERCEL || process.env.NODE_ENV === 'production'

export function sessionCookie(token) {
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.floor(SESSION_MS / 1000)}`,
  ]
  if (isProd()) parts.push('Secure')
  return parts.join('; ')
}

export function clearCookie() {
  const parts = [`${SESSION_COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0']
  if (isProd()) parts.push('Secure')
  return parts.join('; ')
}

/* ── Rate limiting ────────────────────────────────────────────────────── */

const buckets = new Map()

/**
 * Sliding counter keyed by whatever you pass — an IP, an e-mail, or both.
 * In-memory, so on serverless it is per instance. It blunts automated abuse;
 * the per-account lockout below is what actually protects a single account.
 */
export function throttle(key, { max = 10, windowMs = 15 * 60 * 1000 } = {}) {
  const now = Date.now()
  const entry = buckets.get(key)

  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true }
  }

  entry.count++
  if (entry.count > max) {
    return { allowed: false, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) }
  }
  return { allowed: true }
}

export function clearThrottle(key) {
  buckets.delete(key)
}

/* ── Account lockout ──────────────────────────────────────────────────── */

export const MAX_FAILED_LOGINS = 8
export const LOCKOUT_MS = 15 * 60 * 1000

export function isLocked(user) {
  return Boolean(user?.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now())
}

/* ── Validation ───────────────────────────────────────────────────────── */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const normaliseEmail = email => String(email || '').trim().toLowerCase()

export function cleanName(name) {
  return String(name || '').trim().replace(/\s+/g, ' ').slice(0, 120)
}
