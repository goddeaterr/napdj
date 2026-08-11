/* ============================================================================
   Supabase store — talks to PostgREST over plain fetch, so no extra npm
   dependency is needed and it works fine inside serverless functions.

   Activated when SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are both set.
   Create the table first with supabase/schema.sql.

   The service role key bypasses row level security — it must only ever live
   in server environment variables, never in the frontend.
============================================================================ */
const URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '')
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const TABLE = process.env.SUPABASE_TABLE || 'bookings'
const ENDPOINT = `${URL}/rest/v1/${TABLE}`

export const name = 'supabase'
export const description = `${URL}/rest/v1/${TABLE}`

const headers = (extra = {}) => ({
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
  ...extra,
})

async function request(url, options = {}) {
  const res = await fetch(url, options)
  const text = await res.text()

  if (!res.ok) {
    let detail = text
    try { detail = JSON.parse(text).message || text } catch { /* keep raw text */ }
    throw new Error(`Supabase ${res.status}: ${detail}`)
  }

  return text ? JSON.parse(text) : null
}

/* ── Column mapping (app camelCase ⇄ Postgres snake_case) ─────────────── */

function toRow(booking) {
  const row = {
    status:        booking.status,
    name:          booking.name,
    email:         booking.email,
    phone:         booking.phone || null,
    plan:          booking.plan,
    genre:         booking.genre || null,
    session_date:  booking.date || null,
    session_time:  booking.time || null,
    no_preference: Boolean(booking.noPreference),
    date_label:    booking.dateLabel || null,
    message:       booking.message || null,
    lang:          booking.lang || null,
    consent:       Boolean(booking.consent),
    note:          booking.note ?? null,
    delivery:      booking.delivery ?? null,
    user_id:       booking.userId ?? null,
  }
  // Drop undefined so PostgREST applies column defaults.
  Object.keys(row).forEach(k => row[k] === undefined && delete row[k])
  return row
}

function fromRow(row) {
  return {
    id:           row.id,
    createdAt:    row.created_at,
    updatedAt:    row.updated_at ?? undefined,
    status:       row.status,
    name:         row.name,
    email:        row.email,
    phone:        row.phone ?? '',
    plan:         row.plan,
    genre:        row.genre ?? '',
    date:         row.session_date ?? null,
    time:         row.session_time ?? '',
    noPreference: row.no_preference ?? false,
    dateLabel:    row.date_label ?? '',
    message:      row.message ?? '',
    lang:         row.lang ?? 'en',
    consent:      row.consent ?? false,
    note:         row.note ?? undefined,
    delivery:     row.delivery ?? undefined,
    userId:       row.user_id ?? null,
  }
}

/* ── Operations ───────────────────────────────────────────────────────── */

export async function listBookings() {
  const rows = await request(`${ENDPOINT}?select=*&order=created_at.desc`, {
    headers: headers(),
  })
  return (rows || []).map(fromRow)
}

/**
 * Slots that are already spoken for, from `fromDate` onwards.
 * Selects only the two date columns — no personal data ever leaves the
 * database for this query, because it feeds a public endpoint.
 */
export async function listTakenSlots(fromDate) {
  const query = [
    'select=session_date,session_time',
    'status=neq.cancelled',
    'session_time=not.is.null',
    `session_date=gte.${encodeURIComponent(fromDate)}`,
  ].join('&')

  const rows = await request(`${ENDPOINT}?${query}`, { headers: headers() })
  return (rows || [])
    .filter(r => r.session_date && r.session_time)
    .map(r => ({ date: r.session_date, time: r.session_time }))
}

export async function addBooking(data) {
  const rows = await request(ENDPOINT, {
    method: 'POST',
    headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify(toRow({ status: 'new', ...data })),
  })
  return fromRow(rows[0])
}

export async function updateBooking(id, patch) {
  const row = {}
  if (patch.status !== undefined) row.status = patch.status
  if (patch.note   !== undefined) row.note   = patch.note
  row.updated_at = new Date().toISOString()

  const rows = await request(`${ENDPOINT}?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify(row),
  })
  return rows?.length ? fromRow(rows[0]) : null
}

export async function markNotified(id, delivery) {
  const rows = await request(`${ENDPOINT}?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify({ delivery }),
  })
  return rows?.length ? fromRow(rows[0]) : null
}

