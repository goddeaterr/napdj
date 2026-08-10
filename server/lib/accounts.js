/* ============================================================================
   Account operations: register, verify, sign in, password recovery.

   Every response here is deliberately vague about whether an e-mail address is
   registered. "Sign in failed", "if that address has an account we sent a
   link" — an attacker must not be able to use this site to find out who is a
   customer. The e-mail itself tells the real owner what actually happened.
============================================================================ */
import {
  createUser, findUserByEmail, findUserById, updateUser,
  createAuthToken, findAuthToken, useAuthToken, deleteAuthTokens,
  addLessonEntry, listLessonEntries, lessonBalances, listBookingsForUser,
} from './store.js'
import {
  hashPassword, checkPassword, passwordProblem,
  createEmailToken, hashToken,
  createSession, readSession,
  throttle, clearThrottle,
  isLocked, MAX_FAILED_LOGINS, LOCKOUT_MS,
  VERIFY_TTL_MS, RESET_TTL_MS,
  EMAIL_RE, normaliseEmail, cleanName,
  parseCookies, SESSION_COOKIE,
} from './accountAuth.js'
import {
  sendVerificationEmail, sendPasswordResetEmail, sendPasswordChangedEmail,
} from './mailer.js'

const SITE_URL = (process.env.PUBLIC_SITE_URL || 'https://napdj.com').replace(/\/+$/, '')

const verifyLink = token => `${SITE_URL}/verify?token=${encodeURIComponent(token)}`
const resetLink  = token => `${SITE_URL}/reset?token=${encodeURIComponent(token)}`

/** What the browser is allowed to see. Never includes the password hash. */
export function publicUser(user) {
  if (!user) return null
  return {
    id:            user.id,
    email:         user.email,
    name:          user.name,
    phone:         user.phone ?? '',
    lang:          user.lang ?? 'en',
    emailVerified: Boolean(user.emailVerified),
    createdAt:     user.createdAt,
  }
}

/* ── Registration ─────────────────────────────────────────────────────── */

export async function register({ name, email, password, phone, lang, consent }, ip) {
  const limit = throttle(`register:${ip}`, { max: 5, windowMs: 60 * 60 * 1000 })
  if (!limit.allowed) return { ok: false, status: 429, error: 'too_many_requests' }

  const cleanEmail = normaliseEmail(email)
  const fullName   = cleanName(name)

  if (!fullName)                return { ok: false, status: 400, error: 'name_required' }
  if (!EMAIL_RE.test(cleanEmail)) return { ok: false, status: 400, error: 'email_invalid' }
  if (!consent)                 return { ok: false, status: 400, error: 'consent_required' }

  const weak = passwordProblem(password)
  if (weak) return { ok: false, status: 400, error: `password_${weak}` }

  const existing = await findUserByEmail(cleanEmail)

  if (existing) {
    // Same answer as a fresh signup, so this endpoint cannot be used to test
    // which addresses are registered. The e-mail explains what really happened.
    if (!existing.emailVerified) await issueVerification(existing)
    return { ok: true, status: 200, created: false }
  }

  const user = await createUser({
    email:        cleanEmail,
    passwordHash: hashPassword(password),
    name:         fullName,
    phone:        String(phone || '').trim().slice(0, 40),
    lang:         ['en', 'ru', 'lt'].includes(lang) ? lang : 'en',
  })

  await issueVerification(user)
  return { ok: true, status: 201, created: true }
}

async function issueVerification(user) {
  await deleteAuthTokens(user.id, 'verify')
  const { token, tokenHash } = createEmailToken()
  await createAuthToken({
    userId: user.id,
    kind: 'verify',
    tokenHash,
    expiresAt: new Date(Date.now() + VERIFY_TTL_MS).toISOString(),
  })
  return sendVerificationEmail(user, verifyLink(token))
}

export async function resendVerification(email, ip) {
  const limit = throttle(`resend:${ip}`, { max: 5, windowMs: 60 * 60 * 1000 })
  if (!limit.allowed) return { ok: false, status: 429, error: 'too_many_requests' }

  const user = await findUserByEmail(normaliseEmail(email))
  if (user && !user.emailVerified) await issueVerification(user)
  return { ok: true, status: 200 }   // same answer either way
}

export async function verifyEmail(token) {
  const record = await findAuthToken('verify', hashToken(token || ''))
  if (!record || record.usedAt) return { ok: false, status: 400, error: 'link_invalid' }
  if (new Date(record.expiresAt).getTime() < Date.now()) {
    return { ok: false, status: 400, error: 'link_expired' }
  }

  await useAuthToken(record.id)
  const user = await updateUser(record.userId, { emailVerified: true })
  if (!user) return { ok: false, status: 400, error: 'link_invalid' }

  // Signing them in here is safe: they just proved they control the inbox.
  return { ok: true, status: 200, user: publicUser(user), session: createSession(user) }
}

/* ── Sign in ──────────────────────────────────────────────────────────── */

