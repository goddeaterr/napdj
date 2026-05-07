export default function handler(req, res) {
  const gmailReady = !!(
    process.env.GMAIL_USER &&
    process.env.GMAIL_APP_PASSWORD &&
    !process.env.GMAIL_APP_PASSWORD.startsWith('xxxx')
  )
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.json({ ok: true, gmail: gmailReady, owner: process.env.OWNER_EMAIL })
}