export async function deleteBooking(id) {
  const rows = await request(`${ENDPOINT}?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: headers({ Prefer: 'return=representation' }),
  })
  return Boolean(rows?.length)
}

/* ══════════════════════════════════════════════════════════════════════════
   Accounts
══════════════════════════════════════════════════════════════════════════ */

const USERS  = `${URL}/rest/v1/users`
const TOKENS = `${URL}/rest/v1/auth_tokens`
const LEDGER = `${URL}/rest/v1/lesson_entries`

const lower = e => String(e || '').trim().toLowerCase()
const one   = rows => (rows?.length ? rows[0] : null)

function userFromRow(r) {
  if (!r) return null
  return {
    id:            r.id,
    createdAt:     r.created_at,
    email:         r.email,
    passwordHash:  r.password_hash,
    name:          r.name,
    phone:         r.phone ?? '',
    lang:          r.lang ?? 'en',
    emailVerified: r.email_verified ?? false,
    tokenVersion:  r.token_version ?? 1,
    failedLogins:  r.failed_logins ?? 0,
    lockedUntil:   r.locked_until ?? null,
    lastLoginAt:   r.last_login_at ?? null,
  }
}

function userToRow(u) {
  const row = {
    email:          u.email !== undefined ? lower(u.email) : undefined,
    password_hash:  u.passwordHash,
    name:           u.name,
    phone:          u.phone,
    lang:           u.lang,
    email_verified: u.emailVerified,
    token_version:  u.tokenVersion,
    failed_logins:  u.failedLogins,
    locked_until:   u.lockedUntil,
    last_login_at:  u.lastLoginAt,
  }
  Object.keys(row).forEach(k => row[k] === undefined && delete row[k])
  return row
}

export async function createUser(data) {
  const rows = await request(USERS, {
    method: 'POST',
    headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify(userToRow({ ...data, emailVerified: false, tokenVersion: 1, failedLogins: 0 })),
  })
  return userFromRow(one(rows))
}

export async function findUserByEmail(email) {
  const rows = await request(`${USERS}?select=*&email=eq.${encodeURIComponent(lower(email))}&limit=1`, { headers: headers() })
  return userFromRow(one(rows))
}

export async function findUserById(id) {
  const rows = await request(`${USERS}?select=*&id=eq.${encodeURIComponent(id)}&limit=1`, { headers: headers() })
  return userFromRow(one(rows))
}

export async function updateUser(id, patch) {
  const rows = await request(`${USERS}?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify(userToRow(patch)),
  })
  return userFromRow(one(rows))
}

export async function listUsers() {
  const rows = await request(`${USERS}?select=*&order=created_at.desc`, { headers: headers() })
  return (rows || []).map(userFromRow)
}

export async function deleteUser(id) {
  const rows = await request(`${USERS}?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: headers({ Prefer: 'return=representation' }),
  })
  return Boolean(rows?.length)
}

/* ── One-time e-mail tokens ─────────────────────────────────────────────── */

const tokenFromRow = r => r && ({
  id: r.id, userId: r.user_id, kind: r.kind, tokenHash: r.token_hash,
  expiresAt: r.expires_at, usedAt: r.used_at ?? null, createdAt: r.created_at,
})

export async function createAuthToken({ userId, kind, tokenHash, expiresAt }) {
  const rows = await request(TOKENS, {
    method: 'POST',
    headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify({ user_id: userId, kind, token_hash: tokenHash, expires_at: expiresAt }),
  })
  return tokenFromRow(one(rows))
}

export async function findAuthToken(kind, tokenHash) {
  const rows = await request(
    `${TOKENS}?select=*&kind=eq.${encodeURIComponent(kind)}&token_hash=eq.${encodeURIComponent(tokenHash)}&limit=1`,
    { headers: headers() },
  )
  return tokenFromRow(one(rows))
}

export async function useAuthToken(id) {
  const rows = await request(`${TOKENS}?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify({ used_at: new Date().toISOString() }),
  })
  return tokenFromRow(one(rows))
}

export async function deleteAuthTokens(userId, kind) {
  await request(`${TOKENS}?user_id=eq.${encodeURIComponent(userId)}&kind=eq.${encodeURIComponent(kind)}`, {
    method: 'DELETE',
    headers: headers(),
  })
}

/* ── Lesson ledger ──────────────────────────────────────────────────────── */

const entryFromRow = r => ({
  id: r.id, userId: r.user_id, delta: r.delta, kind: r.kind,
  note: r.note ?? '', createdBy: r.created_by ?? '', createdAt: r.created_at,
})

export async function addLessonEntry({ userId, delta, kind, note, createdBy }) {
  const rows = await request(LEDGER, {
    method: 'POST',
    headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify({ user_id: userId, delta, kind, note: note || null, created_by: createdBy || null }),
  })
  return entryFromRow(one(rows))
}

export async function listLessonEntries(userId) {
  const rows = await request(
    `${LEDGER}?select=*&user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc`,
    { headers: headers() },
  )
  return (rows || []).map(entryFromRow)
}

export async function lessonBalances() {
  const rows = await request(`${LEDGER}?select=user_id,delta`, { headers: headers() })
  const totals = {}
  for (const r of rows || []) totals[r.user_id] = (totals[r.user_id] || 0) + Number(r.delta || 0)
  return totals
}

export async function deleteLessonEntry(id) {
  const rows = await request(`${LEDGER}?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: headers({ Prefer: 'return=representation' }),
  })
  return Boolean(rows?.length)
}

export async function listBookingsForUser(userId) {
  const rows = await request(
    `${ENDPOINT}?select=*&user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc`,
    { headers: headers() },
  )
  return (rows || []).map(fromRow)
}

/* ── Rate limiting ─────────────────────────────────────────────────────── */

export async function bumpRateLimit(key, windowMs) {
  const count = await request(`${URL}/rest/v1/rpc/bump_rate_limit`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ k: key, window_seconds: Math.round(windowMs / 1000) }),
  })
  return Number(count) || 1
}

export async function clearRateLimit(key) {
  await request(`${URL}/rest/v1/rate_limits?key=eq.${encodeURIComponent(key)}`, {
    method: 'DELETE', headers: headers(),
  })
}
