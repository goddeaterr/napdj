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

/** Serialises writes so two bookings arriving together cannot clobber each other. */
let queue = Promise.resolve()

async function readAll() {
  try {
    const parsed = JSON.parse(await readFile(FILE, 'utf8'))
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
