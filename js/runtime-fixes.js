/* ============================================================
   runtime-fixes.js — UI, kamera, lifecycle ve gameplay hotfixleri
   Mevcut 50 oyunun mantığını ezmeden uyumluluk sağlar.
   ============================================================ */
'use strict';
(function(){
  const byId=id=>document.getElementById(id);
  const screens=['screen-home','screen-games','screen-avatar','screen-shop','screen-how','screen-over'];
  const openScreen=id=>{
    screens.forEach(s=>{const el=byId(s);if(el)el.classList.add('hidden');});
    const el=byId(id);if(el)el.classList.remove('hidden');
    if(typeof updateTopbar==='function')updateTopbar();
  };
  function cleanButton(id,handler){
    const old=byId(id);if(!old)return null;
    const fresh=old.cloneNode(true);old.replaceWith(fresh);fresh.addEventListener('click',handler);return fresh;
  }

  cleanButton('btn-games-home',()=>{Sfx.click();if(typeof renderGames==='function')renderGames();openScreen('screen-games');});
  cleanButton('btn-av-home',()=>{Sfx.click();if(typeof renderChars==='function')renderChars();openScreen('screen-avatar');});
  cleanButton('btn-shop-home',()=>{Sfx.click();shopReturn='screen-home';if(typeof renderShop==='function')renderShop();openScreen('screen-shop');});
  cleanButton('btn-how-home',()=>{Sfx.click();openScreen('screen-how');});
  cleanButton('btn-games',()=>{Sfx.click();if(typeof renderGames==='function')renderGames();openScreen('screen-games');});
  cleanButton('btn-shop',()=>{Sfx.click();shopReturn='screen-home';if(typeof renderShop==='function')renderShop();openScreen('screen-shop');});
  cleanButton('btn-shop-top',()=>{Sfx.click();shopReturn='screen-home';if(typeof renderShop==='function')renderShop();openScreen('screen-shop');});
  cleanButton('btn-av-top',()=>{Sfx.click();if(typeof renderChars==='function')renderChars();openScreen('screen-avatar');});
  document.querySelectorAll('.btn-back').forEach(btn=>{
    const fresh=btn.cloneNode(true);btn.replaceWith(fresh);
    fresh.addEventListener('click',()=>{Sfx.click();openScreen((fresh.dataset.back||'home')==='home'?'screen-home':fresh.dataset.back);});
  });

  /* HTML'de artık #hud yok; HUD görünürlüğünü gerçek katmanlara uygula. */
  if(typeof HUD!=='undefined'&&!HUD.__visibilityFix){
    HUD.__visibilityFix=true;
    HUD.show=function(v){
      ['topbar','hud-stats'].forEach(id=>{const el=byId(id);if(el)el.classList.toggle('hidden',!v);});
    };
  }

  /* Trigger temizliği: W.box ile oluşan gizli collider mesh'i de kaynaktan silinsin. */
  if(typeof W!=='undefined'&&!W.__cleanupFix){
    W.__cleanupFix=true;
    const baseBox=W.box.bind(W);
    W.box=function(x,y,z,w,h,d,color,o){
      const c=baseBox(x,y,z,w,h,d,color,o);
      c.__originalMesh=c.mesh;
      return c;
    };
    const baseRemove=W.removeC.bind(W);
    W.removeC=function(c){
      if(!c)return;
      const meshes=[c.__originalMesh,c.mesh].filter(Boolean);
      const seen=[];
      meshes.forEach(m=>{if(seen.indexOf(m)>=0)return;seen.push(m);if(m.parent)Engine.scene.remove(m);const i=Engine.items.indexOf(m);if(i>=0)Engine.items.splice(i,1);});
      baseRemove(c);
      meshes.forEach(m=>{const i=Engine.items.indexOf(m);if(i>=0)Engine.items.splice(i,1);});
    };
  }

  /* Oyun değiştiğinde önceki oyunun gecikmiş callback'i yeni oyunda çalışmasın. */
  if(typeof window!=='undefined'&&!window.__runScopedTimers){
    window.__runScopedTimers=true;
    const realSetTimeout=window.setTimeout.bind(window);
    window.setTimeout=function(fn,delay,...args){
      const scoped=(typeof Engine!=='undefined'&&Engine.mode==='game');
      const run=scoped?Engine.runId:null;
      return realSetTimeout(()=>{
        if(scoped&&(!Engine||Engine.mode!=='game'||Engine.runId!==run))return;
        fn(...args);
      },delay);
    };
  }

  /* Clicker: her girişte temiz DOM düğümleri kullan; eski listener'lar birikmez. */
  if(typeof Engine!=='undefined'&&!Engine.__clickerListenerGuard){
    Engine.__clickerListenerGuard=true;
    const origStart=Engine.startGame.bind(Engine);
    Engine.startGame=function(meta){
      if(meta&&meta.id==='clicker'){
        ['clk-btn','clk-up1','clk-up2'].forEach(id=>{const el=byId(id);if(el){const fresh=el.cloneNode(true);el.replaceWith(fresh);}});
      }
      return origStart(meta);
    };
  }

  /* Oyun bitince fizik/bot simülasyonunu kes; retry/lobby yeni run'da yeniden açar. */
  if(typeof Engine!=='undefined'&&!Engine.__finishGuard){
    Engine.__finishGuard=true;
    const origFinish=Engine.finish.bind(Engine);
    Engine.finish=function(win,score,coins,msg){
      const r=origFinish(win,score,coins,msg);
      if(this.finished){
        this.playerOn=false;this.inputLock=true;this.idle=true;this.mode='result';
        this.gameUpdate=null;this.onFallCb=null;Bots.clear();
      }
      return r;
    };
  }

  /* Bridge Race: 37 blok sınırı bitiş trigger'ından biraz önce kalıyordu. */
  if(typeof Engine!=='undefined'&&!Engine.__bridgeGuard){
    Engine.__bridgeGuard=true;
    const origTrigger=Engine.checkTriggers.bind(Engine);
    Engine.checkTriggers=function(){
      origTrigger();
      if(this.playerOn&&this.mode==='game'&&this.currentMeta&&this.currentMeta.id==='bridge'&&!this.finished&&this.player.pos.z<=-48){
        this.finish(true,320,30,'Bitişe ulaştın! 🏁');
      }
    };
  }

  /* Roblox benzeri ilk lobi dahil, her lobby build'inde dekorasyonu uygula. */
  if(typeof Engine!=='undefined'&&!Engine.__lobbyDecorPatched){
    Engine.__lobbyDecorPatched=true;
    const origLobby=Engine.buildLobby.bind(Engine);
    Engine.buildLobby=function(){
      origLobby();
      const addBox=(x,y,z,sx,sy,sz,c)=>{const m=new THREE.Mesh(this.GEO.box,this.MATB(c));m.position.set(x,y,z);m.scale.set(sx,sy,sz);W.mesh(m);};
      addBox(-14,0.12,-3,5.5,0.18,3.8,'#2f7df6');addBox(14,0.12,-3,5.5,0.18,3.8,'#8a5cf6');
      addBox(-14,0.12,8,5.5,0.18,3.8,'#2ed573');addBox(14,0.12,8,5.5,0.18,3.8,'#ff8f2a');
      const makeSign=(txt,x,z,color)=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:this.textTex(txt,color),transparent:true,depthWrite:false}));s.scale.set(4,0.9,1);s.position.set(x,2.6,z);W.mesh(s);};
      makeSign('🎮 50 OYUN',-14,-3,'#fff');makeSign('🛒 MARKET',14,-3,'#ffd32a');makeSign('🏆 EN İYİ',-14,8,'#ffd32a');makeSign('💬 SOHBET',14,8,'#fff');
      const title=new THREE.Sprite(new THREE.SpriteMaterial({map:this.textTex('BLOX HUB','#fff'),transparent:true,depthWrite:false}));title.scale.set(6,1.3,1);title.position.set(0,6,-1);W.mesh(title);
      const sub=new THREE.Sprite(new THREE.SpriteMaterial({map:this.textTex('50 MİNİ OYUN • BOTLAR • ÇEVRİMDIŞI','#ffd32a'),transparent:true,depthWrite:false}));sub.scale.set(5.5,0.6,1);sub.position.set(0,4.8,-1);W.mesh(sub);
    };
    if(Engine.mode==='lobby' && Engine.idle)Engine.idleLobby();
  }
  if(typeof HUD!=='undefined')HUD.coins();
})();
