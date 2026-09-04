'use strict';
let lastGameId=null;

function showOnly(screenId){
  ['screen-menu','screen-chars','screen-games','screen-howto','screen-over','screen-shop']
    .forEach(id=>$(id).classList.add('hidden'));
  if(screenId)$(screenId).classList.remove('hidden');
}
function startGameById(id){
  const m=GAMES.find(g=>g.id===id);
  if(!m)return;
  lastGameId=id;
  Engine.startGame(m);
  HUD.toast(m.emoji+' '+m.name,1.4);
}
function buildMenuBg(){
  const bg=$('menu-bg');
  const cols=['#ff4d5e','#ffd32a','#3ecf5a','#2f7df6','#8a5cf6','#ff8f2a'];
  for(let i=0;i<12;i++){
    const b=document.createElement('div');
    b.className='fblock';
    const s=U.rand(18,52);
    b.style.width=s+'px';b.style.height=s+'px';
    b.style.left=U.rand(0,98)+'%';
    b.style.background=U.choice(cols);
    b.style.animationDuration=U.rand(9,22)+'s';
    b.style.animationDelay=(-U.rand(0,20))+'s';
    bg.appendChild(b);
  }
  $('ticker').textContent=GAMES.map(g=>g.emoji).join(' ');
  $('menu-avatar').innerHTML=avatarDOM(CHARS[Store.data.char]||CHARS[0]);
}
function renderChars(){
  const grid=$('char-grid');grid.innerHTML='';
  CHARS.forEach((c,i)=>{
    const owned=Store.data.owned.indexOf(i)>=0;
    const sel=Store.data.char===i;
    const card=document.createElement('div');
    card.className='charcard'+(sel?' sel':'')+(!owned&&Store.data.coins<c.cost?' poor':'');
    card.style.animationDelay=(i*0.05)+'s';
    card.innerHTML=avatarDOM(c)+
      '<div class="cc-name">'+c.name+'</div>'+
      (sel?'<button class="cc-btn sel">✔ SEÇİLDİ</button>'
        :owned?'<button class="cc-btn">SEÇ</button>'
        :'<button class="cc-btn lock">🪙 '+c.cost+'</button>');
    card.querySelector('button').addEventListener('click',()=>{
      if(sel)return;
      if(owned){
        Store.data.char=i;Store.save();
        Engine.applyChar(i);
        $('menu-avatar').innerHTML=avatarDOM(c);
        Sfx.click();renderChars();
      } else if(Store.data.coins>=c.cost){
        Store.addCoins(-c.cost);
        Store.data.owned.push(i);Store.data.char=i;Store.save();
        Engine.applyChar(i);
        $('menu-avatar').innerHTML=avatarDOM(c);
        Sfx.buy();HUD.toast('🎉 '+c.name+' açıldı!');renderChars();
      } else {
        Sfx.hit();HUD.toast('Yetersiz coin! 🪙 Oyun oyna kazan.');
      }
    });
    grid.appendChild(card);
  });
}
function renderGames(){
  const grid=$('game-grid');grid.innerHTML='';
  GAMES.forEach((g,i)=>{
    const best=Store.getBest(g.id);
    const card=document.createElement('div');
    card.className='gcard';
    card.style.setProperty('--gc',g.color);
    card.style.animationDelay=(i*0.04)+'s';
    card.innerHTML=
      '<div class="gc-ico">'+g.emoji+'</div>'+
      '<div class="gc-name">'+g.name+'</div>'+
      '<div class="gc-desc">'+g.desc+'</div>'+
      '<div class="gc-best">🏅 En iyi: '+(best||'—')+'</div>';
    card.addEventListener('click',()=>{
      Sfx.click();
      showOnly(null);
      Engine.fadeDo(()=>startGameById(g.id));
    });
    grid.appendChild(card);
  });
}
function renderShop(){
  const grid=$('shop-grid');grid.innerHTML='';
  SHOP.forEach((it,i)=>{
    const owned=Store.hasItem(it.id);
    const equipped=(Store.data.equip[it.slot]===it.id);
    const card=document.createElement('div');
    card.className='charcard'+(equipped?' eq':'')+(!owned&&Store.data.coins<it.cost?' poor':'');
    card.style.animationDelay=(i*0.04)+'s';
    card.innerHTML=
      '<div class="shop-ico">'+it.icon+'</div>'+
      '<div class="cc-name">'+it.name+'</div>'+
      '<div class="shop-slot">'+it.desc+'</div>'+
      (owned
        ?'<button class="cc-btn'+(equipped?' sel':'')+'">'+(equipped?'✔ TAKILI':'TAK')+'</button>'
        :'<button class="cc-btn lock">🪙 '+it.cost+'</button>');
    card.querySelector('button').addEventListener('click',()=>{
      if(owned){
        Store.toggleEquip(it);
        Engine.applyChar(Store.data.char);
        Sfx.click();renderShop();
      } else if(Store.buyItem(it)){
        Engine.applyChar(Store.data.char);
        Sfx.buy();HUD.toast('💎 '+it.name+' alındı ve takıldı!');
        renderShop();
      } else {
        Sfx.hit();HUD.toast('Yetersiz coin! 🪙');
      }
    });
    grid.appendChild(card);
  });
}
Events.on('result',r=>{
  $('over-emoji').textContent=r.win?'🏆':'💀';
  const tt=$('over-title');
  tt.textContent=r.win?'KAZANDIN!':'KAYBETTİN!';
  tt.className=r.win?'win':'lose';
  $('over-msg').textContent=(r.msg?r.msg+' • ':'')+r.name;
  $('over-stats').innerHTML=
    '<div>⭐ Skor: <b>'+r.score+'</b></div>'+
    '<div>🏅 En iyi: <b>'+r.best+'</b> '+(r.newBest?'<span class="nb">YENİ REKOR!</span>':'')+'</div>';
  $('over-coins').textContent='+'+r.coins+' 🪙';
  showOnly('screen-over');
});
function boot(){
  Store.load();
  if(!window.THREE){$('nogl').classList.remove('hidden');return;}
  Engine.init($('game'));
  Engine.applyChar(Store.data.char);
  Engine.idleLobby();
  buildMenuBg();
  HUD.coins();
  showOnly('screen-menu');
  Sfx.on=!Store.data.muted;
  $('btn-sound').textContent=Sfx.on?'🔊':'🔇';

  $('btn-play').addEventListener('click',()=>{
    Sfx.click();
    Engine.fadeDo(()=>{
      showOnly(null);
      Engine.enterLobby();
      HUD.toast('🎮 Portala yaklaş ve ✋ ile seç!',2);
    });
  });
  $('btn-chars').addEventListener('click',()=>{Sfx.click();renderChars();showOnly('screen-chars');});
  $('btn-shop').addEventListener('click',()=>{Sfx.click();renderShop();showOnly('screen-shop');});
  $('btn-howto').addEventListener('click',()=>{Sfx.click();showOnly('screen-howto');});
  $('btn-sound').addEventListener('click',()=>{
    Sfx.on=!Sfx.on;Store.data.muted=!Sfx.on;Store.save();
    $('btn-sound').textContent=Sfx.on?'🔊':'🔇';
    if(Sfx.on)Sfx.click();
  });
  $('btn-cback').addEventListener('click',()=>{Sfx.click();showOnly('screen-menu');});
  $('btn-sback').addEventListener('click',()=>{
    Sfx.click();
    if(Engine.mode==='lobby'&&Engine.playerOn){showOnly(null);}
    else showOnly('screen-menu');
  });
  $('btn-gback').addEventListener('click',()=>{Sfx.click();showOnly(null);Engine.enterLobby();});
  $('btn-hback').addEventListener('click',()=>{Sfx.click();showOnly('screen-menu');});
  $('btn-reset').addEventListener('click',()=>{
    if(confirm('Tüm ilerleme silinsin mi?')){
      localStorage.removeItem(Store.KEY);
      location.reload();
    }
  });
  $('btn-exit').addEventListener('click',()=>{
    Sfx.click();
    if(Engine.mode==='game'){
      Engine.fadeDo(()=>{showOnly(null);Engine.toLobby();});
    } else {
      Engine.fadeDo(()=>{Engine.idleLobby();HUD.show(false);HUD.setControls(false);showOnly('screen-menu');});
    }
  });
  $('btn-games').addEventListener('click',()=>{Sfx.click();renderGames();showOnly('screen-games');});
  $('btn-shop2').addEventListener('click',()=>{Sfx.click();renderShop();showOnly('screen-shop');});

  Events.on('reqGame',id=>{
    Engine.fadeDo(()=>{showOnly(null);startGameById(id);});
  });
  Events.on('reqShop',()=>{
    renderShop();showOnly('screen-shop');
  });
  $('btn-retry').addEventListener('click',()=>{
    Sfx.click();
    Engine.fadeDo(()=>{showOnly(null);if(lastGameId)startGameById(lastGameId);});
  });
  $('btn-lobby').addEventListener('click',()=>{
    Sfx.click();
    Engine.fadeDo(()=>{showOnly(null);Engine.toLobby();});
  });
  Events.on('coins',()=>HUD.coins());
}
boot();
