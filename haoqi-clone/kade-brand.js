(function(){
  'use strict';
  var isNextApp=!!document.querySelector('script[src*="/_next/"]');
  /* kade-brand.css covers the page with an opaque sheet + loading bar until
     [data-kade-loaded] is set. Only the cloned Next app needs that wait — the
     static routes are server-rendered HTML, so mark them loaded right away
     instead of leaving them blank behind the cover. */
  if(!isNextApp)document.documentElement.setAttribute('data-kade-loaded','');
  if(isNextApp){
    document.title='Kade New Media | Dijital Pazarlama Ajansı';
    var textPairs=[
      ["I'm Haoqi Wen, leading Design Engineering and AI exploration at ",'Kade New Media; strateji, içerik, reklam ve prodüksiyonla markaları dijitalde büyütür. '],
      ['haoqi','Kade'],['.design',' New Media'],['Work','HİZMETLER'],['Contact','İLETİŞİM'],
      ['Design &','Sosyal Medya &'],['Engineering','Dijital Pazarlama'],
      ['Thinking in systems. Designing with care.','Markaları dijitalde büyütüyoruz.'],
      [', engineering, and AI at scale. Outside work, I build design tools for team efficiency.',''],
      ['I bring','Biz'],['craft & taste','markanı'],['to digital work','büyütüyoruz'],
      ['I explore how to shape AI-era workflows with craft and taste, building the next generation of digital products.','Strateji, içerik ve reklamı tek bir üretim hattında birleştirerek markalara ölçülebilir dijital büyüme sağlıyoruz.'],
      ["I’m building",'İstanbul merkezli ekibimiz'],['reunimos™','sosyal medya'],
      [', and previously worked on Alibaba','; içerik'],[', and 100offer.',' ve web tasarımı alanlarında çalışıyor.'],
      ['Coding Project','Hizmet'],['Reunimos™','Kade Portfolio'],['Inspire Mono','Sosyal Medya'],
      ['Wasm design utils','Dijital Pazarlama'],['VectorSymbols','Marka Tasarımı'],['DarkSide','Video Prodüksiyon'],
      ['aDrive 阿里云盘','Reklam Yönetimi'],['Shore Icon','Kade Studio'],['Teambition','Kade Business'],
      ['FoF: See Hear Touch','Kade Event'],['FoF: Design System','Kade Design'],
      ['Innovate','Marka'],['purpose','büyüt'],["Let's",'Birlikte'],['Create','Harika'],
      ['Something','İşler'],['Extraordinary','Başaralım'],['curiosity.wen@gmail.com','thekademedia@gmail.com']
    ];
    var localeKey='kade-locale';
    var locale='tr';
    try{locale=localStorage.getItem(localeKey)==='en'?'en':'tr'}catch(e){}
    var localeEntries=[
      {tr:'HİZMETLER',en:'SERVICES'},
      {tr:'İLETİŞİM',en:'CONTACT'},
      {tr:'Sosyal Medya &',en:'Social Media &'},
      {tr:'Dijital Pazarlama',en:'Digital Marketing'},
      {tr:'Markaları dijitalde büyütüyoruz.',en:'We grow brands digitally.'},
      {tr:'Kade New Media; strateji, içerik, reklam ve prodüksiyonla markaları dijitalde büyütür.',en:'Kade New Media grows brands through strategy, content, advertising and production.'},
      {tr:'BİZ',en:'WE'},
      {tr:'MARKANI',en:'GROW'},
      {tr:'BÜYÜTÜYORUZ',en:'YOUR BRAND'},
      {tr:'Strateji, içerik ve reklamı tek bir üretim hattında birleştirerek markalara ölçülebilir dijital büyüme sağlıyoruz.',en:'We unite strategy, content and advertising in one production line to deliver measurable digital growth.'},
      {tr:'İstanbul merkezli ekibimiz',en:'Our Istanbul-based team'},
      {tr:'sosyal medya; içerik ve web tasarımı alanlarında çalışıyor.',en:'works across social media, content and web design.'},
      {tr:'Hizmet',en:'Service'},
      {tr:'Marka',en:'Innovate'},
      {tr:'büyüt',en:'purpose'},
      {tr:'Birlikte',en:"Let's"},
      {tr:'Harika',en:'Create'},
      {tr:'İşler',en:'Something'},
      {tr:'Başaralım',en:'Extraordinary'},
      {tr:'Sosyal Medya',en:'Social Media'},
      {tr:'Marka Tasarımı',en:'Brand Design'},
      {tr:'Video Prodüksiyon',en:'Video Production'},
      {tr:'Reklam Yönetimi',en:'Advertising Management'}
      ,{tr:'ile',en:'with'}
    ];
    var serviceItems=[
      {href:'/hizmetler/sosyal-medya-yonetimi',tr:'Sosyal Medya Yönetimi',en:'Social Media Management',trSub:'Strateji, yayın takvimi ve topluluk yönetimi',enSub:'Strategy, publishing calendar and community'},
      {href:'/hizmetler/icerik-uretimi',tr:'İçerik Üretimi',en:'Content Production',trSub:'Tasarım, fotoğraf, video ve metin',enSub:'Design, photography, video and copy'},
      {href:'/hizmetler/reklam-yonetimi',tr:'Reklam Yönetimi',en:'Advertising Management',trSub:'Meta, Google ve TikTok performans reklamları',enSub:'Meta, Google and TikTok performance ads'},
      {href:'/hizmetler/video-produksiyon',tr:'Video Prodüksiyon',en:'Video Production',trSub:'Reels, kampanya filmi, kurgu ve motion',enSub:'Reels, campaign films, editing and motion'},
      {href:'/hizmetler/strateji-danismanlik',tr:'Strateji & Danışmanlık',en:'Strategy & Consulting',trSub:'Analiz, KPI ve büyüme yol haritası',enSub:'Analysis, KPIs and a growth roadmap'},
      {href:'/hizmetler/web-sitesi-tasarimi',tr:'Web Sitesi Tasarımı',en:'Website Design',trSub:'UI/UX, geliştirme, CMS ve e-ticaret',enSub:'UI/UX, development, CMS and e-commerce'}
    ];
    var servicePanel=null;
    var localeSyncGeneration=0;
    function cleanText(value){return(value||'').replace(/\s+/g,' ').trim()}
    function scrambleElement(element,target){
      if(!element||cleanText(element.textContent)===target)return;
      if(matchMedia('(prefers-reduced-motion: reduce)').matches){element.textContent=target;return}
      var glyphs='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@';
      var started=performance.now(),duration=Math.min(520,240+target.length*8);
      function frame(now){
        var progress=Math.min(1,(now-started)/duration),settled=Math.floor(target.length*progress);
        element.textContent=target.split('').map(function(char,index){
          if(char===' '||index<settled)return char;
          return glyphs[Math.floor(Math.random()*glyphs.length)];
        }).join('');
        if(progress<1)requestAnimationFrame(frame);else element.textContent=target;
      }
      requestAnimationFrame(frame);
    }
    function registerLocaleNodes(){
      var elements=Array.prototype.slice.call(document.body.querySelectorAll('h1,h2,h3,h4,p,a,button,span,div'));
      elements.forEach(function(element){
        if(element.closest('#kade-services-panel,#kade-access-panel,.kade-sitefooter,.kade-language-toggle'))return;
        var value=cleanText(element.textContent),index=-1;
        var folded=value.toLocaleLowerCase('tr');
        localeEntries.some(function(entry,i){if(folded===cleanText(entry.tr).toLocaleLowerCase('tr')||folded===cleanText(entry.en).toLocaleLowerCase('tr')){index=i;return true}return false});
        if(index<0)return;
        var duplicate=Array.prototype.some.call(element.children,function(child){return cleanText(child.textContent)===value});
        if(!duplicate)element.setAttribute('data-kade-i18n',String(index));
      });
    }
    function applyLocaleToPage(next,animate){
      registerLocaleNodes();
      document.querySelectorAll('[data-kade-i18n]').forEach(function(element){
        var entry=localeEntries[Number(element.getAttribute('data-kade-i18n'))];
        if(!entry)return;
        var target=entry[next];
        if(cleanText(element.textContent)===cleanText(target))return;
        if(animate)scrambleElement(element,target);else element.textContent=target;
      });
      var inlinePairs=[
        {tr:'İstanbul merkezli ekibimiz',en:'Our Istanbul-based team'},
        {tr:'sosyal medya',en:'social media'},
        {tr:'; içerik',en:'; content'},
        {tr:'ve web tasarımı alanlarında çalışıyor.',en:'and works across web design.'}
      ];
      var walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode:function(node){
        if(node.parentElement&&node.parentElement.closest('#kade-services-panel,#kade-access-panel,.kade-sitefooter,.kade-language-toggle,[data-kade-i18n]'))return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }}),textNodes=[],textNode;
      while((textNode=walker.nextNode()))textNodes.push(textNode);
      textNodes.forEach(function(node){
        var folded=cleanText(node.nodeValue).toLocaleLowerCase('tr');
        inlinePairs.some(function(pair){
          if(folded!==cleanText(pair.tr).toLocaleLowerCase('tr')&&folded!==cleanText(pair.en).toLocaleLowerCase('tr'))return false;
          var leading=(node.nodeValue.match(/^\s*/)||[''])[0],trailing=(node.nodeValue.match(/\s*$/)||[''])[0];
          node.nodeValue=leading+pair[next]+trailing;return true;
        });
      });
      var teamParagraph=document.querySelector('p:has(a[data-kade-href="/hizmetler/sosyal-medya-yonetimi"]):has(a[data-kade-href="/hizmetler/icerik-uretimi"])');
      if(teamParagraph){
        var social=teamParagraph.querySelector('a[data-kade-href="/hizmetler/sosyal-medya-yonetimi"]');
        var content=teamParagraph.querySelector('a[data-kade-href="/hizmetler/icerik-uretimi"]');
        var web=teamParagraph.querySelector('a[data-kade-href="/hizmetler/web-sitesi-tasarimi"]');
        if(social&&content&&web){
          social.textContent=next==='tr'?'sosyal medya':'social media';
          content.textContent=next==='tr'?'içerik üretimi':'content production';
          web.textContent=next==='tr'?'web sitesi tasarımı':'website design';
          teamParagraph.replaceChildren(
            document.createTextNode(next==='tr'?'İstanbul merkezli ekibimiz; ':'Our Istanbul-based team works across '),social,
            document.createTextNode(', '),content,document.createTextNode(next==='tr'?' ve ':' and '),web,
            document.createTextNode(next==='tr'?' alanlarında çalışıyor.':'.')
          );
        }
      }
    }
    function updateLanguageControl(){
      var next=locale==='tr'?'en':'tr';
      document.querySelectorAll('.kade-language-toggle').forEach(function(control){
        control.setAttribute('data-next-locale',next);
        control.setAttribute('data-current-locale',locale);
        control.setAttribute('aria-label',next==='en'?'Switch to English':'Türkçeye geç');
        control.setAttribute('title',next==='en'?'English':'Türkçe');
        /* The badge reports the language currently on screen. The accessible
           label still explains the action that clicking will perform. */
        control.querySelector('span').textContent=locale.toUpperCase();
      });
    }
    function renderServicesPanel(){
      if(!servicePanel)return;
      var isTr=locale==='tr';
      var count=('0'+serviceItems.length).slice(-2);
      /* Turkish has its own casing rules, so uppercase here instead of leaving
         it to text-transform (which would turn "İçerik" into "ICERIK"). */
      var upper=function(value){return isTr?value.toLocaleUpperCase('tr'):value.toUpperCase()};
      servicePanel.setAttribute('aria-label',isTr?'Hizmetler':'Services');
      servicePanel.innerHTML='<div class="kade-services-panel__bar">'+
          '<div class="kade-services-panel__intro">'+
            '<span>'+(isTr?'HİZMETLER':'SERVICES')+' — '+count+'</span>'+
            '<h2>'+(isTr?'Fikirden yayına, tek ekip.':'From idea to launch, one team.')+'</h2>'+
            '<p>'+(isTr?'Strateji, tasarım ve performansı aynı üretim sisteminde buluşturuyoruz.':'We unite strategy, design and performance in one production system.')+'</p>'+
          '</div>'+
          '<button type="button" class="kade-services-panel__close" aria-label="'+(isTr?'Hizmetleri kapat':'Close services')+'">'+(isTr?'Kapat':'Close')+'<i>[ESC]</i></button>'+
        '</div>'+
        '<div class="kade-services-panel__grid">'+serviceItems.map(function(item,index){
          return '<a href="'+item.href+'" data-kade-href="'+item.href+'">'+
            '<span class="kade-services-panel__index">'+('0'+(index+1)).slice(-2)+'</span>'+
            '<strong>'+upper(item[locale])+'</strong>'+
            '<small>'+item[locale+'Sub']+'</small>'+
            '<span class="kade-services-panel__arrow">↗</span></a>';
        }).join('')+'</div>'+
        '<div class="kade-services-panel__footer">'+
          '<a href="/hizmetler" data-kade-href="/hizmetler">'+(isTr?'Tüm hizmetler':'All services')+' ↗</a>'+
          '<a href="/iletisim" data-kade-href="/iletisim">'+(isTr?'Projeni konuşalım':'Start a project')+' ↗</a>'+
        '</div>';
    }
    function setServicesOpen(open){
      if(!servicePanel)return;
      servicePanel.classList.toggle('is-open',!!open);
      servicePanel.setAttribute('aria-hidden',open?'false':'true');
      document.documentElement.classList.toggle('kade-services-open',!!open);
      document.querySelectorAll('[data-kade-services-trigger]').forEach(function(trigger){trigger.setAttribute('aria-expanded',open?'true':'false')});
      if(open){
        servicePanel.querySelectorAll('strong,small').forEach(function(text,index){setTimeout(function(){scrambleElement(text,text.textContent)},index*35)});
      }
    }
    function isServicesTrigger(element){
      if(!element||element.closest('#kade-services-panel'))return false;
      if(element.hasAttribute('data-kade-services-trigger'))return true;
      var label=cleanText(element.textContent).toUpperCase();
      return label==='HİZMETLER'||label==='SERVICES'||label==='WORK';
    }
    function installServicesPanel(){
      if(servicePanel)return;
      servicePanel=document.createElement('aside');
      servicePanel.id='kade-services-panel';
      servicePanel.setAttribute('aria-hidden','true');
      servicePanel.setAttribute('aria-label','Hizmetler');
      document.body.appendChild(servicePanel);
      renderServicesPanel();
      document.querySelectorAll('header button,header a').forEach(function(control){
        if(isServicesTrigger(control)){
          control.setAttribute('data-kade-services-trigger','');
          control.setAttribute('aria-controls','kade-services-panel');
          control.setAttribute('aria-expanded','false');
        }
      });
    }
    function installLanguageToggle(){
      if(document.querySelector('.kade-language-toggle'))return;
      var theme=document.querySelector('[aria-label^="Theme:"]');
      if(!theme||!theme.parentElement)return;
      var button=document.createElement('button');
      button.type='button';button.className='kade-language-toggle';button.innerHTML='<span></span>';
      theme.parentElement.insertBefore(button,theme);
      updateLanguageControl();
    }
    function installMobileControls(){
      if(document.querySelector('.kade-mobile-controls'))return;
      var nav=document.createElement('nav');
      nav.className='kade-mobile-controls';
      nav.setAttribute('aria-label','Site kontrolleri');
      nav.innerHTML='<button type="button" class="kade-mobile-services" data-kade-services-trigger aria-controls="kade-services-panel" aria-expanded="false" aria-label="Hizmetler"></button><button type="button" class="kade-language-toggle"><span></span></button><button type="button" class="kade-mobile-theme" aria-label="Theme: '+(document.documentElement.classList.contains('dark')?'dark':'light')+'"></button>';
      document.body.appendChild(nav);
      updateLanguageControl();
    }
    function setLocale(next,animate){
      locale=next==='en'?'en':'tr';
      var syncGeneration=++localeSyncGeneration;
      try{localStorage.setItem(localeKey,locale)}catch(e){}
      document.documentElement.lang=locale;
      document.documentElement.setAttribute('data-locale',locale);
      document.title=locale==='tr'?'Kade New Media | Dijital Pazarlama Ajansı':'Kade New Media | Digital Marketing Agency';
      updateLanguageControl();
      renderServicesPanel();
      /* Sayfa zaten Türkçe yayınlanıyor (metinler bundle ve sunucu HTML'inde
         çevrili). İlk yüklemede React'in metin düğümlerini textContent ile
         ezmek, o bölüm yeniden render edildiğinde removeChild hatasına ve
         sayfanın boşalmasına yol açıyordu; bu yüzden yalnızca kullanıcı dili
         değiştirdiğinde ya da İngilizceye geçildiğinde uygulanıyor. */
      if(animate||locale!=='tr')applyLocaleToPage(locale,!!animate);
      window.dispatchEvent(new CustomEvent('kade:localechange',{detail:{locale:locale}}));
      /* The cloned page finishes its own staggered text reveal after hydration.
         A few leaf spans can therefore be written back to Haoqi's original
         language after our first pass. Reconcile only while that native reveal
         settles; user-triggered switches keep their scramble animation. */
      if(!animate&&locale!=='tr')[450,1250,2600].forEach(function(delay){
        setTimeout(function(){
          if(syncGeneration!==localeSyncGeneration)return;
          applyLocaleToPage(locale,false);
          updateLanguageControl();
        },delay);
      });
    }
    function installExperience(){
      installLanguageToggle();
      installMobileControls();
      installServicesPanel();
      setLocale(locale,false);
    }
    var workLinks={
      '/reunimos':['/portfolio','Kade Portfolio - 2024-2026'],
      '/inspire_mono':['/hizmetler/sosyal-medya-yonetimi','Sosyal Medya - 2025'],
      '/wasm_design_utils':['/hizmetler','Dijital Pazarlama - 2025'],
      'https://www.figma.com/community/plugin/1255914175202017737/vectorsymbols':['/hizmetler/icerik-uretimi','Marka Tasarımı - 2023'],
      'https://www.figma.com/community/plugin/986289377230504703/darkside':['/hizmetler/video-produksiyon','Video Prodüksiyon - 2021'],
      '/adrive':['/hizmetler/reklam-yonetimi','Reklam Yönetimi - 2020-2022'],
      '/shore_icon':['/hakkimizda','Kade Studio - 2022'],
      '/teambition':['/kade-kit-business','Kade Business - 2018-2020'],
      'https://friends.figma.com/events/details/figma-shanghai-presents-see-hear-touch/':['/portfolio','Kade Event - 2022'],
      'https://friends.figma.com/events/details/figma-shanghai-presents-design-system/':['/hizmetler/web-sitesi-tasarimi','Kade Design - 2021']
    };
    function replaceText(root){
      var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(node){
        var tag=node.parentElement&&node.parentElement.tagName;
        return tag==='SCRIPT'||tag==='STYLE'||tag==='TEXTAREA'?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT;
      }}),nodes=[],node;
      while((node=walker.nextNode()))nodes.push(node);
      nodes.forEach(function(text){
        var value=text.nodeValue||'',next=value;
        textPairs.forEach(function(pair){next=next.split(pair[0]).join(pair[1])});
        if(next!==value)text.nodeValue=next;
      });
    }
    function setAnchor(anchor,href,label){
      anchor.setAttribute('href',href);
      anchor.setAttribute('data-kade-href',href);
      if(label)anchor.setAttribute('aria-label',label);
      if(href.charAt(0)==='/'){anchor.removeAttribute('target');anchor.removeAttribute('rel')}
    }
    function installKadeSignature(){
      var signature=document.querySelector('.svg-sign');
      if(!signature||signature.hasAttribute('data-kade-signature'))return;
      signature.setAttribute('data-kade-signature','');
      signature.setAttribute('aria-label','Kade imzası');
      var kadePaths=[
        '<path class="svg-sign__path" d="M12 128 C30 124 46 111 58 94 C70 77 77 50 84 19 M59 94 C84 82 105 62 122 42 M61 92 C83 93 103 106 118 127"/>',
        '<path class="svg-sign__path" d="M109 96 C116 77 137 66 146 76 C155 87 140 103 125 102 C111 100 112 84 126 75 C137 67 147 73 148 85 C149 96 153 102 160 98 C165 95 168 89 171 84"/>',
        '<path class="svg-sign__path" d="M171 89 C176 73 192 67 200 76 C208 86 197 101 184 102 C172 103 168 91 175 80 C183 68 196 70 201 81 M201 98 C209 76 216 48 226 19 C219 48 211 82 213 96 C216 104 226 96 235 85"/>',
        '<path class="svg-sign__path" d="M234 89 C243 71 260 67 267 75 C271 83 258 93 241 93 C246 105 260 106 273 98 C282 93 288 87 294 80 M290 82 C300 74 308 63 314 52"/>'
      ].map(function(markup){return markup.match(/d="([^"]+)"/)[1]});
      var paths=signature.querySelectorAll('.svg-sign__path');
      Array.prototype.forEach.call(paths,function(path,index){
        if(kadePaths[index])path.setAttribute('d',kadePaths[index]);
        var length=Math.ceil(path.getTotalLength());
        path.setAttribute('fill','none');
        path.setAttribute('stroke','#C0FE04');
        path.setAttribute('stroke-width','4');
        path.style.strokeDasharray=length;
        path.style.strokeDashoffset=length;
        path.style.setProperty('--path-delay',(index*150)+'ms');
        path.style.setProperty('--path-dur','760ms');
      });
      signature.classList.remove('is-drawing');
      requestAnimationFrame(function(){requestAnimationFrame(function(){signature.classList.add('is-drawing')})});
    }
    function enhanceNext(){
      document.documentElement.lang=locale;
      document.documentElement.setAttribute('data-kade-enhanced','');
      document.title=locale==='tr'?'Kade New Media | Dijital Pazarlama Ajansı':'Kade New Media | Digital Marketing Agency';
      var description=document.querySelector('meta[name="description"]');
      if(description)description.content='Kade New Media — İstanbul merkezli sosyal medya ve dijital pazarlama ajansı.';
      /* First normalize the cloned copy to Kade content, then translate that
         content to the selected language. This prevents Haoqi's original copy
         from returning when English is persisted and the page is reloaded. */
      replaceText(document.body);
      installKadeSignature();
      document.querySelectorAll('#selected-work a').forEach(function(anchor){
        var original=anchor.getAttribute('data-kade-original-href')||anchor.getAttribute('href');
        if(!anchor.hasAttribute('data-kade-original-href'))anchor.setAttribute('data-kade-original-href',original||'');
        var next=workLinks[original];
        if(next)setAnchor(anchor,next[0],next[1]);
      });
      document.querySelectorAll('a[href="https://reunimos.cc"]').forEach(function(a){setAnchor(a,'/hizmetler/sosyal-medya-yonetimi','Sosyal medya yönetimi')});
      document.querySelectorAll('a[href="https://www.alipan.com/"]').forEach(function(a){setAnchor(a,'/hizmetler/icerik-uretimi','İçerik üretimi')});
      document.querySelectorAll('a[href="https://www.teambition.com/"]').forEach(function(a){setAnchor(a,'/hizmetler/web-sitesi-tasarimi','Web sitesi tasarımı')});
      /* Footer'daki e-posta ve sosyal bağlantılar artık kaynağında (bundle +
         sunucu HTML'i) düzeltiliyor. Burada DOM'a dokunmak React'in o bölümü
         yeniden render ettiği anda removeChild hatasına ve sayfanın boşalmasına
         yol açıyordu; bu yüzden kaldırıldı. */
      installExperience();
    }
    function revealControlsWhenReady(done){
      var loader=document.querySelector('div[class*="left-1/2"][class*="top-1/2"][class*="z-40"]');
      if(!loader||parseFloat(getComputedStyle(loader).opacity)<=.05){
        if(done)done();
        return;
      }
      requestAnimationFrame(function(){revealControlsWhenReady(done)});
    }
    function startNext(){
      setTimeout(function(){
        revealControlsWhenReady(function(){
          /* Only reveal the page when the native loader is gone. React removes
             that loader during its final commit, so inserting controls in the
             same frame can make React remove the wrong node (removeChild).
             Give the completed commit one quiet frame, then enhance the page. */
          document.documentElement.setAttribute('data-kade-loaded','');
          requestAnimationFrame(function(){
            requestAnimationFrame(function(){setTimeout(enhanceNext,350)});
          });
        });
      },800);
    }
    document.addEventListener('click',function(event){var a=event.target.closest&&event.target.closest('a[data-kade-href]');if(!a)return;event.preventDefault();event.stopImmediatePropagation();location.href=a.getAttribute('data-kade-href')},true);
    document.addEventListener('click',function(event){
      var language=event.target.closest&&event.target.closest('.kade-language-toggle');
      if(language){event.preventDefault();event.stopImmediatePropagation();setLocale(locale==='tr'?'en':'tr',true);return}
      var control=event.target.closest&&event.target.closest('button,a');
      if(isServicesTrigger(control)){
        event.preventDefault();event.stopImmediatePropagation();
        installServicesPanel();setServicesOpen(!servicePanel.classList.contains('is-open'));return;
      }
      if(event.target.closest&&event.target.closest('.kade-services-panel__close')){event.preventDefault();setServicesOpen(false);return}
      if(servicePanel&&servicePanel.classList.contains('is-open')&&!event.target.closest('#kade-services-panel'))setServicesOpen(false);
    },true);
    document.addEventListener('click',function(event){
      var control=event.target.closest&&event.target.closest('[aria-label^="Theme:"]');
      if(!control)return;
      event.preventDefault();event.stopImmediatePropagation();
      window.dispatchEvent(new KeyboardEvent('keydown',{key:document.documentElement.classList.contains('dark')?'l':'d',bubbles:true}));
    },true);
    document.addEventListener('keydown',function(event){
      if(event.key==='Escape'&&servicePanel&&servicePanel.classList.contains('is-open')){setServicesOpen(false);return}
      if(event.key!=='Enter'&&event.key!==' ')return;
      var language=event.target.closest&&event.target.closest('.kade-language-toggle');
      if(language){event.preventDefault();language.click();return}
      var control=event.target.closest&&event.target.closest('[aria-label^="Theme:"]');
      if(!control)return;
      event.preventDefault();event.stopImmediatePropagation();control.click();
    },true);
    if(document.readyState==='loading')addEventListener('DOMContentLoaded',startNext,{once:true});else startNext();
    return;
  }
  var modeKey='kade-mode';
  function setMode(mode){
    mode=mode==='dark'?'dark':'light';
    document.documentElement.classList.toggle('dark',mode==='dark');
    document.documentElement.setAttribute('data-theme',mode);
    try{localStorage.setItem(modeKey,mode)}catch(e){}
    document.querySelectorAll('[data-theme-toggle],[aria-label^="Theme:"]').forEach(function(control){
      control.setAttribute('data-theme-toggle','');
      control.setAttribute('aria-label',mode==='dark'?'Aydınlık temaya geç':'Karanlık temaya geç');
      control.setAttribute('title',mode==='dark'?'Aydınlık tema':'Karanlık tema');
    });
  }
  var initialMode='light';
  try{initialMode=localStorage.getItem(modeKey)==='dark'?'dark':'light'}catch(e){}
  function bindControls(){
    if(document.documentElement.hasAttribute('data-kade-controls'))return;
    document.documentElement.setAttribute('data-kade-controls','');
    document.addEventListener('click',function(event){
    var control=event.target.closest&&event.target.closest('[data-theme-toggle],[aria-label^="Theme:"]');
    if(!control)return;
    event.preventDefault();event.stopImmediatePropagation();
    setMode(document.documentElement.classList.contains('dark')?'light':'dark');
    },true);
    document.addEventListener('keydown',function(event){
    if(event.key!=='Enter'&&event.key!==' ')return;
    var control=event.target.closest&&event.target.closest('[data-theme-toggle],[aria-label^="Theme:"]');
    if(!control)return;
    event.preventDefault();event.stopImmediatePropagation();control.click();
    },true);
  }
  function normalizeBrand(){
    setMode(document.documentElement.classList.contains('dark')?'dark':'light');
    document.querySelectorAll('a.brand').forEach(function(brand){
      var spans=brand.querySelectorAll(':scope > span');
      if(spans.length>=2){
        if(spans[0].textContent!=='Kade')spans[0].textContent='Kade';
        if(spans[1].textContent!==' New Media')spans[1].textContent=' New Media';
      }
      brand.setAttribute('aria-label','Kade New Media ana sayfa');
    });
    document.querySelectorAll('header a[href="/"]').forEach(function(home){
      var compact=(home.textContent||'').replace(/\s+/g,'').toLowerCase();
      if(!/^(kade\.media|kademedia|kadenewmedia)$/.test(compact))return;
      var leaves=Array.prototype.filter.call(home.querySelectorAll('span'),function(span){return !span.querySelector('span')});
      if(leaves.length>=2){
        leaves[0].textContent='Kade';
        leaves[1].textContent=' New Media';
      }else home.textContent='Kade New Media';
      home.setAttribute('aria-label','Kade New Media ana sayfa');
    });
    var walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode:function(node){
      var tag=node.parentElement&&node.parentElement.tagName;
      return tag==='SCRIPT'||tag==='STYLE'||tag==='TEXTAREA'?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT;
    }});
    var nodes=[],node;
    while((node=walker.nextNode()))nodes.push(node);
    nodes.forEach(function(text){
      if(/Kade Media/i.test(text.nodeValue||''))text.nodeValue=text.nodeValue.replace(/Kade Media/gi,'Kade New Media');
    });
  }
  var hydrated=!!document.querySelector('script[src*="/_next/"]');
  function startEnhancements(){
    /* Do not touch <html> or React-owned text before hydration. Doing so caused
       React error #418 and made the header jump back to its server markup. */
    var waited=0;
    var timer=setInterval(function(){
      waited+=100;
      var probe=document.querySelector('header,main,#__next');
      var reactReady=probe&&Object.keys(probe).some(function(key){return /^__react(?:Fiber|Props)\$/.test(key)});
      if(!reactReady&&waited<6000)return;
      clearInterval(timer);
      setTimeout(function(){
        bindControls();
        setMode(initialMode);
        normalizeBrand();
      },100);
    },100);
  }
  if(hydrated){
    if(document.readyState==='complete')startEnhancements();
    else addEventListener('load',startEnhancements,{once:true});
  }else{
    bindControls();
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setMode(initialMode);normalizeBrand()});
    else{setMode(initialMode);normalizeBrand()}
  }
})();
