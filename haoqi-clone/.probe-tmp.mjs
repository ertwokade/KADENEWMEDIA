import { chromium } from 'playwright'
const dir='/private/tmp/claude-501/-Users-kadirdemir-Desktop-KADENEWMEDIA/63ff1985-89a1-4dfe-b118-68d774446b91/scratchpad'
const b = await chromium.launch({ args:['--use-angle=metal','--ignore-gpu-blocklist'] })
const p = await b.newPage({ viewport:{width:1440,height:900} })
await p.goto('http://127.0.0.1:4181/',{waitUntil:'load'}); await p.waitForTimeout(13000)
await p.evaluate(()=>document.querySelector('.kade-sitefooter').scrollIntoView({block:'end'}))
await p.waitForTimeout(2000)
await p.screenshot({path:`${dir}/footer-final2.png`, clip:{x:0,y:520,width:1440,height:380}})
await b.close()
