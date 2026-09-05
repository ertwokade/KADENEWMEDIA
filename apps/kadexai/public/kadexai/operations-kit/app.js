"use strict";
// =====================================================================
// Kade Organizasyon Kiti -- app.js v5 -- Definitive Edition
// Temiz, tam, çakışmasız mimari
// =====================================================================

const STORE_KEY   = "kade-kit-v5";
const UNDO_LIMIT  = 15;
const MAX_LOG     = 80;
const MAX_HISTORY = 10;
const APP_BASE_PATH = (()=>{const marker="/operations-kit/",index=location.pathname.indexOf(marker);return index>0?location.pathname.slice(0,index):""})();
function apiUrl(path){return `${APP_BASE_PATH}${path.startsWith("/")?path:`/${path}`}`}

// ── FORMAT YARDIMCILARI ───────────────────────────────────────────────
const fmt = {
  try: new Intl.NumberFormat("tr-TR", { style:"currency", currency:"TRY", maximumFractionDigits:0 }),
  usd: new Intl.NumberFormat("en-US", { style:"currency", currency:"USD", minimumFractionDigits:2, maximumFractionDigits:2 }),
  date(d){ if(!d)return"—"; try{ return new Intl.DateTimeFormat("tr-TR",{day:"numeric",month:"short"}).format(new Date(d)) }catch{ return d } },
  dt(ts){ try{ return new Intl.DateTimeFormat("tr-TR",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}).format(new Date(ts)) }catch{ return "" } },
  time(){ return new Date().toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"}) },
};
function providerCost(value,suffix=""){
  const usd=num(value,0),rate=num(state?.settings?.usdTryRate,0);
  return rate>0?`${fmt.try.format(usd*rate)} (${fmt.usd.format(usd)}${suffix})`:`${fmt.usd.format(usd)}${suffix} · sağlayıcı USD`;
}

// ── SABİTLER ─────────────────────────────────────────────────────────
const stages = [
  {id:"draft",      label:"Taslaklar",       color:"indigo"},
  {id:"production", label:"Prodüksiyon",      color:"teal"},
  {id:"post",       label:"Post-prodüksiyon", color:"gold"},
  {id:"published",  label:"Yayınlanan",       color:"violet"},
  {id:"cancelled",  label:"İptal",            color:"coral"},
];

const productionTags = [
  {id:"vlog",         label:"Vlog",       color:"teal"},
  {id:"komedi",       label:"Komedi",     color:"gold"},
  {id:"challenge",    label:"Challenge",  color:"coral"},
  {id:"seyahat",      label:"Seyahat",    color:"indigo"},
  {id:"kolaborasyon", label:"Kolabo",     color:"violet"},
];

const imageModels = [
  {id:"nano-banana-pro", name:"Nano Banana Pro", cost:0.18},
  {id:"nano-banana-2",   name:"Nano Banana 2",   cost:0.14},
  {id:"gpt-image-2",     name:"GPT Image 2",     cost:0.22},
];

const videoModels = [
  {id:"seadance-2",   name:"Seadance 2.0",  base:3.0},
  {id:"veo-style",    name:"Veo Style",     base:2.4},
  {id:"runway-style", name:"Runway Style",  base:2.1},
];

const themeDefinitions = [
  {name:"Doğallık ve samimiyet",  keywords:["samimi","doğal","gerçek","içten","sohbet"],        next:"Doğal ekip sohbetlerini kesme; kamera arkası anları kısa bloklar halinde tut."},
  {name:"Konsept övgüsü",         keywords:["konsept","seri","format","tur","restoran","bölüm"], next:"Konsepti seri formatına çevir; her bölümde küçük bir kural değişikliği dene."},
  {name:"Ekip dinamiği",          keywords:["emir","emre","cagri","berkin","merve","ekip"],      next:"Ekip eslesmelerini baslikta ve kapaklarda daha gorünür yap."},
  {name:"Kurgu ve tempo",         keywords:["kurgu","tempo","uzun","sıkıcı","akıcı","montaj"],   next:"Orta bolumde tempo olcumu yap; 30s uzun dusuk aksiyon bloklarini isaretle."},
  {name:"Kamusal alan sesi",      keywords:["gürültü","otobüs","rahatsız","ses","bagir"],        next:"Kamusal alan sahnelerinde daha kısa, kontrollü ses kullan."},
  {name:"Kural ihlali",           keywords:["galeri","telefon","bakma","hile","uydurma"],        next:"Kural ihlali algılanan anları çıkar ya da ekranda gerekçelendir."},
];

const positiveWords = ["mükemmel","harika","çok iyi","efsane","güzel","bayıldım","seviyorum","komik","samimi","başarılı","süper","güldüm","inanılmaz"];
const negativeWords = ["kötü","sıkıcı","fazla","rahatsız","gürültü","beğenmedi","uzun","hile","yapay","eksik","berbat","zayıf"];
const stopWords = new Set("ve veya ama için gibi daha çok bir bu su o da de mi ma mu mü ile ise ben sen biz siz onlar burada böyle olarak kadar sonra önce zaten hep hiç ne nasıl ya yani sadece".split(" "));

const defaultPromptTemplates = [
  {id:"tpl-1", name:"YouTube Kapak",    prompt:"@ana-kişi ve @ikinci-kişi yüksek kontrast neon arka planda, şok ifadesiyle kameraya bakıyor, sinematik ışık, YouTube kapak kompozisyonu."},
  {id:"tpl-2", name:"Restoran Konsept", prompt:"@ana-kişi 1 yıldızlı restoranın önünde, eski soluk tabela ön planda, dramatik sinema renklendirmesi, büyütecle yemeği inceliyor."},
  {id:"tpl-3", name:"Challenge Kapak",  prompt:"@ana-kişi ve @ikinci-kişi abartılı yarışma pozu, konfeti, trofeler arka planda, ultra-canlı renk paleti."},
  {id:"tpl-4", name:"Seyahat Açılış",   prompt:"@ana-kişi egzotik şehir siluetinin önünde, güneş batıyor, sinematik seyahat belgeseli estetiği, geniş açı kompozisyon."},
  {id:"tpl-5", name:"Kamera Arkası",    prompt:"Prodüksiyon ekibi sette çalışırken, kameralar ve ışıklar görünür, samimi belgesel stili, soft bokeh arka plan."},
];




/**
 * Özelleştirilebilir kısayollar.
 *
 * Eskiden hem tuşlar hem tablo ayrı ayrı sabit yazılıydı; ikisi birbirini
 * tekrar ediyordu ve tablo gerçeği yansıtmıyordu (kaldırılan Radar görünümü
 * hâlâ listedeydi). Artık tek kaynak burası; kullanıcının değiştirdiği tuşlar
 * state.shortcuts içinde saklanır.
 */
const SHORTCUT_ACTIONS = [
  {id:"palette",  label:"Komut paleti",        varsayilan:"ctrl+k", calistir:()=>openCommandPalette()},
  {id:"undo",     label:"Son işlemi geri al",  varsayilan:"ctrl+z", calistir:()=>undoLast()},
  {id:"backup",   label:"JSON yedek al",       varsayilan:"ctrl+b", calistir:()=>doBackup()},
  {id:"sentscan", label:"SentScan analiz et",  varsayilan:"ctrl+e", calistir:()=>{navigateTo("comments");runCommentAnalysis()}},
  {id:"calendar", label:"Yayın takvimini aç",  varsayilan:"alt+t",  calistir:()=>navigateTo("calendar")},
  {id:"clients",  label:"Müşteri & teslim aç", varsayilan:"alt+m",  calistir:()=>navigateTo("clients")},
];

/** Tarayıcının geri alamayacağımız kendi kısayolları. */
const KORUMALI_KOMBOLAR = new Set(["ctrl+w","ctrl+t","ctrl+n","ctrl+q","ctrl+r","ctrl+j","ctrl+p"]);

/** Olaydan kanonik kombo üretir. Mac'te Cmd, Ctrl ile aynı sayılır. */
function komboOf(e){
  const p=[];
  if(e.ctrlKey||e.metaKey)p.push("ctrl");
  if(e.altKey)p.push("alt");
  if(e.shiftKey)p.push("shift");
  const k=String(e.key||"").toLocaleLowerCase("en-US");
  if(["control","meta","alt","shift"].includes(k))return "";
  p.push(k);
  return p.join("+");
}

function komboEtiketi(kombo){
  return String(kombo||"").split("+").map(x=>x==="ctrl"?"Ctrl":x==="alt"?"Alt":x==="shift"?"Shift":x.toUpperCase()).join(" + ");
}

/** Etkin kısayol eşlemesi: varsayılanlar + kullanıcının değiştirdikleri. */
function aktifKisayollar(){
  const ozel=isObj(state.shortcuts)?state.shortcuts:{};
  const harita={};
  for(const a of SHORTCUT_ACTIONS){
    const kombo=str(ozel[a.id])||a.varsayilan;
    harita[a.id]=kombo;
  }
  return harita;
}

const sampleComments = [
  {likes:421, text:"Bu format çok samimi olmuş, dusuk puanlı tur serisi kesinlikle devam etmeli!"},
  {likes:318, text:"Emir ve Emre'nin dinamiği efsane, kahkaha attım."},
  {likes:274, text:"Samimi anların bu kadar doğal çıkması çok nadir bir şey, ekip kimyası süper."},
  {likes:210, text:"Otobüs içinde biraz fazla gürültü var, insanlar rahatsız olmuş olabilir."},
  {likes:166, text:"Galeriye bakma kısmı biraz hile gibi durdu, sonraki bölümde olmasa daha iyi."},
  {likes:144, text:"Kurgu çok akıcı, doğallık hissi videoyu taşıyor. Montaj harika!"},
  {likes:99,  text:"Dusuk bütçeli restoran konsepti ayri bir seri olsun, çok iyi fikir."},
  {likes:77,  text:"[16:58] Kilise mum yakma sahnesi inanılmazdı, o an gerçekten büyüleyiciydi."},
  {likes:64,  text:"Video biraz uzun ama samimi olduğu için sıkılmadım, efsane içerik."},
  {likes:39,  text:"Kapak fotoğrafı konsepti çok iyi, restoran puanı daha büyük yazılabilir."},
  {likes:24,  text:"[23:44] Tavernada geçen diyalog çok güzeldi, o bölüm çok doğal çıkmış."},
  {likes:18,  text:"Ses miksajı biraz eksik kalmış, arka plan müziği bazen konuşmanın önüne geciyor."},
  {likes:12,  text:"Her bölümde farklı bir ekip üyesi öne çıksa, seyirci etkileşimi artar."},
];

// ── BAŞLANGIÇ VERİSİ ─────────────────────────────────────────────────
const initialState = {
  settings:{ teamName:"Kade Kit", monthlyBudget:650000, usdTryRate:0, members:["Kadir","Emir","Emre","Çağrı","Berkin","Merve"] },
  references:[
    {id:"ref-main",    tag:"@ana-kişi",    label:"Ana kişi",        tone:"indigo"},
    {id:"ref-second",  tag:"@ikinci-kişi", label:"Ikinci kişi",     tone:"teal"},
    {id:"ref-costume", tag:"@kostum",      label:"Padişah kostümü", tone:"gold"},
  ],
  productions:[
    {
      id:"p-001", title:"Hangisi Gerçek: Medium Bölümü",
      channel:"Kade Media", stage:"production",
      shootDate:"2026-06-28", publishDate:"2026-07-05",
      ideaId:"i-001", owner:"Emir", tags:["vlog","challenge"],
      updates:["Konuk listesi netleşiyor.","Mekân onayı bekleniyor."],
      tasks:[
        {id:"t-001",title:"Konuk teyidi al",      assignee:"Çağrı",  priority:"Yüksek",due:"2026-06-25",done:false,desc:"3 konuk listesini onayla, 1 yedek hazırla."},
        {id:"t-002",title:"Çekim listesi hazırla",assignee:"Emir",   priority:"Orta",  due:"2026-06-26",done:false,desc:""},
      ],
      budgets:[
        {category:"Ulaşım", items:[{id:"bi-001",label:"Otopark",amount:310,spender:"Emir"},{id:"bi-002",label:"Taksi",amount:600,spender:"Emre"}]},
        {category:"Prop",   items:[{id:"bi-003",label:"Masa salı",amount:420,spender:"Emir"},{id:"bi-004",label:"Lamba",amount:1260,spender:"Merve"}]},
      ],
    },
    {
      id:"p-002", title:"En Düşük Puanlı Restoranlar",
      channel:"Kade Media", stage:"post",
      shootDate:"2026-06-14", publishDate:"2026-06-30",
      ideaId:"i-002", owner:"Berkin", tags:["vlog","komedi"],
      updates:["Kapak için 40 görsel denendi.","Ses miksajı ikinci turda."],
      tasks:[
        {id:"t-003",title:"Kapak varyasyonlarını seç",assignee:"Berkin",priority:"Yüksek",due:"2026-06-24",done:false,desc:"En az 5 versiyonu kıyasla."},
        {id:"t-004",title:"Final render kontrolü",    assignee:"Merve", priority:"Orta",  due:"2026-06-27",done:false,desc:""},
      ],
      budgets:[
        {category:"Yemek",         items:[{id:"bi-005",label:"Restoran denemeleri",amount:18400,spender:"Çağrı"},{id:"bi-006",label:"Ekip yemeği",amount:3200,spender:"Emir"}]},
        {category:"Görsel üretim", items:[{id:"bi-007",label:"Banana kapak denemeleri",amount:2150,spender:"Berkin"}]},
      ],
    },
    {
      id:"p-003", title:"Paris Katakombları",
      channel:"Kade V2", stage:"published",
      shootDate:"2026-05-18", publishDate:"2026-06-10",
      ideaId:"i-003", owner:"Merve", tags:["seyahat"],
      updates:["Yayınlandı, yorum analizi olumlu."],
      tasks:[{id:"t-005",title:"Yorum analizini raporla",assignee:"Emre",priority:"Düşük",due:"2026-06-24",done:true,desc:""}],
      budgets:[{category:"Seyahat",items:[{id:"bi-008",label:"Uçak",amount:142000,spender:"Merve"},{id:"bi-009",label:"Konaklama",amount:88000,spender:"Emir"}]}],
    },
    {
      id:"p-004", title:"Oyuncak Kapma Makinesi Kaçışı",
      channel:"Kade V2", stage:"draft",
      shootDate:"2026-07-09", publishDate:"2026-07-19",
      ideaId:"i-004", owner:"Çağrı", tags:["challenge","komedi"],
      updates:["Banana video referansları hazırlanıyor."],
      tasks:[{id:"t-006",title:"Mekân izinleri",assignee:"Çağrı",priority:"Yüksek",due:"2026-07-01",done:false,desc:"AVM yönetiminden yazılı izin al."}],
      budgets:[{category:"Mekân",items:[{id:"bi-010",label:"Ön ödeme",amount:12500,spender:"Çağrı"}]}],
    },
    {
      id:"p-005", title:"Dedektif Serisi: Galeri Kuralı",
      channel:"Kade Media", stage:"cancelled",
      shootDate:"2026-06-03", publishDate:"2026-06-22",
      ideaId:"i-005", owner:"Emre", tags:[],
      updates:["Yorum geri bildirimi nedeniyle iptal edildi."],
      tasks:[],
      budgets:[{category:"Hazırlık",items:[{id:"bi-011",label:"Araştırma",amount:5600,spender:"Emre"}]}],
    },
  ],
  ideas:[
    {id:"i-001",title:"Hangisi Gerçek: Medium",       channel:"Kade Media",notes:"Konukların iddialarını ekip canlı test eder."},
    {id:"i-002",title:"En Düşük Puanlı Restoranlar",  channel:"Kade Media",notes:"1 yıldızlı mekânlardan yemek ve dürüst yorum."},
    {id:"i-003",title:"Paris Katakombları",            channel:"Kade V2",      notes:"Magnus Mitbo ve Sam & Colby referanslı keşif."},
    {id:"i-004",title:"Oyuncak Kapma Makinesi",        channel:"Kade V2",      notes:"İki kişi makinenin içinde saklanır."},
    {id:"i-005",title:"Dedektif: Galeriye Bakma",      channel:"Kade Media",notes:"Yorumlardan gelen eleştiri sonrası kural netleşti."},
  ],
  inventory:[
    {id:"inv-001",name:"LED panel",      qty:8,  location:"Depo A / Raf 2"},
    {id:"inv-002",name:"Masa salı",      qty:2,  location:"Prop kutusu"},
    {id:"inv-003",name:"Yaka mikrofonu", qty:14, location:"Ses çantası"},
    {id:"inv-004",name:"Oyuncak ayıcık", qty:34, location:"Yeni ofis depo"},
    {id:"inv-005",name:"Gimbal",         qty:3,  location:"Kamera çantası"},
    {id:"inv-006",name:"ND filtresi",    qty:12, location:"Depo A / Raf 1"},
  ],
  docs:[
    {title:"Ekip Bilgileri & IK",      type:"IK",      owner:"Operasyon",  icon:"👥"},
    {title:"Sirket Hesapları",          type:"Finans",  owner:"Yönetim",    icon:"💰"},
    {title:"Grafik & Marka Paketleri",  type:"Tasarım", owner:"Kurgu",      icon:"🎨"},
    {title:"Prodüksiyon Sözlesmeleri",  type:"Hukuk",   owner:"Prodüksiyon",icon:"📄"},
    {title:"AI Arac Rehberleri",        type:"Teknik",  owner:"Tüm ekip",   icon:"🤖"},
    {title:"Kase ve Ücret Tablosu",     type:"Finans",  owner:"Yönetim",    icon:"💳"},
  ],
  media:[],videos:[],brainstorm:[],
  sourceVideo:null,
  transcriptText:"",
  transcriptName:"",
  transcriptInsights:null,
  users:[
    {name:"Kadir",  images:42,  videos:9,  spend:87},
    {name:"Berkin", images:118, videos:3,  spend:52},
    {name:"Merve",  images:35,  videos:5,  spend:31},
  ],
  totalUsdSpent:170,
  clients:[],
  promptHistory:[],
  promptTemplates:null,
  analysisHistory:[],
  activityLog:[],
  kanbanTagFilter:null,
  selectedTasks:[],
  currentPageId:"pg-001",
  recentPages:[],
  pages:[
    {id:"pg-001",title:"Başlarken",icon:"👋",cover:null,parentId:null,isFavorite:true,inTrash:false,createdAt:Date.now(),updatedAt:Date.now(),blocks:[
      {id:"b-001",type:"heading1",content:"Kade Kit'e Hoş Geldin 🎬"},
      {id:"b-002",type:"paragraph",content:"Bu uygulama YouTube prodüksiyon ekiplerine özel bir organizasyon kitidir. Sol menüden sayfalar oluşturabilir, notlar tutabilirsin."},
      {id:"b-003",type:"heading2",content:"Neler Yapabilirsin?"},
      {id:"b-004",type:"bulletList",content:"SentScan ile yorum analizi yap"},
      {id:"b-005",type:"bulletList",content:"Prodüksiyon CRM ile videoları takip et"},
      {id:"b-006",type:"bulletList",content:"Banana Studio ile AI görseller üret"},
      {id:"b-007",type:"bulletList",content:"Bu sayfalar bölümünde Notion gibi not tut"},
      {id:"b-008",type:"divider",content:""},
      {id:"b-009",type:"callout",content:"İpucu: boş bir satırda '/' yazarak blok menüsünü açabilirsin.",emoji:"💡"},
    ]},
    {id:"pg-002",title:"Toplantı Notu Şablonu",icon:"📝",cover:null,parentId:null,isFavorite:false,inTrash:false,createdAt:Date.now(),updatedAt:Date.now(),blocks:[
      {id:"b-010",type:"heading1",content:"Toplantı Notları"},
      {id:"b-011",type:"paragraph",content:"📅 Tarih: ___   👥 Katılımcılar: ___"},
      {id:"b-012",type:"heading2",content:"Gündem"},
      {id:"b-013",type:"numberedList",content:"Gündem maddesi 1",num:1},
      {id:"b-014",type:"heading2",content:"Kararlar"},
      {id:"b-015",type:"todo",content:"Karar 1",done:false},
      {id:"b-016",type:"heading2",content:"Aksiyon Maddeleri"},
      {id:"b-017",type:"todo",content:"Sorumlu: ___   Teslim: ___",done:false},
    ]},
    {id:"pg-003",title:"Ekip Referansları",icon:"🗂",cover:null,parentId:null,isFavorite:false,inTrash:false,createdAt:Date.now(),updatedAt:Date.now(),blocks:[
      {id:"b-018",type:"heading1",content:"Ekip Bilgileri"},
      {id:"b-019",type:"paragraph",content:"Ekip üyelerinin rollerini ve iletişim bilgilerini buraya ekle."},
      {id:"b-020",type:"table",rows:[["Ad","Rol","İletişim","Notlar"],["Kadir","Yönetmen","—","—"],["Emir","Kameraman","—","—"],["Emre","Kurgu","—","—"],["Berkin","Kapak","—","—"]],headerRow:true},
    ]},
    {id:"pg-004",title:"Vibe Coding Notları",icon:"💻",cover:null,parentId:"pg-001",isFavorite:false,inTrash:false,createdAt:Date.now(),updatedAt:Date.now(),blocks:[
      {id:"b-021",type:"heading1",content:"Vibe Coding Rehberi"},
      {id:"b-022",type:"callout",content:"Bu notlar Vibe Coding bölümündeki adımları tamamlar.",emoji:"🚀"},
      {id:"b-023",type:"heading2",content:"Faydalı Promptlar"},
      {id:"b-024",type:"code",content:"Bir YouTube prodüksiyon takip uygulaması yaz.\nKullanıcılar: Yapımcı ekibi\nYapabilsin: Video durumu takip, görev yönetimi\nDeploy: Vercel",lang:"text"},
      {id:"b-025",type:"heading2",content:"Araçlar"},
      {id:"b-026",type:"bulletList",content:"Google AI Studio — Ücretsiz Gemini API"},
      {id:"b-027",type:"bulletList",content:"Cursor — AI destekli kod editörü"},
      {id:"b-028",type:"bulletList",content:"Vercel — Ücretsiz deploy"},
    ]},
  ],
};

// ── STATE ─────────────────────────────────────────────────────────────
let state = null;
let undoStack = [];
let currentProductionId = null;
let activeFilter = "all";
let selectedOperationsModel = "auto";
let stateRevision = 0;
let cloudSaveTimer = null;
let dragSrcId = null;
let activeWordFilter = null;
let commandPaletteIndex = 0;
let kanbanSearch = "";
let _pageDragId = null;
let sourceVideoUrl = null;

// ── PERSISTENCE ───────────────────────────────────────────────────────
function clone(v){ return JSON.parse(JSON.stringify(v)) }
function uid(p="x"){ return `${p}-${Math.random().toString(36).slice(2,9)}` }

const memoryStore = {};
function getStorage(){
  try{ return typeof window!=="undefined" && window.localStorage ? window.localStorage : null }
  catch{ return null }
}
function storageGet(key){
  try{ const s=getStorage(); return s ? s.getItem(key) : (memoryStore[key] ?? null) }
  catch{ return memoryStore[key] ?? null }
}
function storageSet(key,value){
  try{ const s=getStorage(); if(s){ s.setItem(key,value); return true } }
  catch{}
  memoryStore[key]=value;
  return false;
}

function deepMerge(base,patch){
  if(typeof patch!=="object"||!patch||Array.isArray(patch))return patch;
  const out={...base};
  for(const k of Object.keys(patch)){
    if(Array.isArray(patch[k]))out[k]=patch[k];
    else if(patch[k]&&typeof patch[k]==="object")out[k]=deepMerge(base[k]||{},patch[k]);
    else out[k]=patch[k];
  }
  return out;
}

function loadState(){
  try{
    const s=storageGet(STORE_KEY);
    if(!s)return buildCleanInitial();
    const saved=JSON.parse(s);
    if(isUntouchedStarterState(saved))return buildCleanInitial();
    removeLegacyStarterData(saved);
    const explicitEmptyArrays=new Set(isObj(saved)?Object.keys(saved).filter(k=>Array.isArray(saved[k])&&!saved[k].length):[]);
    let merged=normalizeState(deepMerge(buildInitial(),saved),explicitEmptyArrays);
    // Migrate Orkun references
    merged.settings.members=merged.settings.members.map(m=>m==="Orkun"?"Kadir":m);
    if(merged.users)merged.users=merged.users.map(u=>u.name==="Orkun"?{...u,name:"Kadir"}:u);
    merged.productions.forEach(p=>{if(p.channel==="Orkun Isitmak")p.channel="Kade Media";if(p.channel==="Orkun V2")p.channel="Kade V2"});
    merged.ideas.forEach(i=>{if(i.channel==="Orkun Isitmak")i.channel="Kade Media";if(i.channel==="Orkun V2")i.channel="Kade V2"});
    // Pages migration
    if(!explicitEmptyArrays.has("pages")&&(!merged.pages||!merged.pages.length))merged.pages=clone(initialState.pages);
    if(!merged.currentPageId&&merged.pages.length)merged.currentPageId=merged.pages[0].id;
    // Prompt templates migration
    if(!explicitEmptyArrays.has("promptTemplates")&&(!merged.promptTemplates||!merged.promptTemplates.length))merged.promptTemplates=clone(defaultPromptTemplates);
    if(typeof merged.transcriptText!=="string")merged.transcriptText="";
    if(typeof merged.transcriptName!=="string")merged.transcriptName="";
    if(merged.transcriptText&&!merged.transcriptInsights)merged.transcriptInsights=analyzeTranscriptText(merged.transcriptText);
    return normalizeState(merged,explicitEmptyArrays);
  }catch{ return buildCleanInitial() }
}

function buildInitial(){
  const s=clone(initialState);
  s.promptTemplates=clone(defaultPromptTemplates);
  return s;
}

function isObj(v){ return v&&typeof v==="object"&&!Array.isArray(v) }
function arr(v){ return Array.isArray(v)?v:[] }
function str(v,fallback=""){ return typeof v==="string"?v:fallback }
function num(v,fallback=0){ const n=Number(v); return Number.isFinite(n)?n:fallback }
function bool(v){ return Boolean(v) }
function idOf(v,prefix){ const value=str(v);return /^[a-zA-Z0-9_-]{1,128}$/.test(value)?value:uid(prefix) }

function normalizeState(input,explicitEmptyArrays=new Set()){
  const base=clone(initialState);
  const s=isObj(input)?input:{};
  const settings=isObj(s.settings)?s.settings:{};
  const members=arr(settings.members).map(m=>str(m).trim()).filter(Boolean);
  s.settings={
    ...base.settings,
    ...settings,
    teamName:str(settings.teamName,base.settings.teamName),
    monthlyBudget:num(settings.monthlyBudget,base.settings.monthlyBudget),
    usdTryRate:num(settings.usdTryRate,base.settings.usdTryRate),
    members:members.length?members:clone(base.settings.members),
  };

  s.references=arr(s.references).map((r,i)=>normalizeReference(r,base.references[i%base.references.length])).filter(Boolean);
  if(!s.references.length&&!explicitEmptyArrays.has("references"))s.references=clone(base.references);

  s.ideas=arr(s.ideas).map(normalizeIdea).filter(Boolean);
  if(!s.ideas.length&&!explicitEmptyArrays.has("ideas"))s.ideas=clone(base.ideas);

  s.productions=arr(s.productions).map(p=>normalizeProduction(p,s.settings.members)).filter(Boolean);
  if(!s.productions.length&&!explicitEmptyArrays.has("productions"))s.productions=clone(base.productions);

  s.inventory=arr(s.inventory).map(normalizeInventoryItem).filter(Boolean);
  if(!s.inventory.length&&!explicitEmptyArrays.has("inventory"))s.inventory=clone(base.inventory);

  s.docs=arr(s.docs).map(normalizeDoc).filter(Boolean);
  if(!s.docs.length&&!explicitEmptyArrays.has("docs"))s.docs=clone(base.docs);

  s.users=arr(s.users).map(normalizeUser).filter(Boolean);
  if(!s.users.length)s.users=clone(base.users);

  s.media=arr(s.media).map(normalizeMedia).filter(Boolean);
  s.videos=arr(s.videos).map(normalizeVideo).filter(Boolean);
  s.brainstorm=arr(s.brainstorm).map(normalizeBrainstorm).filter(Boolean);
  // Kısayollar: yalnızca tanımlı eylem kimlikleri ve güvenli kombo biçimi.
  {
    const gelen=isObj(s.shortcuts)?s.shortcuts:{};
    const temiz={};
    for(const a of SHORTCUT_ACTIONS){
      const k=str(gelen[a.id]).toLocaleLowerCase("en-US");
      if(/^(ctrl\+)?(alt\+)?(shift\+)?[a-z0-9]$/.test(k)&&!KORUMALI_KOMBOLAR.has(k))temiz[a.id]=k;
    }
    s.shortcuts=temiz;
  }

  // Müşteri kayıtları: her alan tek tek doğrulanır, teslimler de öyle.
  s.clients=arr(s.clients).map(c=>({
    id:idOf(c?.id,"cli"),
    name:str(c?.name).slice(0,80),
    contact:str(c?.contact).slice(0,120),
    note:str(c?.note).slice(0,400),
    createdAt:str(c?.createdAt),
    deliveries:arr(c?.deliveries).map(d=>({
      id:idOf(d?.id,"dlv"),
      title:str(d?.title).slice(0,120),
      due:/^\d{4}-\d{2}-\d{2}$/.test(str(d?.due))?str(d?.due):"",
      status:["pending","progress","done"].includes(str(d?.status))?str(d?.status):"pending",
    })).filter(d=>d.title),
  })).filter(c=>c.name);
  s.promptHistory=arr(s.promptHistory).map(p=>str(p)).filter(Boolean);
  s.analysisHistory=arr(s.analysisHistory).map(normalizeAnalysis).filter(Boolean);
  s.activityLog=arr(s.activityLog).map(normalizeLog).filter(Boolean);
  s.selectedTasks=arr(s.selectedTasks).map(id=>str(id)).filter(Boolean);

  s.totalUsdSpent=num(s.totalUsdSpent,base.totalUsdSpent);
  s.kanbanTagFilter=str(s.kanbanTagFilter,null);
  s.sourceVideo=isObj(s.sourceVideo)?s.sourceVideo:null;
  s.transcriptText=str(s.transcriptText,"");
  s.transcriptName=str(s.transcriptName,"");
  s.transcriptInsights=isObj(s.transcriptInsights)?s.transcriptInsights:null;
  s.promptTemplates=arr(s.promptTemplates).map(normalizeTemplate).filter(Boolean);
  if(!s.promptTemplates.length&&!explicitEmptyArrays.has("promptTemplates"))s.promptTemplates=clone(defaultPromptTemplates);

  s.pages=arr(s.pages).map(normalizePage).filter(Boolean);
  if(!s.pages.length&&!explicitEmptyArrays.has("pages"))s.pages=clone(base.pages);
  const livePages=s.pages.filter(p=>!p.inTrash);
  s.currentPageId=livePages.some(p=>p.id===s.currentPageId)?s.currentPageId:(livePages[0]?.id||s.pages[0]?.id||null);
  s.recentPages=arr(s.recentPages).map(id=>str(id)).filter(id=>s.pages.some(p=>p.id===id)).slice(0,10);
  return s;
}

