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
        if(typeof fn==='function')fn(...args);
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

  /* Kamera sistemi tamamen yeniden bağlanıyor: sağ tarafta tek gesture yüzeyi,
     sağlam pointer lifecycle, hassas yaw/pitch, iki parmak zoom ve gerçek takip. */
  if(typeof Engine!=='undefined' && typeof THREE!=='undefined' && !Engine.__robustCameraFix){
    Engine.__robustCameraFix=true;
    let manualYaw=0;

    const oldZone=byId('cam-zone');
    if(oldZone){
      const zone=oldZone.cloneNode(false);
      oldZone.replaceWith(zone);

      const pointers=new Map();
      let lastPinch=0;
      let dragging=false;

      const clearPointers=()=>{
        pointers.clear();
        lastPinch=0;
        dragging=false;
      };

      zone.addEventListener('pointerdown',e=>{
        if(e.pointerType==='mouse' && e.button!==0)return;
        e.preventDefault();
        try{zone.setPointerCapture(e.pointerId);}catch(err){}
        pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
        dragging=true;
        if(pointers.size===1){
          manualYaw=Engine.camYaw;
        }else if(pointers.size===2){
          const p=[...pointers.values()];
          lastPinch=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);
        }
      },{passive:false});

      zone.addEventListener('pointermove',e=>{
        const prev=pointers.get(e.pointerId);
        if(!prev)return;
        e.preventDefault();
        const dx=e.clientX-prev.x;
        const dy=e.clientY-prev.y;
        pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});

        if(pointers.size===1){
          Engine.camYaw-=dx*0.006;
          Engine.camPitch=U.clamp(Engine.camPitch+dy*0.004,0.08,1.25);
          manualYaw=Engine.camYaw;
          if(Math.abs(dx)+Math.abs(dy)>0.5)Engine.camMode=2;
        }else if(pointers.size===2){
          const p=[...pointers.values()];
          const d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);
          if(lastPinch>0)Engine.camDist=U.clamp(Engine.camDist-(d-lastPinch)*0.025,3.5,22);
          lastPinch=d;
        }
      },{passive:false});

      const pointerEnd=e=>{
        pointers.delete(e.pointerId);
        if(pointers.size<2)lastPinch=0;
        if(pointers.size===0)dragging=false;
      };
      zone.addEventListener('pointerup',pointerEnd);
      zone.addEventListener('pointercancel',pointerEnd);
      zone.addEventListener('lostpointercapture',clearPointers);
      zone.addEventListener('wheel',e=>{
        e.preventDefault();
        Engine.camDist=U.clamp(Engine.camDist+e.deltaY*0.012,3.5,22);
      },{passive:false});

      Engine.updateCamera=function(dt){
        const P=this.player.pos;
        const speed=Math.hypot(this.player.vel.x,this.player.vel.z);

        if(this.camMode!==2){
          if(speed>0.8)this.followYaw=Math.atan2(this.player.vel.x,this.player.vel.z);
          const targetYaw=this.followYaw+Math.PI;
          this.camYaw=lerpAngle(this.camYaw,targetYaw,1-Math.exp(-4*dt));
        }

        const cp=Math.cos(this.camPitch);
        const sp=Math.sin(this.camPitch);
        const d=this.camDist;
        const target=new THREE.Vector3(
          P.x+Math.sin(this.camYaw)*cp*d,
          P.y+sp*d+1.2,
          P.z+Math.cos(this.camYaw)*cp*d
        );

        if(this.snapCam){
          this.camera.position.copy(target);
          this.snapCam=false;
        }else{
          this.camera.position.lerp(target,1-Math.exp(-10*dt));
        }

        if(this.shakeT>0){
          this.shakeT-=dt;
          const m=this.shakeM*Math.max(0,this.shakeT)*3;
          this.camera.position.x+=U.rand(-m,m);
          this.camera.position.y+=U.rand(-m,m);
        }
        this.camera.lookAt(P.x,P.y+1.2,P.z);
      };

      const oldStart=Engine.startGame.bind(Engine);
      Engine.startGame=function(meta){
        const r=oldStart(meta);
        manualYaw=this.camYaw;
        dragging=false;
        pointers.clear();
        lastPinch=0;
        return r;
      };
      const oldEnter=Engine.enterLobby.bind(Engine);
      Engine.enterLobby=function(){
        const r=oldEnter();
        manualYaw=this.camYaw;
        dragging=false;
        pointers.clear();
        lastPinch=0;
        return r;
      };
    }

    const camBtn=byId('btn-cam');
    if(camBtn){
      const fresh=camBtn.cloneNode(true);
      camBtn.replaceWith(fresh);
      fresh.addEventListener('click',()=>{
        Engine.camMode=(Engine.camMode+1)%3;
        if(Engine.camMode===0)Engine.camDist=9;
        else if(Engine.camMode===1)Engine.camDist=5;
        else Engine.camDist=9;
        manualYaw=Engine.camYaw;
        HUD.toast(['🎥 3. ŞAHIS TAKİP','🔍 YAKIN TAKİP','🕹️ SERBEST KAMERA'][Engine.camMode],1.2);
        Sfx.click();
      });
    }
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
