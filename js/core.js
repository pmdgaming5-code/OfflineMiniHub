/* ============================================================
   core.js — Yardımcılar, kayıt, ses, veri katmanı
   ============================================================ */
'use strict';

const $ = id => document.getElementById(id);

/* ─── YARDIMCILAR ─── */
const U = {
  clamp:(v,a,b)=> v<a?a:(v>b?b:v),
  lerp:(a,b,t)=> a+(b-a)*t,
  rand:(a,b)=> a+Math.random()*(b-a),
  randi:n=> Math.floor(Math.random()*n),
  choice:arr=> arr[Math.floor(Math.random()*arr.length)],
  approach(v,t,d){ return v<t ? Math.min(t,v+d) : Math.max(t,v-d); },
  dist:(x1,z1,x2,z2)=> Math.hypot(x2-x1,z2-z1),
  pickWeighted(items){
    const total = items.reduce((s,i)=>s+(i.w||1),0);
    let r = Math.random()*total;
    for(const it of items){ r-=(it.w||1); if(r<=0) return it; }
    return items[items.length-1];
  }
};

/* ─── OLAY SİSTEMİ ─── */
const Events = {
  m:{},
  on(e,f){ (this.m[e]=this.m[e]||[]).push(f); },
  emit(e,...a){ (this.m[e]||[]).forEach(f=>f(...a)); }
};

/* ─── KAYIT SİSTEMİ ─── */
const Store = {
  KEY:'bloxhub_v2', data:null,
  load(){
    try{ this.data = JSON.parse(localStorage.getItem(this.KEY)) || {}; }
    catch(e){ this.data = {}; }
    if(!Array.isArray(this.data.owned)) this.data.owned=[0];
    if(typeof this.data.coins!=='number') this.data.coins=0;
    if(typeof this.data.char!=='number') this.data.char=0;
    if(!this.data.best) this.data.best={};
    if(!this.data.plays) this.data.plays={};
    if(typeof this.data.muted!=='boolean') this.data.muted=false;
    if(!Array.isArray(this.data.items)) this.data.items=[];
    if(typeof this.data.equip!=='object'||!this.data.equip) this.data.equip={};
    ['hat','face','back','trail','sword','aura','pet'].forEach(s=>{
      if(!(s in this.data.equip)) this.data.equip[s]=null;
    });
  },
  save(){ try{ localStorage.setItem(this.KEY, JSON.stringify(this.data)); }catch(e){} },
  addCoins(n){
    this.data.coins = Math.max(0, this.data.coins + n);
    this.save(); Events.emit('coins');
  },
  setBest(id,score){
    const b = this.data.best[id]||0;
    if(score>b){ this.data.best[id]=score; this.save(); return true; }
    return false;
  },
  getBest(id){ return this.data.best[id]||0; },
  addPlay(id){
    this.data.plays[id]=(this.data.plays[id]||0)+1;
    this.save();
  },
  getPlays(id){ return this.data.plays[id]||0; },
  hasItem(id){ return this.data.items.indexOf(id)>=0; },
  buyItem(it){
    if(this.data.coins<it.cost) return false;
    this.addCoins(-it.cost);
    this.data.items.push(it.id);
    this.data.equip[it.slot]=it.id;
    this.save(); return true;
  },
  toggleEquip(it){
    this.data.equip[it.slot] = (this.data.equip[it.slot]===it.id)? null : it.id;
    this.save();
  }
};

