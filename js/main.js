/* ============================================================
   main.js — Menü, oyun listesi, avatar, market, sonuç, entegrasyon
   ============================================================ */
'use strict';

let lastGameId=null;
let gameFilter='Tümü';
let shopFilter='Tümü';
let shopReturn='screen-home';

const SCREENS=['screen-home','screen-chars','screen-games','screen-shop','screen-how','screen-over'];

function showOnly(id){
  SCREENS.forEach(s=>{ const el=$(s); if(el) el.classList.add('hidden'); });
  if(id){ const el=$(id); if(el) el.classList.remove('hidden'); }
}

function updateTopbar(){
  const topbar=$('topbar'); if(!topbar)return;
  const show=(Engine.mode==='lobby' && !Engine.idle) || Engine.mode==='game';
  topbar.classList.toggle('hidden', !show);
}

function updateCharPreview(){
  const avPrev=document.querySelector('.av-preview');
  if(avPrev) avPrev.innerHTML=avatarDOM(CHARS[Store.data.char]||CHARS[0]);
}

function buildMenuBg(){
  const bg=$('menu-bg'); if(!bg)return;
  bg.innerHTML='';
  const cols=['#ff4d5e','#ffd32a','#3ecf5a','#2f7df6','#8a5cf6','#ff8f2a'];
  for(let i=0;i<14;i++){
    const b=document.createElement('div');
    b.className='fblock';
    const s=U.rand(18,52);
    b.style.width=s+'px'; b.style.height=s+'px';
    b.style.left=U.rand(0,98)+'%';
    b.style.background=U.choice(cols);
    b.style.animationDuration=U.rand(9,22)+'s';
    b.style.animationDelay=(-U.rand(0,20))+'s';
    bg.appendChild(b);
  }
  const ticker=$('ticker'); if(ticker) ticker.textContent=GAMES.map(g=>g.emoji).join(' ');
  const av=$('menu-avatar'); if(av) av.innerHTML=avatarDOM(CHARS[Store.data.char]||CHARS[0]);
}

/* ─── KARAKTER LİSTESİ ─── */
function renderChars(){
  const grid=$('char-grid'); if(!grid)return;
  grid.innerHTML='';
  CHARS.forEach((c,i)=>{
    const owned=Store.data.owned.indexOf(i)>=0;
    const sel=Store.data.char===i;
    const card=document.createElement('div');
    card.className='charcard'+(sel?' sel':'')+(!owned&&Store.data.coins<c.cost?' poor':'');
    card.style.animationDelay=(i*0.03)+'s';
    card.innerHTML=avatarDOM(c)+
      '<div class="cc-name">'+c.name+'</div>'+
      (sel?'<button class="cc-btn sel">✔ SEÇİLDİ</button>'
        :owned?'<button class="cc-btn">SEÇ</button>'
        :'<button class="cc-btn lock">🪙 '+c.cost+'</button>');
    card.querySelector('button').addEventListener('click',(e)=>{
      e.stopPropagation();
      if(sel) return;
      if(owned){
        Store.data.char=i; Store.save();
        Engine.applyChar(i);
        Sfx.click();
        HUD.toast(c.name+' seçildi',1);
        updateCharPreview(); renderChars();
      } else if(Store.data.coins>=c.cost){
        Store.addCoins(-c.cost);
        Store.data.owned.push(i); Store.data.char=i; Store.save();
        Engine.applyChar(i);
        Sfx.buy();
        HUD.toast('🎉 '+c.name+' açıldı!',1.2);
        updateCharPreview(); renderChars();
      } else {
        Sfx.hit();
        HUD.toast('Yetersiz coin! 🪙 Oyun oyna kazan.',1.2);
      }
    });
    grid.appendChild(card);
  });
  updateCharPreview();
}

/* ─── OYUN LİSTESİ (filtreli) ─── */
function renderGameFilters(){
  const cont=$('game-filters'); if(!cont)return;
  cont.innerHTML='';
  GAME_CATS.forEach(cat=>{
    const chip=document.createElement('button');
    chip.className='filter-chip'+(cat===gameFilter?' active':'');
    chip.textContent=cat;
    chip.addEventListener('click',()=>{ gameFilter=cat; renderGames(); });
    cont.appendChild(chip);
  });
}
function renderGames(){
  const grid=$('game-grid'); if(!grid)return;
  grid.innerHTML='';
  const list=GAMES.filter(g=>gameFilter==='Tümü'||g.cat===gameFilter);
  list.forEach((g,i)=>{
    const best=Store.getBest(g.id);
    const plays=Store.getPlays(g.id)||0;
    const card=document.createElement('div');
    card.className='gcard';
    card.style.setProperty('--gc',g.color);
    card.style.animationDelay=(i*0.03)+'s';
    card.innerHTML=
      '<div class="gc-ico">'+g.emoji+'</div>'+
      '<div class="gc-name">'+g.name+'</div>'+
      '<div class="gc-desc">'+g.desc+'</div>'+
      '<div class="gc-best">'+'⭐'.repeat(g.diff)+' | 🏅 '+(best||'—')+' | '+plays+' oynama</div>';
    card.addEventListener('click',()=>{
      Sfx.click();
      showOnly(null);
      Engine.fadeDo(()=>startGameById(g.id));
    });
    grid.appendChild(card);
  });
  renderGameFilters();
}

