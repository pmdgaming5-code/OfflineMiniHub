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
    const chat=byId('chat-box');
    if(chat)chat.classList.toggle('hidden',id!=='screen-home'&&id!=='screen-games'&&id!=='screen-avatar'&&id!=='screen-shop'&&id!=='screen-how'&&id!=='screen-over');
    if(typeof updateTopbar==='function')updateTopbar();
  };

  function cleanButton(id,handler){
    const old=byId(id);if(!old)return null;
    const fresh=old.cloneNode(true);old.replaceWith(fresh);fresh.addEventListener('click',handler);return fresh;
  }

  /* Yeni HTML ID'lerini doğrudan bağla. Eski main.js listener'larını da temizle. */
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

  /* Kamera: tek alan + güvenli drag/pinch. Engine'in mevcut updateCamera'ını stabilize et. */
  const zone=byId('cam-zone');
  if(zone && !zone.__runtimeCameraBound){
    zone.__runtimeCameraBound=true;
    const pointers=new Map();let pinch=0;
    const end=e=>{pointers.delete(e.pointerId);if(pointers.size<2)pinch=0;};
    zone.addEventListener('pointerdown',e=>{if(e.button!==undefined&&e.button!==0&&e.pointerType==='mouse')return;try{zone.setPointerCapture(e.pointerId);}catch(err){}pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2){const a=[...pointers.values()];pinch=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);}});
    zone.addEventListener('pointermove',e=>{const p=pointers.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1){if(Engine.camMode!==2)Engine.camMode=2;Engine.camYaw-=dx*0.0045;Engine.camPitch=U.clamp(Engine.camPitch+dy*0.0035,0.12,1.18);}else{const a=[...pointers.values()];const d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(pinch)Engine.camDist=U.clamp(Engine.camDist-(d-pinch)*0.025,3.5,20);pinch=d;}});
    zone.addEventListener('pointerup',end);zone.addEventListener('pointercancel',end);zone.addEventListener('lostpointercapture',()=>{pointers.clear();pinch=0;});
  }
  if(typeof Engine!=='undefined'&&!Engine.__runtimeCameraPatched){
    Engine.__runtimeCameraPatched=true;
    Engine.updateCamera=function(dt){
      const P=this.player.pos;
      if(this.camMode!==2){
        const hs=Math.hypot(this.player.vel.x,this.player.vel.z);
        if(hs>0.8)this.followYaw=Math.atan2(this.player.vel.x,this.player.vel.z);
        this.camYaw=lerpAngle(this.camYaw,this.followYaw+Math.PI,1-Math.exp(-5.5*dt));
      }
      const cp=Math.cos(this.camPitch),sp=Math.sin(this.camPitch),d=this.camDist;
      const target=new THREE.Vector3(P.x+Math.sin(this.camYaw)*cp*d,P.y+1.2+sp*d,P.z+Math.cos(this.camYaw)*cp*d);
      if(this.snapCam){this.camera.position.copy(target);this.snapCam=false;}else this.camera.position.lerp(target,1-Math.exp(-10*dt));
      if(this.shakeT>0){this.shakeT-=dt;const m=this.shakeM*Math.max(0,this.shakeT)*2.5;this.camera.position.x+=U.rand(-m,m);this.camera.position.y+=U.rand(-m,m);}
      this.camera.lookAt(P.x,P.y+1.2,P.z);
      return null;
    };
  }
  const camBtn=byId('btn-cam');
  if(camBtn&&!camBtn.__runtimeBound){
    camBtn.__runtimeBound=true;
    camBtn.addEventListener('click',()=>{
      Engine.camMode=(Engine.camMode+1)%3;
      if(Engine.camMode===0)Engine.camDist=9;
      else if(Engine.camMode===1)Engine.camDist=5;
      if(Engine.camMode!==2)Engine.snapCam=true;
      HUD.toast(['🎥 TAKİP','🔍 YAKIN','🕹️ SERBEST'][Engine.camMode],1.1);Sfx.click();
    });
  }

  /* Clicker: aynı DOM düğümüne tekrar tekrar listener eklenmesini önle. */
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
      if(this.finished){this.playerOn=false;this.inputLock=true;this.idle=true;this.mode='result';this.gameUpdate=null;this.onFallCb=null;Bots.clear();}
      return r;
    };
  }

  /* Bridge Race: mevcut 37 blok sınırının bitişten önce kalmasını telafi et. */
  if(typeof Engine!=='undefined'&&!Engine.__bridgeGuard){
    Engine.__bridgeGuard=true;
    const origTrigger=Engine.checkTriggers.bind(Engine);
    Engine.checkTriggers=function(){
      origTrigger();
      if(this.playerOn&&this.mode==='game'&&this.currentMeta&&this.currentMeta.id==='bridge'&&!this.finished&&this.player.pos.z<=-48){
        const p=Math.max(1,Math.min(3,1+Math.floor(Math.max(0,-this.player.pos.z-48))));
        this.finish(true,400-p*80,30+(3-p)*8,'Bitişe ulaştın! Süre: '+this.time.toFixed(1)+' sn');
      }
    };
  }

  /* Daha Roblox benzeri lobi dekorasyonu. Sadece görsel meshler eklenir. */
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
  }

  /* Lobby'deki alışveriş/arka dönüş ekran durumunu temizle. */
  if(typeof HUD!=='undefined')HUD.coins();
})();