function normalizeReference(r,fallback={}){
  if(!isObj(r))r={};
  const tag=str(r.tag,fallback.tag||"@ref");
  return{id:idOf(r.id,"ref"),tag:tag.startsWith("@")?tag:`@${tag}`,label:str(r.label,fallback.label||tag.replace("@","")),tone:str(r.tone,fallback.tone||"teal")};
}

function normalizeIdea(i){
  if(!isObj(i))return null;
  return{id:idOf(i.id,"i"),title:str(i.title,"Başlıksız fikir"),channel:str(i.channel,"Kade Media"),notes:str(i.notes,"")};
}

function normalizeProduction(p,members=[]){
  if(!isObj(p))return null;
  const stageIds=stages.map(s=>s.id);
  const owner=str(p.owner,members[0]||"Operasyon");
  const budgets=arr(p.budgets).map(normalizeBudgetGroup).filter(Boolean);
  return{
    id:idOf(p.id,"p"),
    title:str(p.title,"Başlıksız prodüksiyon"),
    channel:str(p.channel,"Kade Media"),
    stage:stageIds.includes(p.stage)?p.stage:"draft",
    shootDate:str(p.shootDate,""),
    publishDate:str(p.publishDate,""),
    ideaId:str(p.ideaId,""),
    owner,
    tags:arr(p.tags).map(t=>str(t)).filter(Boolean),
    updates:arr(p.updates).map(u=>str(u)).filter(Boolean),
    tasks:arr(p.tasks).map(t=>normalizeTask(t,owner)).filter(Boolean),
    budgets:budgets.length?budgets:[{category:"Hazırlık",items:[]}],
  };
}

function normalizeTask(t,owner){
  if(!isObj(t))return null;
  return{id:idOf(t.id,"t"),title:str(t.title,"Başlıksız görev"),assignee:str(t.assignee,owner||"Operasyon"),priority:str(t.priority,"Orta"),due:str(t.due,""),done:bool(t.done),desc:str(t.desc,"")};
}

function normalizeBudgetGroup(g){
  if(!isObj(g))return null;
  return{category:str(g.category,"Hazırlık"),items:arr(g.items).map(normalizeBudgetItem).filter(Boolean)};
}

function normalizeBudgetItem(i){
  if(!isObj(i))return null;
  return{id:idOf(i.id,"bi"),label:str(i.label,"Kalem"),amount:num(i.amount,0),spender:str(i.spender,"Operasyon")};
}

function normalizeInventoryItem(i){
  if(!isObj(i))return null;
  return{id:idOf(i.id,"inv"),name:str(i.name,"Ürün"),qty:num(i.qty,0),location:str(i.location,"")};
}

function normalizeDoc(d){
  if(!isObj(d))return null;
  return{id:idOf(d.id,"doc"),title:str(d.title,"Doküman"),type:str(d.type,"Genel"),owner:str(d.owner,"Operasyon"),icon:str(d.icon,"📄")};
}

function normalizeUser(u){
  if(!isObj(u))return null;
  return{name:str(u.name,"Kullanıcı"),images:num(u.images,0),videos:num(u.videos,0),spend:num(u.spend,0)};
}

function normalizeMedia(m){
  if(!isObj(m))return null;
  return{id:idOf(m.id,"img"),title:str(m.title,"Görsel"),prompt:str(m.prompt,""),model:str(m.model,""),cost:num(m.cost,0),src:str(m.src,"")};
}

function normalizeVideo(v){
  if(!isObj(v))return null;
  return{id:idOf(v.id,"vid"),title:str(v.title,"Video"),prompt:str(v.prompt,""),model:str(v.model,""),cost:num(v.cost,0),dur:num(v.dur,0),src:str(v.src,"")};
}

function normalizeBrainstorm(b){
  if(!isObj(b))return null;
  return{id:idOf(b.id,"bs"),prompt:str(b.prompt,""),idx:num(b.idx,0)};
}

function normalizeTemplate(t){
  if(!isObj(t))return null;
  return{id:idOf(t.id,"tpl"),name:str(t.name,"Şablon"),prompt:str(t.prompt,"")};
}

function normalizeAnalysis(a){
  if(!isObj(a))return null;
  return{id:idOf(a.id,"as"),videoUrl:str(a.videoUrl,""),rawComments:str(a.rawComments,""),ts:num(a.ts,Date.now()),total:num(a.total,0),score:num(a.score,0),themes:arr(a.themes)};
}

function normalizeLog(l){
  if(!isObj(l))return null;
  return{id:idOf(l.id,"log"),message:str(l.message,""),type:str(l.type,"info"),ts:num(l.ts,Date.now())};
}

function normalizePage(p){
  if(!isObj(p))return null;
  const blocks=arr(p.blocks).map(normalizeBlock).filter(Boolean);
  return{
    id:idOf(p.id,"pg"),
    title:str(p.title,"Başlıksız"),
    icon:str(p.icon,"📄"),
    cover:p.cover?str(p.cover):null,
    parentId:p.parentId?str(p.parentId):null,
    isFavorite:bool(p.isFavorite),
    inTrash:bool(p.inTrash),
    createdAt:num(p.createdAt,Date.now()),
    updatedAt:num(p.updatedAt,Date.now()),
    relatedType:["production","client","idea","document"].includes(str(p.relatedType))?str(p.relatedType):"",
    relatedId:str(p.relatedId,""),
    blocks:blocks.length?blocks:[{id:uid("b"),type:"paragraph",content:""}],
  };
}

function normalizeBlock(b){
  if(!isObj(b))return null;
  const type=str(b.type,"paragraph");
  const out={...b,id:idOf(b.id,"b"),type,content:str(b.content,"")};
  if(type==="todo")out.done=bool(b.done);
  if(type==="callout")out.emoji=str(b.emoji,"💡");
  if(type==="code")out.lang=str(b.lang,"javascript");
  if(type==="table")out.rows=arr(b.rows).map(row=>arr(row).map(cell=>str(cell)));
  if(type==="columns")out.cols=arr(b.cols).map(c=>({content:isObj(c)?str(c.content,""):str(c,"")}));
  if(type==="toggle")out.childBlocks=arr(b.childBlocks).map(normalizeBlock).filter(Boolean);
  return out;
}

function saveState(){
  const persisted=storageSet(STORE_KEY,JSON.stringify(state));
  stateRevision++;
  scheduleCloudSave();
  const el=document.getElementById("saveStatus");
  if(el)el.textContent=`${persisted?"Kaydedildi":"Geçici kayıt"} ${fmt.time()}`;
  updateBadge();
  syncUndoBtn();
  if(operationsReportingReady)scheduleSilentOperationReport();
}

function buildCleanInitial(){
  const s=buildInitial();
  s.settings={teamName:"Kade Media",monthlyBudget:0,usdTryRate:0,members:["Kadir"]};
  s.references=[];
  s.productions=[];
  s.ideas=[];
  s.inventory=[];
  s.docs=[];
  s.media=[];
  s.videos=[];
  s.brainstorm=[];
  s.users=[{name:"Kadir",images:0,videos:0,spend:0}];
  s.totalUsdSpent=0;
  s.clients=[];
  s.shortcuts={};
  s.promptHistory=[];
  s.analysisHistory=[];
  s.activityLog=[];
  s.selectedTasks=[];
  s.recentPages=[];
  s.pages=[{
    id:"pg-start",title:"Başlarken",icon:"K",cover:null,parentId:null,
    isFavorite:true,inTrash:false,createdAt:Date.now(),updatedAt:Date.now(),
    blocks:[
      {id:"b-start-title",type:"heading1",content:"Kade çalışma alanı"},
      {id:"b-start-text",type:"paragraph",content:"Prodüksiyonlarını, görevlerini ve notlarını buradan yönetebilirsin."},
    ],
  }];
  s.currentPageId="pg-start";
  return s;
}

function isUntouchedStarterState(saved){
  if(!isObj(saved)||saved.settings?.monthlyBudget!==650000||saved.totalUsdSpent!==170)return false;
  const ids=arr(saved.productions).map(item=>item?.id).sort().join(",");
  return ids==="p-001,p-002,p-003,p-004,p-005"&&arr(saved.media).length===0&&arr(saved.videos).length===0;
}

function removeLegacyStarterData(saved){
  if(!isObj(saved))return saved;
  const removeIds=(items,ids)=>arr(items).filter(item=>!ids.has(item?.id));
  saved.productions=removeIds(saved.productions,new Set(["p-001","p-002","p-003","p-004","p-005"]));
  saved.ideas=removeIds(saved.ideas,new Set(["i-001","i-002","i-003","i-004","i-005"]));
  saved.inventory=removeIds(saved.inventory,new Set(["inv-001","inv-002","inv-003","inv-004","inv-005","inv-006"]));
  saved.references=removeIds(saved.references,new Set(["ref-main","ref-second","ref-costume"]));
  saved.pages=removeIds(saved.pages,new Set(["pg-001","pg-002","pg-003","pg-004"]));
  if(!saved.pages.length){saved.pages=clone(buildCleanInitial().pages);saved.currentPageId="pg-start"}
  saved.media=arr(saved.media).filter(item=>!String(item?.model||"").includes("(demo)"));
  // Önceki sürümde video formu gerçek bir API çağırmadan kayıt oluşturuyordu.
  saved.videos=[];
  if(saved.settings?.monthlyBudget===650000)saved.settings.monthlyBudget=0;
  if(arr(saved.settings?.members).join(",")==="Kadir,Emir,Emre,Çağrı,Berkin,Merve")saved.settings.members=["Kadir"];
  if(saved.totalUsdSpent===170||arr(saved.users).some(user=>user?.images===118)){
    saved.users=[{name:"Kadir",images:saved.media.length,videos:0,spend:saved.media.reduce((sum,item)=>sum+Number(item?.cost||0),0)}];
    saved.totalUsdSpent=saved.users[0].spend;
  }
  return saved;
}

function scheduleCloudSave(){
  if(!API.features.operationsSync)return;
  clearTimeout(cloudSaveTimer);
  cloudSaveTimer=setTimeout(()=>syncStateToCloud(),700);
}

async function syncStateToCloud(){
  try{
    const response=await fetch(apiUrl("/api/operations-state"),{
      method:"PUT",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({state}),
    });
    if(!response.ok)return;
    const el=document.getElementById("saveStatus");
    if(el)el.textContent=`Buluta kaydedildi ${fmt.time()}`;
  }catch{}
}

async function hydrateRemoteState(){
  const revisionAtStart=stateRevision;
  try{
    const response=await fetch(apiUrl("/api/operations-state"),{cache:"no-store"});
    if(!response.ok)return;
    const payload=await response.json();
    if(payload.state&&revisionAtStart===stateRevision){
      state=normalizeState(deepMerge(buildInitial(),payload.state));
      storageSet(STORE_KEY,JSON.stringify(state));
      renderAll();
      runCommentAnalysis();
      updateBadge();
      syncUndoBtn();
      const el=document.getElementById("saveStatus");
      if(el)el.textContent=`Buluttan eşitlendi ${fmt.time()}`;
      return;
    }
    if(!payload.state)syncStateToCloud();
  }catch{}
}

function snapshotUndo(){ undoStack.push(clone(state)); if(undoStack.length>UNDO_LIMIT)undoStack.shift(); syncUndoBtn() }
function undoLast(){ if(!undoStack.length)return; state=undoStack.pop(); saveState(); renderAll(); showToast("Geri alındı","info") }
function syncUndoBtn(){ const b=document.getElementById("undoBtn"); if(b)b.disabled=!undoStack.length }

// ── AKTİVİTE LOGU ────────────────────────────────────────────────────
function logActivity(message,type="info"){
  state.activityLog=[{id:uid("log"),message,type,ts:Date.now()},...state.activityLog].slice(0,MAX_LOG);
}

// ── API ISTEMCISI (server.js proxy) ──────────────────────────────────
// Bağlı servisler API üzerinden, diğer araçlar açıkça yerel modda çalışır.
const API={ features:{provider:"none",assistant:false,youtube:false,image:false,video:false,operationsSync:false} };
async function loadApiFeatures(){
  try{
    const r=await fetch(apiUrl("/api/config"));
    if(r.ok){
      API.features=await r.json();
      if(API.features.operationsSync)await hydrateRemoteState();
      else state=loadState();
    }else{
      state=loadState();
    }
  }catch{ state=loadState(); /* API durumu okunamazsa yalnızca yerel araçlar açık kalır. */ }
  applyApiFeatures();
  return API.features;
}
async function apiPost(path,body,timeoutMs=12000){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const r=await fetch(apiUrl(path),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body||{}),signal:controller.signal});
    return r.json();
  }finally{
    clearTimeout(timer);
  }
}
async function apiGet(path){ const r=await fetch(apiUrl(path)); return r.json(); }
function applyApiFeatures(){
  // Asistan placeholder / ipucu
  const ai=document.getElementById("assistantInput");
  if(ai) ai.placeholder=API.features.assistant?"Ekibine, bütçeye, görevlere dair sor…":"Yerel verilerde ara…";
  // YouTube yorum cekme butonu
  const btn=document.getElementById("fetchCommentsBtn");
  if(btn) btn.style.display=API.features.youtube?"":"none";
  const badge=document.getElementById("youtubeApiBadge");
  if(badge) badge.textContent=API.features.youtube?"YouTube API bağlı":"API bağlı değil · yorumları yapıştır";
  const videoButton=document.getElementById("videoGenerateButton");
  if(videoButton){
    videoButton.disabled=!API.features.video;
    videoButton.innerHTML=API.features.video?'<i data-lucide="play"></i>Oluştur':'<i data-lucide="clock-3"></i>Yakında';
  }
}

// Modele gonderilecek kompakt ekip ozeti
function buildAssistantContext(){
  try{
    const allSpent=totalSpent();
    const thisMonthSpent=totalSpent(periodProductions("thismonth"));
    const lastMonthSpent=totalSpent(periodProductions("lastmonth"));
    const selectedPeriod=periodLabel(activeFilter);
    const selectedSpent=totalSpent(periodProductions(activeFilter));
    const prods=arr(state.productions).map(p=>`- ${p.title} | asama:${p.stage||"?"} | harcama:${fmt.try.format(productionSpent(p))} | görev:${arr(p.tasks).length}`).slice(0,20).join("\n");
    const tasks=(typeof upcomingTasksList==="function"?upcomingTasksList():[]).slice(0,10).map(t=>`- ${t.task?.title} (${t.task?.assignee||"?"}, teslim:${t.task?.due||"-"})`).join("\n");
    const inv=arr(state.inventory).slice(0,15).map(i=>`- ${i.name}: ${i.qty} adet`).join("\n");
    const ideas=arr(state.ideas).slice(0,10).map(i=>`- ${i.title}`).join("\n");
    return [
      `Aylık bütçe: ${fmt.try.format(state.settings?.monthlyBudget||0)}`,
      `Tüm zamanlar harcaması: ${fmt.try.format(allSpent)}`,
      `Bu ay harcanan: ${fmt.try.format(thisMonthSpent)}`,
      `Geçen ay harcanan: ${fmt.try.format(lastMonthSpent)}`,
      `Dashboard filtresi: ${selectedPeriod} | Filtrelenmiş harcama: ${fmt.try.format(selectedSpent)}`,
      `Ekip: ${arr(state.settings?.members).join(", ")}`,
      `\nPRODÜKSİYONLAR:\n${prods||"yok"}`,
      `\nAÇIK GÖREVLER:\n${tasks||"yok"}`,
      `\nENVANTER:\n${inv||"yok"}`,
      `\nFIKIRLER:\n${ideas||"yok"}`,
    ].join("\n");
  }catch{ return "(veri ozeti oluşturulamadı)"; }
}

// ── BOOTSTRAP ────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded",async()=>{
  // Hazır sinyali her durumda gitmeli: başlatmanın herhangi bir adımı hata
  // verirse üst çerçeve 12 saniye bekleyip "Operasyon alanı yüklenemedi"
  // gösteriyordu. Hata artık konsola yazılır, arayüz yine de açılır.
  try{
  // Bulut senkronizasyonu olan hesaplarda ortak tarayıcı state'ini göstermeden
  // önce kullanıcıya ait kayıt yüklenir. API yoksa loadApiFeatures yerel moda düşer.
  state=buildCleanInitial();
  await loadApiFeatures();
  loadTheme();
  populateSelects();
  bindNavigation();
  bindParentBridge();
  bindGlobalActions();
  bindThemeToggle();
  bindDashboardFilter();
  bindDashboardActions();
  bindCommentSection();
  bindSourceImport();
  bindCrm();
  bindBanana();
  relocatePageTreeWhenEmbedded();
  bindCalendar();
  bindClients();
  bindSettings();
  bindKeyboardShortcuts();
  bindCommandPalette();
  bindBackupRestore();
  bindPages();
  renderAll();
  runCommentAnalysis();
  updateBadge();
  syncUndoBtn();
  const initialView = new URLSearchParams(location.search).get("view") || location.hash.replace(/^#/,"");
  if(initialView && viewOrder.includes(initialView)) navigateTo(initialView,false);
  }catch(error){
    console.error("Operasyon merkezi başlatılırken hata:", error);
  }finally{
    document.body.dataset.operationsReady="true";
    if(document.documentElement.classList.contains("embedded")&&window.parent!==window){
      window.parent.postMessage({type:"kade:operations-ready"},location.origin);
    }
    operationsReportingReady=true;
  }
});

// ── YARDIMCILAR ───────────────────────────────────────────────────────
function esc(s){ return String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;") }
function safeImageUrl(value){
  const raw=String(value||"").trim();
  if(/^data:image\/(?:png|jpe?g|gif|webp);base64,[a-z0-9+/=]+$/i.test(raw))return esc(raw);
  try{const url=new URL(raw,location.origin);return ["http:","https:","blob:"].includes(url.protocol)?esc(url.href):""}catch{return""}
}
function budgetPercent(spent){ const budget=Number(state?.settings?.monthlyBudget||0);return budget>0?Math.min(100,Math.round((Number(spent||0)/budget)*100)):0 }
function totalSpent(prods){ return arr(prods||state.productions).reduce((t,p)=>t+productionSpent(p),0) }
function productionSpent(p){ return arr(p?.budgets).reduce((s,g)=>s+arr(g?.items).reduce((a,i)=>a+Number(i.amount||0),0),0) }
function openTasks(prods=state.productions){ return arr(prods).flatMap(p=>arr(p.tasks).filter(t=>!t.done).map(t=>({task:t,production:p}))) }
function upcomingTasksList(prods=state.productions){ return openTasks(prods).sort((a,b)=>String(a.task.due).localeCompare(String(b.task.due))).slice(0,6) }
function priorityColor(p){ return{"Yüksek":"coral","Orta":"gold","Düşük":"teal"}[p]||"indigo" }
function containsAny(text,list){ const l=text.toLocaleLowerCase("tr-TR"); return list.some(w=>l.includes(w)) }
function refreshIcons(){ if(window.lucide)window.lucide.createIcons() }
function updateBadge(){ const n=openTasks().length; const el=document.getElementById("badge-tasks"); if(!el)return; el.textContent=n>0?n:""; el.style.display=n>0?"":"none" }

function periodProductions(filter="all"){
  if(filter==="all")return state.productions;
  const now=new Date(),thisStart=new Date(now.getFullYear(),now.getMonth(),1),lastStart=new Date(now.getFullYear(),now.getMonth()-1,1),lastEnd=new Date(now.getFullYear(),now.getMonth(),0);
  return state.productions.filter(p=>{ const d=new Date(p.publishDate||p.shootDate); if(filter==="thismonth")return d>=thisStart; if(filter==="lastmonth")return d>=lastStart&&d<=lastEnd; return true });
}
function filteredProductions(){ return periodProductions(activeFilter) }
function periodLabel(filter=activeFilter){ return {all:"Tüm zamanlar",thismonth:"Bu ay",lastmonth:"Geçen ay"}[filter]||"Tüm zamanlar" }
function taskDueMeta(due){
  if(!due)return{label:"Tarih yok",overdue:false};
  const today=new Date();today.setHours(0,0,0,0);
  const date=new Date(due);date.setHours(0,0,0,0);
  const days=Math.round((date-today)/86400000);
  if(days<0)return{label:`${Math.abs(days)} gün gecikti`,overdue:true};
  if(days===0)return{label:"Bugün",overdue:false};
  return{label:`${days} gün kaldı`,overdue:false};
}

function findTask(id){ for(const p of state.productions)for(const t of p.tasks)if(t.id===id)return t; return null }

function countdownBadge(prod){
  if(["published","cancelled"].includes(prod.stage))return`<span class="countdown-badge done">${prod.stage==="published"?"✓ Yayında":"İptal"}</span>`;
  if(!prod.publishDate)return"";
  const days=Math.ceil((new Date(prod.publishDate)-new Date())/86400000);
  if(days<0)return`<span class="countdown-badge late">⚠ ${Math.abs(days)}g gecikti</span>`;
  if(days<=3)return`<span class="countdown-badge warn">⏰ ${days}g kaldı</span>`;
  return`<span class="countdown-badge ok">📅 ${days}g kaldı</span>`;
}

function calcProgress(prod){ const total=prod.tasks.length,done=prod.tasks.filter(t=>t.done).length; return{total,done,pct:total>0?Math.round((done/total)*100):0} }

function tagEl(tagId){ const t=productionTags.find(t=>t.id===tagId); if(!t)return""; return`<span class="tag-chip ${t.color}">${esc(t.label)}</span>` }

// ── TOAST ────────────────────────────────────────────────────────────
function showToast(msg,type="success"){
  const icons={success:"✓",error:"✗",info:"ℹ",warning:"⚠"};
  const c=document.getElementById("toastContainer");
  if(!c)return;
  const t=document.createElement("div");
  t.className=`toast ${type}`;
  t.innerHTML=`<span>${icons[type]||"✓"}</span><span>${esc(msg)}</span>`;
  c.appendChild(t);
  t.addEventListener("click",()=>removeToast(t));
  setTimeout(()=>removeToast(t),3500);
  clearTimeout(operationSilentReportTimer);
  operationSilentReportTimer=null;
  if(operationsReportingReady&&!['Karanlık mod','Aydınlık mod'].includes(String(msg))){
    reportOperation(msg,type);
  }
}
function removeToast(t){ t.classList.add("toast-out"); t.addEventListener("animationend",()=>t.remove(),{once:true}) }

let operationsReportingReady=false;
let operationSilentReportTimer=null;
function scheduleSilentOperationReport(){
  clearTimeout(operationSilentReportTimer);
  operationSilentReportTimer=setTimeout(()=>reportOperation('Operasyon verisi güncellendi','info'),1800);
}
function reportOperation(message,reportType="info"){
  if(!document.documentElement.classList.contains("embedded")||window.parent===window)return;
  const active=document.querySelector('.view.active');
  window.parent.postMessage({
    type:'kade:operations-report',
    message:String(message||'').slice(0,320),
    reportType:String(reportType||'info').slice(0,16),
    view:active?.id||'dashboard',
  },location.origin);
}

// ── TEMA ─────────────────────────────────────────────────────────────
function loadTheme(){
  // Panel içindeyken tema PANELE aittir. Kitin kendi yerel tercihi burada
  // uygulanırsa panel koyuyken kit açık kalıyor ve operasyon sekmesi arayüzün
  // geri kalanından kopuk görünüyordu. Gömülüyken panele sorulur.
  if(document.documentElement.classList.contains("embedded")&&window.parent!==window){
    try{ window.parent.postMessage({type:"kade:request-operations-theme"},location.origin) }catch{}
    return;
  }
  const s=storageGet("kade-theme")==="dark"?"dark":"light"; document.documentElement.setAttribute("data-theme",s); updateThemeBtn(s)
}
function bindThemeToggle(){ document.getElementById("themeToggle").addEventListener("click",()=>{ const c=document.documentElement.getAttribute("data-theme")||"dark",n=c==="dark"?"light":"dark"; document.documentElement.setAttribute("data-theme",n); storageSet("kade-theme",n); updateThemeBtn(n); showToast(n==="dark"?"Karanlık mod":"Aydınlık mod","info") }) }
function updateThemeBtn(t){ const b=document.getElementById("themeToggle"); if(b){const l=t==="dark"?"Açık temaya geç":"Koyu temaya geç";b.textContent=t==="dark"?"☀️":"🌙";b.setAttribute("aria-label",l);b.title=l} }

// ── MOBİL MENÜ ───────────────────────────────────────────────────────
function toggleMobileMenu(){ const s=document.getElementById("sidebar"),o=document.getElementById("mobileOverlay"),isOpen=s.classList.contains("mobile-open"); s.classList.toggle("mobile-open",!isOpen); o.classList.toggle("visible",!isOpen) }
function closeMobileMenu(){ document.getElementById("sidebar")?.classList.remove("mobile-open"); document.getElementById("mobileOverlay")?.classList.remove("visible") }

// ── NAVİGASYON ───────────────────────────────────────────────────────
const viewOrder=["dashboard","comments","crm","banana","calendar","clients","settings","pages"];

function bindNavigation(){
  document.querySelectorAll(".nav-item[data-view]").forEach(btn=>{
    btn.addEventListener("click",()=>{ navigateTo(btn.dataset.view); closeMobileMenu() });
  });
}

function bindParentBridge(){
  if(!document.documentElement.classList.contains("embedded")||window.parent===window)return;
  window.addEventListener("message",event=>{
    if(event.origin!==location.origin||event.source!==window.parent)return;
    if(event.data?.type==="kade:set-operations-model"&&typeof event.data.model==="string"){
      selectedOperationsModel=event.data.model;
      return;
    }
    if(event.data?.type==="kade:set-operations-view"){
      const view=event.data.view;
      if(typeof view==="string"&&viewOrder.includes(view))navigateTo(view,false);
      return;
    }
    if(event.data?.type==="kade:set-operations-theme"){
      const nextTheme=event.data.theme;
      if(nextTheme==="light"||nextTheme==="dark"){
        document.documentElement.setAttribute("data-theme",nextTheme);
        updateThemeBtn(nextTheme);
      }
    }
  });
}

function navigateTo(viewId,notifyParent=true){
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.remove("active"));
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  const btn=document.querySelector(`.nav-item[data-view="${viewId}"]`);
  const view=document.getElementById(viewId);
  if(btn)btn.classList.add("active");
  if(view){
    view.classList.add("active");
    document.getElementById("viewTitle").textContent  =view.dataset.title  ||"";
    document.getElementById("viewEyebrow").textContent=view.dataset.eyebrow||"";
  }
  if(viewId==="crm")setTimeout(renderGanttChart,50);
  if(viewId==="pages"){renderPageTree();renderPageEditor()}
  if(notifyParent&&document.documentElement.classList.contains("embedded")&&window.parent!==window){
    window.parent.postMessage({type:"kade:operations-view",view:viewId},location.origin);
  }
  refreshIcons();
}

