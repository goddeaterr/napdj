import { studentsHandler } from '../../server/lib/adminApi.js'

export default async function handler(req, res) {
  try {
    await studentsHandler(req, res)
  } catch (err) {
    console.error('admin/students failed:', err.message)
    if (!res.headersSent) res.status(500).json({ ok: false, error: 'server_error' })
  }
}