/* ─── SES SİSTEMİ ─── */
const Sfx = {
  ctx:null, on:true,
  ensure(){
    if(!this.ctx){
      const AC = window.AudioContext||window.webkitAudioContext;
      if(AC) this.ctx = new AC();
    }
    if(this.ctx && this.ctx.state==='suspended') this.ctx.resume();
  },
  tone(f,d,type,v,slide,when){
    if(!this.on) return;
    this.ensure(); if(!this.ctx) return;
    type=type||'square'; v=v||0.12; when=when||0;
    const t=this.ctx.currentTime+when;
    const o=this.ctx.createOscillator(), g=this.ctx.createGain();
    o.type=type; o.frequency.setValueAtTime(f,t);
    if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),t+d);
    g.gain.setValueAtTime(v,t);
    g.gain.exponentialRampToValueAtTime(0.001,t+d);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(t); o.stop(t+d+0.02);
  },
  click(){ this.tone(620,0.06,'square',0.09); },
  jump(){ this.tone(260,0.18,'square',0.11,240); },
  land(){ this.tone(140,0.08,'triangle',0.09,-40); },
  coin(){ this.tone(988,0.07,'square',0.11,0,0); this.tone(1319,0.12,'square',0.11,0,0.07); },
  buy(){ this.tone(523,0.08,'square',0.11,0,0); this.tone(784,0.12,'square',0.11,0,0.08); },
  hit(){ this.tone(150,0.22,'sawtooth',0.17,-90); },
  trap(){ this.tone(220,0.3,'sawtooth',0.17,-160); },
  boom(){ this.tone(90,0.4,'sawtooth',0.2,-60); this.tone(50,0.5,'triangle',0.2,-20,0.02); },
  door(){ this.tone(392,0.1,'triangle',0.12); this.tone(523,0.14,'triangle',0.12,0,0.09); },
  tap(){ this.tone(740,0.05,'triangle',0.09); },
  splash(){ this.tone(400,0.2,'sine',0.1,-200); },
  reel(){ this.tone(800,0.05,'square',0.06,300); },
  tick(){ this.tone(1200,0.04,'square',0.08); },
  msg(){ this.tone(700,0.05,'sine',0.07); },
  level(){ [523,659,784,1047].forEach((f,i)=>this.tone(f,0.12,'square',0.11,0,i*0.08)); },
  win(){ [523,659,784,1047,1319].forEach((f,i)=>this.tone(f,0.16,'square',0.12,0,i*0.1)); },
  lose(){ this.tone(330,0.5,'sawtooth',0.14,-200); this.tone(196,0.6,'sawtooth',0.11,-90,0.2); }
};
document.addEventListener('pointerdown', ()=>Sfx.ensure());

/* ─── KARAKTERLER ─── */
const CHARS = [
  {name:'ÇAYLAK',     skin:'#ffd23f', shirt:'#31a2ff', pants:'#274b7a', cost:0},
  {name:'NİNJA',      skin:'#f2f2f2', shirt:'#23272e', pants:'#23272e', cost:60},
  {name:'İTFAİYECİ',  skin:'#ffcf9e', shirt:'#ff5722', pants:'#37474f', cost:120},
  {name:'UZAYLI',     skin:'#8be04a', shirt:'#9b59b6', pants:'#4a148c', cost:180},
  {name:'ROBO-PANDA', skin:'#ffffff', shirt:'#15181d', pants:'#15181d', cost:260},
  {name:'ALTIN KRAL', skin:'#ffd700', shirt:'#ffffff', pants:'#c0392b', cost:400},
  {name:'GÖLGE',      skin:'#37474f', shirt:'#1a1a2e', pants:'#0f0f1e', cost:500},
  {name:'PEMBE PRENSES',skin:'#ffb6c1', shirt:'#ff69b4', pants:'#ff1493', cost:600}
];