// ── KOMUT PALETİ ─────────────────────────────────────────────────────
function bindCommandPalette(){
  document.getElementById("commandInput").addEventListener("input",renderCommandResults);
  document.getElementById("commandInput").addEventListener("keydown",onCommandKey);
  document.getElementById("globalSearch").addEventListener("focus",()=>openCommandPalette());
}
function openCommandPalette(){ const p=document.getElementById("commandPalette"); p.style.display="flex"; document.getElementById("commandInput").focus(); renderCommandResults(); refreshIcons() }
function closeCommandPalette(e){ if(!e||e.target===document.getElementById("commandPalette")){ document.getElementById("commandPalette").style.display="none"; document.getElementById("commandInput").value=""; commandPaletteIndex=0 } }

function buildCommandItems(query){
  const q=(query||"").toLocaleLowerCase("tr-TR");
  const labels=["Özet","SentScan","Prodüksiyon CRM","Banana Studio","Prodüksiyon Takvimi","Müşteri & Teslim","Ayarlar","Sayfalar"];
  const icons=["layout-dashboard","message-square-text","kanban-square","sparkles","code-2","radio-tower","settings","notebook-text"];
  const items=[
    ...viewOrder.map((v,i)=>({label:labels[i]||v,sub:document.getElementById(v)?.dataset.eyebrow||"",icon:icons[i],action:()=>navigateTo(v)})),
    ...state.productions.map(p=>({label:p.title,sub:`${p.channel} · ${stages.find(s=>s.id===p.stage)?.label||p.stage}`,icon:"clapperboard",action:()=>{ navigateTo("crm"); openProduction(p.id) }})),
    {label:"JSON Yedek Al",        sub:"Tüm veriyi indir",    icon:"download-cloud",action:doBackup},
    {label:"Tema Degistir",         sub:"Dark / Light",        icon:"sun",           action:()=>document.getElementById("themeToggle").click()},
    {label:"Yeni Prodüksiyon Karti",sub:"CRM Kanban",          icon:"plus-circle",   action:()=>{ navigateTo("crm"); document.getElementById("quickAddProduction").click() }},
    {label:"Analiz Et",             sub:"SentScan",            icon:"bar-chart-3",   action:()=>{ navigateTo("comments"); runCommentAnalysis() }},
    {label:"Yeni Sayfa",            sub:"Sayfalar",            icon:"file-plus-2",   action:()=>{ navigateTo("pages"); createPage(null) }},
    ...(q?searchPages(q).map(p=>({label:p.title||"Başlıksız",sub:"📄 Sayfa",icon:"notebook-text",action:()=>{openPageEditor(p.id);navigateTo("pages")}})):[]),
  ];
  if(!q)return items.slice(0,8);
  return items.filter(i=>`${i.label} ${i.sub}`.toLocaleLowerCase("tr-TR").includes(q)).slice(0,12);
}

function renderCommandResults(){
  const q=document.getElementById("commandInput").value;
  const items=buildCommandItems(q);
  const el=document.getElementById("commandResults");
  commandPaletteIndex=0;
  el.innerHTML=items.length
    ?items.map((item,i)=>`<button class="command-item${i===0?" focused":""}" data-ci="${i}" onclick="execCommand(${i})"><i data-lucide="${esc(item.icon)}" class="command-item-icon"></i><div><div class="command-item-label">${esc(item.label)}</div><div class="command-item-sub">${esc(item.sub)}</div></div></button>`).join("")
    :`<div class="command-empty">Sonuç bulunamadı</div>`;
  el._items=items;
  refreshIcons();
}

function execCommand(idx){ const items=document.getElementById("commandResults")._items||[]; if(items[idx]){ items[idx].action(); closeCommandPalette({target:document.getElementById("commandPalette")}) } }

function onCommandKey(e){
  const btns=document.getElementById("commandResults").querySelectorAll(".command-item");
  if(!btns.length)return;
  if(e.key==="ArrowDown"){e.preventDefault();commandPaletteIndex=Math.min(commandPaletteIndex+1,btns.length-1)}
  if(e.key==="ArrowUp"){e.preventDefault();commandPaletteIndex=Math.max(commandPaletteIndex-1,0)}
  if(e.key==="Enter"){e.preventDefault();execCommand(commandPaletteIndex);return}
  if(e.key==="Escape"){closeCommandPalette({target:document.getElementById("commandPalette")});return}
  btns.forEach((b,i)=>b.classList.toggle("focused",i===commandPaletteIndex));
}

// ── KLAVYE KISAYOLLARI ────────────────────────────────────────────────
function bindKeyboardShortcuts(){
  document.addEventListener("keydown",e=>{
    const typing=["INPUT","TEXTAREA","SELECT"].includes(e.target.tagName)||e.target.isContentEditable;
    // Kısayol yakalama modundayken (ayarlarda tuş atanıyor) hiçbir eylem çalışmaz.
    if(kisayolYakalama){ return }
    if(e.key==="Escape"){document.getElementById("commandPalette").style.display="none";document.getElementById("productionDialog")?.close();return}
    if(typing)return;
    const kombo=komboOf(e);
    if(kombo){
      const harita=aktifKisayollar();
      const eylem=SHORTCUT_ACTIONS.find(a=>harita[a.id]===kombo);
      if(eylem){ e.preventDefault(); eylem.calistir(); return }
    }
    if(!typing&&!e.ctrlKey&&!e.metaKey&&!e.altKey){const idx=parseInt(e.key,10)-1;if(idx>=0&&idx<viewOrder.length)navigateTo(viewOrder[idx])}
  });
}

/** Ayarlarda tuş atanırken true olur; bu sırada kısayollar tetiklenmez. */
let kisayolYakalama=false;

/** Bir eyleme yeni tuş atar: sıradaki tuş kombinasyonunu yakalar. */
function kisayolYakala(actionId,btn){
  const eylem=SHORTCUT_ACTIONS.find(a=>a.id===actionId); if(!eylem)return;
  kisayolYakalama=true;
  const eskiMetin=btn.textContent;
  btn.textContent="Tuşa bas…";
  const bitir=()=>{ kisayolYakalama=false; btn.textContent=eskiMetin; window.removeEventListener("keydown",yakala,true) };
  const yakala=e=>{
    e.preventDefault(); e.stopPropagation();
    if(e.key==="Escape"){ bitir(); return }
    const kombo=komboOf(e);
    if(!kombo)return;
    if(KORUMALI_KOMBOLAR.has(kombo)){ showToast("Bu kombinasyon tarayıcıya ait, kullanılamaz","warning"); return }
    const harita=aktifKisayollar();
    const cakisan=SHORTCUT_ACTIONS.find(a=>a.id!==actionId&&harita[a.id]===kombo);
    if(cakisan){ showToast(`Bu kısayol "${cakisan.label}" için kullanılıyor`,"warning"); return }
    snapshotUndo();
    state.shortcuts=isObj(state.shortcuts)?state.shortcuts:{};
    state.shortcuts[actionId]=kombo;
    saveState(); bitir(); renderSettingsView();
    showToast(`${eylem.label}: ${komboEtiketi(kombo)}`,"success");
  };
  window.addEventListener("keydown",yakala,true);
}

// ── GLOBAL AKSİYONLAR ────────────────────────────────────────────────
function bindGlobalActions(){
  document.getElementById("resetBtn").addEventListener("click",doReset);
  document.getElementById("clearStarterData")?.addEventListener("click",clearStarterData);
  document.getElementById("printBtn").addEventListener("click",()=>window.print());
  document.getElementById("undoBtn").addEventListener("click",undoLast);
  document.getElementById("assistantForm").addEventListener("submit",e=>{ e.preventDefault(); answerAssistant(document.getElementById("assistantInput").value) });
}

function doReset(){
  if(!confirm("Çalışma alanındaki yerel veriler silinsin mi?"))return;
  snapshotUndo(); state=buildCleanInitial(); activeFilter="all";
  saveState(); renderAll(); runCommentAnalysis(); syncFilterChips();
  showToast("Çalışma alanı sıfırlandı","info");
}

// ── YEDEK & GERİ YÜKLEME ─────────────────────────────────────────────
function bindBackupRestore(){
  document.getElementById("backupBtn").addEventListener("click",doBackup);
  document.getElementById("restoreBtn").addEventListener("click",()=>document.getElementById("restoreFile").click());
  document.getElementById("settingsBackup")?.addEventListener("click",doBackup);
  document.getElementById("settingsRestore")?.addEventListener("click",()=>document.getElementById("restoreFile").click());
  document.getElementById("settingsReset")?.addEventListener("click",doReset);
  document.getElementById("restoreFile").addEventListener("change",e=>{
    const file=e.target.files[0]; if(!file)return;
    const reader=new FileReader();
    reader.onload=ev=>{ try{ const data=JSON.parse(ev.target.result); if(!data.productions)throw new Error(); snapshotUndo(); state=deepMerge(buildInitial(),data); saveState(); renderAll(); showToast("Yedek yüklendi!","success"); logActivity("Yedek dosyası geri yüklendi","success") }catch{ showToast("Geçersiz yedek dosyası","error") } e.target.value="" };
    reader.readAsText(file);
  });
}

function doBackup(){
  const data=JSON.stringify(state,null,2);
  const url=URL.createObjectURL(new Blob([data],{type:"application/json"}));
  const date=new Date().toISOString().slice(0,10);
  const a=Object.assign(document.createElement("a"),{href:url,download:`kade-kit-yedek-${date}.json`});
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  showToast("Yedek indirildi","success"); logActivity("JSON yedek alındı","success");
}

// ── DASHBOARD FİLTRE ─────────────────────────────────────────────────
function bindDashboardFilter(){ document.getElementById("dashFilter").addEventListener("click",e=>{ const c=e.target.closest("[data-filter]"); if(!c)return; activeFilter=c.dataset.filter; syncFilterChips(); renderDashboard() }) }
function syncFilterChips(){ document.querySelectorAll("[data-filter]").forEach(c=>c.classList.toggle("active",c.dataset.filter===activeFilter)) }

function bindDashboardActions(){
  const dashboard=document.getElementById("dashboard");
  if(!dashboard)return;
  const activate=target=>{
    const view=target?.dataset?.dashboardNav;
    if(!view||!viewOrder.includes(view))return;
    navigateTo(view);
    if(target.dataset.productionId)setTimeout(()=>openProduction(target.dataset.productionId),0);
  };
  dashboard.addEventListener("click",e=>{
    const target=e.target.closest("[data-dashboard-nav]");
    if(target)activate(target);
  });
  dashboard.addEventListener("keydown",e=>{
    if(e.key!=="Enter"&&e.key!==" ")return;
    const target=e.target.closest("[data-dashboard-nav]");
    if(!target)return;
    e.preventDefault();
    activate(target);
  });
}

function clearStarterData(){
  if(!confirm("Örnek prodüksiyon, görev, bütçe ve envanter kayıtları kaldırılsın mı?"))return;
  snapshotUndo();
  state.productions=[];
  state.ideas=[];
  state.inventory=[];
  state.docs=[];
  state.media=[];
  state.videos=[];
  state.brainstorm=[];
  state.activityLog=[];
  state.totalUsdSpent=0;
  state.users=state.settings.members.map(name=>({name,images:0,videos:0,spend:0}));
  saveState();
  renderAll();
  showToast("Boş çalışma alanı hazır","success");
}

// ── KPI KARTI ────────────────────────────────────────────────────────
function kpi(label,value,meta,color,icon,targetView=null){
  const content=`${icon?`<span class="kpi-icon"><i data-lucide="${icon}"></i></span>`:""}<span class="label">${esc(label)}</span><span class="value">${esc(String(value))}</span><span class="meta">${esc(meta)}</span>`;
  if(!targetView)return`<div class="kpi ${color}">${content}</div>`;
  return`<button type="button" class="kpi dashboard-kpi ${color}" data-dashboard-nav="${esc(targetView)}" aria-label="${esc(label)} ayrıntılarını aç">${content}<span class="dashboard-open-hint">Ayrıntıları aç →</span></button>`;
}

// ── RENDER ALL ────────────────────────────────────────────────────────
function renderAll(){ renderDashboard(); renderCrm(); renderBanana(); renderCalendar(); renderClients(); renderSettingsView(); renderSourceImport(); renderPageTree(); renderPageEditor(); refreshIcons() }

// ── DONUT SVG ────────────────────────────────────────────────────────
function donutSvg(pct,color){
  const r=52,cx=60,cy=60,circ=2*Math.PI*r,dash=circ*Math.min(pct/100,1);
  const cols={teal:"#00d4aa",indigo:"#6c8ef5",coral:"#ff6b6b",gold:"#ffd166",violet:"#c77dff"};
  const c=cols[color]||"#00d4aa";
  return`<svg width="120" height="120" viewBox="0 0 120 120"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="10"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${c}" stroke-width="10" stroke-dasharray="${dash} ${circ}" stroke-dashoffset="${circ/4}" stroke-linecap="round" style="transition:stroke-dasharray 800ms ease"/><text x="${cx}" y="${cy+6}" text-anchor="middle" font-size="18" font-weight="800" fill="${c}">${pct}%</text></svg>`;
}

// ── DASHBOARD ────────────────────────────────────────────────────────
function renderDashboard(){
  const prods=filteredProductions(),spent=totalSpent(prods),active=prods.filter(p=>!["published","cancelled"].includes(p.stage)).length,open=openTasks(prods).length,pct=budgetPercent(spent);
  const hasBudget=Number(state.settings.monthlyBudget)>0;
  const starterNotice=document.getElementById("starterNotice");
  if(starterNotice)starterNotice.style.display=state.productions.some(p=>p.id==="p-001")?"flex":"none";
  const isAllTime=activeFilter==="all";
  document.getElementById("dashKpis").innerHTML=[
    kpi(isAllTime?"Bütçe Referansı":"Aylık Bütçe",hasBudget?fmt.try.format(state.settings.monthlyBudget):"Tanımlı değil",hasBudget?(isAllTime?"Aylık limit":`${pct}% kullanıldı`):"Ayarlardan bütçe gir","teal","wallet","crm"),
    kpi("Harcanan",fmt.try.format(spent),isAllTime?"Tüm kayıtlar":hasBudget?`${fmt.try.format(Math.max(state.settings.monthlyBudget-spent,0))} kaldı`:"Bütçe ile karşılaştırılamıyor","gold","trending-up","crm"),
    kpi("Aktif Üretim",active,`${state.ideas.length} fikir havuzda`,"indigo","clapperboard","crm"),
    kpi("Açık Görev",open,`${state.inventory.length} envanter`,"coral","list-checks","crm"),
  ].join("");
  renderBudgetOverview(prods); renderUpcomingTasks(prods); renderRecentMedia(); renderActivityFeed(); renderTeamWorkload(prods);
}

function renderBudgetOverview(prods){
  const spent=totalSpent(prods),pct=budgetPercent(spent);
  if(!(Number(state.settings.monthlyBudget)>0)){
    document.getElementById("budgetOverview").innerHTML=`<div class="empty-state">Aylık bütçe tanımlı değil. ${fmt.try.format(spent)} harcama kaydı var; oran hesaplanmadı.<br><button type="button" class="ghost-btn" style="margin-top:12px" onclick="navigateTo('settings')">Bütçeyi tanımla</button></div>`;
    return;
  }
  let warning="";
  if(pct>=100)warning=`<div class="budget-warning danger">🔴 Bütçe aşımı! ${fmt.try.format(spent-state.settings.monthlyBudget)} fazla harcandı.</div>`;
  else if(pct>=90)warning=`<div class="budget-warning caution">⚠️ Dikkat: Bütçenin %${pct}'i kullanıldı.</div>`;
  const catMap=new Map();
  (prods||state.productions).forEach(p=>p.budgets.forEach(g=>{ const t=g.items.reduce((s,i)=>s+Number(i.amount||0),0); catMap.set(g.category,(catMap.get(g.category)||0)+t) }));
  const topCats=[...catMap.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5);
  document.getElementById("budgetOverview").innerHTML=`${warning}<div class="donut-wrap">${donutSvg(pct,pct>=100?"coral":pct>=90?"gold":"teal")}<div class="donut-legend"><div style="font-size:13px;color:var(--ink3);margin-bottom:10px">${fmt.try.format(spent)} / ${fmt.try.format(state.settings.monthlyBudget)}</div>${topCats.map(([name,amount])=>`<div class="donut-entry"><div class="donut-dot"></div><span style="flex:1;font-size:13px">${esc(name)}</span><span class="donut-pct">${fmt.try.format(amount)}</span></div>`).join("")}</div></div><div style="margin-top:16px"><div class="progress"><span style="width:${pct}%"></span></div></div>`;
}

function renderUpcomingTasks(prods=state.productions){
  const tasks=upcomingTasksList(prods);
  document.getElementById("upcomingTasks").innerHTML=tasks.map(({task,production})=>{const due=taskDueMeta(task.due);return`<button type="button" class="task-row dashboard-row-button" data-dashboard-nav="crm" data-production-id="${esc(production.id)}" aria-label="${esc(task.title)} görevini aç"><span><span class="row-title">${esc(task.title)}</span><span class="row-meta">${esc(production.title)} · ${esc(task.assignee)} · ${fmt.date(task.due)}</span></span><span class="task-badges"><span class="pill ${due.overdue?"coral":"teal"}">${esc(due.label)}</span><span class="pill ${priorityColor(task.priority)}">${esc(task.priority)}</span></span></button>`}).join("")||`<div class="empty-state">Bu dönemde açık görev yok 🎉</div>`;
}

function renderRecentMedia(){
  const items=state.media.slice(-3).reverse();
  document.getElementById("recentMedia").innerHTML=items.length
    ?items.map(m=>`<button type="button" class="media-tile dashboard-media-button" data-dashboard-nav="banana" aria-label="${esc(m.title)} üretimini Banana Studio'da aç"><img src="${safeImageUrl(m.src)}" alt="${esc(m.title)}" loading="lazy"/><span><strong style="font-size:13px">${esc(m.title)}</strong><span class="row-meta">${providerCost(m.cost)} · ${esc(m.model)}</span></span></button>`).join("")
    :`<div class="empty-state">Henüz görsel üretilmedi.</div>`;
}

function renderActivityFeed(){
  const el=document.getElementById("activityFeed");if(!el)return;
  const logs=state.activityLog.slice(0,7);
  el.innerHTML=logs.length?logs.map(log=>`<button type="button" class="activity-item dashboard-row-button" data-dashboard-nav="crm"><span class="activity-dot ${log.type}"></span><span style="flex:1"><span style="font-size:13px">${esc(log.message)}</span><span class="row-meta" style="font-size:11px">${fmt.dt(log.ts)}</span></span></button>`).join(""):`<div class="empty-state">Henüz aksiyon yok.</div>`;
}

function renderTeamWorkload(prods=state.productions){
  const el=document.getElementById("teamWorkload");if(!el)return;
  const countMap=new Map();
  prods.flatMap(p=>p.tasks.filter(t=>!t.done)).forEach(t=>countMap.set(t.assignee,(countMap.get(t.assignee)||0)+1));
  const entries=[...countMap.entries()].sort((a,b)=>b[1]-a[1]),max=Math.max(...entries.map(([,v])=>v),1);
  el.innerHTML=entries.length?entries.map(([name,count])=>`<button type="button" class="bar-row dashboard-row-button" data-dashboard-nav="crm" aria-label="${esc(name)} görevlerini aç"><span class="bar-label">${esc(name)}</span><span class="bar-track"><span class="bar-fill" style="width:${Math.round((count/max)*100)}%;background:${count>=5?"#ff6b6b":count>=3?"#ffd166":"#00d4aa"}"></span></span><span class="bar-val">${count} görev</span></button>`).join(""):`<div class="empty-state">Açık görev yok.</div>`;
}

// ── AI ASISTAN ────────────────────────────────────────────────────────
async function answerAssistant(question){
  const out=document.getElementById("assistantAnswer");
  const q=(question||"").trim();
  if(!q){ if(out)out.textContent="Bir soru yaz."; return; }
  if(API.features.assistant){
    if(out)out.textContent="Düşünüyor…";
    try{
      const res=await apiPost("/api/assistant",{question:q,context:buildAssistantContext(),model:selectedOperationsModel});
      if(res.error){ if(out)out.textContent="AI bağlantısı kurulamadı. Yerel çalışma alanı özeti gösteriliyor."; answerAssistantLocal(question); return; }
      if(out)out.textContent=(res.answer||"(boş cevap)")+`\n\n— Model: ${res.model||selectedOperationsModel}`+(res.note?`\n— ${res.note}`:"");
      if(typeof logActivity==="function")logActivity("AI asistana soruldu","info");
      return;
    }catch{ if(out)out.textContent="AI bağlantısı kurulamadı. Yerel çalışma alanı özeti gösteriliyor."; answerAssistantLocal(question); return; }
  }
  answerAssistantLocal(question);
}
function answerAssistantLocal(question){
  const q=(question||"").toLocaleLowerCase("tr-TR");
  const requestedPeriod=q.includes("geçen ay")?"lastmonth":q.includes("bu ay")?"thismonth":activeFilter;
  const spent=totalSpent(periodProductions(requestedPeriod));
  let ans=`${periodLabel(requestedPeriod)} toplam ${fmt.try.format(spent)} harcandı${requestedPeriod==="all"?".":state.settings.monthlyBudget>0?` (aylık bütçenin %${budgetPercent(spent)}'i).`:". Aylık bütçe henüz girilmedi."}`;
  if(q.includes("kameraman")||q.includes("kase")||q.includes("kaşe")||q.includes("ücret"))ans="Kayıtlı bir kaşe veya ücret tablosu bulunmuyor. Kütüphaneye güncel belgeni ekleyebilirsin.";
  else if(q.includes("pahali")||q.includes("en fazla")){ const top=[...state.productions].sort((a,b)=>productionSpent(b)-productionSpent(a))[0]; ans=top?`En pahalı: "${top.title}" — ${fmt.try.format(productionSpent(top))}.`:"Henüz karşılaştırılacak prodüksiyon kaydı yok." }
  else if(q.includes("görev")||q.includes("bekleyen")){ const tasks=upcomingTasksList(); ans=`Açık görev: ${tasks.length}. İlk sırada "${tasks[0]?.task.title||"—"}" (${tasks[0]?.task.assignee}, teslim: ${fmt.date(tasks[0]?.task.due)}).` }
  else if(q.includes("envanter kalemi")||q.includes("depo")){ const top=[...state.inventory].sort((a,b)=>b.qty-a.qty)[0]; ans=`Envanterde ${state.inventory.length} kalem. En çok: ${top?.name} (${top?.qty} adet).` }
  else if(q.includes("fikir"))ans=`Havuzda ${state.ideas.length} konsept var. En son: "${state.ideas[0]?.title}".`;
  else if(q.includes("banana")||q.includes("görsel"))ans=`Banana Studio sağlayıcı kullanımı: ${providerCost(state.totalUsdSpent)}, ${state.media.length} görsel üretildi.`;
  document.getElementById("assistantAnswer").textContent=ans+"\n\n— Yerel hesaplama";
}

// ── VIDEO & TRANSCRIPT IMPORT ────────────────────────────────────────
function bindSourceImport(){
  document.getElementById("sourceVideoFile")?.addEventListener("change",handleSourceVideoFile);
  document.getElementById("transcriptFile")?.addEventListener("change",handleTranscriptFile);
  document.getElementById("analyzeTranscriptBtn")?.addEventListener("click",()=>{
    const raw=document.getElementById("transcriptInput")?.value||"";
    if(!raw.trim()){showToast("Transkript boş","error");return}
    loadTranscriptText(raw,state.transcriptName||"Yapıştırılan transkript");
  });
  document.getElementById("sendTranscriptPage")?.addEventListener("click",createTranscriptPage);
  document.getElementById("clearTranscriptBtn")?.addEventListener("click",clearTranscriptImport);
}

function handleSourceVideoFile(e){
  const file=e.target.files?.[0];if(!file)return;
  if(sourceVideoUrl)URL.revokeObjectURL(sourceVideoUrl);
  sourceVideoUrl=URL.createObjectURL(file);
  snapshotUndo();
  state.sourceVideo={name:file.name,size:file.size,type:file.type||"video",ts:Date.now()};
  saveState();
  renderSourceImport();
  showToast("Video yüklendi","success");
  logActivity(`Kaynak video yüklendi: ${file.name}`,"success");
}

function handleTranscriptFile(e){
  const file=e.target.files?.[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=ev=>loadTranscriptText(ev.target.result||"",file.name);
  reader.onerror=()=>showToast("Transkript okunamadı","error");
  reader.readAsText(file,"utf-8");
}

function loadTranscriptText(raw,name){
  const text=repairTextEncoding(raw);
  snapshotUndo();
  state.transcriptText=text;
  state.transcriptName=name||"Transkript";
  state.transcriptInsights=analyzeTranscriptText(text);
  saveState();
  renderSourceImport();
  showToast("Transkript analiz edildi","success");
  logActivity(`Transkript analiz edildi: ${state.transcriptName}`,"success");
}

function clearTranscriptImport(){
  snapshotUndo();
  state.transcriptText="";
  state.transcriptName="";
  state.transcriptInsights=null;
  saveState();
  renderSourceImport();
  showToast("Transkript temizlendi","warning");
}

function renderSourceImport(){
  const ta=document.getElementById("transcriptInput");
  if(ta&&document.activeElement!==ta)ta.value=state.transcriptText||"";

  const video=document.getElementById("sourceVideoPreview");
  const empty=document.getElementById("sourceVideoEmpty");
  if(video){
    if(sourceVideoUrl){ video.src=sourceVideoUrl; video.style.display="block"; if(empty)empty.style.display="none" }
    else { video.removeAttribute("src"); video.style.display="none"; if(empty)empty.style.display="grid" }
  }

  const meta=document.getElementById("sourceVideoMeta");
  if(meta){
    const v=state.sourceVideo;
    meta.innerHTML=v?`<span class="pill indigo">${esc(v.type||"video")}</span><span>${esc(v.name)}</span><span>${formatBytes(v.size)}</span>`:`<span class="row-meta">Video seçilmedi.</span>`;
  }

  const transcriptMeta=document.getElementById("transcriptMeta");
  if(transcriptMeta){
    const wc=countWords(state.transcriptText||"");
    transcriptMeta.innerHTML=state.transcriptText?`<span class="pill teal">${wc} kelime</span><span>${esc(state.transcriptName||"Transkript")}</span>`:`<span class="row-meta">Transkript bekleniyor.</span>`;
  }

  const sendBtn=document.getElementById("sendTranscriptPage");
  if(sendBtn)sendBtn.disabled=!state.transcriptInsights;
  renderTranscriptInsights();
}

function renderTranscriptInsights(){
  const el=document.getElementById("transcriptInsights");if(!el)return;
  const ins=state.transcriptInsights;
  if(!ins){
    el.innerHTML=`<div class="empty-state">Video ve transkript yüklendiğinde özet burada görünür.</div>`;
    return;
  }
  el.innerHTML=`
    <div class="transcript-kpis">
      <div><span>${ins.wordCount}</span><small>Kelime</small></div>
      <div><span>${ins.modules.length}</span><small>Modül</small></div>
      <div><span>${ins.timestamps.length}</span><small>Zaman</small></div>
    </div>
    <div class="transcript-summary">${esc(ins.summary)}</div>
    <div class="transcript-module-grid">
      ${ins.modules.map(m=>`<div class="transcript-module-card ${m.color}"><div class="transcript-module-head"><strong>${esc(m.title)}</strong><span>${m.score}</span></div><p>${esc(m.reason)}</p>${m.snippets.length?`<div class="transcript-snippets">${m.snippets.map(s=>`<span>${esc(s)}</span>`).join("")}</div>`:""}</div>`).join("")}
    </div>
    <div class="transcript-actions">
      ${ins.actions.map(a=>`<div class="transcript-action"><span class="pill ${a.color}">${esc(a.module)}</span><span>${esc(a.text)}</span></div>`).join("")}
    </div>
  `;
}

function createTranscriptPage(){
  const raw=state.transcriptText||document.getElementById("transcriptInput")?.value||"";
  if(!raw.trim()){showToast("Önce transkript yükle","error");return}
  const ins=state.transcriptInsights||analyzeTranscriptText(raw);
  snapshotUndo();
  const pg=newPageObj(null);
  pg.title=`Transkript Özeti - ${state.transcriptName||"Video"}`;
  pg.icon="🎬";
  pg.blocks=[
    newBlockObj("heading1",{content:pg.title}),
    newBlockObj("callout",{content:ins.summary,emoji:"🎬"}),
    newBlockObj("heading2",{content:"Öne çıkan modüller"}),
    ...ins.modules.map(m=>newBlockObj("bulletList",{content:`${m.title}: ${m.reason}`})),
    newBlockObj("heading2",{content:"Aksiyonlar"}),
    ...ins.actions.map(a=>newBlockObj("todo",{content:`${a.module}: ${a.text}`,done:false})),
    newBlockObj("heading2",{content:"Ham transkript"}),
    newBlockObj("paragraph",{content:raw.slice(0,6000)}),
  ];
  state.pages.unshift(pg);
  state.currentPageId=pg.id;
  saveState();
  renderPageTree();
  renderPageEditor();
  navigateTo("pages");
  showToast("Transkript notlara aktarıldı","success");
}

function analyzeTranscriptText(raw){
  const text=cleanTranscript(raw);
  const lower=text.toLocaleLowerCase("tr-TR");
  const sentences=(text.match(/[^.!?\n]+[.!?]?/g)||[]).map(s=>s.trim()).filter(s=>s.length>20);
  const moduleDefs=[
    {title:"SentScan yorum analizi",color:"teal",keywords:["yorum","tema","kelime bulutu","beğen","begen","zaman damga","analiz","izleyici"],actions:["Yorum metni girişini ve CSV çıktısını canlı tut.","Tema, duygu, en çok beğenilen yorum ve zaman damgası alanlarını aynı akışta göster."]},
    {title:"Prodüksiyon CRM",color:"indigo",keywords:["notion","crm","prodüksiyon","produksiyon","bütçe","bütçe","görev","görev","envanter","kütüphane","kutuphane"],actions:["Kanban kartlarında çekim, yayın, görev ve bütçe bilgisini tek detay ekranında tut.","Genel görev, envanter ve doküman kütüphanesini aynı veri setine bağla."]},
    {title:"Banana görsel stüdyosu",color:"gold",keywords:["görsel","görsel","prompt","template","şablon","sablon","brainstorm","beyin fırtınası","kapak","referans"],actions:["Prompt iyileştirme, şablon kaydetme ve brainstorm akışını tek panelden çalıştır.","Referans etiketlerini prompt içinde kullanılabilir hale getir."]},
    {title:"Banana video stüdyosu",color:"violet",keywords:["video","seadance","cde","continue","devam ettir","saniye","kamera","referans video"],actions:["Video promptunu saniye, kamera ve referans bilgisiyle iyileştir.","Devam ettir akışında önceki promptu ve seçilen videoyu birlikte kullan."]},
    {title:"Müşteri & teslim takibi",color:"coral",keywords:["müşteri","musteri","teslim","termin","fatura","sözleşme","sozlesme","brief","iş","teklif"],actions:["Müşteri kartı aç ve teslimleri termine bağla."]},
    {title:"Yayın takvimi",color:"teal",keywords:["takvim","tarih","çekim","cekim","yayın","yayin","plan","program","hafta","ay"],actions:["Çekim ve yayın tarihlerini takvimde gör."]},
  ];
  const modules=moduleDefs.map(def=>{
    const hits=def.keywords.reduce((sum,k)=>sum+countTerm(lower,k),0);
    const snippets=sentences.filter(s=>def.keywords.some(k=>s.toLocaleLowerCase("tr-TR").includes(k))).slice(0,2).map(s=>s.slice(0,180));
    return{...def,hits,score:Math.min(99,Math.max(12,30+hits*9)),snippets,reason:snippets[0]||`${def.title} ile ilgili anahtar akışlar transkriptte eşleşti.`};
  }).filter(m=>m.hits>0).sort((a,b)=>b.hits-a.hits).slice(0,6);
  const top=modules.map(m=>m.title).slice(0,3).join(", ");
  const actions=modules.flatMap(m=>m.actions.map(text=>({module:m.title.replace(/ .*/,""),text,color:m.color}))).slice(0,8);
  const timestamps=[...new Set((raw.match(/\b(?:\d{1,2}:)?\d{1,2}[:.]\d{2}\b/g)||[]).slice(0,12))];
  return{
    wordCount:countWords(text),
    modules,
    actions,
    timestamps,
    summary:top?`Transkript ağırlıklı olarak ${top} başlıklarını anlatıyor. Uygulamadaki karşılığı; dosya içe aktarma, analiz, üretim akışları, CRM takibi ve notlara dönüştürülebilir aksiyon listesidir.`:"Transkript yüklendi; ana başlıklar sınırlı eşleştiği için genel not ve aksiyon sayfası üretilebilir.",
  };
}

function repairTextEncoding(raw){
  let text=String(raw||"").replace(/\r/g,"");
  const pairs=[
    ["Ã§","ç"],["Ã‡","Ç"],["Ã¼","ü"],["Ãœ","Ü"],["Ã¶","ö"],["Ã–","Ö"],
    ["ÄŸ","ğ"],["Äž","Ğ"],["Ä±","ı"],["Ä°","İ"],["ÅŸ","ş"],["Åž","Ş"],
    ["Å\u009f","ş"],["Å\u009e","Ş"],["â€™","'"],["â€˜","'"],["â€œ","\""],["â€","\""],
    ["â€“","-"],["â€”","-"],["â€¦","..."],["Â",""],
  ];
  pairs.forEach(([bad,good])=>{ text=text.split(bad).join(good) });
  return text;
}

function cleanTranscript(raw){
  return repairTextEncoding(raw)
    .replace(/^\s*\d+\s*$/gm,"")
    .replace(/\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,.]\d{3}/g," ")
    .replace(/\[(?:müzik|music|alkış|applause)[^\]]*\]/gi," ")
    .replace(/[ \t]+/g," ")
    .replace(/\n{3,}/g,"\n\n")
    .trim();
}

