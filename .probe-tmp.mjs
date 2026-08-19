import { chromium } from 'playwright'
const dir='/private/tmp/claude-501/-Users-kadirdemir-Desktop-KADENEWMEDIA/63ff1985-89a1-4dfe-b118-68d774446b91/scratchpad'
const b = await chromium.launch({ args:['--use-angle=metal','--ignore-gpu-blocklist'] })
const p = await b.newPage({ viewport:{width:1440,height:900} })
const errs=[]; p.on('pageerror',e=>errs.push(e.message.slice(0,90)))
await p.goto('http://127.0.0.1:4181/',{waitUntil:'load'}); await p.waitForTimeout(13000)
for (let i=0;i<14;i++){ await p.mouse.wheel(0,1200); await p.waitForTimeout(300) }
await p.waitForTimeout(2000)
await p.screenshot({path:`${dir}/fix-en-alt.png`})
console.log(JSON.stringify(await p.evaluate(()=>({
  metin: document.body.innerText.trim().length,
  footer: !!document.querySelector('.kade-sitefooter'),
  ingilizce: (document.body.innerText.match(/\b(Create|Something|Extraordinary|tools|event)\b/gi)||[]).slice(0,5)
}))), '| hata:', errs.join(' | ')||'yok')
await b.close()
