import { chromium } from 'playwright'
const b = await chromium.launch({ args:['--use-angle=metal'] })
const p = await b.newPage({ viewport:{width:1440,height:900} })
await p.goto('http://127.0.0.1:4181/hakkimizda',{waitUntil:'load'}); await p.waitForTimeout(1500)
const once = await p.evaluate(()=>[...document.querySelectorAll('.reveal')].filter(e=>getComputedStyle(e).opacity==='0').length)
await p.evaluate(async ()=>{ const k=document.querySelector('.article-shell'); const h=k.scrollHeight
  for(let y=0;y<h;y+=500){ k.scrollTo({top:y}); await new Promise(r=>setTimeout(r,120)) } })
await p.waitForTimeout(1200)
const sonra = await p.evaluate(()=>[...document.querySelectorAll('.reveal')].filter(e=>getComputedStyle(e).opacity==='0').length)
console.log('kaydırmadan önce görünmez:', once, '| kaydırdıktan sonra:', sonra)
await b.close()
