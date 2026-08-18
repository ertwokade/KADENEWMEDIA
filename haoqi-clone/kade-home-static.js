(function(){
  document.querySelectorAll('.kade-navrow').forEach(function(el){el.style.opacity='1'})
  document.querySelectorAll('a[href^="https://kadenewmedia.com/"]').forEach(function(a){a.href=new URL(a.href).pathname})
  document.querySelectorAll('header button').forEach(function(button){
    var text=(button.textContent||'').trim().toUpperCase()
    if(text==='İŞLER') button.addEventListener('click',function(){document.querySelector('#selected-work')?.scrollIntoView({behavior:'smooth'})})
    if(text==='İLETİŞİM') button.addEventListener('click',function(){document.querySelector('#contact')?.scrollIntoView({behavior:'smooth'})})
  })
})();
