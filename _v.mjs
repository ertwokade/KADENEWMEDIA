import { chromium } from 'playwright';
const OUT='/private/tmp/claude-501/-Users-kadirdemir-Desktop-kademedia/1635a319-eaed-49c6-a41d-6122db714358/scratchpad';
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1440,height:900}});
const bad=[];
for(const path of ['/hakkimizda','/hizmetler','/paketler','/iletisim','/portfolio','/blog','/teklif-al','/giris']){
  let errs=[]; p.removeAllListeners('pageerror'); p.on('pageerror',e=>errs.push(e.message.slice(0,45)));
  await p.goto('http://localhost:5173'+path,{waitUntil:'domcontentloaded',timeout:20000}).catch(()=>{});
  await p.waitForTimeout(1500);
  const s=await p.evaluate(()=>({eh:!!document.querySelector('.knav')||!!document.querySelector('header a[href="/"]'),old:!!document.querySelector('.navbar:not(.knav)'),ov:document.documentElement.scrollWidth>window.innerWidth+4,lightning:!!document.querySelector('.lightning-svg')}));
  const pr=[]; if(!s.eh)pr.push('header-yok'); if(s.old)pr.push('ESKİ-NAV'); if(s.ov)pr.push('OVF'); if(s.lightning)pr.push('LIGHTNING'); if(errs.length)pr.push('ERR');
  if(pr.length) bad.push(path+'→'+pr.join(','));
}
await p.screenshot({path:`${OUT}/KEEP-hakkimizda.png`}).catch(()=>{});
console.log(bad.length?('SORUN: '+bad.join(' | ')):'TEMİZ ✓ (8 route: editoryal header, eski nav/lightning/taşma yok)');
await b.close();
