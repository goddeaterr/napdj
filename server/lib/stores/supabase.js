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