/* ─── MARKET (slot filtreli) ─── */
const SHOP_SLOTS=['Tümü','hat','face','back','trail','sword','aura','pet'];
const SLOT_NAMES={hat:'Şapka',face:'Yüz',back:'Sırt',trail:'İz',sword:'Kılıç',aura:'Aura',pet:'Pet'};
function renderShopFilters(){
  const cont=$('shop-filters'); if(!cont)return;
  cont.innerHTML='';
  SHOP_SLOTS.forEach(slot=>{
    const chip=document.createElement('button');
    chip.className='filter-chip'+(slot===shopFilter?' active':'');
    chip.textContent=slot==='Tümü'?'Tümü':(SLOT_NAMES[slot]||slot);
    chip.addEventListener('click',()=>{ shopFilter=slot; renderShop(); });
    cont.appendChild(chip);
  });
}
function renderShop(){
  const grid=$('shop-grid'); if(!grid)return;
  grid.innerHTML='';
  const list=SHOP.filter(it=>shopFilter==='Tümü'||it.slot===shopFilter);
  list.forEach((it,i)=>{
    const owned=Store.hasItem(it.id);
    const equipped=(Store.data.equip[it.slot]===it.id);
    const card=document.createElement('div');
    card.className='charcard'+(equipped?' eq':'')+(!owned&&Store.data.coins<it.cost?' poor':'');
    card.style.animationDelay=(i*0.03)+'s';
    card.innerHTML=
      '<div class="shop-ico">'+it.icon+'</div>'+
      '<div class="cc-name">'+it.name+'</div>'+
      '<div class="shop-slot">'+(SLOT_NAMES[it.slot]||it.slot)+' • '+it.desc+'</div>'+
      (owned
        ?'<button class="cc-btn'+(equipped?' sel':'')+'">'+(equipped?'✔ TAKILI':'TAK')+'</button>'
        :'<button class="cc-btn lock">🪙 '+it.cost+'</button>');
    card.querySelector('button').addEventListener('click',(e)=>{
      e.stopPropagation();
      if(owned){
        const wasEquipped=(Store.data.equip[it.slot]===it.id);
        Store.toggleEquip(it);
        Engine.applyChar(Store.data.char);
        Sfx.click();
        HUD.toast(wasEquipped?it.name+' çıkarıldı':it.name+' takıldı',1);
        renderShop();
      } else if(Store.buyItem(it)){
        Engine.applyChar(Store.data.char);
        Sfx.buy();
        HUD.toast('💎 '+it.name+' alındı ve takıldı!',1.2);
        renderShop();
      } else {
        Sfx.hit();
        HUD.toast('Yetersiz coin! 🪙 Oyun oyna kazan.',1.2);
      }
    });
    grid.appendChild(card);
  });
  renderShopFilters();
}

/* ─── OYUN BAŞLATMA ─── */
function startGameById(id){
  const m=GAMES.find(g=>g.id===id);
  if(!m) return;
  lastGameId=id;
  Engine.startGame(m);
  updateTopbar();
  HUD.toast(m.emoji+' '+m.name, 1.4);
}

/* ─── SONUÇ EKRANI ─── */
function showResult(r){
  HUD.setControls(false);
  const oe=$('over-emoji'); if(oe) oe.textContent=r.win?'🏆':'💀';
  const tt=$('over-title');
  if(tt){ tt.textContent=r.win?'KAZANDIN!':'KAYBETTİN!'; tt.className=r.win?'win':'lose'; }
  const om=$('over-msg'); if(om) om.textContent=(r.msg?r.msg+' • ':'')+r.name;
  const os=$('over-stats');
  if(os) os.innerHTML=
    '<div>⭐ Skor: <b>'+r.score+'</b></div>'+
    '<div>🏅 En iyi: <b>'+r.best+'</b> '+(r.newBest?'<span class="nb">YENİ REKOR!</span>':'')+'</div>';
  const oc=$('over-coins'); if(oc) oc.textContent='+'+r.coins+' 🪙';
  showOnly('screen-over');
}

