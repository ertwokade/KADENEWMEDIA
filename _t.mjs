import { chromium } from 'playwright';
const b=await chromium.launch();
let p=await b.newPage({viewport:{width:1440,height:900},javaScriptEnabled:false});
try{await p.goto('https://kadenewmedia.com/',{waitUntil:'domcontentloaded',timeout:25000});}catch(e){}
await p.waitForTimeout(1200);
const off=await p.evaluate(()=>{const t=document.body.innerText;return{eng:/I'm Kade|leading social/.test(t),mask:t.includes('■'),hasClean:t.includes('Kade Media; içerik'),biz:/BİZ|BÜYÜTÜYORUZ/.test(t)&&!/BUYUTUYORUZ/.test(t)};});
console.log('JS-OFF:',JSON.stringify(off));
await p.close();
p=await b.newPage({viewport:{width:1440,height:900}});
try{await p.goto('https://kadenewmedia.com/',{waitUntil:'load',timeout:30000});}catch(e){}
await p.waitForTimeout(6000);
const on=await p.evaluate(()=>{const t=document.body.innerText;return{eng:/I'm Kade|leading social/.test(t),mask:t.includes('■'),theme:t.includes('THEME[A]')};});
console.log('JS-ON :',JSON.stringify(on));
await b.close();
