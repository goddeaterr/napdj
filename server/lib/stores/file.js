/* ============================================================================
   File store — JSON file with atomic writes. Used for local development and
   for self-hosted Node deployments where the filesystem persists.
============================================================================ */
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import path from 'node:path'

const DATA_DIR = process.env.DATA_DIR
  || (process.env.VERCEL ? '/tmp/nap-data' : path.join(process.cwd(), 'data'))

const FILE = path.join(DATA_DIR, 'bookings.json')

/** Serialises writes so two requests arriving together cannot clobber each other. */
let queue = Promise.resolve()

async function readFrom(file) {
  try {
    const parsed = JSON.parse(await readFile(file, 'utf8'))
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function writeTo(file, rows) {
  await mkdir(DATA_DIR, { recursive: true })
  const tmp = `${file}.${process.pid}.tmp`
  await writeFile(tmp, JSON.stringify(rows, null, 2), 'utf8')
  await rename(tmp, file)
}

const readAll  = () => readFrom(FILE)
const writeAll = rows => writeTo(FILE, rows)

function run(task) {
  queue = queue.then(task, task)
  return queue
}

/* ── Generic collection helper, used by the account tables ─────────────── */
function collection(fileName) {
  const file = path.join(DATA_DIR, fileName)
  return {
    all:    () => readFrom(file),
    save:   rows => writeTo(file, rows),
    insert: row => run(async () => {
      const rows = await readFrom(file)
      const created = { id: randomUUID(), createdAt: new Date().toISOString(), ...row }
      rows.push(created)
      await writeTo(file, rows)
      return created
    }),
    patch: (id, changes) => run(async () => {
      const rows = await readFrom(file)
      const i = rows.findIndex(r => r.id === id)
      if (i === -1) return null
      rows[i] = { ...rows[i], ...changes }
      await writeTo(file, rows)
      return rows[i]
    }),
    remove: id => run(async () => {
      const rows = await readFrom(file)
      const next = rows.filter(r => r.id !== id)
      if (next.length === rows.length) return false
      await writeTo(file, next)
      return true
    }),
  }
}

const usersCol  = collection('users.json')
const tokensCol = collection('auth-tokens.json')
const ledgerCol = collection('lesson-entries.json')

export const name = 'file'
export const description = FILE

export async function listBookings() {
  const rows = await readAll()
  return rows.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
}

/**
 * Slots that are already spoken for, from `fromDate` onwards.
 * Returns only { date, time } — never any personal data, because this feeds a
 * public endpoint.
 */
export async function listTakenSlots(fromDate) {
  const rows = await readAll()
  return rows
    .filter(r => r.status !== 'cancelled' && r.date && r.time && r.date >= fromDate)
    .map(r => ({ date: r.date, time: r.time }))
}

export async function addBooking(data) {
  return run(async () => {
    const rows = await readAll()
    const booking = {
      id:        randomUUID(),
      createdAt: new Date().toISOString(),
      status:    'new',
      ...data,
    }
    rows.push(booking)
    await writeAll(rows)
    return booking
  })
}

export async function updateBooking(id, patch) {
  return run(async () => {
    const rows = await readAll()
    const i = rows.findIndex(r => r.id === id)
    if (i === -1) return null
    rows[i] = { ...rows[i], ...patch, updatedAt: new Date().toISOString() }
    await writeAll(rows)
    return rows[i]
  })
}

export async function markNotified(id, delivery) {
  return run(async () => {
    const rows = await readAll()
    const i = rows.findIndex(r => r.id === id)
    if (i === -1) return null
    rows[i] = { ...rows[i], delivery }
    await writeAll(rows)
    return rows[i]
  })
}

export async function deleteBooking(id) {
  return run(async () => {
    const rows = await readAll()
    const next = rows.filter(r => r.id !== id)
    if (next.length === rows.length) return false
    await writeAll(next)
    return true
  })
}

/* ══════════════════════════════════════════════════════════════════════════
   Accounts
══════════════════════════════════════════════════════════════════════════ */

const lower = e => String(e || '').trim().toLowerCase()

export async function createUser(data) {
  return usersCol.insert({
    ...data,
    email:         lower(data.email),
    emailVerified: false,
    tokenVersion:  1,
    failedLogins:  0,
    lockedUntil:   null,
    lastLoginAt:   null,
  })
}

export async function findUserByEmail(email) {
  const rows = await usersCol.all()
  return rows.find(u => lower(u.email) === lower(email)) ?? null
}

export async function findUserById(id) {
  const rows = await usersCol.all()
  return rows.find(u => u.id === id) ?? null
}

export const updateUser = (id, patch) => usersCol.patch(id, patch)

export async function listUsers() {
  const rows = await usersCol.all()
  return rows.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
}

export const deleteUser = id => usersCol.remove(id)

/* ── One-time e-mail tokens ─────────────────────────────────────────────── */

export const createAuthToken = data => tokensCol.insert(data)

export async function findAuthToken(kind, tokenHash) {
  const rows = await tokensCol.all()
  return rows.find(t => t.kind === kind && t.tokenHash === tokenHash) ?? null
}

export const useAuthToken = id => tokensCol.patch(id, { usedAt: new Date().toISOString() })

export async function deleteAuthTokens(userId, kind) {
  const rows = await tokensCol.all()
  await tokensCol.save(rows.filter(t => !(t.userId === userId && t.kind === kind)))
}

/* ── Lesson ledger ──────────────────────────────────────────────────────── */

export const addLessonEntry = entry => ledgerCol.insert(entry)

export async function listLessonEntries(userId) {
  const rows = await ledgerCol.all()
  return rows
    .filter(e => e.userId === userId)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
}

/** Balance for every user at once: { userId: balance }. */
export async function lessonBalances() {
  const rows = await ledgerCol.all()
  const totals = {}
  for (const e of rows) totals[e.userId] = (totals[e.userId] || 0) + Number(e.delta || 0)
  return totals
}

export const deleteLessonEntry = id => ledgerCol.remove(id)

/** Bookings belonging to one account. */
export async function listBookingsForUser(userId) {
  const rows = await readAll()
  return rows
    .filter(b => b.userId === userId)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
}
