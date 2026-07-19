import { chromium } from 'playwright';
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1440,height:900}});
const fails=[], errs=[], cons=[];
p.on('requestfailed',r=>fails.push((r.failure()?.errorText||'')+' '+r.url().split('/').pop()));
p.on('response',r=>{if(r.status()>=400)fails.push(r.status()+' '+r.url().split('/').pop());});
p.on('pageerror',e=>errs.push(e.message.slice(0,90)));
p.on('console',m=>{if(m.type()==='error')cons.push(m.text().slice(0,80));});
let loaded=false;
p.on('load',()=>{loaded=true;});
try{ await p.goto('https://kadenewmedia.com/',{waitUntil:'commit',timeout:20000}); }catch(e){console.log('goto',e.message.slice(0,40));}
await p.waitForTimeout(9000);
const dom=await p.evaluate(()=>({canvas:!!document.querySelector('canvas'),bodyLen:document.body.innerText.length,ready:document.readyState})).catch(e=>({err:e.message.slice(0,40)}));
console.log('LOAD event:',loaded);
console.log('readyState/DOM:',JSON.stringify(dom));
console.log('4xx/fail:',fails.length, fails.slice(0,8));
console.log('pageerror:',errs.length, errs.slice(0,4));
console.log('console.error:',cons.length, cons.slice(0,4));
await b.close();
