// Run: node seed-db.js
const res = await fetch('http://localhost:3001/api/seed', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ secret: 'kademedia-seed-2026' }),
})
const data = await res.json()
console.log(JSON.stringify(data, null, 2))
