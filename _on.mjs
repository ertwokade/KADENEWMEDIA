import { chromium } from 'playwright';
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1440,height:900}});
try{await p.goto('https://kadenewmedia.com/',{waitUntil:'domcontentloaded',timeout:25000});}catch(e){}
await p.waitForTimeout(6000);
const on=await p.evaluate(()=>{const t=document.body.innerText;return{eng:/I'm Kade|leading social/.test(t),mask:t.includes('■'),theme:t.includes('THEME'),ascii:t.includes('BUYUTUYORUZ'),intro:(t.match(/Kade Media[^\n]{0,80}/)||[''])[0]};});
console.log('JS-ON:',JSON.stringify(on));
await b.close();
