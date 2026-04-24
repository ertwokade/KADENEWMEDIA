// Run: node seed-db.js
import 'dotenv/config'

const csrfRes = await fetch('http://localhost:3001/api/auth?action=csrf')
const setCookie = csrfRes.headers.get('set-cookie') || ''
const csrfToken = (await csrfRes.json()).csrfToken
const cookie = setCookie.split(';')[0]

const res = await fetch('http://localhost:3001/api/seed', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken, Cookie: cookie },
  body: JSON.stringify({ secret: process.env.SEED_SECRET || '' }),
})
const data = await res.json()
console.log(JSON.stringify(data, null, 2))