function countTerm(text,term){ const t=term.toLocaleLowerCase("tr-TR"); return t?text.split(t).length-1:0 }
function countWords(text){ return cleanTranscript(text).split(/\s+/).filter(Boolean).length }
function formatBytes(bytes){
  const n=Number(bytes||0); if(!n)return"0 KB";
  if(n<1024*1024)return`${Math.round(n/1024)} KB`;
  return`${(n/(1024*1024)).toFixed(1)} MB`;
}

// ── SENTSCAN ─────────────────────────────────────────────────────────
function bindCommentSection(){
  document.getElementById("loadSampleComments").addEventListener("click",()=>{ setSampleComments(); runCommentAnalysis() });
  document.getElementById("commentForm").addEventListener("submit",e=>{ e.preventDefault(); runCommentAnalysis() });
  document.getElementById("exportCsv").addEventListener("click",exportCommentsCsv);
  document.getElementById("saveAnalysis").addEventListener("click",saveAnalysisSession);
  document.getElementById("fetchCommentsBtn")?.addEventListener("click",fetchYoutubeComments);
}
async function fetchYoutubeComments(){
  const btn=document.getElementById("fetchCommentsBtn");
  const url=document.getElementById("videoUrl")?.value||"";
  if(!url.trim()){ showToast("Önce video linki gir","error"); return; }
  const old=btn?btn.innerHTML:"";
  if(btn){ btn.disabled=true; btn.textContent="Çekiliyor…"; }
  try{
    const res=await apiGet("/api/youtube/comments?videoUrl="+encodeURIComponent(url)+"&max=200");
    if(res.error){ showToast("YouTube: "+res.error,"error"); return; }
    const lines=arr(res.comments).map(c=>`[${c.likes||0}] ${String(c.text||"").replace(/\s+/g," ").trim()}`);
    if(!lines.length){ showToast("Bu videoda yorum bulunamadı (kapalı olabilir)","warning"); return; }
    const el=document.getElementById("commentsInput");
    if(el)el.value=lines.join("\n");
    runCommentAnalysis();
    showToast(`${lines.length} yorum çekildi ve analiz edildi`,"success");
    if(typeof logActivity==="function")logActivity(`YouTube: ${lines.length} yorum çekildi`,"success");
  }catch(e){ showToast("Bağlantı hatası: "+e.message,"error"); }
  finally{ if(btn){ btn.disabled=false; btn.innerHTML=old; refreshIcons&&refreshIcons(); } }
}
function setSampleComments(){ const el=document.getElementById("commentsInput"); if(el)el.value=sampleComments.map(c=>`[${c.likes}] ${c.text}`).join("\n") }
function runCommentAnalysis(){ const raw=document.getElementById("commentsInput").value; const result=analyzeComments(raw); renderCommentResult(result); renderVideoScore(result); renderAnalysisHistory(); refreshIcons() }

function analyzeComments(raw){
  const comments=raw.split(/\n+/).map((line,i)=>{ const m=line.match(/^\s*\[(\d+)\]\s*(.+)$/); return{text:m?m[2].trim():line.trim(),likes:m?Number(m[1]):Math.max(1,80-i*4)} }).filter(c=>c.text.length>2);
  const total=comments.length;
  const themes=themeDefinitions.map(td=>{ const hits=comments.filter(c=>containsAny(c.text,td.keywords)); return{...td,count:hits.length,percent:total?Math.round((hits.length/total)*100):0,examples:hits.slice(0,2)} }).filter(t=>t.count>0).sort((a,b)=>b.count-a.count);
  const sentiment=comments.reduce((acc,c)=>{ const t=c.text.toLocaleLowerCase("tr-TR"); if(containsAny(t,positiveWords))acc.positive++; if(containsAny(t,negativeWords))acc.negative++; return acc },{positive:0,negative:0});
  const timestamps=comments.map(c=>({...c,stamps:[...c.text.matchAll(/\b\d{1,2}[:.]?\d{2}\b/g)].map(m=>m[0])})).filter(c=>c.stamps.length);
  const score=calcVideoScore(sentiment,total);
  return{total,themes,sentiment,timestamps,score,words:buildWordCloud(comments.map(c=>c.text).join(" ")),topComments:[...comments].sort((a,b)=>b.likes-a.likes).slice(0,8)};
}

function calcVideoScore(sentiment,total){ if(!total)return null;const posRate=sentiment.positive/total,negRate=sentiment.negative/total,raw=5+posRate*5-negRate*4; return Math.min(10,Math.max(1,parseFloat(raw.toFixed(1)))) }

function renderVideoScore(result){
  const el=document.getElementById("videoScore");if(!el)return;
  if(result.score===null){el.innerHTML='<div class="empty-state">Puan ve duygu yorumu için en az bir gerçek yorum ekle.</div>';return}
  const score=result.score,color=score>=8?"teal":score>=6?"gold":"coral",label=score>=8?"Harika içerik! İzleyiciler çok memnun.":score>=6?"İyi içerik. Küçük iyileştirmeler etkili olur.":"Yoğun eleştiri var. Önerileri incele.";
  el.innerHTML=`<div style="display:flex;align-items:center;gap:20px;padding:8px 0"><div style="text-align:center"><div style="font-size:52px;font-weight:900;color:var(--${color});line-height:1">${score}</div><div style="font-size:12px;color:var(--ink3);margin-top:4px">/ 10 puan</div></div><div style="flex:1"><div class="progress" style="margin-bottom:10px"><span style="width:${score*10}%;background:var(--${color})"></span></div><div style="font-size:13px;line-height:1.6;color:var(--ink2)">${label}</div><div style="display:flex;gap:10px;margin-top:10px"><span class="pill teal">+${result.sentiment.positive} pozitif</span><span class="pill coral">-${result.sentiment.negative} negatif</span><span class="pill indigo">${result.total} yorum</span></div></div></div>`;
}

function renderCommentResult(result){
  const themeColors=["teal","indigo","gold","violet","coral"];
  document.getElementById("commentSummary").innerHTML=result.themes.length?`<div class="summary-bars">${result.themes.map((t,i)=>`<div class="summary-bar"><header><span>${esc(t.name)}</span><span class="pill ${themeColors[i%themeColors.length]}">${t.percent}%</span></header><div class="progress"><span style="width:${Math.max(t.percent,3)}%"></span></div><div class="row-meta">${t.count} yorum</div></div>`).join("")}</div>`:`<div class="empty-state">Analiz için yorum ekle.</div>`;
  document.getElementById("recommendations").innerHTML=result.themes.length?`<ul class="recommendation-list">${result.themes.slice(0,5).map(t=>`<li><div class="rec-theme">💡 ${esc(t.name)}</div><div class="rec-action">${esc(t.next)}</div></li>`).join("")}</ul>`:`<div class="empty-state">Öneri için analiz yap.</div>`;
  const wordCloud=document.getElementById("wordCloud");
  wordCloud.innerHTML=result.words.map(w=>`<button type="button" class="word ${w.sentiment}${activeWordFilter===w.word?" selected":""}" style="font-size:${w.size}px" data-word="${esc(w.word)}">${esc(w.word)}</button>`).join(" ");
  wordCloud.querySelectorAll("[data-word]").forEach(el=>el.addEventListener("click",()=>filterByWord(el.dataset.word||"")));
  const raw=document.getElementById("commentsInput").value;
  const allComments=raw.split(/\n+/).map(line=>{ const m=line.match(/^\s*\[(\d+)\]\s*(.+)$/); return{text:m?m[2].trim():line.trim(),likes:m?Number(m[1]):0} }).filter(c=>c.text.length>2);
  const filtered=activeWordFilter?allComments.filter(c=>c.text.toLocaleLowerCase("tr-TR").includes(activeWordFilter)):[...allComments].sort((a,b)=>b.likes-a.likes).slice(0,8);
  document.getElementById("topComments").innerHTML=`<table class="data-table"><thead><tr><th>👍</th><th>Yorum</th></tr></thead><tbody>${filtered.slice(0,8).map(c=>`<tr><td><span class="pill teal">${c.likes}</span></td><td style="font-size:13px">${esc(c.text)}</td></tr>`).join("")}</tbody></table>`;
  document.getElementById("timestampComments").innerHTML=result.timestamps.length?result.timestamps.map(c=>`<div class="ts-row"><div>${c.stamps.map(s=>`<span class="ts-badge">${esc(s)}</span>`).join(" ")}</div><div class="ts-text">${esc(c.text)}</div></div>`).join(""):`<div class="empty-state">Zaman damgali yorum yok.</div>`;
}

function filterByWord(word){ if(activeWordFilter===word){clearWordFilter();return} activeWordFilter=word; document.getElementById("wordFilterLabel").textContent=`"${word}" içeren yorumlar`; document.getElementById("wordFilterBar").style.display="flex"; const raw=document.getElementById("commentsInput").value; renderCommentResult(analyzeComments(raw)); refreshIcons() }
function clearWordFilter(){ activeWordFilter=null; document.getElementById("wordFilterBar").style.display="none"; const raw=document.getElementById("commentsInput").value; renderCommentResult(analyzeComments(raw)); refreshIcons() }

function buildWordCloud(text){
  const counts=new Map();
  text.toLocaleLowerCase("tr-TR").replace(/[^\p{L}\p{N}\s]/gu," ").split(/\s+/).filter(w=>w.length>3&&!stopWords.has(w)).forEach(w=>counts.set(w,(counts.get(w)||0)+1));
  return[...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,28).map(([word,count])=>({word,size:13+Math.min(22,count*5),sentiment:containsAny(word,positiveWords)?"positive":containsAny(word,negativeWords)?"negative":"neutral"}));
}

function saveAnalysisSession(){
  const url=document.getElementById("videoUrl").value,raw=document.getElementById("commentsInput").value;
  if(!raw.trim()){showToast("Önce yorum gir","error");return}
  const result=analyzeComments(raw);
  snapshotUndo();
  state.analysisHistory=[{id:uid("as"),videoUrl:url,rawComments:raw,ts:Date.now(),total:result.total,score:result.score,themes:result.themes.slice(0,3)},...state.analysisHistory].slice(0,MAX_HISTORY);
  saveState(); renderAnalysisHistory(); showToast("Analiz kaydedildi","success"); logActivity(`Analiz kaydedildi: ${url||"Manuel yorum seti"}`,"success");
}

function renderAnalysisHistory(){
  const el=document.getElementById("analysisHistory");if(!el)return;
  el.innerHTML=state.analysisHistory.length?`<div style="display:grid;gap:10px">${state.analysisHistory.map(s=>`<div class="analysis-history-item"><div style="flex:1"><div style="font-weight:600;font-size:13px">${esc(s.videoUrl||"Manuel yorum seti")}</div><div class="row-meta">${fmt.dt(s.ts)} · ${s.total} yorum · <span class="pill teal">${s.score}/10</span></div></div><button type="button" class="ghost-btn" style="font-size:12px" onclick="loadAnalysisSession('${s.id}')">Yükle</button><button type="button" onclick="deleteAnalysisSession('${s.id}')" style="border:0;background:transparent;color:var(--coral);cursor:pointer;font-size:18px;padding:0 4px">×</button></div>`).join("")}</div>`:`<div class="empty-state">Analizi Kaydet düğmesiyle geçmişe ekle.</div>`;
}

function loadAnalysisSession(id){
  const s=state.analysisHistory.find(h=>h.id===id);if(!s)return;
  if(s.videoUrl)document.getElementById("videoUrl").value=s.videoUrl;
  if(s.rawComments){document.getElementById("commentsInput").value=s.rawComments;runCommentAnalysis()}
  showToast("Oturum yüklendi","info");
}
function deleteAnalysisSession(id){ snapshotUndo(); state.analysisHistory=state.analysisHistory.filter(h=>h.id!==id); saveState(); renderAnalysisHistory(); showToast("Oturum silindi","warning") }

function exportCommentsCsv(){
  const raw=document.getElementById("commentsInput").value,result=analyzeComments(raw);
  const rows=[["Video",document.getElementById("videoUrl").value,""],["Skor",result.score+"/10",""],["","",""],["Tip","Icerik","Deger"],...result.themes.map(t=>["Tema",t.name,`${t.percent}%`]),["","",""],["Sentiment","Pozitif",result.sentiment.positive],["Sentiment","Negatif",result.sentiment.negative],["","",""],...result.topComments.map(c=>["Yorum",c.text,c.likes]),...result.timestamps.map(c=>["Zaman",c.stamps.join(" "),c.text])];
  const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
  const url=URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"}));
  const a=Object.assign(document.createElement("a"),{href:url,download:`sentscan-${Date.now()}.csv`});
  document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
  showToast("CSV indirildi","success");
}

// ── CRM ───────────────────────────────────────────────────────────────
function bindCrm(){
  document.querySelectorAll("[data-crm-tab]").forEach(btn=>btn.addEventListener("click",()=>switchTab("crm",btn.dataset.crmTab)));
  document.getElementById("quickAddProduction").addEventListener("click",()=>{
    snapshotUndo();
    const idea=state.ideas[0];
    state.productions.unshift({id:uid("p"),title:idea?idea.title:"Yeni prodüksiyon",channel:idea?.channel||"Kade",stage:"draft",shootDate:"",publishDate:"",ideaId:idea?.id||"",owner:state.settings.members[0]||"Operasyon",tags:[],updates:["Kart oluşturuldu."],tasks:[],budgets:[{category:"Hazırlık",items:[]}]});
    saveState();renderAll();showToast("Yeni kart oluşturuldu","success");logActivity("Yeni prodüksiyon kartı açıldı","success");
  });
  document.getElementById("kanbanBoard").addEventListener("click",e=>{ const card=e.target.closest("[data-production-id]"); if(card)openProduction(card.dataset.productionId) });
  document.getElementById("dialogBody").addEventListener("click",handleDialogClick);
  document.getElementById("dialogBody").addEventListener("change",handleDialogChange);
  document.getElementById("deleteProductionBtn").addEventListener("click",()=>{
    const prod=state.productions.find(p=>p.id===currentProductionId);
    if(!prod||!confirm(`"${prod.title}" silinsin mi?`))return;
    snapshotUndo(); state.productions=state.productions.filter(p=>p.id!==currentProductionId);
    document.getElementById("productionDialog").close(); saveState();renderAll();
    showToast(`"${prod.title}" silindi`,"warning"); logActivity(`Prodüksiyon silindi: ${prod.title}`,"warning");
  });
  document.getElementById("duplicateProductionBtn").addEventListener("click",()=>{
    const prod=state.productions.find(p=>p.id===currentProductionId);if(!prod)return;
    snapshotUndo();
    const copy={...clone(prod),id:uid("p"),title:prod.title+" (kopya)",stage:"draft",updates:[`"${prod.title}"den kopyalandı.`],tasks:prod.tasks.map(t=>({...clone(t),id:uid("t"),done:false}))};
    state.productions.unshift(copy); document.getElementById("productionDialog").close(); saveState();renderAll();
    showToast("Kart kopyalandı","info"); logActivity(`Kart kopyalandı: ${prod.title}`,"info");
  });
  document.getElementById("ideaForm").addEventListener("submit",e=>{ e.preventDefault(); snapshotUndo(); state.ideas.unshift({id:uid("i"),title:document.getElementById("ideaTitle").value,channel:document.getElementById("ideaChannel").value,notes:document.getElementById("ideaNotes").value}); e.target.reset(); document.getElementById("ideaChannel").value="Kade Media"; saveState();renderAll();showToast("Fikir eklendi","success") });
  document.getElementById("inventoryForm").addEventListener("submit",e=>{ e.preventDefault(); snapshotUndo(); state.inventory.unshift({id:uid("inv"),name:document.getElementById("inventoryName").value,qty:Number(document.getElementById("inventoryQty").value||1),location:document.getElementById("inventoryLocation").value}); e.target.reset(); document.getElementById("inventoryQty").value=1; document.getElementById("inventoryLocation").value="Depo A / Raf 1"; saveState();renderAll();showToast("Envanter eklendi","success") });
}

function switchTab(prefix,tab){ document.querySelectorAll(`.${prefix}-tab`).forEach(n=>n.classList.remove("active")); document.querySelectorAll(`[data-${prefix}-tab]`).forEach(n=>n.classList.remove("active")); document.getElementById(`${prefix}-${tab}`)?.classList.add("active"); document.querySelector(`[data-${prefix}-tab="${tab}"]`)?.classList.add("active"); if(tab==="gantt")setTimeout(renderGanttChart,50); refreshIcons() }

function renderCrm(){
  const spent=totalSpent(),active=state.productions.filter(p=>!["published","cancelled"].includes(p.stage)).length;
  document.getElementById("crmKpis").innerHTML=[kpi("Bütçe",fmt.try.format(state.settings.monthlyBudget),"Aylık hedef","teal","wallet"),kpi("Harcanan",fmt.try.format(spent),state.settings.monthlyBudget>0?`%${budgetPercent(spent)}`:"Bütçe girilmedi","gold","trending-up"),kpi("Aktif",active,"Canlı prodüksiyon","indigo","clapperboard"),kpi("Fikir",state.ideas.length,"Havuzda","violet","lightbulb"),kpi("Envanter",state.inventory.length,"Kayıt","coral","boxes")].join("");
  renderTagFilterBar(); renderKanban(); renderIdeas(); renderGeneralTasks(); renderGanttChart(); renderInventory(); renderLibrary();
}

function renderTagFilterBar(){
  const el=document.getElementById("tagFilterBar");if(!el)return;
  el.innerHTML=`<span style="font-size:12px;color:var(--ink3);font-weight:700">Etiket:</span><button class="filter-chip${!state.kanbanTagFilter?" active":""}" onclick="setTagFilter(null)">Tümü</button>${productionTags.map(t=>`<button class="filter-chip tag-chip-filter ${state.kanbanTagFilter===t.id?"active":""}" onclick="setTagFilter('${t.id}')">${esc(t.label)}</button>`).join("")}<input type="search" id="kanbanSearchInput" placeholder="Prodüksiyon ara…" value="${esc(kanbanSearch)}" oninput="kanbanSearch=this.value;renderKanban()" style="margin-left:auto;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:5px 12px;color:var(--ink);font-size:12px;outline:none;width:180px;transition:var(--transition)" onfocus="this.style.borderColor='var(--teal)'" onblur="this.style.borderColor=''" />`;
}
function setTagFilter(tagId){ state.kanbanTagFilter=tagId; renderTagFilterBar(); renderKanban() }

function renderKanban(){
  const tagF=state.kanbanTagFilter;
  const sq=kanbanSearch.toLocaleLowerCase("tr-TR");
  const board=document.getElementById("kanbanBoard");
  board.innerHTML=stages.map(stage=>{
    let items=state.productions.filter(p=>p.stage===stage.id);
    if(tagF)items=items.filter(p=>(p.tags||[]).includes(tagF));
    if(sq)items=items.filter(p=>(p.title+p.owner+(p.channel||"")).toLocaleLowerCase("tr-TR").includes(sq));
    const cards=items.map(p=>{
      const prog=calcProgress(p);
      const tags=(p.tags||[]).length
        ? `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px">${(p.tags||[]).map(tagEl).join("")}</div>`
        : "";
      const progress=prog.total>0
        ? `<div style="margin-top:8px"><div style="display:flex;justify-content:space-between;font-size:11px;color:var(--ink3);margin-bottom:3px"><span>${prog.done}/${prog.total}</span><span>${prog.pct}%</span></div><div class="progress" style="height:4px"><span style="width:${prog.pct}%"></span></div></div>`
        : "";
      return `<button class="production-card" draggable="true" data-production-id="${p.id}"><strong style="font-size:14px;text-align:left;display:block;margin-bottom:6px">${esc(p.title)}</strong><div class="card-meta"><span class="pill ${stage.color}" style="font-size:11px">${esc(p.channel)}</span>${countdownBadge(p)}</div>${tags}${progress}<div class="row-meta" style="margin-top:6px">${esc(p.owner)} · ${fmt.try.format(productionSpent(p))}</div></button>`;
    }).join("");
    return `<section class="kanban-column" data-stage="${stage.id}"><header><span>${esc(stage.label)}</span><span class="pill ${stage.color}">${items.length}</span></header><div class="kanban-list">${cards}</div></section>`;
  }).join("");
  document.querySelectorAll(".production-card[draggable]").forEach(card=>{
    card.addEventListener("dragstart",e=>{dragSrcId=card.dataset.productionId;card.classList.add("dragging");e.dataTransfer.effectAllowed="move"});
    card.addEventListener("dragend",()=>{card.classList.remove("dragging");document.querySelectorAll(".kanban-column").forEach(c=>c.classList.remove("drag-over"))});
  });
  document.querySelectorAll(".kanban-column").forEach(col=>{
    col.addEventListener("dragover",e=>{e.preventDefault();document.querySelectorAll(".kanban-column").forEach(c=>c.classList.remove("drag-over"));col.classList.add("drag-over")});
    col.addEventListener("dragleave",e=>{if(!col.contains(e.relatedTarget))col.classList.remove("drag-over")});
    col.addEventListener("drop",e=>{
      e.preventDefault();
      col.classList.remove("drag-over");
      const targetStage=col.dataset.stage;
      if(!dragSrcId||!targetStage)return;
      const prod=state.productions.find(p=>p.id===dragSrcId);
      if(prod&&prod.stage!==targetStage){
        snapshotUndo();
        const stageName=stages.find(s=>s.id===targetStage)?.label||targetStage;
        prod.stage=targetStage;
        prod.updates.unshift(`Aşama "${stageName}" olarak değiştirildi.`);
        saveState();
        renderAll();
        showToast(`"${prod.title}" → ${stageName}`,"success");
        logActivity(`"${prod.title}" → ${stageName}`,"success");
      }
      dragSrcId=null;
    });
  });
}