/* ─── MARKET EŞYALARI ─── */
const SHOP = [
  {id:'glasses',      name:'PİLOT GÖZLÜĞÜ',  icon:'🕶️', cost:80,  slot:'face',  desc:'Karizma +10'},
  {id:'visor',        name:'NEON VİZÖR',     icon:'🤖', cost:95,  slot:'face',  desc:'Gelecekten geldi'},
  {id:'mask_ninja',   name:'NİNJA MASKESİ',  icon:'🥷', cost:110, slot:'face',  desc:'Gizlilik +50'},
  {id:'cap',          name:'BEYZBOL ŞAPKASI',icon:'🧢', cost:90,  slot:'hat',   desc:'Günlük stil'},
  {id:'tophat',       name:'SİLİNDİR ŞAPKA', icon:'🎩', cost:100, slot:'hat',   desc:'Centilmen görün'},
  {id:'halo',         name:'HALE',           icon:'😇', cost:120, slot:'hat',   desc:'Döner altın halka'},
  {id:'crown',        name:'ALTIN TAÇ',      icon:'👑', cost:150, slot:'hat',   desc:'Kral sensin'},
  {id:'viking',       name:'VİKİNG MİĞFERİ', icon:'⚔️', cost:180, slot:'hat',   desc:'Boynuzlu güç'},
  {id:'wizard',       name:'BÜYÜCÜ ŞAPKASI', icon:'🧙', cost:170, slot:'hat',   desc:'+30 mana'},
  {id:'demon',        name:'ŞEYTAN BOYNUZU', icon:'😈', cost:210, slot:'hat',   desc:'Karanlık taraf'},
  {id:'wings',        name:'PERİ KANATLARI', icon:'🧚', cost:200, slot:'back',  desc:'Sırtında parlar'},
  {id:'dragon_wings', name:'EJDER KANADI',   icon:'🐉', cost:340, slot:'back',  desc:'Efsanevi'},
  {id:'jetpack',      name:'JET ÇANTASI',    icon:'🚀', cost:300, slot:'back',  desc:'3...2...1...'},
  {id:'cape',         name:'KAHRAMAN PELERİNİ',icon:'🦸',cost:160,slot:'back',  desc:'Rüzgarda dalgalanır'},
  {id:'sword_fire',   name:'ATEŞ KILIÇ',     icon:'🔥', cost:220, slot:'sword', desc:'Lav rengi çelik'},
  {id:'sword_gold',   name:'ALTIN KILIÇ',    icon:'⚜️', cost:280, slot:'sword', desc:'Zengin parlaması'},
  {id:'sword_ice',    name:'BUZ KILICI',     icon:'❄️', cost:260, slot:'sword', desc:'Donmuş keskinlik'},
  {id:'sword_void',   name:'BOŞLUK KILICI',  icon:'🌌', cost:380, slot:'sword', desc:'Yasak güç'},
  {id:'sword_diamond',name:'ELMAS KILIÇ',    icon:'💎', cost:300, slot:'sword', desc:'Efsanevi parlaklık'},
  {id:'trail_star',   name:'YILDIZ İZİ',     icon:'✨', cost:250, slot:'trail', desc:'Yürürken parılda'},
  {id:'trail_fire',   name:'ATEŞ İZİ',       icon:'🔥', cost:270, slot:'trail', desc:'Alev alev'},
  {id:'trail_bubble', name:'BALONCUK İZİ',   icon:'🫧', cost:230, slot:'trail', desc:'Pıt pıt pıt'},
  {id:'trail_rainbow',name:'GÖKKUŞAĞI İZİ',  icon:'🌈', cost:400, slot:'trail', desc:'Renk fırtınası'},
  {id:'aura_gold',    name:'ALTIN AURA',     icon:'🌟', cost:320, slot:'aura',  desc:'Dönen enerji halkası'},
  {id:'aura_rainbow', name:'GÖKKUŞAĞI AURA', icon:'💫', cost:420, slot:'aura',  desc:'Işıltı patlaması'},
  {id:'pet_dog',      name:'YAVRU KÖPEK',    icon:'🐶', cost:350, slot:'pet',   desc:'Sadık dost'},
  {id:'pet_cat',      name:'KEDİ',           icon:'🐱', cost:350, slot:'pet',   desc:'Miyav'},
  {id:'pet_dragon',   name:'MİNİ EJDER',     icon:'🐲', cost:500, slot:'pet',   desc:'Nadir yaratık'},
  {id:'pet_robot',    name:'ROBOT PET',      icon:'🤖', cost:450, slot:'pet',   desc:'Bip bop'}
];

/* ─── 50 OYUN KAYDI ───
   Her oyun: id, name, emoji, color, desc, cat (kategori), diff (zorluk 1-3)
   Oyun mantığı games-core.js ve games-pack*.js dosyalarında tanımlanır. */