export async function login({ email, password }, ip) {
  const cleanEmail = normaliseEmail(email)

  const byIp = throttle(`login-ip:${ip}`, { max: 20, windowMs: 15 * 60 * 1000 })
  if (!byIp.allowed) return { ok: false, status: 429, error: 'too_many_requests' }

  const byAccount = throttle(`login-acct:${cleanEmail}`, { max: 10, windowMs: 15 * 60 * 1000 })
  if (!byAccount.allowed) return { ok: false, status: 429, error: 'too_many_requests' }

  const user = await findUserByEmail(cleanEmail)

  if (!user) {
    // Spend roughly the same time as a real check so response timing does not
    // reveal whether the address exists.
    hashPassword(String(password || 'x'))
    return { ok: false, status: 401, error: 'invalid_credentials' }
  }

  if (isLocked(user)) {
    return { ok: false, status: 423, error: 'account_locked' }
  }

  if (!checkPassword(password, user.passwordHash)) {
    const failed = (user.failedLogins || 0) + 1
    await updateUser(user.id, {
      failedLogins: failed,
      lockedUntil: failed >= MAX_FAILED_LOGINS
        ? new Date(Date.now() + LOCKOUT_MS).toISOString()
        : null,
    })
    return { ok: false, status: 401, error: 'invalid_credentials' }
  }

  const fresh = await updateUser(user.id, {
    failedLogins: 0,
    lockedUntil: null,
    lastLoginAt: new Date().toISOString(),
  }) || user

  clearThrottle(`login-acct:${cleanEmail}`)

  return { ok: true, status: 200, user: publicUser(fresh), session: createSession(fresh) }
}

/* ── Password recovery ────────────────────────────────────────────────── */

export async function requestPasswordReset(email, ip) {
  const limit = throttle(`reset-req:${ip}`, { max: 5, windowMs: 60 * 60 * 1000 })
  if (!limit.allowed) return { ok: false, status: 429, error: 'too_many_requests' }

  const user = await findUserByEmail(normaliseEmail(email))

  if (user) {
    await deleteAuthTokens(user.id, 'reset')
    const { token, tokenHash } = createEmailToken()
    await createAuthToken({
      userId: user.id,
      kind: 'reset',
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TTL_MS).toISOString(),
    })
    await sendPasswordResetEmail(user, resetLink(token))
  }

  // Identical answer whether or not the address is registered.
  return { ok: true, status: 200 }
}

export async function resetPassword({ token, password }) {
  const weak = passwordProblem(password)
  if (weak) return { ok: false, status: 400, error: `password_${weak}` }

  const record = await findAuthToken('reset', hashToken(token || ''))
  if (!record || record.usedAt) return { ok: false, status: 400, error: 'link_invalid' }
  if (new Date(record.expiresAt).getTime() < Date.now()) {
    return { ok: false, status: 400, error: 'link_expired' }
  }

  const user = await findUserById(record.userId)
  if (!user) return { ok: false, status: 400, error: 'link_invalid' }

  await useAuthToken(record.id)
  await deleteAuthTokens(user.id, 'reset')

  const updated = await updateUser(user.id, {
    passwordHash: hashPassword(password),
    // Invalidates every session issued before this moment, everywhere.
    tokenVersion: (user.tokenVersion || 1) + 1,
    failedLogins: 0,
    lockedUntil: null,
    // Reaching the inbox proves the address works.
    emailVerified: true,
  })

  // Someone who forgot their password has usually just burned the sign-in
  // limit guessing. Proving control of the inbox clears it, otherwise they
  // would be locked out of the account they just recovered.
  clearThrottle(`login-acct:${user.email}`)

  sendPasswordChangedEmail(updated).catch(() => {})

  return { ok: true, status: 200, user: publicUser(updated), session: createSession(updated) }
}

/* ── Reading the current account ──────────────────────────────────────── */

/** Resolves the signed-in account from the session cookie, or null. */
export async function currentUser(req) {
  const token = parseCookies(req)[SESSION_COOKIE]
  const claims = readSession(token)
  if (!claims) return null

  const user = await findUserById(claims.uid)
  if (!user) return null

  // A password change bumps token_version, retiring older sessions.
  if ((user.tokenVersion || 1) !== claims.ver) return null

  return user
}

/* ── Lessons ──────────────────────────────────────────────────────────── */

export async function lessonBalance(userId) {
  const totals = await lessonBalances()
  return totals[userId] || 0
}

/** Everything the student dashboard needs, in one call. */
export async function accountOverview(user) {
  const [entries, bookings, balance] = await Promise.all([
    listLessonEntries(user.id),
    listBookingsForUser(user.id),
    lessonBalance(user.id),
  ])

  return {
    user: publicUser(user),
    balance,
    lessons: entries,
    bookings: bookings.map(b => ({
      id: b.id, createdAt: b.createdAt, status: b.status, plan: b.plan,
      genre: b.genre, date: b.date, time: b.time,
      noPreference: b.noPreference, dateLabel: b.dateLabel, message: b.message,
    })),
  }
}

/** Admin action — grant or remove lessons. Returns the new balance. */
export async function adjustLessons({ userId, delta, kind, note, createdBy }) {
  const amount = Math.trunc(Number(delta))
  if (!Number.isFinite(amount) || amount === 0) return { ok: false, status: 400, error: 'delta_invalid' }
  if (Math.abs(amount) > 500) return { ok: false, status: 400, error: 'delta_too_large' }

  const user = await findUserById(userId)
  if (!user) return { ok: false, status: 404, error: 'user_not_found' }

  const allowed = ['purchase', 'free', 'used', 'adjustment']
  await addLessonEntry({
    userId,
    delta: amount,
    kind: allowed.includes(kind) ? kind : 'adjustment',
    note: String(note || '').slice(0, 500),
    createdBy: createdBy || 'admin',
  })

  return { ok: true, status: 200, balance: await lessonBalance(userId) }
}
