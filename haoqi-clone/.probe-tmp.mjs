import { chromium } from 'playwright'
const dir='/private/tmp/claude-501/-Users-kadirdemir-Desktop-KADENEWMEDIA/63ff1985-89a1-4dfe-b118-68d774446b91/scratchpad'
const b = await chromium.launch({ args:['--use-angle=metal','--ignore-gpu-blocklist'] })
const p = await b.newPage({ viewport:{width:1440,height:900} })
const errs=[]; p.on('pageerror',e=>errs.push(e.message.slice(0,80)))
await p.goto('http://127.0.0.1:4181/?raw=1',{waitUntil:'load'}); await p.waitForTimeout(13000)
const once = await p.evaluate(()=>({metin:document.body.innerText.trim().length}))
// gerçek kaydırma kabı üzerinden in
await p.evaluate(async ()=>{
  const k = document.querySelector('.overflow-y-auto') || document.scrollingElement
  const h = k.scrollHeight
  for (let y=0;y<h;y+=600){ k.scrollTo({top:y,behavior:'auto'}); await new Promise(r=>setTimeout(r,120)) }
  k.scrollTo({top:h,behavior:'auto'})
})
await p.waitForTimeout(2500)
const sonra = await p.evaluate(()=>({metin:document.body.innerText.trim().length, footer:!!document.querySelector('.kade-sitefooter'), footerGorunur:(()=>{const f=document.querySelector('.kade-sitefooter');if(!f)return false;const r=f.getBoundingClientRect();return r.top<window.innerHeight&&r.bottom>0})()}))
console.log('önce:', JSON.stringify(once), 'sonra:', JSON.stringify(sonra), '| hata:', errs.join(' | ')||'yok')
await p.screenshot({path:`${dir}/scroll-son.png`})
await b.close()