const GAME_LIST = [
  // Klasikler (1-10)
  {id:'obby',     name:'Klasik Obby',      emoji:'🏁', color:'#3ecf5a', desc:'Düşmeden bitişe ulaş!', cat:'Parkur', diff:1},
  {id:'tower',    name:'Tower of Hell',     emoji:'🗼', color:'#ff4d5e', desc:'Süre bitmeden tepeye tırman!', cat:'Parkur', diff:2},
  {id:'lava',     name:'Floor is Lava',     emoji:'🌋', color:'#ff8f2a', desc:'Lav yükseliyor, tırman!', cat:'Hayatta Kalma', diff:2},
  {id:'color',    name:'Color Block',       emoji:'🎨', color:'#8a5cf6', desc:'Doğru renge koş!', cat:'Refleks', diff:1},
  {id:'speed',    name:'Speed Run',         emoji:'⚡', color:'#28c7d9', desc:'Engellerden kaç, yarış!', cat:'Yarış', diff:2},
  {id:'tycoon',   name:'Mega Tycoon',       emoji:'🏭', color:'#2ed573', desc:'Konveyör kur, zengin ol!', cat:'Tycoon', diff:1},
  {id:'doors',    name:'Doors',             emoji:'🚪', color:'#b3803e', desc:'Doğru kapıyı bul!', cat:'Bulmaca', diff:2},
  {id:'disaster', name:'Afet Survival',      emoji:'☄️', color:'#ff6b35', desc:'Meteorlardan hayatta kal!', cat:'Hayatta Kalma', diff:2},
  {id:'clicker',  name:'Clicker Sim',       emoji:'💥', color:'#ff4da6', desc:'Tıkla, güçlen, seviye atla!', cat:'Sim', diff:1},
  {id:'boss',     name:'Boss Arena',        emoji:'⚔️', color:'#c0392b', desc:'Bossu yen!', cat:'Dövüş', diff:3},
  // Paket 1 (11-20)
  {id:'tntrun',   name:'TNT Run',           emoji:'🧨', color:'#ff5252', desc:'Bastığın blok patlar!', cat:'Refleks', diff:2},
  {id:'bridge',   name:'Bridge Race',       emoji:'🌉', color:'#31a2ff', desc:'Köprü kur, yarışı kazan!', cat:'Yarış', diff:2},
  {id:'sumo',     name:'Sumo Royale',       emoji:'🤼', color:'#ffb100', desc:'Herkesi platformdan it!', cat:'Dövüş', diff:2},
  {id:'mine',     name:'Mine Sim',          emoji:'⛏️', color:'#8d6e63', desc:'Cevher kaz, zengin ol!', cat:'Tycoon', diff:1},
  {id:'zombie',   name:'Zombi İstilası',    emoji:'🧟', color:'#7cb342', desc:'Zombi dalgalarına dayan!', cat:'Hayatta Kalma', diff:3},
  {id:'fishing',  name:'Balık Tutma',       emoji:'🎣', color:'#29b6f6', desc:'Oltayı at, balığı yakala!', cat:'Sim', diff:1},
  {id:'bomb',     name:'Bomba Kimde',       emoji:'💣', color:'#ff5252', desc:'Bombayı üzerinde tutma!', cat:'Refleks', diff:2},
  {id:'scavenger',name:'Hazine Avı',        emoji:'💎', color:'#ab47bc', desc:'Mücevherleri topla!', cat:'Toplama', diff:1},
  {id:'bladeball',name:'Blade Ball',        emoji:'🗡️', color:'#e74c3c', desc:'Topu kılıcınla geri vur!', cat:'Dövüş', diff:3},
  {id:'glassbridge',name:'Cam Köprü',       emoji:'🪟', color:'#80d8ff', desc:'Doğru camı seç, düşme!', cat:'Refleks', diff:3},
  // Paket 2 (21-30)
  {id:'redlight', name:'Kırmızı Yeşil Işık',emoji:'🚦', color:'#2ecc71', desc:'Yeşilde koş, kırmızıda dur!', cat:'Refleks', diff:2},
  {id:'murder',   name:'Murder Mystery',    emoji:'🔪', color:'#9b59b6', desc:'Katili bul, hayatta kal!', cat:'Bulmaca', diff:3},
  {id:'kinghill', name:'King of the Hill',  emoji:'👑', color:'#f39c12', desc:'Tepede kal, kral ol!', cat:'Dövüş', diff:2},
  {id:'freezetag',name:'Freeze Tag',        emoji:'❄️', color:'#5dade2', desc:'Donmadan kaç!', cat:'Yarış', diff:2},
  {id:'dodgeball',name:'Dodgeball',         emoji:'🏐', color:'#e67e22', desc:'Toplardan kaç!', cat:'Refleks', diff:2},
  {id:'ctf',      name:'Bayrak Kapma',      emoji:'🚩', color:'#e74c3c', desc:'Bayrağı çal, üsse getir!', cat:'Yarış', diff:3},
  {id:'jailbreak',name:'Jailbreak Chase',   emoji:'🚔', color:'#34495e', desc:'Hapisten kaç!', cat:'Parkur', diff:2},
  {id:'petsim',   name:'Pet Simulator',     emoji:'🐾', color:'#ff69b4', desc:'Pet topla, güçlen!', cat:'Sim', diff:1},
  {id:'beeswarm', name:'Bal Toplama',       emoji:'🐝', color:'#f1c40f', desc:'Bal topla, kovanı büyüt!', cat:'Toplama', diff:1},
  {id:'hide',     name:'Saklambaç',         emoji:'🙈', color:'#16a085', desc:'Saklan, yakalanma!', cat:'Bulmaca', diff:2},
  // Paket 3 (31-40)
  {id:'prophunt', name:'Prop Hunt',         emoji:'📦', color:'#d35400', desc:'Eşya ol, saklan!', cat:'Bulmaca', diff:2},
  {id:'arsenal',  name:'Arsenal',           emoji:'🔫', color:'#c0392b', desc:'Silahlarla rakipleri yen!', cat:'Dövüş', diff:3},
  {id:'prison',   name:'Prison Escape',     emoji:'🔒', color:'#7f8c8d', desc:'Hapishaneden kaç!', cat:'Parkur', diff:3},
  {id:'pizza',    name:'Pizza Ustası',      emoji:'🍕', color:'#e74c3c', desc:'Pizza yap, para kazan!', cat:'Sim', diff:1},
  {id:'themepark',name:'Lunapark Tycoon',   emoji:'🎡', color:'#9b59b6', desc:'Lunapark inşa et!', cat:'Tycoon', diff:2},
  {id:'carcrush', name:'Araba Ezme',        emoji:'🚗', color:'#f39c12', desc:'Arabaları ez, para kazan!', cat:'Sim', diff:1},
  {id:'ragdoll',  name:'Ragdoll Fiziği',    emoji:'🤸', color:'#3498db', desc:'Fizik ile eğlen!', cat:'Sim', diff:1},
  {id:'ballrun',  name:'Top Obby',          emoji:'⚽', color:'#27ae60', desc:'Top olarak obby yap!', cat:'Parkur', diff:2},
  {id:'onlyup',   name:'Only Up',           emoji:'🧗', color:'#e67e22', desc:'Sadece yukarı, düşme!', cat:'Parkur', diff:3},
  {id:'memory',   name:'Hafıza Eşleştirme', emoji:'🧠', color:'#8e44ad', desc:'Kartları eşleştir!', cat:'Bulmaca', diff:1},
  // Paket 4 (41-50)
  {id:'swordroyale',name:'Kılıç Royale',    emoji:'⚔️', color:'#c0392b', desc:'Son kalan ol!', cat:'Dövüş', diff:3},
  {id:'bowbattle',name:'Ok Savaşı',         emoji:'🏹', color:'#27ae60', desc:'Oklarla rakipleri vur!', cat:'Dövüş', diff:2},
  {id:'raceroyale',name:'Yarış Royale',     emoji:'🏎️', color:'#e74c3c', desc:'Son araba kalana kadar!', cat:'Yarış', diff:3},
  {id:'puzzle',   name:'Platform Bulmaca',  emoji:'🧩', color:'#3498db', desc:'Blokları doğru diz!', cat:'Bulmaca', diff:2},
  {id:'musical',  name:'Müzikal Sandalye',  emoji:'🪑', color:'#f1c40f', desc:'Müzik durunca otur!', cat:'Refleks', diff:1},
  {id:'naturdis2',name:'Afet Survival 2',   emoji:'🌪️', color:'#e67e22', desc:'Kasırgaya dayan!', cat:'Hayatta Kalma', diff:3},
  {id:'obbytower',name:'Obby Kulesi',       emoji:'🏗️', color:'#16a085', desc:'Kat kat obby tırman!', cat:'Parkur', diff:2},
  {id:'coinrush', name:'Coin Koşusu',       emoji:'🪙', color:'#f39c12', desc:'En çok coini topla!', cat:'Toplama', diff:1},
  {id:'lavafloor',name:'Lav Zemini 2',      emoji:'🔥', color:'#d35400', desc:'Daha hızlı lav!', cat:'Hayatta Kalma', diff:3},
  {id:'gauntlet', name:'Final Gauntlet',    emoji:'🏆', color:'#ffd32a', desc:'Tüm oyunların finali!', cat:'Parkur', diff:3}
];

/* Kategori listesi (filtreler için) */
const GAME_CATS = ['Tümü','Parkur','Dövüş','Yarış','Refleks','Hayatta Kalma','Tycoon','Sim','Bulmaca','Toplama'];

/* Oyun kaydı — games dosyaları bunu doldurur */
const GAMES = [];
const GAME_IMPL = {};
function defGame(meta, enterFn){
  GAME_IMPL[meta.id] = enterFn;
  // GAME_LIST'teki meta ile birleştir
  const list = GAME_LIST.find(g=>g.id===meta.id);
  GAMES.push(Object.assign({}, list, meta, {enter:enterFn}));
}
function getGame(id){ return GAMES.find(g=>g.id===id); }
