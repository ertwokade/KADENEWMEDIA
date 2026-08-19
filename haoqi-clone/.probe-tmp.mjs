import { chromium } from 'playwright'
const b = await chromium.launch({ args:['--use-angle=metal'] })
const p = await b.newPage({ viewport:{width:1440,height:900} })
for (const r of ['/hizmetler','/hakkimizda','/kvkk','/iletisim']) {
  await p.goto('http://127.0.0.1:4181'+r,{waitUntil:'load'})
  await p.waitForTimeout(900)
  const erken = await p.evaluate(()=>[...document.querySelectorAll('.reveal,.page-head h1')].filter(e=>getComputedStyle(e).opacity==='0'&&e.getBoundingClientRect().top<window.innerHeight).length)
  await p.waitForTimeout(2200)
  const sonra = await p.evaluate(()=>[...document.querySelectorAll('.reveal,.page-head h1')].filter(e=>getComputedStyle(e).opacity==='0').length)
  console.log(r.padEnd(14), 'ilk ekranda gizli:', erken, '| 3sn sonra gizli:', sonra)
}
await b.close()