/* ─── OLAY BAĞLANTILARI ─── */
function wireEvents(){
  const play=$('btn-play');
  if(play) play.addEventListener('click',()=>{
    Sfx.click();
    Engine.fadeDo(()=>{
      showOnly(null);
      Engine.enterLobby();
      updateTopbar();
      HUD.toast('🎮 Portala yaklaş ve ✋ ile seç!',2);
    });
  });
  const chars=$('btn-chars');
  if(chars) chars.addEventListener('click',()=>{ Sfx.click(); renderChars(); showOnly('screen-chars'); });
  const shop=$('btn-shop');
  if(shop) shop.addEventListener('click',()=>{ Sfx.click(); shopReturn='screen-home'; renderShop(); showOnly('screen-shop'); });
  const howto=$('btn-howto');
  if(howto) howto.addEventListener('click',()=>{ Sfx.click(); showOnly('screen-how'); });
  const snd=$('btn-sound');
  if(snd) snd.addEventListener('click',()=>{
    Sfx.on=!Sfx.on; Store.data.muted=!Sfx.on; Store.save();
    snd.textContent=Sfx.on?'🔊':'🔇';
    if(Sfx.on)Sfx.click();
  });
  const cback=$('btn-cback'); if(cback)cback.addEventListener('click',()=>{ Sfx.click(); showOnly('screen-home'); });
  const gback=$('btn-gback'); if(gback)gback.addEventListener('click',()=>{ Sfx.click(); showOnly(null); });
  const sback=$('btn-sback'); if(sback)sback.addEventListener('click',()=>{ Sfx.click(); if(shopReturn) showOnly(shopReturn); else showOnly(null); });
  const hback=$('btn-hback'); if(hback)hback.addEventListener('click',()=>{ Sfx.click(); showOnly('screen-home'); });

  const home=$('btn-home');
  if(home) home.addEventListener('click',()=>{
    Sfx.click();
    if(Engine.mode==='game'){
      Engine.fadeDo(()=>{ showOnly(null); Engine.toLobby(); updateTopbar(); });
    } else if(Engine.mode==='lobby' && !Engine.idle){
      Engine.fadeDo(()=>{ Engine.idleLobby(); HUD.show(false); HUD.setControls(false); showOnly('screen-home'); updateTopbar(); });
    } else {
      showOnly('screen-home');
    }
  });
  const gamesBtn=$('btn-games');
  if(gamesBtn) gamesBtn.addEventListener('click',()=>{ Sfx.click(); renderGames(); showOnly('screen-games'); });
  const shop2=$('btn-shop2');
  if(shop2) shop2.addEventListener('click',()=>{ Sfx.click(); shopReturn=null; renderShop(); showOnly('screen-shop'); });

  const reset=$('btn-reset');
  if(reset) reset.addEventListener('click',()=>{
    if(confirm('Tüm ilerleme silinsin mi?')){
      localStorage.removeItem(Store.KEY);
      location.reload();
    }
  });

  const retry=$('btn-retry');
  if(retry) retry.addEventListener('click',()=>{
    Sfx.click();
    Engine.fadeDo(()=>{ showOnly(null); if(lastGameId)startGameById(lastGameId); });
  });
  const lobbyBtn=$('btn-lobby');
  if(lobbyBtn) lobbyBtn.addEventListener('click',()=>{
    Sfx.click();
    Engine.fadeDo(()=>{ showOnly(null); Engine.toLobby(); updateTopbar(); });
  });

  Events.on('reqGame',id=>{
    Engine.fadeDo(()=>{ showOnly(null); startGameById(id); });
  });
  Events.on('reqShop',()=>{
    shopReturn=null; renderShop(); showOnly('screen-shop');
  });
  Events.on('result',r=>{ showResult(r); });
  Events.on('coins',()=>{ HUD.coins(); });
}

/* ─── BAŞLATMA ─── */
function boot(){
  Store.load();
  if(!window.THREE){
    const nogl=$('nogl'); if(nogl)nogl.classList.remove('hidden');
    return;
  }
  const loading=$('loading');
  if(loading){
    const fill=$('load-fill'); if(fill)fill.style.width='100%';
    setTimeout(()=>loading.classList.add('hidden'),300);
  }
  Engine.init($('game'));
  Engine.applyChar(Store.data.char);
  Engine.idleLobby();
  buildMenuBg();
  HUD.coins();
  showOnly('screen-home');
  updateTopbar();
  Sfx.on=!Store.data.muted;
  const sndBtn=$('btn-sound'); if(sndBtn)sndBtn.textContent=Sfx.on?'🔊':'🔇';
  wireEvents();
}

boot();
