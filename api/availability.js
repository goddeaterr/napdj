import { getAvailability } from '../server/lib/availability.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  // Short cache: a freed slot should reappear quickly, but repeated page loads
  // should not hit the database every time.
  res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=30')

  if (req.method !== 'GET') {
    res.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }

  try {
    res.json(await getAvailability())
  } catch (err) {
    // Never block the booking form because availability could not be read —
    // the server re-checks the slot on submit anyway.
    console.error('availability failed:', err.message)
    res.json({ ok: false, taken: {} })
  }
}
