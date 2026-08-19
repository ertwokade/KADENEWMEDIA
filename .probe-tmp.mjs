import { chromium } from 'playwright'
const b = await chromium.launch({ args:['--use-angle=metal','--ignore-gpu-blocklist'] })
const p = await b.newPage({ viewport:{width:1440,height:900} })
await p.goto('http://127.0.0.1:4181/',{waitUntil:'load'}); await p.waitForTimeout(13000)
console.log(JSON.stringify(await p.evaluate(()=>{
  const out=[]
  document.querySelectorAll('*').forEach(el=>{
    if(el.children.length) return
    const t=(el.textContent||'').trim()
    if(/^(Let.s|Create|Something|Extraordinary|TOOLS|EVENT|Tools|Event)$/i.test(t)) out.push({t, cls:(el.className||'').toString().slice(0,40)})
  })
  return out.slice(0,10)
})))
await b.close()