function openProduction(id){
  currentProductionId=id;
  const prod=state.productions.find(p=>p.id===id);if(!prod)return;
  const idea=state.ideas.find(i=>i.id===prod.ideaId),stage=stages.find(s=>s.id===prod.stage),prog=calcProgress(prod),members=state.settings.members;
  document.getElementById("dialogStage").textContent=stage?.label||"Kart";
  document.getElementById("dialogTitle").textContent=prod.title;
  document.getElementById("dialogBody").innerHTML=`<div class="dialog-grid"><div><div class="section-block"><h3>Detay</h3>${prog.total>0?`<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;font-size:12px;color:var(--ink3);margin-bottom:4px"><span>${prog.done}/${prog.total} görev</span><span>${prog.pct}%</span></div><div class="progress"><span style="width:${prog.pct}%"></span></div></div>`:""}<table class="data-table"><tbody><tr><td style="width:110px;font-weight:600;font-size:13px">Başlık</td><td><input class="editable-field" style="width:100%" data-edit="title" value="${esc(prod.title)}"/></td></tr><tr><td style="font-weight:600;font-size:13px">Sahip</td><td><select class="editable-field" data-edit="owner">${members.map(m=>`<option${prod.owner===m?" selected":""}>${esc(m)}</option>`).join("")}</select></td></tr><tr><td style="font-weight:600;font-size:13px">Çekim</td><td><input class="editable-field" type="date" data-edit="shootDate" value="${prod.shootDate||""}"/></td></tr><tr><td style="font-weight:600;font-size:13px">Yayın</td><td><input class="editable-field" type="date" data-edit="publishDate" value="${prod.publishDate||""}"/></td></tr><tr><td style="font-weight:600;font-size:13px">Fikir</td><td class="row-meta">${esc(idea?.title||"—")}</td></tr><tr><td style="font-weight:600;font-size:13px">Harcama</td><td><span class="pill gold">${fmt.try.format(productionSpent(prod))}</span></td></tr></tbody></table></div><div class="section-block"><h3>Etiketler</h3><div style="display:flex;flex-wrap:wrap;gap:8px">${productionTags.map(t=>{ const active=(prod.tags||[]).includes(t.id); return`<button type="button" class="tag-chip ${t.color}${active?" tag-active":""}" onclick="toggleProdTag('${t.id}')">${esc(t.label)}</button>` }).join("")}</div></div><div class="section-block"><h3>Aşama</h3><div class="status-actions">${stages.map(s=>`<button type="button" class="status-btn${prod.stage===s.id?" active-stage":""}" data-move-stage="${s.id}">${esc(s.label)}</button>`).join("")}</div></div><div class="section-block"><h3>Güncellemeler</h3>${prod.updates.map(u=>`<div class="simple-row" style="font-size:13px">· ${esc(u)}</div>`).join("")}<div class="mini-form" style="margin-top:8px"><input id="newUpdateText" placeholder="Durum güncellemesi…"/><button type="button" class="icon-btn" data-add-update><i data-lucide="plus"></i></button></div></div></div><div><div class="section-block"><h3>Görevler</h3>${prod.tasks.map(t=>`<div class="task-item" style="border-bottom:1px solid var(--border);padding-bottom:10px;margin-bottom:10px"><label style="display:flex;align-items:flex-start;gap:8px;cursor:pointer"><input type="checkbox" data-dialog-task="${t.id}" ${t.done?"checked":""} style="margin-top:3px"/><div style="flex:1"><div style="font-weight:600;font-size:13px;${t.done?"text-decoration:line-through;opacity:.5":""}">${esc(t.title)}</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px"><select data-task-priority="${t.id}" style="font-size:11px;padding:2px 6px;min-height:auto;border-radius:6px;width:auto">${["Yüksek","Orta","Düşük"].map(p=>`<option${t.priority===p?" selected":""}>${p}</option>`).join("")}</select><input type="date" data-task-due="${t.id}" value="${t.due||""}" style="font-size:11px;padding:2px 6px;min-height:auto;border-radius:6px;width:auto"/><select data-task-assignee="${t.id}" style="font-size:11px;padding:2px 6px;min-height:auto;border-radius:6px;width:auto">${members.map(m=>`<option${t.assignee===m?" selected":""}>${esc(m)}</option>`).join("")}</select></div></div><button type="button" onclick="deleteTask('${prod.id}','${t.id}')" style="border:0;background:transparent;color:var(--coral);cursor:pointer;font-size:18px;padding:0">×</button></label></div>`).join("")||`<div class="empty-state">Görev yok.</div>`}<div class="mini-form" style="margin-top:8px"><input id="newTaskText" placeholder="Yeni görev…"/><button type="button" class="icon-btn" data-add-task><i data-lucide="plus"></i></button></div></div><div class="section-block"><h3>Bütçe</h3>${prod.budgets.map((g,gi)=>`<div style="margin-bottom:16px"><div style="font-size:11px;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">${esc(g.category)}</div><table class="data-table"><thead><tr><th>Kalem</th><th>Tutar</th><th>Kişi</th><th></th></tr></thead><tbody>${g.items.map(item=>`<tr><td style="font-size:13px">${esc(item.label)}</td><td><span class="pill gold">${fmt.try.format(item.amount)}</span></td><td class="row-meta">${esc(item.spender)}</td><td><button type="button" onclick="deleteBudgetItem('${gi}','${item.id}')" style="border:0;background:transparent;color:var(--coral);cursor:pointer;font-size:16px;padding:0">×</button></td></tr>`).join("")}</tbody></table><div class="budget-add-form" data-budget-group="${gi}"><input placeholder="Kalem adı" data-ba-label/><input type="number" placeholder="Tutar" data-ba-amount min="0"/><select data-ba-spender>${members.map(m=>`<option>${esc(m)}</option>`).join("")}</select><button type="button" class="add-item-btn" data-add-budget="${gi}">+ Ekle</button></div></div>`).join("")}<button type="button" class="ghost-btn" style="font-size:12px;min-height:30px" data-add-category><i data-lucide="plus" style="width:13px;height:13px"></i> Kategori ekle</button></div></div></div>`;
  const dialog=document.getElementById("productionDialog");
  if(!dialog.open)dialog.showModal();
  refreshIcons();
}

function toggleProdTag(tagId){ const prod=state.productions.find(p=>p.id===currentProductionId);if(!prod)return;if(!prod.tags)prod.tags=[];const idx=prod.tags.indexOf(tagId);if(idx===-1)prod.tags.push(tagId);else prod.tags.splice(idx,1);saveState();renderKanban();openProduction(prod.id) }
function deleteTask(prodId,taskId){ const prod=state.productions.find(p=>p.id===prodId);if(!prod||!confirm("Görev silinsin mi?"))return;snapshotUndo();prod.tasks=prod.tasks.filter(t=>t.id!==taskId);saveState();renderAll();openProduction(prodId);showToast("Görev silindi","warning") }
function deleteBudgetItem(groupIdx,itemId){ const prod=state.productions.find(p=>p.id===currentProductionId);if(!prod||!confirm("Bütçe kalemi silinsin mi?"))return;snapshotUndo();const group=prod.budgets[Number(groupIdx)];if(group)group.items=group.items.filter(i=>String(i.id)!==String(itemId));saveState();renderAll();openProduction(prod.id);showToast("Kalemi silindi","warning") }

function handleDialogClick(e){
  const prod=state.productions.find(p=>p.id===currentProductionId);if(!prod)return;
  const stageBtn=e.target.closest("[data-move-stage]");
  if(stageBtn){snapshotUndo();prod.stage=stageBtn.dataset.moveStage;const stageName=stages.find(s=>s.id===prod.stage)?.label||prod.stage;prod.updates.unshift(`Aşama "${stageName}" olarak güncellendi.`);saveState();renderAll();openProduction(prod.id);showToast(`Aşama: ${stageName}`,"success");logActivity(`"${prod.title}" → ${stageName}`,"success");return}
  const taskBox=e.target.closest("[data-dialog-task]");if(taskBox){toggleTask(taskBox.dataset.dialogTask,taskBox.checked);return}
  if(e.target.closest("[data-add-update]")){const inp=document.getElementById("newUpdateText");if(inp.value.trim()){snapshotUndo();prod.updates.unshift(inp.value.trim());saveState();renderAll();openProduction(prod.id);showToast("Güncelleme eklendi","success")}return}
  if(e.target.closest("[data-add-task]")){const inp=document.getElementById("newTaskText");if(inp.value.trim()){snapshotUndo();prod.tasks.unshift({id:uid("t"),title:inp.value.trim(),assignee:state.settings.members[0]||"Operasyon",priority:"Orta",due:"",done:false,desc:""});saveState();renderAll();openProduction(prod.id);showToast("Görev eklendi","success")}return}
  const budgetAddBtn=e.target.closest("[data-add-budget]");
  if(budgetAddBtn){const gi=Number(budgetAddBtn.dataset.addBudget),form=budgetAddBtn.closest(".budget-add-form"),label=form.querySelector("[data-ba-label]").value.trim(),amount=Number(form.querySelector("[data-ba-amount]").value),spender=form.querySelector("[data-ba-spender]").value;if(!label||!amount){showToast("Kalem adı ve tutar zorunludur","error");return}snapshotUndo();prod.budgets[gi].items.push({id:uid("bi"),label,amount,spender});saveState();renderAll();openProduction(prod.id);showToast(`${fmt.try.format(amount)} eklendi`,"success");return}
  if(e.target.closest("[data-add-category]")){const name=prompt("Yeni kategori adı:");if(name?.trim()){snapshotUndo();prod.budgets.push({category:name.trim(),items:[]});saveState();renderAll();openProduction(prod.id);showToast("Kategori eklendi","success")}}
}

function handleDialogChange(e){
  const prod=state.productions.find(p=>p.id===currentProductionId);if(!prod)return;
  const editField=e.target.closest("[data-edit]");if(editField){prod[editField.dataset.edit]=editField.value;if(editField.dataset.edit==="title")document.getElementById("dialogTitle").textContent=editField.value;saveState();renderKanban();return}
  const prioSel=e.target.closest("[data-task-priority]");if(prioSel){const t=findTask(prioSel.dataset.taskPriority);if(t){t.priority=prioSel.value;saveState()}return}
  const dueSel=e.target.closest("[data-task-due]");if(dueSel){const t=findTask(dueSel.dataset.taskDue);if(t){t.due=dueSel.value;saveState()}return}
  const assigneeSel=e.target.closest("[data-task-assignee]");if(assigneeSel){const t=findTask(assigneeSel.dataset.taskAssignee);if(t){t.assignee=assigneeSel.value;saveState();renderGeneralTasks()}return}
}

function toggleTask(id,done){ const t=findTask(id);if(t)t.done=done;saveState();renderDashboard();renderGeneralTasks();updateBadge();refreshIcons() }

function renderIdeas(){
  document.getElementById("ideaList").innerHTML=state.ideas.map(idea=>`<div class="idea-item"><h3>${esc(idea.title)}</h3><span class="pill teal">${esc(idea.channel)}</span><p class="row-meta" style="font-size:13px;margin-top:6px">${esc(idea.notes)}</p><div style="display:flex;gap:8px;margin-top:10px"><button type="button" class="ghost-btn" style="font-size:12px" onclick="ideaToProduction('${idea.id}')"><i data-lucide="arrow-right" style="width:13px;height:13px"></i> Prodüksiyona Taşı</button><button type="button" onclick="deleteIdea('${idea.id}')" style="border:0;background:transparent;color:var(--coral);cursor:pointer;font-size:18px;padding:0">×</button></div></div>`).join("")||`<div class="empty-state">Fikir havuzu bos.</div>`;
}

function ideaToProduction(ideaId){ const idea=state.ideas.find(i=>i.id===ideaId);if(!idea||!confirm(`"${idea.title}" → prodüksiyon kartı açılsın mı?`))return;snapshotUndo();state.productions.unshift({id:uid("p"),title:idea.title,channel:idea.channel,stage:"draft",shootDate:"",publishDate:"",ideaId:idea.id,owner:state.settings.members[0]||"Operasyon",tags:[],updates:[`"${idea.title}" fikrinden oluşturuldu.`],tasks:[],budgets:[{category:"Hazırlık",items:[]}]});saveState();renderAll();switchTab("crm","productions");showToast("Prodüksiyon kartı açıldı","success");logActivity(`Fikir prodüksiyona taşındı: ${idea.title}`,"success") }
function deleteIdea(id){ if(!confirm("Fikir silinsin mi?"))return;snapshotUndo();state.ideas=state.ideas.filter(i=>i.id!==id);saveState();renderIdeas();showToast("Fikir silindi","warning") }

function renderGeneralTasks(){
  const assigneeSel=document.getElementById("taskAssigneeFilter");
  const currentAssignee=assigneeSel?.value||"";
  if(assigneeSel){ const assignees=[...new Set(state.productions.flatMap(p=>p.tasks.map(t=>t.assignee)))].sort(); assigneeSel.innerHTML=`<option value="">— Tümü —</option>`+assignees.map(a=>`<option${a===currentAssignee?" selected":""}>${esc(a)}</option>`).join("") }
  const filterAssignee=document.getElementById("taskAssigneeFilter")?.value||"",filterStatus=document.getElementById("taskStatusFilter")?.value||"",filterPrio=document.getElementById("taskPrioFilter")?.value||"";
  const tasks=state.productions.flatMap(p=>p.tasks.map(t=>({task:t,production:p}))).filter(({task})=>(!filterAssignee||task.assignee===filterAssignee)&&(!filterStatus||(filterStatus==="open"?!task.done:task.done))&&(!filterPrio||task.priority===filterPrio));
  const selected=state.selectedTasks||[];
  const toolbar=document.getElementById("bulkTaskToolbar");if(toolbar){toolbar.style.display=selected.length?"flex":"none";const cnt=document.getElementById("bulkCount");if(cnt)cnt.textContent=`${selected.length} seçili`}
  document.getElementById("generalTasks").innerHTML=tasks.length?`<table class="data-table"><thead><tr><th><input type="checkbox" id="selectAllTasks" onchange="toggleSelectAll(this.checked)"/></th><th>Görev</th><th>Prodüksiyon</th><th>Sahip</th><th>Öncelik</th><th>Tarih</th></tr></thead><tbody>${tasks.map(({task,production})=>`<tr><td><input type="checkbox" class="bulk-task-cb" data-tid="${task.id}" ${selected.includes(task.id)?"checked":""} onchange="toggleBulkSelect('${task.id}',this.checked)"/></td><td style="font-weight:600;font-size:13px;${task.done?"text-decoration:line-through;opacity:.5":""}">${esc(task.title)}</td><td class="row-meta">${esc(production.title)}</td><td class="row-meta">${esc(task.assignee)}</td><td><span class="pill ${priorityColor(task.priority)}">${esc(task.priority)}</span></td><td class="row-meta">${fmt.date(task.due)}</td></tr>`).join("")}</tbody></table>`:`<div class="empty-state">Bu kriterlere göre görev bulunamadı.</div>`;
}

function toggleSelectAll(checked){ const cbs=document.querySelectorAll(".bulk-task-cb");state.selectedTasks=checked?[...cbs].map(cb=>cb.dataset.tid):[];cbs.forEach(cb=>cb.checked=checked);const toolbar=document.getElementById("bulkTaskToolbar");if(toolbar)toolbar.style.display=checked&&cbs.length?"flex":"none";const cnt=document.getElementById("bulkCount");if(cnt)cnt.textContent=`${state.selectedTasks.length} seçili` }
function toggleBulkSelect(taskId,checked){ if(!state.selectedTasks)state.selectedTasks=[];if(checked)state.selectedTasks.push(taskId);else state.selectedTasks=state.selectedTasks.filter(id=>id!==taskId);const toolbar=document.getElementById("bulkTaskToolbar");if(toolbar)toolbar.style.display=state.selectedTasks.length?"flex":"none";const cnt=document.getElementById("bulkCount");if(cnt)cnt.textContent=`${state.selectedTasks.length} seçili` }
function bulkCompleteTasks(){ if(!state.selectedTasks?.length)return;snapshotUndo();state.productions.forEach(p=>p.tasks.forEach(t=>{if(state.selectedTasks.includes(t.id))t.done=true}));state.selectedTasks=[];saveState();renderAll();showToast("Seçili görevler tamamlandı","success") }
function clearBulkSelect(){ state.selectedTasks=[];renderGeneralTasks() }

function renderInventory(){
  document.getElementById("inventoryTable").innerHTML=`<table class="data-table"><thead><tr><th>Ürün</th><th>Adet</th><th>Konum</th></tr></thead><tbody>${state.inventory.map(item=>`<tr><td style="font-weight:600;font-size:13px">${esc(item.name)}</td><td><div class="qty-control"><button class="qty-btn" onclick="adjustQty('${item.id}',-1)">−</button><span class="qty-display">${item.qty}</span><button class="qty-btn" onclick="adjustQty('${item.id}',1)">+</button></div></td><td class="row-meta">${esc(item.location)}</td></tr>`).join("")}</tbody></table>`;
}
function adjustQty(id,delta){ const item=state.inventory.find(i=>i.id===id);if(!item)return;item.qty=Math.max(0,item.qty+delta);saveState();renderInventory();showToast(`${item.name}: ${item.qty} adet`,"info") }
function renderLibrary(){
  const el=document.getElementById("libraryList");if(!el)return;
  el.innerHTML=state.docs.map(doc=>`<div class="doc-item" style="position:relative"><div style="font-size:28px">${esc(doc.icon||"📄")}</div><h3>${esc(doc.title)}</h3><div class="card-meta"><span class="pill indigo">${esc(doc.type)}</span><span class="row-meta">${esc(doc.owner)}</span></div><button onclick="deleteDoc('${doc.id}')" style="position:absolute;top:8px;right:8px;border:0;background:transparent;color:var(--coral);cursor:pointer;font-size:20px;line-height:1;padding:2px;opacity:.5;transition:var(--transition)" title="Sil" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=.5">×</button></div>`).join("")+`<div class="doc-item" style="border-style:dashed;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;opacity:.55;transition:var(--transition)" onclick="addDoc()" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=.55"><div style="font-size:28px">+</div><h3 style="font-size:12px;font-weight:600">Yeni Doküman</h3></div>`;
}
function addDoc(){
  const title=prompt("Doküman adı:");if(!title?.trim())return;
  const type=prompt("Tür (Finans / IK / Hukuk / Tasarım / Teknik / Genel):")||"Genel";
  const owner=prompt("Sorumlu:")||"Operasyon";
  const icons={Finans:"💰",IK:"👥",Hukuk:"📄",Tasarım:"🎨",Teknik:"🤖",Genel:"📋"};
  snapshotUndo();
  state.docs.push({id:uid("doc"),title:title.trim(),type:type.trim(),owner:owner.trim(),icon:icons[type.trim()]||"📋"});
  saveState();renderLibrary();showToast("Doküman eklendi","success");
}
function deleteDoc(idOrTitle){
  if(!confirm("Doküman silinsin mi?"))return;
  snapshotUndo();
  state.docs=state.docs.filter(d=>(d.id||d.title)!==idOrTitle);
  saveState();renderLibrary();showToast("Doküman silindi","warning");
}

function renderGanttChart(){
  const el=document.getElementById("ganttChart");if(!el)return;
  const now=new Date(),start=new Date(now.getFullYear(),now.getMonth()-1,1),end=new Date(now.getFullYear(),now.getMonth()+3,0),totalMs=end-start;
  const months=[],stageColors={draft:"#6c8ef5",production:"#00d4aa",post:"#ffd166",published:"#c77dff",cancelled:"#ff6b6b"};
  let cur=new Date(start);while(cur<=end){months.push(new Date(cur));cur=new Date(cur.getFullYear(),cur.getMonth()+1,1)}
  const todayPct=Math.max(0,Math.min(100,((now-start)/totalMs)*100)),prods=state.productions.filter(p=>p.publishDate||p.shootDate);
  el.innerHTML=`<div class="gantt-header"><div class="gantt-label-col">Prodüksiyon</div><div class="gantt-months">${months.map(m=>`<div class="gantt-month">${m.toLocaleDateString("tr-TR",{month:"short",year:"2-digit"})}</div>`).join("")}</div></div>${!prods.length?`<div class="empty-state">Tarih girilmiş prodüksiyon yok.</div>`:prods.map(p=>{ const s2=new Date(p.shootDate||p.publishDate),e2=new Date(p.publishDate||p.shootDate),l=Math.max(0,Math.min(100,((s2-start)/totalMs)*100)),r=Math.max(0,Math.min(100,((e2-start)/totalMs)*100)),w=Math.max(1,r-l);return`<div class="gantt-row" onclick="openProduction('${p.id}')" style="cursor:pointer"><div class="gantt-row-label">${esc(p.title.slice(0,26))}${p.title.length>26?"…":""}<div class="row-meta">${esc(p.owner)}</div></div><div class="gantt-track"><div class="gantt-today" style="left:${todayPct}%"></div><div class="gantt-bar" style="left:${l}%;width:${w}%;background:${stageColors[p.stage]||"#6c8ef5"}">${w>8?esc(p.title.slice(0,12)):""}</div></div></div>` }).join("")}`;
}

// ── BANANA STUDIO ─────────────────────────────────────────────────────
function populateSelects(){
  const setOpts=(id,opts)=>{ const el=document.getElementById(id);if(!el)return;el.innerHTML=opts.map(o=>`<option value="${esc(o.value)}">${esc(o.label)}</option>`).join("") };
  setOpts("imageModel",imageModels.map(m=>({value:m.id,label:`${m.name} (${providerCost(m.cost,"/görsel")})`})));
  setOpts("imageRatio",[{value:"16:9",label:"16:9 YouTube"},{value:"9:16",label:"9:16 Reels"},{value:"1:1",label:"1:1 Kare"},{value:"4:3",label:"4:3 Klasik"}]);
  setOpts("imageResolution",[{value:"1920x1080",label:"1920×1080 FHD"},{value:"2560x1440",label:"2560×1440 QHD"},{value:"3840x2160",label:"3840×2160 4K"}]);
  setOpts("videoModel",videoModels.map(m=>({value:m.id,label:`${m.name} ($${m.base}/10s)`})));
  setOpts("videoDuration",[{value:"5",label:"5 sn"},{value:"10",label:"10 sn"},{value:"15",label:"15 sn"},{value:"30",label:"30 sn"}]);
  setOpts("videoResolution",[{value:"1080p",label:"1080p FHD"},{value:"4K",label:"4K Ultra HD"}]);
}

function bindBanana(){
  document.querySelectorAll("[data-banana-tab]").forEach(btn=>btn.addEventListener("click",()=>switchTab("banana",btn.dataset.bananaTab)));
  document.getElementById("brainstormImage").addEventListener("click",()=>{ const cnt=Number(document.getElementById("brainstormCount").value)||5; state.brainstorm=createBrainstorm(document.getElementById("imagePrompt").value,cnt);saveState();renderBanana() });
  document.getElementById("enhanceImagePrompt").addEventListener("click",()=>{ const el=document.getElementById("imagePrompt");el.value=enhanceImagePrompt(el.value);showToast("Prompt iyilestirildi","info") });
  document.getElementById("enhanceVideoPrompt").addEventListener("click",()=>{ const el=document.getElementById("videoPrompt");el.value=enhanceVideoPrompt(el.value);showToast("Prompt iyilestirildi","info") });
  document.getElementById("saveTemplate").addEventListener("click",()=>{ const prompt=document.getElementById("imagePrompt").value.trim();if(!prompt){showToast("Önce bir prompt yaz","error");return}snapshotUndo();const name=prompt.slice(0,30)+(prompt.length>30?"…":"");if(!state.promptTemplates)state.promptTemplates=[];state.promptTemplates.push({id:uid("tpl"),name,prompt});saveState();renderPromptTemplates();showToast("Şablon kaydedildi","success") });
  document.getElementById("imageForm").addEventListener("submit",async e=>{ e.preventDefault();const model=imageModels.find(m=>m.id===document.getElementById("imageModel").value)||imageModels[0],count=Number(document.getElementById("imageCount").value||1),prompt=document.getElementById("imagePrompt").value;if(!prompt.trim()){showToast("Önce prompt yaz","error");return}const srcs=(await generateImageSrcs(prompt,count,state.media.length)).filter(Boolean);if(!srcs.length){showToast("Görsel üretilemedi; kayıt oluşturulmadı.","error");return}snapshotUndo();const cost=model.cost*srcs.length;for(const src of srcs)state.media.push({id:uid("img"),title:`Görsel ${state.media.length+1}`,prompt,model:model.name,cost:model.cost,src});state.media=state.media.slice(-24);const user=state.users[0];if(user){user.images+=srcs.length;user.spend+=cost}state.totalUsdSpent=(state.totalUsdSpent||0)+cost;if(!state.promptHistory)state.promptHistory=[];state.promptHistory=[prompt,...state.promptHistory.filter(p=>p!==prompt)].slice(0,8);saveState();renderBanana();renderRecentMedia();showToast(`${srcs.length} görsel üretildi (${providerCost(cost)})`,"success");logActivity(`Banana: ${srcs.length} görsel üretildi`,"success") });
  document.getElementById("videoForm").addEventListener("submit",async e=>{
    e.preventDefault();
    const prompt=document.getElementById("videoPrompt").value.trim(),button=document.getElementById("videoGenerateButton");
    if(!prompt){showToast("Önce video promptu yaz.","error");return}
    if(!API.features.video){showToast("Video sağlayıcısı bağlı değil. Ayarlar › Altyapı bölümünü kontrol et.","error");return}
    const model=videoModels.find(m=>m.id===document.getElementById("videoModel").value)||videoModels[0],dur=Number(document.getElementById("videoDuration").value||10);
    button.disabled=true;button.textContent="Video üretiliyor…";
    try{
      const response=await apiPost("/api/video",{subject:prompt.slice(0,300),script:prompt,language:"tr",aspect:"landscape"},290000);
      const payload=response?.data||response,urls=arr(payload?.videos).map(v=>str(v)).filter(Boolean);
      if(response?.error||!urls.length){showToast(response?.error||"Video sağlayıcısı boş yanıt döndürdü.","error");return}
      snapshotUndo();
      const unitCost=model.base*Math.max(dur,10)/10;
      urls.forEach((src,index)=>state.videos.push({id:uid("vid"),title:`Video ${state.videos.length+index+1}`,prompt,model:model.name,cost:unitCost,dur,src}));
      state.videos=state.videos.slice(-24);state.totalUsdSpent=(state.totalUsdSpent||0)+(unitCost*urls.length);
      const user=state.users[0];if(user){user.videos+=urls.length;user.spend+=unitCost*urls.length}
      saveState();renderBanana();showToast(`${urls.length} video üretildi (${providerCost(unitCost*urls.length)})`,"success");logActivity(`Banana: ${urls.length} video üretildi`,"success");
    }catch(error){showToast(error?.name==="AbortError"?"Video üretimi zaman aşımına uğradı.":"Video bağlantı hatası.","error")}
    finally{button.disabled=!API.features.video;button.innerHTML='<i data-lucide="play"></i>Oluştur';refreshIcons()}
  });
  document.getElementById("continueVideo").addEventListener("click",()=>{ const el=document.getElementById("videoPrompt");el.value=`[DEVAM] ${el.value}`;el.focus() });
  document.getElementById("referenceForm").addEventListener("submit",e=>{ e.preventDefault();const tag=document.getElementById("referenceTag").value.trim();if(!tag)return;state.references.push({id:uid("ref"),tag:tag.startsWith("@")?tag:`@${tag}`,label:tag.replace("@",""),tone:"teal"});document.getElementById("referenceTag").value="";saveState();renderBanana();refreshIcons() });
}

function renderBanana(){ document.getElementById("bananaCost").textContent=`Sağlayıcı maliyeti: ${providerCost(state.totalUsdSpent||0)}`;renderBananaReferences();renderPromptTemplates();renderBrainstorm();renderPromptHistory();renderImageGallery();renderVideoHistory();renderYoutubeRefs();renderAdminSpend();renderModelCosts();renderSpendingChart() }
function renderBananaReferences(){ document.getElementById("referenceList").innerHTML=state.references.map(r=>`<div class="reference-row"><div class="avatar">${esc(r.label.slice(0,2).toUpperCase())}</div><div style="flex:1"><div style="font-size:13px;font-weight:600">${esc(r.tag)}</div><div class="row-meta">${esc(r.label)}</div></div><span class="pill ${r.tone||"teal"}">Aktif</span></div>`).join("")||`<div class="empty-state">Referans ekle.</div>` }

function renderPromptTemplates(){
  const el=document.getElementById("promptTemplates");if(!el)return;
  const templates=state.promptTemplates||[];
  el.innerHTML=templates.length?templates.map(t=>`<div class="prompt-history-item"><span class="prompt-history-text">${esc(t.name)}</span><button class="prompt-history-use" onclick="useTemplate('${t.id}')">Kullan</button><button onclick="deleteTemplate('${t.id}')" style="border:0;background:transparent;color:var(--coral);cursor:pointer;font-size:16px;padding:0 4px">×</button></div>`).join(""):`<div class="empty-state">Prompt yazıp sablon olarak kaydet.</div>`;
}
function useTemplate(id){ const t=(state.promptTemplates||[]).find(t=>t.id===id);if(t){document.getElementById("imagePrompt").value=t.prompt;showToast("Şablon yüklendi","info")} }
function deleteTemplate(id){ state.promptTemplates=(state.promptTemplates||[]).filter(t=>t.id!==id);saveState();renderPromptTemplates();showToast("Şablon silindi","warning") }

