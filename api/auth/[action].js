import { handleAuth } from '../../server/lib/accountApi.js'

export default async function handler(req, res) {
  const action = Array.isArray(req.query?.action) ? req.query.action[0] : req.query?.action
  try {
    await handleAuth(String(action || ''), req, res)
  } catch (err) {
    console.error(`auth/${action} failed:`, err.message)
    if (!res.headersSent) res.status(500).json({ ok: false, error: 'server_error' })
  }
}
