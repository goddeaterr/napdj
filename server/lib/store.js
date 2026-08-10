/* ============================================================================
   Booking store — append-only JSON file with atomic writes.
   ----------------------------------------------------------------------------
   Location: $DATA_DIR/bookings.json (defaults to ./data next to the project).
   On Vercel the filesystem is ephemeral, so /tmp is used there and the data
   only survives while the serverless instance is warm — run the Express
   server (npm run server) on a normal host if you need durable history.
============================================================================ */
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import path from 'node:path'

const DATA_DIR = process.env.DATA_DIR
  || (process.env.VERCEL ? '/tmp/nap-data' : path.join(process.cwd(), 'data'))

const FILE = path.join(DATA_DIR, 'bookings.json')

/** Serialises writes so two bookings arriving together cannot clobber each other. */
let queue = Promise.resolve()

async function readAll() {
  try {
    const raw = await readFile(FILE, 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function writeAll(rows) {
  await mkdir(DATA_DIR, { recursive: true })
  const tmp = `${FILE}.${process.pid}.tmp`
  await writeFile(tmp, JSON.stringify(rows, null, 2), 'utf8')
  await rename(tmp, FILE)
}

function run(task) {
  queue = queue.then(task, task)
  return queue
}

/** Newest first. */
export async function listBookings() {
  const rows = await readAll()
  return rows.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
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
    const allowed = {}
    if (typeof patch.status === 'string') allowed.status = patch.status
    if (typeof patch.note   === 'string') allowed.note   = patch.note.slice(0, 2000)
    rows[i] = { ...rows[i], ...allowed, updatedAt: new Date().toISOString() }
    await writeAll(rows)
    return rows[i]
  })
}

/** Records the outcome of the notification e-mails (internal, not admin input). */
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

export const STORE_PATH = FILE