function renderBrainstorm(){
  const list=document.getElementById("brainstormList");if(!list)return;
  if(!state.brainstorm.length){list.innerHTML=`<div style="padding:24px;text-align:center;color:var(--ink3);font-size:13px">Prompt önerisi oluşturmak için düğmeye bas.</div>`;return}
  list.innerHTML=state.brainstorm.map((item,idx)=>`<button type="button" style="width:100%;padding:10px 14px;border:0;border-bottom:${idx<state.brainstorm.length-1?`1px solid var(--border)`:"none"};border-radius:${idx===0?`var(--radius) var(--radius) 0 0`:idx===state.brainstorm.length-1?`0 0 var(--radius) var(--radius)`:`0`};background:transparent;text-align:left;color:var(--ink2);font-size:13px;cursor:pointer;transition:var(--transition);display:flex;align-items:flex-start;gap:8px" onmouseover="this.style.background='var(--surface-hover)'" onmouseout="this.style.background='transparent'" onclick="document.getElementById('imagePrompt').value=this.dataset.prompt;showToast('Prompt yüklendi','info')" data-prompt="${esc(item.prompt)}"><span style="color:var(--teal);flex:0 0 auto;font-weight:700">→</span><span>${esc(item.prompt.slice(0,120))}${item.prompt.length>120?"…":""}</span></button>`).join("")
}
function renderPromptHistory(){ const el=document.getElementById("promptHistory");if(!el)return;const history=state.promptHistory||[];el.innerHTML=history.length?history.map((p,i)=>`<div class="prompt-history-item"><span class="prompt-history-text">${esc(p.slice(0,100))}${p.length>100?"…":""}</span><button class="prompt-history-use" onclick="document.getElementById('imagePrompt').value=(state.promptHistory||[])[${i}];showToast('Prompt yüklendi','info')">Kullan</button></div>`).join(""):`<div class="empty-state">Görsel üretince burada görünür.</div>` }
function renderImageGallery(){ const items=state.media.slice(-9).reverse(),el=document.getElementById("imageGallery");el.innerHTML=items.length?items.map(m=>`<div class="image-tile"><img src="${safeImageUrl(m.src)}" alt="${esc(m.title)}" loading="lazy"/><div><div style="font-size:12px;font-weight:600">${esc(m.title)}</div><div class="row-meta" style="font-size:11px">${providerCost(m.cost)} · ${esc(m.model)}</div></div></div>`).join(""):`<div class="empty-state">Henüz görsel üretilmedi.</div>` }
function renderVideoHistory(){ const items=state.videos.slice(-6).reverse(),el=document.getElementById("videoHistory");el.innerHTML=items.length?items.map(v=>`<div class="video-tile">${v.src?`<video class="video-thumb" src="${esc(v.src)}" controls preload="metadata" aria-label="${esc(v.title)}"></video>`:`<div class="video-thumb"><i data-lucide="play-circle"></i></div>`}<div><div style="font-size:13px;font-weight:600">${esc(v.title)}</div><div class="row-meta" style="font-size:11px">${providerCost(v.cost)} · ${esc(v.model)} · ${v.dur}s</div></div></div>`).join(""):`<div class="empty-state">Henüz video üretilmedi.</div>` }
const _ytRefs=[];
let _ytSort="popular";
function switchYtSort(sort,btn){
  _ytSort=sort;
  document.querySelectorAll("[data-yt-sort]").forEach(b=>b.classList.remove("active"));
  if(btn)btn.classList.add("active");
  renderYoutubeRefs();
}
function renderYoutubeRefs(){
  const sorted=_ytSort==="recent"
    ?[..._ytRefs].sort((a,b)=>new Date(b.date)-new Date(a.date))
    :[..._ytRefs].sort((a,b)=>b.views-a.views);
  const list=document.getElementById("youtubeReferences");
  list.innerHTML=sorted.length?sorted.map((r,index)=>`<div class="reference-row"><div style="font-size:20px">▶</div><div style="flex:1"><div class="row-title" style="font-size:13px">${esc(r.title)}</div><div class="row-meta">${fmt.date(r.date)} · ${(r.views/1000).toFixed(0)}K izlenme</div></div><button type="button" class="ghost-btn" style="font-size:12px" data-youtube-ref="${index}">Ref al</button></div>`).join(""):`<div class="empty-state">Henüz referans video eklenmedi.</div>`;
  list.querySelectorAll("[data-youtube-ref]").forEach(button=>button.addEventListener("click",()=>{const ref=sorted[Number(button.dataset.youtubeRef)];if(ref)document.getElementById("videoPrompt").value+=`[Ref: ${ref.title}]`}));
}
function renderAdminSpend(){ document.getElementById("adminSpend").innerHTML=`<table class="data-table"><thead><tr><th>Kullanıcı</th><th>Görsel</th><th>Video</th><th>Tahmini sağlayıcı kullanımı</th></tr></thead><tbody>${state.users.map(u=>`<tr><td style="font-weight:700">${esc(u.name)}</td><td><span class="pill indigo">${u.images}</span></td><td><span class="pill violet">${u.videos}</span></td><td><span class="cost-chip">${providerCost(u.spend)}</span></td></tr>`).join("")}</tbody></table><div style="margin-top:14px;padding:14px;border:1px solid var(--border);border-radius:10px;background:var(--gold-dim)"><div style="font-size:11px;font-weight:700;color:var(--gold);margin-bottom:4px">TAHMİNİ TOPLAM SAĞLAYICI KULLANIMI</div><div style="font-size:28px;font-weight:900;color:var(--gold)">${providerCost(state.totalUsdSpent||0)}</div></div>` }
function renderModelCosts(){ document.getElementById("modelCosts").innerHTML=`<table class="data-table"><thead><tr><th>Model</th><th>Tip</th><th>Birim</th></tr></thead><tbody>${imageModels.map(m=>`<tr><td style="font-weight:700;font-size:13px">${esc(m.name)}</td><td><span class="pill teal">Görsel</span></td><td><span class="cost-chip">${providerCost(m.cost,"/görsel")}</span></td></tr>`).join("")}${videoModels.map(m=>`<tr><td style="font-weight:700;font-size:13px">${esc(m.name)}</td><td><span class="pill violet">Video</span></td><td><span class="cost-chip">${providerCost(m.base,"/10 sn")}</span></td></tr>`).join("")}</tbody></table>` }
function renderSpendingChart(){ const el=document.getElementById("spendingChart");if(!el)return;const max=Math.max(...state.users.map(u=>u.spend),1),cls=["#00d4aa","#6c8ef5","#c77dff"];el.innerHTML=state.users.map((u,i)=>`<div class="bar-row"><div class="bar-label">${esc(u.name)}</div><div class="bar-track"><div class="bar-fill" style="width:${Math.round((u.spend/max)*100)}%;background:${cls[i%cls.length]}"></div></div><div class="bar-val">${providerCost(u.spend)}</div></div>`).join("") }
function createBrainstorm(cur,count){
  const n=Math.min(Number(count)||5,20);
  const base=[
    "Zehirlenme konsepti: @ana-kişi şüpheli yemegin önünde, abartılı yüz ifadesi, gicirdayan restoran tabelası.",
    "Böcekli dürüm: @ana-kişi büyütecle inceliyor, karanlık neon ışığı, ultra-gerçekçi doku.",
    "1 Yıldızlı Restoran: Eski soluk tabela ön planda, @ana-kişi ve @ikinci-kişi saskin bakis.",
    "Sac çıkan yemek: @ana-kişi dehsetle geri çekiliyor, stüdyo ışığı, sinema rengi.",
    "Paket servisi felaketi: Şekilsiz paket, neon çerçeveli sahne, @ikinci-kişi dehsette.",
    "Gizli kamera: @ana-kişi restoran mutfagina bakıyor, dehset yüzü, dramatik aydınlatma.",
    "Fiyat soku: @ana-kişi fatura görürken çatılı kasilar, gold-noir renk paleti.",
    "Böcek temalı: @ana-kişi ve @ikinci-kişi büyütecle yemeği inceliyor, siyah arkaplan.",
    "Yemek kriteri: Kalem ve defter ön planda, @ana-kişi ciddi degerlendirme pozu.",
    "Geri döndük: @ana-kişi restoranın önünde 'Tekrar Denedim' yazisiyla, dramatik pozlama.",
    "Düşük bütçeli lüks: @ana-kişi sofistike restoranın önünde eski kiyafetlerle, komik kontrast.",
    "Hayatta kalma: @ana-kişi sacini tutarak çikis kapısı önünde, dramatik siluet.",
    "En kötüsü: @ana-kişi siyah fonda kirmizi '1 yildiz' hologram, sinematik kompozisyon.",
    "Uzman testi: @ana-kişi önlük ve büyütecle, laboratuvar estetigiyle yemek analizi.",
    "Teselli ödülü: @ana-kişi berbat yemek sonrası emoji ifadesiyle, canlı renk paleti.",
    "Seri final: @ana-kişi ve @ikinci-kişi arka arkaya yüz ifadeleri kolaji.",
    "Sosyal medya: Telefon ekraninda 1 yildiz yorumu büyük yazılı, @ana-kişi saskin.",
    "Karşılaştırma: Solda lüks restoran renderı, sağda gerçek mekân; bölünmüş ekran.",
    "Macera devam: @ana-kişi yeni restoranın önünde 'Bu sefer ne olacak?' bakışıyla.",
    "Kolabo: @ana-kişi ve @ikinci-kişi baskica el sikisirken tabelalı restoran fon.",
  ];
  const out=[];
  for(let i=0;i<n;i++)out.push({id:uid("bs"),prompt:base[i%base.length],idx:i});
  return out;
}
function enhanceImagePrompt(raw){ const refs=state.references.map(r=>r.tag).join(", ");return`${raw.trim()}\n\n— Sistem: sinematik aydınlatma, ultra-gerçekçi doku, sığ alan derinliği, profesyonel YouTube kapak kompozisyonu. Referanslar: ${refs||"@ana-kişi"}. Stil: edgy editorial, vibrant renk paleti.` }
function enhanceVideoPrompt(raw){ return`${raw.trim()}\n\n[Sistem: kamera=dinamik el kamerası, ışık=dramatik kontrast, fps=24, gerçekçilik=yüksek]` }

// ── YAYIN TAKVİMİ ────────────────────────────────────────────────────
// CRM panosu işleri AŞAMAYA göre dizer ("hangi iş nerede kaldı"). Burası
// TARİHE göre dizer ("bu hafta ne çekiliyor, ne yayınlanıyor"). Aynı veriyi
// (state.productions) kullanır, ikinci bir kayıt tutmaz.
let calendarCursor = new Date();
let calendarSelected = null;

function ymd(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}` }

/** Bir güne düşen çekim ve yayın işleri. */
function calendarEntriesFor(key){
  const out=[];
  for(const p of arr(state.productions)){
    if(p.shootDate===key) out.push({tur:"shoot",prod:p});
    if(p.publishDate===key) out.push({tur:"publish",prod:p});
  }
  return out;
}

/**
 * Gömülü modda sayfa ağacını Notlar görünümünün içine taşır.
 *
 * Ağaç kitin kenar çubuğunda duruyor; panel içinde o çubuk gizlendiği için
 * notlar arasında geçiş yapmak imkânsızdı. Aynı DOM düğümü taşınır, böylece
 * mevcut render ve olay bağlantıları olduğu gibi çalışmaya devam eder.
 */
function relocatePageTreeWhenEmbedded(){
  if(!document.documentElement.classList.contains("embedded"))return;
  const agac=document.getElementById("pagesNavTree");
  const yuva=document.getElementById("pagesTreeSlot");
  if(agac&&yuva&&agac.parentElement!==yuva)yuva.appendChild(agac);
}

function bindCalendar(){
  document.getElementById("calPrev")?.addEventListener("click",()=>{ calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()-1,1); renderCalendar() });
  document.getElementById("calNext")?.addEventListener("click",()=>{ calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()+1,1); renderCalendar() });
  document.getElementById("calToday")?.addEventListener("click",()=>{ calendarCursor=new Date(); calendarSelected=ymd(new Date()); renderCalendar() });
  document.getElementById("calendarGrid")?.addEventListener("click",e=>{
    const cell=e.target.closest("[data-day]"); if(!cell)return;
    calendarSelected=cell.dataset.day; renderCalendar();
  });
}

function renderCalendar(){
  const grid=document.getElementById("calendarGrid"); if(!grid)return;
  const yil=calendarCursor.getFullYear(), ay=calendarCursor.getMonth();
  const baslik=document.getElementById("calendarMonthTitle");
  if(baslik)baslik.textContent=new Intl.DateTimeFormat("tr-TR",{month:"long",year:"numeric"}).format(calendarCursor);

  const ilk=new Date(yil,ay,1);
  // Hafta pazartesi başlar; getDay() pazarı 0 verdiği için kaydırılır.
  const bosluk=(ilk.getDay()+6)%7;
  const gunSayisi=new Date(yil,ay+1,0).getDate();
  const bugun=ymd(new Date());

  const basliklar=["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"]
    .map(g=>`<div class="cal-head">${g}</div>`).join("");
  const hucreler=[];
  for(let i=0;i<bosluk;i++) hucreler.push('<div class="cal-cell cal-empty"></div>');
  for(let g=1;g<=gunSayisi;g++){
    const key=`${yil}-${String(ay+1).padStart(2,"0")}-${String(g).padStart(2,"0")}`;
    const isler=calendarEntriesFor(key);
    const noktalar=isler.slice(0,4).map(x=>`<i class="cal-dot cal-dot-${x.tur==="shoot"?"shoot":"publish"}"></i>`).join("");
    const sinif=["cal-cell",key===bugun?"cal-today":"",key===calendarSelected?"cal-selected":"",isler.length?"cal-has":""].filter(Boolean).join(" ");
    hucreler.push(`<div class="${sinif}" data-day="${key}" role="button" tabindex="0" aria-label="${g} ${isler.length?`· ${isler.length} iş`:""}"><span class="cal-num">${g}</span><span class="cal-dots">${noktalar}</span></div>`);
  }
  grid.innerHTML=basliklar+hucreler.join("");

  // Ay içi özet
  const ayAnahtari=`${yil}-${String(ay+1).padStart(2,"0")}`;
  const ayIsleri=arr(state.productions).filter(p=>String(p.shootDate||"").startsWith(ayAnahtari)||String(p.publishDate||"").startsWith(ayAnahtari));
  const cekim=ayIsleri.filter(p=>String(p.shootDate||"").startsWith(ayAnahtari)).length;
  const yayin=ayIsleri.filter(p=>String(p.publishDate||"").startsWith(ayAnahtari)).length;
  const tarihsiz=arr(state.productions).filter(p=>!p.shootDate&&!p.publishDate&&p.stage!=="published"&&p.stage!=="cancelled").length;
  const kpi=document.getElementById("calendarKpis");
  if(kpi)kpi.innerHTML=[
    kpi_("Bu ay çekim",cekim,"Planlanan çekim günü","teal","clapperboard"),
    kpi_("Bu ay yayın",yayin,"Planlanan yayın","teal","send"),
    kpi_("Tarihi yok",tarihsiz,"Takvime girmemiş iş","teal","calendar-off"),
  ].join("");

  renderCalendarDay();
}

function kpi_(label,value,meta,color,icon){
  return `<div class="kpi ${color}"><span class="kpi-icon"><i data-lucide="${icon}"></i></span><span class="label">${esc(label)}</span><span class="value">${esc(String(value))}</span><span class="meta">${esc(meta)}</span></div>`;
}

function renderCalendarDay(){
  const liste=document.getElementById("calendarDayList"); if(!liste)return;
  const baslik=document.getElementById("calendarDayTitle");
  if(!calendarSelected){ if(baslik)baslik.textContent="Bir gün seç"; liste.innerHTML='<p class="empty-hint">Takvimden bir güne tıkla.</p>'; return }
  const d=new Date(calendarSelected+"T00:00:00");
  if(baslik)baslik.textContent=new Intl.DateTimeFormat("tr-TR",{day:"numeric",month:"long",weekday:"long"}).format(d);
  const isler=calendarEntriesFor(calendarSelected);
  liste.innerHTML=isler.length?isler.map(x=>`
    <div class="cal-day-row">
      <i class="cal-dot cal-dot-${x.tur==="shoot"?"shoot":"publish"}"></i>
      <div class="cal-day-main"><strong>${esc(x.prod.title||"Adsız")}</strong><span>${x.tur==="shoot"?"Çekim":"Yayın"} · ${esc(x.prod.owner||"atanmamış")}</span></div>
      <span class="cal-day-stage">${esc((stages.find(st=>st.id===x.prod.stage)||{}).label||x.prod.stage||"")}</span>
    </div>`).join(""):'<p class="empty-hint">Bu güne planlanmış iş yok.</p>';
  refreshIcons();
}

// ── MÜŞTERİ & TESLİM ─────────────────────────────────────────────────
// Ajans tarafında eksik olan parça: kime ne teslim edildi, ne bekliyor.
const TESLIM_DURUMLARI=[
  {id:"pending",  label:"Bekliyor"},
  {id:"progress", label:"Devam ediyor"},
  {id:"done",     label:"Teslim edildi"},
];

function bindClients(){
  document.getElementById("clientForm")?.addEventListener("submit",e=>{
    e.preventDefault();
    const ad=document.getElementById("clientName").value.trim();
    if(!ad)return;
    snapshotUndo();
    state.clients=arr(state.clients);
    state.clients.unshift({
      id:uid("cli"), name:ad.slice(0,80),
      contact:document.getElementById("clientContact").value.trim().slice(0,120),
      note:document.getElementById("clientNote").value.trim().slice(0,400),
      createdAt:new Date().toISOString(), deliveries:[],
    });
    document.getElementById("clientForm").reset();
    saveState(); renderClients(); showToast("Müşteri eklendi","success");
  });

  document.getElementById("clientList")?.addEventListener("click",e=>{
    const sil=e.target.closest("[data-client-delete]");
    if(sil){ deleteClient(sil.dataset.clientDelete); return }
    const ekle=e.target.closest("[data-delivery-add]");
    if(ekle){ addDelivery(ekle.dataset.deliveryAdd); return }
    const durum=e.target.closest("[data-delivery-cycle]");
    if(durum){ cycleDelivery(durum.dataset.deliveryCycle, durum.dataset.clientId); return }
  });
}

function findClient(id){ return arr(state.clients).find(c=>c.id===id) }

function addDelivery(clientId){
  const c=findClient(clientId); if(!c)return;
  const baslik=prompt("Teslim edilecek iş:"); if(!baslik||!baslik.trim())return;
  const tarih=prompt("Termin (YYYY-AA-GG, boş bırakılabilir):")||"";
  snapshotUndo();
  c.deliveries=arr(c.deliveries);
  c.deliveries.push({id:uid("dlv"),title:baslik.trim().slice(0,120),due:/^\d{4}-\d{2}-\d{2}$/.test(tarih.trim())?tarih.trim():"",status:"pending"});
  saveState(); renderClients(); showToast("Teslim eklendi","success");
}

function cycleDelivery(deliveryId, clientId){
  const c=findClient(clientId); if(!c)return;
  const d=arr(c.deliveries).find(x=>x.id===deliveryId); if(!d)return;
  const i=TESLIM_DURUMLARI.findIndex(x=>x.id===d.status);
  snapshotUndo();
  d.status=TESLIM_DURUMLARI[(i+1)%TESLIM_DURUMLARI.length].id;
  saveState(); renderClients();
}

function deleteClient(id){
  const c=findClient(id); if(!c)return;
  if(!confirm(`"${c.name}" ve teslimleri silinsin mi?`))return;
  snapshotUndo();
  state.clients=arr(state.clients).filter(x=>x.id!==id);
  saveState(); renderClients(); showToast("Müşteri silindi","warning");
}

function renderClients(){
  const liste=document.getElementById("clientList"); if(!liste)return;
  const musteriler=arr(state.clients);
  const bugun=ymd(new Date());
  const tumTeslim=musteriler.flatMap(c=>arr(c.deliveries));
  const bekleyen=tumTeslim.filter(d=>d.status!=="done").length;
  const geciken=tumTeslim.filter(d=>d.status!=="done"&&d.due&&d.due<bugun).length;

  const kpi=document.getElementById("clientKpis");
  if(kpi)kpi.innerHTML=[
    kpi_("Müşteri",musteriler.length,"Kayıtlı","teal","users"),
    kpi_("Bekleyen teslim",bekleyen,"Tamamlanmamış","teal","clock"),
    kpi_("Geciken",geciken,"Termini geçmiş","teal","alert-triangle"),
  ].join("");

  liste.innerHTML=musteriler.length?musteriler.map(c=>{
    const teslimler=arr(c.deliveries);
    const satirlar=teslimler.length?teslimler.map(d=>{
      const durum=TESLIM_DURUMLARI.find(x=>x.id===d.status)||TESLIM_DURUMLARI[0];
      const gec=d.status!=="done"&&d.due&&d.due<bugun;
      return `<div class="dlv-row${gec?" dlv-late":""}">
        <button class="dlv-status" data-delivery-cycle="${esc(d.id)}" data-client-id="${esc(c.id)}" title="Durumu değiştir">${esc(durum.label)}</button>
        <span class="dlv-title">${esc(d.title)}</span>
        <span class="dlv-due">${d.due?esc(d.due):"—"}</span>
      </div>`;
    }).join(""):'<p class="empty-hint">Henüz teslim yok.</p>';
    return `<article class="client-card">
      <div class="client-head">
        <div><strong>${esc(c.name)}</strong>${c.contact?`<span class="client-contact">${esc(c.contact)}</span>`:""}</div>
        <div class="client-actions">
          <button class="ghost-btn" data-delivery-add="${esc(c.id)}"><i data-lucide="plus"></i>Teslim</button>
          <button class="ghost-btn" data-client-delete="${esc(c.id)}" aria-label="Müşteriyi sil"><i data-lucide="trash-2"></i></button>
        </div>
      </div>
      ${c.note?`<p class="client-note">${esc(c.note)}</p>`:""}
      <div class="dlv-list">${satirlar}</div>
    </article>`;
  }).join(""):'<p class="empty-hint">Henüz müşteri eklenmemiş. Bu ekrandaki müşteri formundan ekleyebilirsin.</p>';
  refreshIcons();
}

// ── AYARLAR ───────────────────────────────────────────────────────────
function bindSettings(){
  document.getElementById("settingsForm").addEventListener("submit",e=>{ e.preventDefault();snapshotUndo();const teamName=document.getElementById("setTeamName").value.trim(),budget=Number(document.getElementById("setBudget").value),usdTryRate=Number(document.getElementById("setUsdTryRate").value),membersRaw=document.getElementById("setMembers").value;if(teamName)state.settings.teamName=teamName;if(budget>=0)state.settings.monthlyBudget=budget;if(Number.isFinite(usdTryRate)&&usdTryRate>=0)state.settings.usdTryRate=usdTryRate;if(membersRaw.trim())state.settings.members=membersRaw.split(",").map(m=>m.trim()).filter(Boolean);saveState();renderAll();document.getElementById("appTeamName").textContent=state.settings.teamName;showToast("Ayarlar kaydedildi","success");logActivity("Ayarlar güncellendi","info") });
}

function renderSettingsView(){
  const s=state.settings;
  const n=document.getElementById("setTeamName"),b=document.getElementById("setBudget"),r=document.getElementById("setUsdTryRate"),m=document.getElementById("setMembers");
  if(n)n.value=s.teamName;if(b)b.value=s.monthlyBudget;if(r)r.value=s.usdTryRate||"";if(m)m.value=s.members.join(", ");
  const tnEl=document.getElementById("appTeamName");if(tnEl)tnEl.textContent=s.teamName;
  // Kısayol tablosu artık düzenlenebilir: her satırdaki düğme bir sonraki
  // tuş kombinasyonunu yakalar. Tarayıcının kendi kısayolları geri
  // alınamadığı için reddedilir, aksi halde kullanıcı kendini kilitliyor.
  const st=document.getElementById("shortcutsTable");
  if(st){
    const harita=aktifKisayollar();
    st.innerHTML=`<thead><tr><th>Aksiyon</th><th>Kısayol</th><th></th></tr></thead><tbody>${
      SHORTCUT_ACTIONS.map(a=>`<tr>
        <td style="font-size:13px">${esc(a.label)}</td>
        <td><kbd class="kbd">${esc(komboEtiketi(harita[a.id]))}</kbd></td>
        <td style="text-align:right"><button class="ghost-btn" data-shortcut-edit="${esc(a.id)}">Değiştir</button></td>
      </tr>`).join("")
    }<tr><td style="font-size:13px">Görünüm geçişi</td><td><kbd class="kbd">1 – 8</kbd></td><td style="text-align:right;color:var(--ink3);font-size:11px">sabit</td></tr>
      <tr><td style="font-size:13px">Dialog / paleti kapat</td><td><kbd class="kbd">Escape</kbd></td><td style="text-align:right;color:var(--ink3);font-size:11px">sabit</td></tr>
      </tbody>`;
    if(!st.dataset.bound){
      st.dataset.bound="1";
      st.addEventListener("click",e=>{
        const btn=e.target.closest("[data-shortcut-edit]"); if(!btn)return;
        kisayolYakala(btn.dataset.shortcutEdit,btn);
      });
    }
  }
  const fal=document.getElementById("fullActivityLog");
  if(fal){const logs=state.activityLog;fal.innerHTML=logs.length?`<div style="max-height:280px;overflow-y:auto">${logs.map(log=>`<div class="activity-item"><div class="activity-dot ${log.type}"></div><div style="flex:1"><div style="font-size:12px">${esc(log.message)}</div><div class="row-meta" style="font-size:11px">${fmt.dt(log.ts)}</div></div></div>`).join("")}</div>`:`<div class="empty-state">Henüz aksiyon logu yok.</div>`}
}

// ═══════════════════════════════════════════════════════════════════════
// NOTION-LIKE PAGES
// ═══════════════════════════════════════════════════════════════════════

const SLASH_TYPES=[
  {type:"paragraph",    icon:"T",   label:"Metin",          desc:"Düz metin paragrafı"},
  {type:"heading1",     icon:"H1",  label:"Başlık 1",       desc:"Büyük başlık"},
  {type:"heading2",     icon:"H2",  label:"Başlık 2",       desc:"Orta başlık"},
  {type:"heading3",     icon:"H3",  label:"Başlık 3",       desc:"Küçük başlık"},
  {type:"bulletList",   icon:"•",   label:"Madde",          desc:"Madde işaretli liste"},
  {type:"numberedList", icon:"1.",  label:"Numaralı",       desc:"Numaralı liste"},
  {type:"todo",         icon:"☑",   label:"Yapılacak",      desc:"Onay kutusu"},
  {type:"toggle",       icon:"▶",   label:"Akordiyon",      desc:"Genişletilebilir blok"},
  {type:"quote",        icon:"❝",   label:"Alıntı",         desc:"Vurgulu alıntı"},
  {type:"callout",      icon:"💡",  label:"Vurgulu Not",    desc:"İkonlu not kutusu"},
  {type:"code",         icon:"<>",  label:"Kod",            desc:"Kod bloğu"},
  {type:"divider",      icon:"—",   label:"Ayraç",          desc:"Yatay çizgi"},
  {type:"image",        icon:"🖼",  label:"Görsel",         desc:"URL ile görsel ekle"},
  {type:"table",        icon:"⊞",   label:"Tablo",          desc:"Satır-sütun tablosu"},
  {type:"toc",          icon:"≡",   label:"İçindekiler",    desc:"Başlıkları listeler"},
  {type:"embed",        icon:"⊕",   label:"Gömme",          desc:"Web sayfası yerleştir"},
  {type:"columns",      icon:"⊟",   label:"Sütunlar",       desc:"İki sütunlu düzen"},
];

const COMMON_EMOJIS=["😀","😂","🤩","😎","🤔","🎯","🚀","⭐","💡","🔥","✅","❌","⚠️","📝","📌","📎","🔗","🎬","🎥","🎭","🎨","🎤","🎵","🎶","🏆","🥇","🎁","📅","⏰","🔔","📊","📈","📉","💰","💳","🔧","⚙️","🔨","🔑","🔒","🏠","🏢","🌍","🌙","☀️","❄️","🌈","🌊","🦁","🐯","🦊","🌸","🌺","🌻","🍕","🍔","☕","🎃","🎄","👋","👍","👏","✊","🤝","❤️","💙","💚","💛","💜","🤍","🖤","📄","🗒️","✏️","📚","🗂","🚀"];

const PAGE_TEMPLATES=[
  {id:"blank",      label:"Boş Sayfa",       icon:"📄", desc:"Sıfırdan başla",
   blocks:[{type:"paragraph",content:""}]},
  {id:"meeting",    label:"Toplantı Notu",    icon:"📝", desc:"Hazır toplantı şablonu",
   blocks:[
     {type:"heading1",content:"Toplantı Notları"},
     {type:"paragraph",content:"📅 Tarih: ___   👥 Katılımcılar: ___"},
     {type:"heading2",content:"Gündem"},
     {type:"numberedList",content:"Gündem maddesi 1",num:1},
     {type:"heading2",content:"Notlar"},
     {type:"paragraph",content:""},
     {type:"heading2",content:"Aksiyon Maddeleri"},
     {type:"todo",content:"",done:false},
   ]},
  {id:"project",    label:"Proje Planı",      icon:"📊", desc:"Proje takip şablonu",
   blocks:[
     {type:"heading1",content:"Proje Planı"},
     {type:"callout",content:"Projenin kısa açıklamasını buraya yaz.",emoji:"🎯"},
     {type:"heading2",content:"Hedefler"},
     {type:"bulletList",content:"Hedef 1"},
     {type:"heading2",content:"Görevler"},
     {type:"todo",content:"Görev 1",done:false},
     {type:"todo",content:"Görev 2",done:false},
     {type:"heading2",content:"Notlar"},
     {type:"paragraph",content:""},
   ]},
  {id:"weekly",     label:"Haftalık Plan",    icon:"📅", desc:"Haftayı planla",
   blocks:[
     {type:"heading1",content:"Haftalık Plan"},
     {type:"callout",content:"Bu haftanın en önemli 3 hedefi neler?",emoji:"⭐"},
     {type:"heading2",content:"Pazartesi"},
     {type:"todo",content:"",done:false},
     {type:"heading2",content:"Salı"},
     {type:"todo",content:"",done:false},
     {type:"heading2",content:"Çarşamba"},
     {type:"todo",content:"",done:false},
     {type:"heading2",content:"Perşembe"},
     {type:"todo",content:"",done:false},
     {type:"heading2",content:"Cuma"},
     {type:"todo",content:"",done:false},
   ]},
  {id:"brainstorm", label:"Beyin Fırtınası", icon:"💡", desc:"Fikir üretim şablonu",
   blocks:[
     {type:"heading1",content:"Beyin Fırtınası"},
     {type:"callout",content:"Kural yok! Her fikri yaz, filtreleyi sonra yap.",emoji:"💡"},
     {type:"heading2",content:"Problem"},
     {type:"paragraph",content:""},
     {type:"heading2",content:"Fikirler"},
     {type:"bulletList",content:"Fikir 1"},
     {type:"bulletList",content:"Fikir 2"},
     {type:"heading2",content:"En İyi 3 Fikir"},
     {type:"numberedList",content:"",num:1},
   ]},
];

let slashTargetBlockId=null, slashFilter="", emojiPickerCallback=null, slashActiveIdx=0;

// ── Helpers ──────────────────────────────────────────────────────────────
function getPage(id){ return(state.pages||[]).find(p=>p.id===id)||null }
function getBlock(pageId,blockId){
  const pg=getPage(pageId);if(!pg)return null;
  function search(blocks){ for(const b of blocks||[]){ if(b.id===blockId)return b; const f=b.childBlocks?search(b.childBlocks):null; if(f)return f } return null }
  return search(pg.blocks);
}
function currentPage(){ return getPage(state.currentPageId) }

function newBlockObj(type,extra={}){
  const d={
    paragraph:{content:""},heading1:{content:""},heading2:{content:""},heading3:{content:""},
    bulletList:{content:""},numberedList:{content:"",num:1},todo:{content:"",done:false},
    toggle:{content:"",open:false,childBlocks:[]},quote:{content:""},
    callout:{content:"",emoji:"💡"},code:{content:"",lang:"javascript"},divider:{content:""},
    image:{content:"",caption:""},table:{rows:[["",""],["",""]],headerRow:true},
    toc:{content:""},embed:{content:""},columns:{cols:[{content:""},{content:""}]},
  };
  return{id:uid("b"),type,...(d[type]||{content:""}),...extra};
}

function newPageObj(parentId=null){
  return{id:uid("pg"),title:"",icon:"📄",cover:null,parentId:parentId||null,isFavorite:false,inTrash:false,createdAt:Date.now(),updatedAt:Date.now(),relatedType:"",relatedId:"",blocks:[newBlockObj("paragraph")]};
}

// ── Page CRUD ─────────────────────────────────────────────────────────────
function openPageEditor(pageId){
  state.currentPageId=pageId;
  if(!state.recentPages)state.recentPages=[];
  state.recentPages=[pageId,...state.recentPages.filter(id=>id!==pageId)].slice(0,10);
  saveState(); renderPageTree(); renderPageEditor();
}

function createPage(parentId=null){ showTemplateModal(parentId) }

function deletePage(pageId){
  const pg=getPage(pageId);if(!pg)return;
  pg.inTrash=true; pg.updatedAt=Date.now();
  if(state.currentPageId===pageId){ const next=(state.pages||[]).find(p=>!p.inTrash&&p.id!==pageId); state.currentPageId=next?.id||null }
  saveState(); renderPageTree(); renderPageEditor();
  showToast(`"${pg.title||"Sayfa"}" çöp kutusuna taşındı`,"warning");
  logActivity(`Sayfa silindi: ${pg.title||"Başlıksız"}`,"warning");
}

function restorePage(pageId){
  const pg=getPage(pageId);if(!pg)return;
  pg.inTrash=false; pg.updatedAt=Date.now();
  saveState(); renderPageTree(); renderTrashModal();
  showToast("Sayfa geri yüklendi","success");
}

function permanentDeletePage(pageId){
  if(!confirm("Bu sayfa kalıcı olarak silinsin mi?"))return;
  const ids=[pageId];
  function collect(id){ (state.pages||[]).filter(p=>p.parentId===id).forEach(c=>{ids.push(c.id);collect(c.id)}) }
  collect(pageId);
  state.pages=(state.pages||[]).filter(p=>!ids.includes(p.id));
  if(ids.includes(state.currentPageId))state.currentPageId=(state.pages||[]).find(p=>!p.inTrash)?.id||null;
  saveState(); renderPageTree(); renderTrashModal(); renderPageEditor();
  showToast("Sayfa kalıcı silindi","error");
}

function toggleFavoritePage(pageId){
  const pg=getPage(pageId);if(!pg)return;
  pg.isFavorite=!pg.isFavorite; saveState(); renderPageTree(); renderPageEditor();
  showToast(pg.isFavorite?"Favorilere eklendi":"Favorilerden çıkarıldı","info");
}

function getPageAncestors(pageId){
  const out=[];let pg=getPage(pageId);if(!pg)return out;
  let pid=pg.parentId;
  while(pid){ const p=getPage(pid);if(!p||out.some(a=>a.id===p.id))break; out.unshift(p); pid=p.parentId }
  return out;
}

// ── Render Tree ───────────────────────────────────────────────────────────
function renderPageTree(){
  if(!state.pages)return;
  const favs=(state.pages||[]).filter(p=>p.isFavorite&&!p.inTrash);
  const roots=(state.pages||[]).filter(p=>!p.parentId&&!p.inTrash);
  const favsEl=document.getElementById("pageTreeFavs");
  const rootEl=document.getElementById("pageTreeRoot");
  if(favsEl)favsEl.innerHTML=favs.length?favs.map(p=>pageTreeFavItem(p)).join(""):`<div class="ptree-empty">Favori yok</div>`;
  if(rootEl)rootEl.innerHTML=roots.length?roots.map(p=>pageTreeItem(p,0)).join(""):`<div class="ptree-empty">Henüz sayfa yok</div>`;
  refreshIcons();
}

function pageTreeFavItem(p){
  const a=state.currentPageId===p.id;
  return`<div class="ptree-row${a?" ptree-active":""}" onclick="openPageEditor('${p.id}');navigateTo('pages')" title="${esc(p.title||'Başlıksız')}"><span class="ptree-icon">${esc(p.icon||"📄")}</span><span class="ptree-title">${esc(p.title||"Başlıksız")}</span><button class="ptree-add" onclick="event.stopPropagation();createPage('${p.id}')" title="Alt sayfa">+</button></div>`;
}

function pageTreeItem(p,depth){
  const a=state.currentPageId===p.id;
  const children=(state.pages||[]).filter(c=>c.parentId===p.id&&!c.inTrash);
  const pl=6+depth*14;
  let html=`<div class="ptree-row${a?" ptree-active":""}" style="padding-left:${pl}px" onclick="openPageEditor('${p.id}');navigateTo('pages')" title="${esc(p.title||'Başlıksız')}"><span class="ptree-icon">${esc(p.icon||"📄")}</span><span class="ptree-title">${esc(p.title||"Başlıksız")}</span><button class="ptree-add" onclick="event.stopPropagation();createPage('${p.id}')" title="Alt sayfa">+</button></div>`;
  if(children.length)html+=`<div class="ptree-group" style="padding-left:8px">${children.map(c=>pageTreeItem(c,depth+1)).join("")}</div>`;
  return html;
}

// ── Render Page Editor ────────────────────────────────────────────────────
function renderPageEditor(){
  const pg=currentPage();
  const emptyEl=document.getElementById("pageEmpty");
  const editorEl=document.getElementById("pageEditor");
  if(!pg){ if(emptyEl)emptyEl.style.display="flex"; if(editorEl)editorEl.style.display="none"; return }
  if(emptyEl)emptyEl.style.display="none"; if(editorEl)editorEl.style.display="flex";

  // Cover
  const coverArea=document.getElementById("pageCoverArea");
  if(coverArea)coverArea.innerHTML=pg.cover?`<img src="${safeImageUrl(pg.cover)}" class="page-cover-img" alt=""/><button class="page-cover-remove" onclick="removeCover()">Kapağı kaldır</button>`:"";

  // Breadcrumb
  const bc=document.getElementById("pageBreadcrumb");
  if(bc){
    const all=[...getPageAncestors(pg.id),pg];
    bc.innerHTML=all.map((p,i)=>i===all.length-1
      ?`<span class="bc-cur">${esc(p.title||"Başlıksız")}</span>`
      :`<span class="bc-item" onclick="openPageEditor('${p.id}')">${esc(p.title||"Başlıksız")}</span><span class="bc-sep">›</span>`
    ).join("");
  }

  // Fav button
  const favBtn=document.getElementById("pageFavBtn");
  if(favBtn)favBtn.innerHTML=pg.isFavorite
    ?`<i data-lucide="star-off" style="width:13px;height:13px"></i> Favoriden çıkar`
    :`<i data-lucide="star" style="width:13px;height:13px"></i> Favoriye ekle`;

  // Icon
  const iconBtn=document.getElementById("pageIconBtn");
  if(iconBtn)iconBtn.textContent=pg.icon||"📄";

  // Title
  const titleEl=document.getElementById("pageTitleEl");
  if(titleEl&&titleEl.textContent!==pg.title)titleEl.textContent=pg.title||"";

  renderPageRelation(pg);

  renderBlocks();
  updateWordCount();
  refreshIcons();
}

function pageRelationItems(type){
  if(type==="production")return(state.productions||[]).map(item=>({id:item.id,label:item.title||"Başlıksız prodüksiyon"}));
  if(type==="client")return(state.clients||[]).map(item=>({id:item.id,label:item.name||"İsimsiz müşteri"}));
  if(type==="idea")return(state.ideas||[]).map(item=>({id:item.id,label:item.title||"Başlıksız fikir"}));
  if(type==="document")return(state.docs||[]).map(item=>({id:item.id,label:item.title||"İsimsiz doküman"}));
  return[];
}

function renderPageRelation(pg){
  const typeEl=document.getElementById("pageRelationType"),idEl=document.getElementById("pageRelationId");
  if(!typeEl||!idEl)return;
  typeEl.value=pg.relatedType||"";
  const items=pageRelationItems(pg.relatedType);
  idEl.style.display=pg.relatedType?"":"none";
  idEl.innerHTML=`<option value="">Kayıt seç</option>${items.map(item=>`<option value="${esc(item.id)}"${item.id===pg.relatedId?" selected":""}>${esc(item.label)}</option>`).join("")}`;
  if(pg.relatedId&&!items.some(item=>item.id===pg.relatedId)){pg.relatedId="";saveState()}
}

// ── Render Blocks ─────────────────────────────────────────────────────────
function renderBlocks(){
  const pg=currentPage();
  const el=document.getElementById("blocksInner");
  if(!el||!pg)return;
  let numCtr=0;
  el.innerHTML=(pg.blocks||[]).map(b=>{ if(b.type==="numberedList")numCtr++; else numCtr=0; return renderOneBlock(b,numCtr) }).join("");

  el.querySelectorAll("[data-block-id]").forEach(bEl=>{
    const bid=bEl.getAttribute("data-block-id");
    const colMatch=bid.match(/^(.+)-c(\d+)$/);
    if(colMatch){
      const[,parentId,ci]=colMatch;
      bEl.addEventListener("input",()=>{ const pg2=currentPage();const b2=pg2&&getBlock(pg2.id,parentId);if(b2&&b2.cols){if(!b2.cols[ci])b2.cols[Number(ci)]={content:""};b2.cols[Number(ci)].content=bEl.innerHTML||"";pg2.updatedAt=Date.now();saveState()} });
    } else {
      bEl.addEventListener("keydown",e=>handleBlockKey(e,bid));
      bEl.addEventListener("input",()=>{
        const pg2=currentPage();const b2=pg2&&getBlock(pg2.id,bid);
        if(b2){b2.content=bEl.innerHTML||"";pg2.updatedAt=Date.now();saveState();updateWordCount()}
        // @mention detection
        if((bEl.textContent||"").endsWith("@"))showMentionPicker(bEl);
        else document.getElementById("mentionPicker")?.remove();
      });
      bEl.addEventListener("paste",e=>{ e.preventDefault();document.execCommand("insertText",false,e.clipboardData?.getData("text/plain")||"") });
      bEl.addEventListener("mouseup",handleInlineSelect);
      bEl.addEventListener("keyup",handleInlineSelect);
    }
  });

  // Block drag-to-reorder
  el.querySelectorAll(".nt-block-wrap").forEach(wrap=>{
    wrap.addEventListener("dragstart",e=>{
      _pageDragId=wrap.dataset.wrapId;
      wrap.classList.add("nt-dragging");
      e.dataTransfer.effectAllowed="move";
    });
    wrap.addEventListener("dragend",()=>{
      wrap.classList.remove("nt-dragging");
      el.querySelectorAll(".nt-block-wrap").forEach(w=>w.classList.remove("nt-drag-over"));
      _pageDragId=null;
    });
    wrap.addEventListener("dragover",e=>{
      e.preventDefault();e.dataTransfer.dropEffect="move";
      el.querySelectorAll(".nt-block-wrap").forEach(w=>w.classList.remove("nt-drag-over"));
      wrap.classList.add("nt-drag-over");
    });
    wrap.addEventListener("dragleave",e=>{ if(!wrap.contains(e.relatedTarget))wrap.classList.remove("nt-drag-over") });
    wrap.addEventListener("drop",e=>{
      e.preventDefault();wrap.classList.remove("nt-drag-over");
      if(!_pageDragId||wrap.dataset.wrapId===_pageDragId)return;
      const pg2=currentPage();if(!pg2)return;
      const fi=pg2.blocks.findIndex(b=>b.id===_pageDragId);
      const ti=pg2.blocks.findIndex(b=>b.id===wrap.dataset.wrapId);
      if(fi===-1||ti===-1)return;
      snapshotUndo();const[moved]=pg2.blocks.splice(fi,1);pg2.blocks.splice(ti,0,moved);
      pg2.updatedAt=Date.now();saveState();renderBlocks();
    });
  });

  el.querySelectorAll(".todo-cb").forEach(cb=>{
    cb.addEventListener("change",()=>{
      const pg2=currentPage();const b2=pg2&&getBlock(pg2.id,cb.dataset.todoId);
      if(b2){b2.done=cb.checked;pg2.updatedAt=Date.now();saveState();cb.nextElementSibling?.classList.toggle("todo-done",cb.checked)}
    });
  });

  el.querySelectorAll("[data-tbl]").forEach(cell=>{
    cell.addEventListener("input",()=>saveTableCells(cell.dataset.tbl));
  });

  const hintBtn=document.getElementById("addBlockHintBtn");
  if(hintBtn)hintBtn.onclick=()=>{
    const pg2=currentPage();if(!pg2)return;
    const nb=newBlockObj("paragraph");
    pg2.blocks.push(nb);pg2.updatedAt=Date.now();saveState();renderBlocks();
    setTimeout(()=>{const e2=document.querySelector(`[data-block-id="${nb.id}"]`);if(e2)e2.focus()},0);
  };
  refreshIcons();
}

function safeRichHtml(value){
  const template=document.createElement("template");
  template.innerHTML=String(value||"");
  const dangerous=new Set(["SCRIPT","STYLE","IFRAME","OBJECT","EMBED","SVG","MATH","FORM","INPUT","BUTTON"]);
  const allowed=new Set(["B","STRONG","I","EM","U","S","BR","CODE","A","DIV","P","SPAN"]);
  [...template.content.querySelectorAll("*")].forEach(el=>{
    if(dangerous.has(el.tagName)){el.remove();return}
    if(!allowed.has(el.tagName)){el.replaceWith(...el.childNodes);return}
    const href=el.tagName==="A"?el.getAttribute("href"):null;
    [...el.attributes].forEach(attr=>el.removeAttribute(attr.name));
    if(href){
      try{const url=new URL(href,location.origin);if(["http:","https:","mailto:"].includes(url.protocol)){el.setAttribute("href",url.href);el.setAttribute("rel","noopener noreferrer")}}catch{}
    }
  });
  return template.innerHTML;
}

function renderOneBlock(b,num){
  function wrap(inner){ return`<div class="nt-block-wrap" data-wrap-id="${b.id}" draggable="true"><div class="blk-ctrl-bar"><span class="blk-drag-handle" title="Sürükle">⠿</span><button class="blk-ctrl-btn" onclick="duplicateBlock('${b.id}')" title="Kopyala"><i data-lucide="copy"></i></button><button class="blk-ctrl-btn" onclick="deleteBlockById('${b.id}')" title="Sil"><i data-lucide="trash-2"></i></button></div>${inner}</div>` }
  switch(b.type){
    case"paragraph":   return wrap(`<div class="block-editable nt-p" contenteditable="true" data-block-id="${b.id}" data-ph="Yazmaya başla veya '/' yaz...">${safeRichHtml(b.content)}</div>`);
    case"heading1":    return wrap(`<div class="block-editable nt-h1" contenteditable="true" data-block-id="${b.id}" data-ph="Başlık 1">${safeRichHtml(b.content)}</div>`);
    case"heading2":    return wrap(`<div class="block-editable nt-h2" contenteditable="true" data-block-id="${b.id}" data-ph="Başlık 2">${safeRichHtml(b.content)}</div>`);
    case"heading3":    return wrap(`<div class="block-editable nt-h3" contenteditable="true" data-block-id="${b.id}" data-ph="Başlık 3">${safeRichHtml(b.content)}</div>`);
    case"bulletList":  return wrap(`<div class="nt-list-row"><span class="nt-bullet">•</span><div class="block-editable nt-p" contenteditable="true" data-block-id="${b.id}" data-ph="Madde">${safeRichHtml(b.content)}</div></div>`);
    case"numberedList":return wrap(`<div class="nt-list-row"><span class="nt-bullet nt-num">${num}.</span><div class="block-editable nt-p" contenteditable="true" data-block-id="${b.id}" data-ph="Madde">${safeRichHtml(b.content)}</div></div>`);
    case"todo":        return wrap(`<div class="nt-todo-row"><input type="checkbox" class="todo-cb" data-todo-id="${b.id}"${b.done?" checked":""}><div class="block-editable nt-p${b.done?" todo-done":""}" contenteditable="true" data-block-id="${b.id}" data-ph="Yapılacak">${safeRichHtml(b.content)}</div></div>`);
    case"toggle":{
      const kids=(b.childBlocks||[]).map((c,i)=>renderOneBlock(c,i+1)).join("");
      return wrap(`<div class="nt-toggle-row"><button class="toggle-arrow" onclick="toggleToggle('${b.id}')">${b.open?"▼":"▶"}</button><div class="block-editable nt-p" contenteditable="true" data-block-id="${b.id}" data-ph="Başlık">${safeRichHtml(b.content)}</div></div>${b.open?`<div class="blocks-inner" style="padding-left:24px;margin-top:2px">${kids||`<div class="nt-toggle-hint" style="font-size:12px;opacity:.45;padding:4px 0">Yazmaya başla...</div>`}</div>`:""}`);
    }
    case"quote":       return wrap(`<div class="nt-quote"><div class="block-editable nt-quote-text" contenteditable="true" data-block-id="${b.id}" data-ph="Alıntı...">${safeRichHtml(b.content)}</div></div>`);
    case"callout":     return wrap(`<div class="nt-callout"><button class="callout-emoji" onclick="openCalloutEmoji('${b.id}',this)">${esc(b.emoji||"💡")}</button><div class="block-editable nt-p" contenteditable="true" data-block-id="${b.id}" data-ph="Not ekle...">${safeRichHtml(b.content)}</div></div>`);
    case"code":{
      const langs=["javascript","typescript","python","html","css","json","bash","sql","text"];
      return wrap(`<div class="nt-code-wrap"><div class="nt-code-header"><select class="nt-lang-sel" onchange="setCodeLang('${b.id}',this.value)">${langs.map(l=>`<option${(b.lang||"javascript")===l?" selected":""}>${l}</option>`).join("")}</select><button class="ghost-btn" style="font-size:11px;min-height:24px;padding:2px 8px" onclick="copyBlockCode('${b.id}')">Kopyala</button></div><pre class="block-editable nt-code" contenteditable="true" data-block-id="${b.id}" data-ph="Kod buraya...">${esc(b.content||"")}</pre></div>`);
    }
    case"divider":     return wrap(`<hr class="nt-divider"/>`);
    case"image":       return wrap(b.content&&safeImageUrl(b.content)?`<div class="nt-img-wrap"><img src="${safeImageUrl(b.content)}" class="nt-img" loading="lazy" alt="${esc(b.caption||"")}"/>${b.caption?`<div class="nt-caption">${esc(b.caption)}</div>`:""}</div>`:`<div class="img-url-form"><i data-lucide="image"></i><input type="url" placeholder="Görsel URL'si yapıştır ve Enter'a bas..." onkeydown="if(event.key==='Enter'){event.preventDefault();const pg=currentPage();const bl=getBlock(pg.id,'${b.id}');if(bl&&this.value){bl.content=this.value;pg.updatedAt=Date.now();saveState();renderBlocks()}}"/></div>`);
    case"table":       return wrap(renderTableBlock(b));
    case"toc":         return wrap(renderTocBlock());
    case"embed":       return wrap(renderEmbedBlock(b));
    case"columns":{
      const cols=b.cols||[{content:""},{content:""}];
      return wrap(`<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:4px 0">${cols.map((col,ci)=>`<div style="min-width:0;border-right:${ci<cols.length-1?"1px solid var(--border)":"none"};padding-right:${ci<cols.length-1?"20px":"0"}"><div class="block-editable nt-p" contenteditable="true" data-block-id="${b.id}-c${ci}" data-ph="Sütun ${ci+1}">${esc(col.content||"")}</div></div>`).join("")}</div>`);
    }
    default:           return wrap(`<div class="block-editable nt-p" contenteditable="true" data-block-id="${b.id}" data-ph="...">${esc(b.content||"")}</div>`);
  }
}

// ── Table ─────────────────────────────────────────────────────────────────
function renderTableBlock(b){
  const rows=b.rows||[["",""],["",""]];const hr=b.headerRow!==false;
  return`<div class="nt-tbl-wrap"><table class="nt-table"><tbody>${rows.map((row,ri)=>`<tr>${row.map((cell,ci)=>`<td><div class="tbl-cell${ri===0&&hr?" tbl-hdr":""}" contenteditable="true" data-tbl="${b.id}" data-r="${ri}" data-c="${ci}">${esc(cell)}</div></td>`).join("")}</tr>`).join("")}</tbody></table><div class="tbl-actions"><button class="ghost-btn" style="font-size:11px;min-height:26px" onclick="addTblRow('${b.id}')"><i data-lucide="plus" style="width:12px;height:12px"></i> Satır</button><button class="ghost-btn" style="font-size:11px;min-height:26px" onclick="addTblCol('${b.id}')"><i data-lucide="plus" style="width:12px;height:12px"></i> Sütun</button></div></div>`;
}

function saveTableCells(blockId){
  const pg=currentPage();const b=pg&&getBlock(pg.id,blockId);if(!b)return;
  const cells=document.querySelectorAll(`[data-tbl="${blockId}"]`);
  const rowMap=new Map();
  cells.forEach(c=>{const r=Number(c.dataset.r),ci=Number(c.dataset.c);if(!rowMap.has(r))rowMap.set(r,[]);rowMap.get(r)[ci]=c.textContent||""});
  b.rows=[...rowMap.entries()].sort((a,c)=>a[0]-c[0]).map(([,row])=>row);
  pg.updatedAt=Date.now();saveState();
}

function addTblRow(blockId){
  const pg=currentPage();const b=pg&&getBlock(pg.id,blockId);if(!b)return;
  saveTableCells(blockId);
  b.rows.push(new Array(b.rows[0]?.length||2).fill(""));
  pg.updatedAt=Date.now();saveState();renderBlocks();
}

function addTblCol(blockId){
  const pg=currentPage();const b=pg&&getBlock(pg.id,blockId);if(!b)return;
  saveTableCells(blockId);
  b.rows=b.rows.map(row=>[...row,""]);
  pg.updatedAt=Date.now();saveState();renderBlocks();
}

// ── TOC & Embed ──────────────────────────────────────────────────────────
function renderTocBlock(){
  const pg=currentPage();if(!pg)return`<div style="padding:8px;font-size:13px;color:var(--ink3)"><em>İçindekiler yüklenemedi.</em></div>`;
  const heads=(pg.blocks||[]).filter(b=>["heading1","heading2","heading3"].includes(b.type)&&b.content);
  if(!heads.length)return`<div style="padding:8px;font-size:13px;color:var(--ink3)"><em>Sayfada başlık yok.</em></div>`;
  return`<div class="nt-toc">${heads.map(h=>`<div style="padding:3px 0 3px ${h.type==="heading1"?0:h.type==="heading2"?12:24}px;cursor:pointer;font-size:13px;color:var(--ink2)" onclick="scrollToBlock('${h.id}')">${esc(h.content)}</div>`).join("")}</div>`;
}

function scrollToBlock(id){ document.querySelector(`[data-wrap-id="${id}"]`)?.scrollIntoView({behavior:"smooth",block:"start"}) }

function renderEmbedBlock(b){
  if(!b.content)return`<div class="img-url-form"><i data-lucide="globe"></i><input type="url" placeholder="Embed URL yapıştır ve Enter'a bas..." onkeydown="if(event.key==='Enter'){event.preventDefault();const pg=currentPage();const bl=getBlock(pg.id,'${b.id}');if(bl&&this.value){bl.content=this.value;pg.updatedAt=Date.now();saveState();renderBlocks()}}"/></div>`;
  let embedUrl="";
  try{
    const url=new URL(String(b.content));
    let videoId="";
    if(url.hostname==="youtu.be")videoId=url.pathname.split("/").filter(Boolean)[0]||"";
    if(["youtube.com","www.youtube.com","m.youtube.com"].includes(url.hostname))videoId=url.searchParams.get("v")||url.pathname.match(/^\/embed\/([a-zA-Z0-9_-]{6,20})$/)?.[1]||"";
    if(/^[a-zA-Z0-9_-]{6,20}$/.test(videoId))embedUrl=`https://www.youtube-nocookie.com/embed/${videoId}`;
  }catch{}
  if(!embedUrl)return`<div class="empty-state">Yalnızca geçerli YouTube bağlantıları gömülebilir.</div>`;
  return`<div class="nt-embed-wrap"><iframe src="${embedUrl}" title="YouTube video" style="width:100%;height:320px;border:1px solid var(--border);border-radius:10px" sandbox="allow-scripts allow-same-origin allow-presentation" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="lazy"></iframe><button class="ghost-btn" style="font-size:11px;min-height:24px;margin-top:4px" onclick="const pg=currentPage();const bl=getBlock(pg.id,'${b.id}');if(bl){bl.content='';pg.updatedAt=Date.now();saveState();renderBlocks()}">URL değiştir</button></div>`;
}

// ── Block Operations ──────────────────────────────────────────────────────
function createBlockAfter(pageId,blockId,newBlock){
  const pg=getPage(pageId);if(!pg)return;
  const idx=pg.blocks.findIndex(b=>b.id===blockId);
  if(idx===-1)pg.blocks.push(newBlock); else pg.blocks.splice(idx+1,0,newBlock);
  pg.updatedAt=Date.now();saveState();renderBlocks();
  setTimeout(()=>{ const el=document.querySelector(`[data-block-id="${newBlock.id}"]`);if(el){el.focus();placeCaretAtStart(el)} },0);
}

function deleteBlockById(blockId){
  const pg=currentPage();if(!pg)return;
  const idx=pg.blocks.findIndex(b=>b.id===blockId);if(idx===-1)return;
  const prevId=idx>0?pg.blocks[idx-1].id:null;
  pg.blocks.splice(idx,1);pg.updatedAt=Date.now();saveState();renderBlocks();
  if(prevId)setTimeout(()=>{ const el=document.querySelector(`[data-block-id="${prevId}"]`);if(el){el.focus();placeCaretAtEnd(el)} },0);
}

function duplicateBlock(blockId){
  const pg=currentPage();if(!pg)return;
  const idx=pg.blocks.findIndex(b=>b.id===blockId);if(idx===-1)return;
  const copy={...clone(pg.blocks[idx]),id:uid("b")};
  pg.blocks.splice(idx+1,0,copy);pg.updatedAt=Date.now();saveState();renderBlocks();
  showToast("Blok kopyalandı","info");
}

// ── Block Key Handler ─────────────────────────────────────────────────────
function handleBlockKey(e,blockId){
  const pg=currentPage();if(!pg)return;
  const b=getBlock(pg.id,blockId);if(!b)return;
  const el=e.currentTarget;
  const content=el.textContent||"";

  if(e.key==="Escape"){ hideSlashMenu(); hideInlineToolbar(); return }

  if(e.key==="/"&&content===""){
    e.preventDefault();
    slashTargetBlockId=blockId; slashFilter=""; slashActiveIdx=0;
    const rect=el.getBoundingClientRect();
    showSlashMenu(rect.left,rect.bottom+4);
    return;
  }

  if(e.key==="Enter"&&!e.shiftKey){
    e.preventDefault(); hideSlashMenu();
    // Code block: insert newline instead of creating new block
    if(b.type==="code"){document.execCommand("insertText",false,"\n");return}
    if(b.type==="divider"){createBlockAfter(pg.id,blockId,newBlockObj("paragraph"));return}
    const newType=["heading1","heading2","heading3"].includes(b.type)?"paragraph":b.type;
    const extra={};
    if(newType==="numberedList"){const idx2=pg.blocks.findIndex(bl=>bl.id===blockId);extra.num=(pg.blocks[idx2]?.num||0)+1}
    if(newType==="todo")extra.done=false;
    if(newType==="toggle")extra.open=false;
    createBlockAfter(pg.id,blockId,newBlockObj(newType,extra));
    return;
  }

  if(e.key==="Backspace"&&content===""){
    if(b.type!=="paragraph"){
      e.preventDefault();
      b.type="paragraph"; b.content=""; pg.updatedAt=Date.now(); saveState(); renderBlocks();
      setTimeout(()=>{ const el2=document.querySelector(`[data-block-id="${blockId}"]`);if(el2){el2.focus();placeCaretAtEnd(el2)} },0);
      return;
    }
    const idx=pg.blocks.findIndex(bl=>bl.id===blockId);
    if(idx>0){
      e.preventDefault();
      const prevId=pg.blocks[idx-1].id;
      pg.blocks.splice(idx,1);pg.updatedAt=Date.now();saveState();renderBlocks();
      setTimeout(()=>{ const prevEl=document.querySelector(`[data-block-id="${prevId}"]`);if(prevEl){prevEl.focus();placeCaretAtEnd(prevEl)} },0);
    }
    return;
  }

  if(e.key==="ArrowUp"&&caretIsAtStart(el)){
    const idx=pg.blocks.findIndex(bl=>bl.id===blockId);
    if(idx>0){ e.preventDefault(); const prevEl=document.querySelector(`[data-block-id="${pg.blocks[idx-1].id}"]`);if(prevEl){prevEl.focus();placeCaretAtEnd(prevEl)} }
    return;
  }
  if(e.key==="ArrowDown"&&caretIsAtEnd(el)){
    const idx=pg.blocks.findIndex(bl=>bl.id===blockId);
    if(idx<pg.blocks.length-1){ e.preventDefault(); const nextEl=document.querySelector(`[data-block-id="${pg.blocks[idx+1].id}"]`);if(nextEl){nextEl.focus();placeCaretAtStart(nextEl)} }
    return;
  }
}

// ── Toggle & Code ─────────────────────────────────────────────────────────
function toggleToggle(blockId){
  const pg=currentPage();const b=pg&&getBlock(pg.id,blockId);if(!b)return;
  b.open=!b.open;pg.updatedAt=Date.now();saveState();renderBlocks();
}
function setCodeLang(blockId,lang){
  const pg=currentPage();const b=pg&&getBlock(pg.id,blockId);if(!b)return;
  b.lang=lang;pg.updatedAt=Date.now();saveState();
}
function copyBlockCode(blockId){
  const el=document.querySelector(`[data-block-id="${blockId}"]`);
  if(!el)return;
  navigator.clipboard.writeText(el.textContent||"").then(()=>showToast("Kod kopyalandı","success"));
}

// ── Slash Menu ────────────────────────────────────────────────────────────
function showSlashMenu(x,y){
  const m=document.getElementById("slashMenu");if(!m)return;
  let left=x,top=y;
  if(left+260>window.innerWidth)left=window.innerWidth-270;
  if(top+360>window.innerHeight)top=y-370;
  m.style.left=left+"px"; m.style.top=top+"px"; m.style.display="flex";
  const inp=document.getElementById("slashInput");
  if(inp){inp.value="";inp.focus()}
  slashFilter=""; slashActiveIdx=0; renderSlashMenu();
}

function hideSlashMenu(){
  const m=document.getElementById("slashMenu");if(m)m.style.display="none";
  slashTargetBlockId=null; slashFilter="";
}

function renderSlashMenu(){
  const el=document.getElementById("slashList");if(!el)return;
  const q=slashFilter.toLocaleLowerCase("tr-TR");
  const items=SLASH_TYPES.filter(t=>!q||(t.label+t.desc).toLocaleLowerCase("tr-TR").includes(q));
  if(!items.length){el.innerHTML=`<div class="slash-empty">Blok bulunamadı</div>`;return}
  el.innerHTML=items.map((t,i)=>`<button class="slash-item${i===slashActiveIdx?" slash-active":""}" onclick="applySlashType('${t.type}')"><div class="slash-icon-cell">${t.icon}</div><div><div class="slash-lbl">${esc(t.label)}</div><div class="slash-dsc">${esc(t.desc)}</div></div></button>`).join("");
}

function applySlashType(type){
  const pg=currentPage();if(!pg||!slashTargetBlockId)return;
  const b=getBlock(pg.id,slashTargetBlockId);if(!b){hideSlashMenu();return}
  const extra={};
  if(type==="callout")extra.emoji="💡";
  if(type==="code")extra.lang="javascript";
  if(type==="table")extra.rows=[["","",""],["","",""]];
  if(type==="columns")extra.cols=[{content:""},{content:""}];
  if(type==="toggle"){extra.open=false;extra.childBlocks=[]}
  if(type==="todo")extra.done=false;
  Object.assign(b,{type,...extra});
  if(b.content===undefined)b.content="";
  pg.updatedAt=Date.now();saveState();hideSlashMenu();renderBlocks();
  setTimeout(()=>{ const el=document.querySelector(`[data-block-id="${slashTargetBlockId}"]`);if(el){el.focus();placeCaretAtEnd(el)} },0);
}

// ── Inline Toolbar ────────────────────────────────────────────────────────
function handleInlineSelect(){
  const sel=window.getSelection();
  if(!sel||sel.isCollapsed||sel.toString().length===0){hideInlineToolbar();return}
  const range=sel.getRangeAt(0);
  const anc=range.commonAncestorContainer.nodeType===3?range.commonAncestorContainer.parentElement:range.commonAncestorContainer;
  if(!anc.closest("[data-block-id]")){hideInlineToolbar();return}
  const tb=document.getElementById("inlineToolbar");if(!tb)return;
  const rect=range.getBoundingClientRect();
  const tbw=tb.offsetWidth||220;
  let left=rect.left+(rect.width/2)-(tbw/2);
  let top=rect.top-46;
  if(left<8)left=8;
  if(left+tbw>window.innerWidth-8)left=window.innerWidth-8-tbw;
  tb.style.left=left+"px"; tb.style.top=top+"px"; tb.style.display="flex";
}

function hideInlineToolbar(){ const tb=document.getElementById("inlineToolbar");if(tb)tb.style.display="none" }

// ── @mention ──────────────────────────────────────────────────────────────
function showMentionPicker(blockEl){
  document.getElementById("mentionPicker")?.remove();
  const pages=(state.pages||[]).filter(p=>!p.inTrash);
  if(!pages.length)return;
  const rect=blockEl.getBoundingClientRect();
  const m=document.createElement("div");
  m.id="mentionPicker";
  m.style.cssText=`position:fixed;z-index:9999;background:var(--bg2);border:1px solid var(--border-hover);border-radius:var(--radius);box-shadow:var(--shadow);width:220px;max-height:220px;overflow-y:auto;padding:4px`;
  m.innerHTML=`<div style="padding:4px 10px 6px;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--ink3)">Sayfa seç</div>`+
    pages.map(p=>`<button onclick="insertMention('${p.id}')" class="slash-item"><span style="font-size:15px;flex:0 0 auto">${esc(p.icon||"📄")}</span><span class="slash-lbl">${esc(p.title||"Başlıksız")}</span></button>`).join("");
  let left=rect.left,top=rect.bottom+4;
  if(left+228>window.innerWidth)left=window.innerWidth-232;
  if(top+230>window.innerHeight)top=rect.top-234;
  m.style.left=left+"px";m.style.top=top+"px";
  document.body.appendChild(m);
}
function insertMention(pageId){
  const pg=getPage(pageId);
  document.getElementById("mentionPicker")?.remove();
  if(!pg)return;
  const sel=window.getSelection();
  if(sel&&sel.rangeCount){
    const r=sel.getRangeAt(0);
    // remove the @ character that triggered the picker
    if(r.startOffset>0){r.setStart(r.startContainer,r.startOffset-1);r.deleteContents()}
  }
  document.execCommand("insertHTML",false,`<a class="page-mention" onclick="event.preventDefault();openPageEditor('${pageId}');navigateTo('pages')" href="#">${esc(pg.icon||"📄")} ${esc(pg.title||"Başlıksız")}</a> `);
}

// ── Emoji Picker ──────────────────────────────────────────────────────────
function openCalloutEmoji(blockId,btnEl){
  emojiPickerCallback=(emoji)=>{
    const pg=currentPage();const b=pg&&getBlock(pg.id,blockId);
    if(b){b.emoji=emoji;pg.updatedAt=Date.now();saveState();renderBlocks()}
  };
  showEmojiPicker(btnEl.getBoundingClientRect());
}

function openPageIconEmoji(btnEl){
  emojiPickerCallback=(emoji)=>{
    const pg=currentPage();if(!pg)return;
    pg.icon=emoji;pg.updatedAt=Date.now();saveState();
    const ib=document.getElementById("pageIconBtn");if(ib)ib.textContent=emoji;
    renderPageTree();
  };
  showEmojiPicker(btnEl.getBoundingClientRect());
}

function showEmojiPicker(rect){
  const picker=document.getElementById("emojiPicker");if(!picker)return;
  const grid=document.getElementById("emojiGrid");if(!grid)return;
  grid.innerHTML=COMMON_EMOJIS.map(e=>`<button class="emoji-btn" onclick="selectEmoji('${e}')">${e}</button>`).join("");
  let left=rect.left,top=rect.bottom+4;
  if(left+240>window.innerWidth)left=window.innerWidth-244;
  if(top+270>window.innerHeight)top=rect.top-274;
  picker.style.left=left+"px"; picker.style.top=top+"px"; picker.style.display="flex";
}

function selectEmoji(emoji){
  const picker=document.getElementById("emojiPicker");if(picker)picker.style.display="none";
  if(emojiPickerCallback){emojiPickerCallback(emoji);emojiPickerCallback=null}
}

// ── Cover & Export ────────────────────────────────────────────────────────
function removeCover(){
  const pg=currentPage();if(!pg)return;
  pg.cover=null;pg.updatedAt=Date.now();saveState();
  const ca=document.getElementById("pageCoverArea");if(ca)ca.innerHTML="";
}

function addPageCover(){
  const url=prompt("Kapak görsel URL'si girin:");
  if(!url)return;
  const pg=currentPage();if(!pg)return;
  pg.cover=url;pg.updatedAt=Date.now();saveState();renderPageEditor();
}

function exportPageMarkdown(){
  const pg=currentPage();if(!pg){showToast("Sayfa bulunamadı","error");return}
  const strip=s=>(s||"").replace(/<[^>]+>/g,"");
  const lines=[`# ${pg.title||"Başlıksız"}`,"",...(pg.blocks||[]).map(b=>{
    const t=strip(b.content);
    switch(b.type){
      case"heading1":return`# ${t}`;case"heading2":return`## ${t}`;case"heading3":return`### ${t}`;
      case"bulletList":return`- ${t}`;case"numberedList":return`${b.num||1}. ${t}`;
      case"todo":return`- [${b.done?"x":" "}] ${t}`;
      case"quote":return`> ${t}`;case"callout":return`> ${b.emoji||"💡"} ${t}`;
      case"code":return"```"+(b.lang||"")+"\n"+b.content+"\n"+"```";
      case"divider":return"---";case"image":return`![${b.caption||""}](${b.content})`;
      default:return t;
    }
  })];
  const blob=new Blob([lines.join("\n")],{type:"text/markdown;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=Object.assign(document.createElement("a"),{href:url,download:`${pg.title||"sayfa"}.md`});
  document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
  showToast("Markdown indirildi","success");
}

// ── Trash Modal ───────────────────────────────────────────────────────────
function renderTrashModal(){
  const el=document.getElementById("trashList");if(!el)return;
  const trashed=(state.pages||[]).filter(p=>p.inTrash);
  el.innerHTML=trashed.length
    ?trashed.map(p=>`<div class="trash-row"><span style="font-size:20px">${esc(p.icon||"📄")}</span><div style="flex:1"><div style="font-weight:600;font-size:13px">${esc(p.title||"Başlıksız")}</div><div class="row-meta">Silindi</div></div><button class="ghost-btn" style="font-size:12px" onclick="restorePage('${p.id}')">Geri yükle</button><button class="danger-btn" style="font-size:12px;min-height:32px" onclick="permanentDeletePage('${p.id}')">Sil</button></div>`).join("")
    :`<div class="empty-state">Çöp kutusu boş.</div>`;
}

// ── Template Modal ────────────────────────────────────────────────────────
function showTemplateModal(parentId){
  document.getElementById("templateModal")?.remove();
  const modal=document.createElement("div");
  modal.id="templateModal";
  modal.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center";
  modal.innerHTML=`<div style="background:var(--bg2);border-radius:var(--radius);border:1px solid var(--border);padding:28px;width:min(580px,94vw);max-height:90vh;overflow-y:auto">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
      <h2 style="font-size:18px;font-weight:700">Şablon seç</h2>
      <button onclick="document.getElementById('templateModal').remove()" style="border:0;background:transparent;font-size:22px;cursor:pointer;color:var(--ink3)">×</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:12px">
      ${PAGE_TEMPLATES.map(t=>`<button onclick="applyTemplate('${t.id}','${parentId||""}')" style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:18px 14px;cursor:pointer;text-align:left;transition:var(--transition);display:block" onmouseover="this.style.borderColor='var(--teal)'" onmouseout="this.style.borderColor='var(--border)'">
        <div style="font-size:30px;margin-bottom:8px">${t.icon}</div>
        <div style="font-weight:700;font-size:13px;margin-bottom:4px;color:var(--ink)">${esc(t.label)}</div>
        <div style="font-size:11px;color:var(--ink3)">${esc(t.desc)}</div>
      </button>`).join("")}
    </div>
  </div>`;
  modal.addEventListener("click",e=>{if(e.target===modal)modal.remove()});
  document.body.appendChild(modal);
}

function applyTemplate(templateId,parentId){
  const tmpl=PAGE_TEMPLATES.find(t=>t.id===templateId);
  document.getElementById("templateModal")?.remove();
  const pg=newPageObj(parentId||null);
  if(tmpl){
    pg.icon=tmpl.icon;
    pg.title=tmpl.id==="blank"?"":tmpl.label;
    pg.blocks=tmpl.blocks.map(b=>({...newBlockObj(b.type),...b,id:uid("b")}));
  }
  if(!state.pages)state.pages=[];
  state.pages.push(pg);
  state.currentPageId=pg.id;
  saveState(); renderPageTree(); renderPageEditor(); navigateTo("pages");
  showToast("Sayfa oluşturuldu","success");
  logActivity(`Yeni sayfa: ${pg.title||"Başlıksız"}`,"success");
  setTimeout(()=>{ const tel=document.getElementById("pageTitleEl");if(tel){tel.focus();placeCaretAtEnd(tel)} },60);
}

// ── Page Ops ──────────────────────────────────────────────────────────────
function duplicatePage(){
  const pg=currentPage();if(!pg)return;
  const copy=clone(pg);
  copy.id=uid("pg"); copy.title=(pg.title||"Başlıksız")+" (kopya)";
  copy.isFavorite=false; copy.createdAt=Date.now(); copy.updatedAt=Date.now();
  copy.blocks=(pg.blocks||[]).map(b=>({...clone(b),id:uid("b")}));
  state.pages.push(copy); state.currentPageId=copy.id;
  saveState(); renderPageTree(); renderPageEditor();
  showToast("Sayfa kopyalandı","info");
}

function showMovePageModal(){
  const pg=currentPage();if(!pg)return;
  const others=(state.pages||[]).filter(p=>!p.inTrash&&p.id!==pg.id);
  document.getElementById("movePageModal")?.remove();
  const modal=document.createElement("div");
  modal.id="movePageModal";
  modal.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center";
  modal.innerHTML=`<div style="background:var(--bg2);border-radius:var(--radius);border:1px solid var(--border);padding:24px;width:min(380px,94vw);max-height:80vh;overflow-y:auto">
    <h2 style="font-size:16px;font-weight:700;margin-bottom:14px">Sayfayı taşı</h2>
    <div style="display:grid;gap:8px">
      <button onclick="applyMovePage(null)" style="text-align:left;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px 14px;cursor:pointer;font-size:13px">📁 Kök dizine taşı</button>
      ${others.map(p=>`<button onclick="applyMovePage('${p.id}')" style="text-align:left;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px 14px;cursor:pointer;font-size:13px">${esc(p.icon||"📄")} ${esc(p.title||"Başlıksız")}</button>`).join("")}
    </div>
    <button onclick="document.getElementById('movePageModal').remove()" style="margin-top:14px;width:100%;border:0;background:transparent;color:var(--ink3);cursor:pointer;font-size:13px;padding:6px">İptal</button>
  </div>`;
  modal.addEventListener("click",e=>{if(e.target===modal)modal.remove()});
  document.body.appendChild(modal);
}

function applyMovePage(targetParentId){
  const pg=currentPage();if(!pg)return;
  document.getElementById("movePageModal")?.remove();
  pg.parentId=targetParentId||null;pg.updatedAt=Date.now();
  saveState(); renderPageTree(); renderPageEditor();
  showToast("Sayfa taşındı","success");
}

// ── Search ────────────────────────────────────────────────────────────────
function searchPages(q){
  if(!q)return[];
  const lq=q.toLocaleLowerCase("tr-TR");
  return(state.pages||[]).filter(p=>!p.inTrash&&(
    (p.title||"").toLocaleLowerCase("tr-TR").includes(lq)||
    (p.blocks||[]).some(b=>(b.content||"").replace(/<[^>]+>/g,"").toLocaleLowerCase("tr-TR").includes(lq))
  )).slice(0,6);
}

function togglePageSearch(){
  const existing=document.getElementById("pageSearchBar");
  if(existing){existing.remove();document.querySelectorAll(".nt-block-wrap").forEach(w=>{w.style.opacity="";w.style.background=""});return}
  const bar=document.createElement("div");
  bar.id="pageSearchBar";
  bar.style.cssText="position:sticky;top:0;background:var(--bg2);border-bottom:1px solid var(--border);padding:8px 52px;display:flex;align-items:center;gap:8px;z-index:100;backdrop-filter:blur(8px)";
  bar.innerHTML=`<i data-lucide="search" style="width:14px;height:14px;opacity:.5;flex:0 0 auto"></i><input id="pageSearchInput" type="text" placeholder="Sayfada ara…" style="background:transparent;border:none;outline:none;color:var(--ink);font-size:13px;flex:1"/><button onclick="const b=this.parentElement;b.remove();document.querySelectorAll('.nt-block-wrap').forEach(w=>{w.style.opacity='';w.style.background=''})" style="border:0;background:transparent;color:var(--ink3);cursor:pointer;font-size:18px;line-height:1">×</button>`;
  const content=document.querySelector(".page-content");
  if(content)content.insertAdjacentElement("beforebegin",bar); else document.getElementById("pageEditor")?.prepend(bar);
  const inp=document.getElementById("pageSearchInput");
  if(inp){inp.focus();inp.addEventListener("input",doPageSearch)}
  refreshIcons();
}

function doPageSearch(){
  const q=(document.getElementById("pageSearchInput")?.value||"").toLocaleLowerCase("tr-TR");
  document.querySelectorAll(".nt-block-wrap").forEach(w=>{
    w.style.opacity="";w.style.outline="";w.style.background="";
    if(!q)return;
    const match=(w.textContent||"").toLocaleLowerCase("tr-TR").includes(q);
    w.style.opacity=match?"1":"0.18";
    if(match){
      w.style.outline="2px solid rgba(0,212,170,0.5)";
      w.style.outlineOffset="3px";
      w.style.borderRadius="var(--radius)";
      w.style.background="rgba(0,212,170,0.06)";
    }
  });
}

// ── Word Count ────────────────────────────────────────────────────────────
function updateWordCount(){
  const pg=currentPage();
  const el=document.getElementById("pageWordCount");if(!el)return;
  if(!pg){el.textContent="";return}
  const text=(pg.blocks||[]).filter(b=>b.content).map(b=>(b.content||"").replace(/<[^>]+>/g,"")).join(" ");
  const words=text.trim()?text.trim().split(/\s+/).length:0;
  el.textContent=`${words} kelime · ${(pg.blocks||[]).length} blok`;
}

// ── Caret Helpers ─────────────────────────────────────────────────────────
function placeCaretAtStart(el){
  if(!el)return;
  try{const r=document.createRange(),s=window.getSelection();r.setStart(el,0);r.collapse(true);s.removeAllRanges();s.addRange(r)}catch{}
}
function placeCaretAtEnd(el){
  if(!el)return;
  try{const r=document.createRange(),s=window.getSelection();r.selectNodeContents(el);r.collapse(false);s.removeAllRanges();s.addRange(r)}catch{}
}
function caretIsAtStart(el){
  const s=window.getSelection();if(!s||!s.rangeCount)return false;
  const r=s.getRangeAt(0);if(!r.collapsed)return false;
  const t=document.createRange();t.selectNodeContents(el);t.setEnd(r.startContainer,r.startOffset);return t.toString().length===0;
}
function caretIsAtEnd(el){
  const s=window.getSelection();if(!s||!s.rangeCount)return false;
  const r=s.getRangeAt(0);if(!r.collapsed)return false;
  const t=document.createRange();t.selectNodeContents(el);t.setStart(r.endContainer,r.endOffset);return t.toString().length===0;
}

// ── Title Binding ─────────────────────────────────────────────────────────
function bindPageTitleEl(){
  const titleEl=document.getElementById("pageTitleEl");if(!titleEl)return;
  titleEl.addEventListener("input",()=>{
    const pg=currentPage();if(!pg)return;
    pg.title=titleEl.textContent||""; pg.updatedAt=Date.now(); saveState(); renderPageTree();
  });
  titleEl.addEventListener("keydown",e=>{
    if(e.key==="Enter"){
      e.preventDefault();
      const pg=currentPage();
      if(pg&&pg.blocks&&pg.blocks.length){
        const fEl=document.querySelector(`[data-block-id="${pg.blocks[0].id}"]`);
        if(fEl){fEl.focus();placeCaretAtStart(fEl)}
      }
    }
  });
}

// ── bindPages ─────────────────────────────────────────────────────────────
function bindPages(){
  document.getElementById("newRootPage")?.addEventListener("click",()=>createPage(null));
  document.getElementById("openTrashBtn")?.addEventListener("click",()=>{ renderTrashModal(); document.getElementById("trashModal")?.showModal() });
  document.getElementById("newPageFromEmpty")?.addEventListener("click",()=>createPage(null));
  document.getElementById("pageFavBtn")?.addEventListener("click",()=>{ const pg=currentPage();if(pg)toggleFavoritePage(pg.id) });
  document.getElementById("pageAddCoverBtn")?.addEventListener("click",addPageCover);
  document.getElementById("pageAddSubBtn")?.addEventListener("click",()=>{ const pg=currentPage();if(pg)createPage(pg.id) });
  document.getElementById("pageDupBtn")?.addEventListener("click",duplicatePage);
  document.getElementById("pageMoveBtn")?.addEventListener("click",showMovePageModal);
  document.getElementById("pageExportMdBtn")?.addEventListener("click",exportPageMarkdown);
  document.getElementById("pageDeleteBtn")?.addEventListener("click",()=>{ const pg=currentPage();if(pg&&confirm(`"${pg.title||"Sayfa"}" silinsin mi?`))deletePage(pg.id) });
  document.getElementById("pageIconBtn")?.addEventListener("click",function(){openPageIconEmoji(this)});
  document.getElementById("pageRelationType")?.addEventListener("change",event=>{
    const pg=currentPage();if(!pg)return;
    pg.relatedType=event.target.value;pg.relatedId="";pg.updatedAt=Date.now();saveState();renderPageRelation(pg);
  });
  document.getElementById("pageRelationId")?.addEventListener("change",event=>{
    const pg=currentPage();if(!pg)return;
    pg.relatedId=event.target.value;pg.updatedAt=Date.now();saveState();showToast(pg.relatedId?"Not kayda bağlandı":"Not bağlantısı kaldırıldı","info");
  });

  bindPageTitleEl();

  // Slash menu input
  const slashInp=document.getElementById("slashInput");
  if(slashInp){
    slashInp.addEventListener("input",e=>{ slashFilter=e.target.value; slashActiveIdx=0; renderSlashMenu() });
    slashInp.addEventListener("keydown",e=>{
      const filtered=SLASH_TYPES.filter(t=>!slashFilter||(t.label+t.desc).toLocaleLowerCase("tr-TR").includes(slashFilter.toLocaleLowerCase("tr-TR")));
      if(e.key==="ArrowDown"){e.preventDefault();slashActiveIdx=Math.min(slashActiveIdx+1,filtered.length-1);renderSlashMenu()}
      else if(e.key==="ArrowUp"){e.preventDefault();slashActiveIdx=Math.max(slashActiveIdx-1,0);renderSlashMenu()}
      else if(e.key==="Enter"){e.preventDefault();if(filtered[slashActiveIdx])applySlashType(filtered[slashActiveIdx].type)}
      else if(e.key==="Escape")hideSlashMenu();
    });
  }

  // Inline toolbar buttons
  document.getElementById("inlineToolbar")?.querySelectorAll("[data-cmd]").forEach(btn=>{
    btn.addEventListener("mousedown",e=>{
      e.preventDefault();
      const cmd=btn.dataset.cmd,val=btn.dataset.val;
      if(cmd==="inlineCode"){
        const sel=window.getSelection();
        if(sel&&!sel.isCollapsed){const t=sel.toString();document.execCommand("insertHTML",false,`<code style="background:rgba(0,0,0,.2);padding:1px 5px;border-radius:4px;font-family:monospace;font-size:.9em">${esc(t)}</code>`)}
      } else if(cmd==="createLink"){
        const url=prompt("Link URL'si:");if(url)document.execCommand("createLink",false,url);
      } else { document.execCommand(cmd,false,val||null) }
    });
  });

  // Global close handlers
  document.addEventListener("click",e=>{
    if(!e.target.closest("#slashMenu"))hideSlashMenu();
    if(!e.target.closest("#emojiPicker")&&!e.target.closest(".callout-emoji")&&!e.target.closest("#pageIconBtn")){ const pk=document.getElementById("emojiPicker");if(pk)pk.style.display="none" }
    if(!e.target.closest("#inlineToolbar")&&!e.target.closest("[data-block-id]"))hideInlineToolbar();
    if(!e.target.closest("#mentionPicker"))document.getElementById("mentionPicker")?.remove();
  });

  // Ctrl+F in pages view
  document.addEventListener("keydown",e=>{
    if(!document.getElementById("pages")?.classList.contains("active"))return;
    if(e.key==="f"&&(e.ctrlKey||e.metaKey)){e.preventDefault();togglePageSearch()}
    if(e.key==="Escape"){ hideSlashMenu(); hideInlineToolbar(); document.getElementById("mentionPicker")?.remove(); document.getElementById("pageSearchBar")?.remove(); document.querySelectorAll(".nt-block-wrap").forEach(w=>{w.style.opacity="";w.style.outline="";w.style.background=""}) }
  });
}

// ── GORSEL URETIMI ───────────────────────────────────────────────────
// Yalnızca sunucudan gerçek bir sonuç gelirse üretim kaydı oluşturulur.
async function generateImageSrcs(prompt,count){
  if(!API.features.image){
    showToast("Görsel sağlayıcısı bağlı değil.","error");
    return [];
  }
  const out=[];
  for(let i=0;i<count;i++){
    try{
      const res=await apiPost("/api/image",{prompt});
      if(res.error||!res.image){ showToast("Görsel: "+(res.error||"boş yanıt"),"error"); }
      else{
        out.push(res.image);
        if(res.fallback)showToast("Yedek görsel sağlayıcısı kullanıldı.","info");
      }
    }catch{ showToast("Görsel bağlantı hatası","error"); }
  }
  return out;
}

// Inline HTML eylemleri için bilinçli ve denetlenebilir genel API.
Object.assign(window,{
  toggleMobileMenu,
  closeMobileMenu,
  filterByWord,
  clearWordFilter,
  loadAnalysisSession,
  deleteAnalysisSession,
  setTagFilter,
  toggleProdTag,
  deleteTask,
  deleteBudgetItem,
  ideaToProduction,
  deleteIdea,
  toggleSelectAll,
  toggleBulkSelect,
  bulkCompleteTasks,
  clearBulkSelect,
  adjustQty,
  addDoc,
  deleteDoc,
  useTemplate,
  deleteTemplate,
  switchYtSort,
  restorePage,
  permanentDeletePage,
  addTblRow,
  addTblCol,
  scrollToBlock,
  deleteBlockById,
  duplicateBlock,
  toggleToggle,
  setCodeLang,
  copyBlockCode,
  insertMention,
  openCalloutEmoji,
  selectEmoji,
  removeCover,
  applyTemplate,
  applyMovePage,
});
