/* ============================================================
   engine.js — Motor: Roblox tarzı grafikler, fizik, giriş,
   kamera, HUD, FX, BOTLAR + kozmetik/market entegrasyonu
   + BOT SOHBET SİSTEMİ
   ============================================================ */
'use strict';

const GRAV = -30;
const HX = 0.45, HY = 0.95, HZ = 0.45;

function lerpAngle(a,b,t){
  let d=(b-a)%(Math.PI*2);
  if(d>Math.PI)d-=Math.PI*2;
  if(d<-Math.PI)d+=Math.PI*2;
  return a+d*t;
}

const keys = {};
const Input = {
  jx:0, jf:0, btnJump:false, btnAct:false,
  jumpBuf:0, actionBuf:0, _pj:false, _pa:false,
  update(dt){
    this.jumpBuf = Math.max(0, this.jumpBuf - dt);
    this.actionBuf = Math.max(0, this.actionBuf - dt);
    const jh = this.btnJump || !!keys['Space'];
    if(jh && !this._pj) this.jumpBuf = 0.18;
    this._pj = jh;
    const ah = this.btnAct || !!keys['KeyE'] || !!keys['Enter'];
    if(ah && !this._pa) this.actionBuf = 0.22;
    this._pa = ah;
  },
  axis(){
    let x = ((keys['KeyD']||keys['ArrowRight'])?1:0) - ((keys['KeyA']||keys['ArrowLeft'])?1:0) + this.jx;
    let f = ((keys['KeyW']||keys['ArrowUp'])?1:0)    - ((keys['KeyS']||keys['ArrowDown'])?1:0) + this.jf;
    const l = Math.hypot(x,f);
    if(l>1){ x/=l; f/=l; }
    return {x:x, f:f};
  }
};

function bindInput(){
  const block = ['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
  window.addEventListener('keydown', e=>{
    if(block.indexOf(e.code)>=0) e.preventDefault();
    keys[e.code]=true;
  });
  window.addEventListener('keyup', e=>{ keys[e.code]=false; });

  const zone=$('joy-zone'), base=$('joy-base'), thumb=$('joy-thumb');
  let joyId=null; const R=52;
  function joyMove(e){
    const r=base.getBoundingClientRect();
    const cx=r.left+r.width/2, cy=r.top+r.height/2;
    let dx=e.clientX-cx, dy=e.clientY-cy;
    const l=Math.hypot(dx,dy);
    if(l>0.001){ const cl=Math.min(l,R); dx=dx/l*cl; dy=dy/l*cl; }
    thumb.style.transform='translate('+dx+'px,'+dy+'px)';
    Input.jx=dx/R; Input.jf=-dy/R;
  }
  zone.addEventListener('pointerdown', e=>{
    e.preventDefault(); joyId=e.pointerId;
    try{ zone.setPointerCapture(e.pointerId); }catch(err){}
    zone.classList.add('on'); joyMove(e);
  });
  zone.addEventListener('pointermove', e=>{ if(e.pointerId===joyId) joyMove(e); });
  const joyEnd=e=>{
    if(e.pointerId!==joyId) return;
    joyId=null; Input.jx=0; Input.jf=0;
    thumb.style.transform='translate(0,0)'; zone.classList.remove('on');
  };
  zone.addEventListener('pointerup', joyEnd);
  zone.addEventListener('pointercancel', joyEnd);

  function holdBtn(el, down, up){
    el.addEventListener('pointerdown', e=>{ e.preventDefault();
      try{ el.setPointerCapture(e.pointerId); }catch(err){} down(); });
    ['pointerup','pointercancel','pointerleave'].forEach(ev=>
      el.addEventListener(ev, e=>{ e.preventDefault(); up(); }));
  }
  holdBtn($('btn-jump'), ()=>{ Input.btnJump=true; Input.jumpBuf=0.18; }, ()=>{ Input.btnJump=false; });
  holdBtn($('btn-act'),  ()=>{ Input.btnAct=true;  Input.actionBuf=0.22;}, ()=>{ Input.btnAct=false; });

  document.addEventListener('contextmenu', e=>e.preventDefault());
  document.addEventListener('visibilitychange', ()=>{ Engine._last=0; });
  bindCamera();
}

function bindCamera(){
  const zone=$('cam-zone');
  const pointers=new Map();
  let lastPinch=0;
  zone.addEventListener('pointerdown', e=>{
    try{ zone.setPointerCapture(e.pointerId); }catch(err){}
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pointers.size===2){
      const p=[...pointers.values()];
      lastPinch=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);
    }
  });
  zone.addEventListener('pointermove', e=>{
    if(!pointers.has(e.pointerId)) return;
    const prev=pointers.get(e.pointerId);
    const dx=e.clientX-prev.x, dy=e.clientY-prev.y;
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pointers.size===1){
      if(Engine.camMode!==2) Engine.camMode=2;
      Engine.camYaw -= dx*0.005;
      Engine.camPitch = U.clamp(Engine.camPitch + dy*0.004, 0.05, 1.25);
    } else if(pointers.size===2){
      const p=[...pointers.values()];
      const d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);
      Engine.camDist = U.clamp(Engine.camDist - (d-lastPinch)*0.03, 3, 22);
      lastPinch=d;
    }
  });
  const up=e=>{ pointers.delete(e.pointerId); };
  zone.addEventListener('pointerup', up);
  zone.addEventListener('pointercancel', up);
  zone.addEventListener('wheel', e=>{
    e.preventDefault();
    Engine.camDist = U.clamp(Engine.camDist + e.deltaY*0.01, 3, 22);
  }, {passive:false});
  $('btn-cam').addEventListener('click', ()=>{
    Engine.camMode = (Engine.camMode + 1) % 3;
    const names = ['🎥 3. ŞAHIS TAKİP','🔍 YAKIN TAKİP','🕹️ SERBEST KAMERA'];
    if(Engine.camMode===0) Engine.camDist=9;
    if(Engine.camMode===1) Engine.camDist=5;
    if(Engine.camMode!==2){
      const P=Engine.player;
      const hs=Math.hypot(P.vel.x,P.vel.z);
      Engine.camYaw = (hs>0.5 ? Math.atan2(P.vel.x,P.vel.z) : Engine.camYaw-Math.PI) + Math.PI;
    }
    HUD.toast(names[Engine.camMode], 1.2);
    Sfx.click();
  });
}

/* ============================================================
   BOT SOHBET SİSTEMİ
   ============================================================ */
const BotChat = {
  messages: {
    lobby: [
      'Merhaba! 👋','Bu lobi harika! 🏝️','Kim benimle oynar? 🎮',
      'Coin topluyorum! 🪙','Marketten eşya aldım! 💎','Hadi yarışalım! 🏃',
      'Portalları deneyelim! 🌀','Bu oyun çok eğlenceli! 🎉'
    ],
    game: [
      'Dikkat et! ⚠️','Zıpla! ⤴','Hızlı ol! 💨','Beni takip et! 👉',
      'Vay canına! 😮','Harika! 🌟','Neredeyse bitirdim! 🏁','Çok yakın! 😅',
      'Bir daha deneyelim! 🔄','Süper! 🔥','Altın buldum! 💰','Kaç! 🏃‍♂️'
    ],
    win: [
      'Tebrikler! 🎉','Helal olsun! 👏','Şampiyon! 🏆','İnanılmaz! 🤩'
    ],
    lose: [
      'Bir daha dene! 💪','Olsun, olur! 😊','Pes etme! 🌟','Tekrar! 🔄'
    ]
  },
  activeBubbles: [],
  sayRandom(bot, category){
    category = category || 'lobby';
    const msgs = this.messages[category] || this.messages.lobby;
    const msg = U.choice(msgs);
    this.showBubble(bot, msg);
  },
  showBubble(bot, msg){
    if(!bot || !bot.grp || !bot.grp.parent) return;
    
    // Eski balonları temizle (max 5)
    if(this.activeBubbles.length >= 5){
      const old = this.activeBubbles.shift();
      if(old.sprite && old.sprite.parent) old.sprite.parent.remove(old.sprite);
      if(old.tex) old.tex.dispose();
    }
    
    const cv=document.createElement('canvas');
    cv.width=256; cv.height=80;
    const g=cv.getContext('2d');
    
    // Balon arka planı
    g.fillStyle='rgba(255,255,255,0.95)';
    g.beginPath();
    g.moveTo(12,0);
    g.lineTo(244,0);
    g.quadraticCurveTo(256,0,256,12);
    g.lineTo(256,58);
    g.quadraticCurveTo(256,70,244,70);
    g.lineTo(140,70);
    g.lineTo(128,80);
    g.lineTo(116,70);
    g.lineTo(12,70);
    g.quadraticCurveTo(0,70,0,58);
    g.lineTo(0,12);
    g.quadraticCurveTo(0,0,12,0);
    g.fill();
    
    // Kenarlık
    g.strokeStyle='#10131f';
    g.lineWidth=3;
    g.stroke();
    
    // Metin
    g.fillStyle='#10131f';
    g.font='bold 22px Arial, sans-serif';
    g.textAlign='center';
    g.textBaseline='middle';
    
    // Uzun metni kısalt
    let displayMsg = msg;
    if(g.measureText(msg).width > 230){
      while(g.measureText(displayMsg+'...').width > 230 && displayMsg.length > 0){
        displayMsg = displayMsg.slice(0,-1);
      }
      displayMsg += '...';
    }
    g.fillText(displayMsg, 128, 35);
    
    const tex=new THREE.CanvasTexture(cv);
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({
      map:tex, transparent:true, depthWrite:false
    }));
    sprite.scale.set(2.2, 0.7, 1);
    sprite.renderOrder = 999;
    
    // Botun üstüne ekle
    bot.grp.add(sprite);
    sprite.position.set(0, 2.6, 0);
    
    this.activeBubbles.push({sprite: sprite, tex: tex, bot: bot, startTime: Engine.time});
    
    // 3.5 saniye sonra kaldır
    const self = this;
    setTimeout(()=>{
      self.removeBubble(sprite, tex);
    }, 3500);
  },
  removeBubble(sprite, tex){
    if(sprite && sprite.parent) sprite.parent.remove(sprite);
    if(tex) tex.dispose();
    const idx = this.activeBubbles.findIndex(b=>b.sprite===sprite);
    if(idx>=0) this.activeBubbles.splice(idx,1);
  },
  clearAll(){
    this.activeBubbles.forEach(b=>{
      if(b.sprite && b.sprite.parent) b.sprite.parent.remove(b.sprite);
      if(b.tex) b.tex.dispose();
    });
    this.activeBubbles.length=0;
  }
};

const FX = {
  parts:[], floats:[], customs:[],
  burst(x,y,z,color,n,spd,life){
    n=n||14; spd=spd||6; life=life||0.7;
    for(let i=0;i<n;i++){
      if(this.parts.length>220) return;
      const m=new THREE.Mesh(Engine.GEO.bit, Engine.MATB(color));
      m.position.set(x,y,z); Engine.scene.add(m);
      this.parts.push({m:m,
        vx:(Math.random()-0.5)*spd, vy:Math.random()*spd*0.7+2, vz:(Math.random()-0.5)*spd,
        life:life, tl:0});
    }
  },
  confetti(x,y,z){
    const cols=['#ff4d5e','#ffd32a','#3ecf5a','#2f7df6','#8a5cf6'];
    for(let i=0;i<5;i++) this.burst(x,y,z,cols[i],10,8,1.1);
  },
  floatText(x,y,z,text,color){
    const cv=document.createElement('canvas'); cv.width=256; cv.height=96;
    const g=cv.getContext('2d');
    g.font='bold 52px Nunito, Arial Black'; g.textAlign='center'; g.textBaseline='middle';
    g.lineWidth=10; g.strokeStyle='#10131f'; g.strokeText(text,128,48);
    g.fillStyle=color||'#fff'; g.fillText(text,128,48);
    const t=new THREE.CanvasTexture(cv);
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false}));
    sp.scale.set(2.4,0.9,1); sp.position.set(x,y,z);
    Engine.scene.add(sp);
    this.floats.push({m:sp,tl:0,life:1});
  },
  ring(x,y,z,color){
    const m=new THREE.Mesh(new THREE.RingGeometry(0.5,0.68,26),
      new THREE.MeshBasicMaterial({color:color,transparent:true,opacity:0.9,side:THREE.DoubleSide,depthWrite:false}));
    m.rotation.x=-Math.PI/2; m.position.set(x,y,z);
    Engine.scene.add(m);
    this.customs.push({m:m,tl:0,life:0.5,fn:(mm,e,l)=>{
      const k=1+e*16; mm.scale.set(k,k,k); mm.material.opacity=0.9*(1-e/l);
    }});
  },
  spawn(mesh,life,fn){ this.customs.push({m:mesh,tl:0,life:life,fn:fn}); },
  update(dt){
    for(let i=this.parts.length-1;i>=0;i--){
      const p=this.parts[i]; p.tl+=dt;
      if(p.tl>=p.life){ Engine.scene.remove(p.m); this.parts.splice(i,1); continue; }
      p.vy-=22*dt; p.m.position.x+=p.vx*dt; p.m.position.y+=p.vy*dt; p.m.position.z+=p.vz*dt;
      p.m.scale.setScalar(Math.max(0.01, 1-p.tl/p.life));
    }
    for(let i=this.floats.length-1;i>=0;i--){
      const f=this.floats[i]; f.tl+=dt;
      if(f.tl>=f.life){ Engine.scene.remove(f.m); f.m.material.map.dispose(); f.m.material.dispose(); this.floats.splice(i,1); continue; }
      f.m.position.y+=1.3*dt; f.m.material.opacity=1-f.tl/f.life;
    }
    for(let i=this.customs.length-1;i>=0;i--){
      const c=this.customs[i]; c.tl+=dt;
      if(c.tl>=c.life){ Engine.scene.remove(c.m); this.customs.splice(i,1); continue; }
      if(c.fn) c.fn(c.m,c.tl,c.life);
    }
  },
  clear(){
    const kill=a=>{ a.forEach(o=>Engine.scene.remove(o.m)); a.length=0; };
    kill(this.parts); kill(this.floats); kill(this.customs);
  }
};

const HUD = {
  toastT:null, bigT:null,
  show(v){ $('hud').classList.toggle('hidden',!v); },
  lobby(){
    $('hud-title').textContent='🏝️ LOBİ';
    document.querySelectorAll('.lobby-only').forEach(b=>b.style.display='');
    $('hud-hearts').classList.add('hidden'); $('hud-stat').classList.add('hidden');
    HUD.boss(null);
  },
  game(m){
    $('hud-title').textContent=m.emoji+' '+m.name;
    document.querySelectorAll('.lobby-only').forEach(b=>b.style.display='none');
    $('hud-hearts').classList.add('hidden'); $('hud-stat').classList.add('hidden');
    HUD.boss(null);
  },
  hearts(n,max){
    const el=$('hud-hearts'); el.classList.remove('hidden');
    let s=''; for(let i=0;i<max;i++) s+= i<n ? '❤️' : '🖤';
    el.textContent=s;
  },
  stat(t){
    const el=$('hud-stat');
    if(t){ el.textContent=t; el.classList.remove('hidden'); }
    else el.classList.add('hidden');
  },
  coins(){
    const c='🪙 '+Store.data.coins;
    ['hud-coins','m-coins','c-coins','g-coins','s-coins'].forEach(id=>{ const el=$(id); if(el) el.textContent=c; });
  },
  toast(t,d){
    d=d||1.5; const el=$('toast'); el.textContent=t; el.classList.add('show');
    clearTimeout(this.toastT); this.toastT=setTimeout(()=>el.classList.remove('show'), d*1000);
  },
  big(t,color,d){
    d=d||1.2; const el=$('bigprompt');
    el.textContent=t; el.style.background=color||'#2f7df6';
    el.classList.remove('hidden');
    el.style.animation='none'; void el.offsetWidth; el.style.animation='';
    clearTimeout(this.bigT); this.bigT=setTimeout(()=>el.classList.add('hidden'), d*1000);
  },
  interact(t){
    const el=$('interact');
    if(t){ el.textContent='✋ '+t; el.classList.remove('hidden'); }
    else el.classList.add('hidden');
  },
  setControls(v){ $('controls').classList.toggle('hidden',!v); },
  boss(r){
    const el=$('bossbar');
    if(r==null){ el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    $('bossfill').style.width=Math.max(0,r*100)+'%';
  }
};

const W = {
  killY:-30,
  env(top,near,far,horizon,withSun){
    horizon=horizon||top;
    Engine.scene.background=new THREE.Color(horizon);
    Engine.scene.fog=new THREE.Fog(new THREE.Color(horizon), near, far);
    // FIX: Set clear color to match horizon to prevent black flash
    Engine.renderer.setClearColor(new THREE.Color(horizon));
    Engine.buildSkyDome(top,horizon);
    if(withSun) Engine.buildSun();
  },
  box(x,y,z,w,h,d,color,o){
    o=o||{};
    let mat;
    if(o.trigger||o.noStud) mat=Engine.MAT(color);
    else mat=Engine.MATSTUD(color,w,d);
    const m=new THREE.Mesh(Engine.GEO.box, mat);
    m.scale.set(w,h,d); m.position.set(x,y,z);
    if(o.trigger) m.visible=false;
    Engine.scene.add(m); Engine.items.push(m);
    const c={x:x,y:y,z:z,hx:w/2,hy:h/2,hz:d/2,mesh:m,
      trigger:!!o.trigger, disabled:false, tag:o.tag||null, cb:o.cb||null, onLand:null};
    Engine.colliders.push(c);
    return c;
  },
  mover(x,y,z,w,h,d,color,o){
    const c=this.box(x,y,z,w,h,d,color,o);
    c.base={x:x,y:y,z:z};
    c.axis=o.axis||'x'; c.amp=o.amp||2; c.speed=o.speed||1; c.phase=o.phase||0;
    Engine.movers.push(c);
    return c;
  },
  mesh(m){ Engine.scene.add(m); Engine.items.push(m); return m; },
  removeC(c){
    if(!c) return;
    c.disabled=true;
    if(c.mesh) Engine.scene.remove(c.mesh);
    let i=Engine.colliders.indexOf(c); if(i>=0) Engine.colliders.splice(i,1);
    i=Engine.movers.indexOf(c); if(i>=0) Engine.movers.splice(i,1);
  },
  clear(){
    Engine.runCleanups();
    BotChat.clearAll();
    Bots.clear();
    Engine.colliders.length=0; Engine.movers.length=0; Engine.interact.length=0;
    Engine.items.forEach(o=>Engine.scene.remove(o)); Engine.items.length=0;
    FX.clear();
    Engine.clearTrail();
    Engine.clearPet();
    this.killY=-30;
    Engine.setTool(null);
  }
};

const Engine = {
  mode:'boot', idle:true, playerOn:false,
  runId:0, finished:false, noMove:false, inputLock:true,
  time:0, shakeT:0, shakeM:0, punch:0, walkT:0,
  gameUpdate:null, onFallCb:null, cleanupFns:[], currentMeta:null,
  colliders:[], movers:[], items:[], interact:[],
  spawnPt:{x:0,y:HY,z:0},
  GEO:null, _matC:null, _matB:null, _studTex:null, _studMat:null,
  trailType:null, trailT:0, trailPs:[],
  fxHalo:null, fxAura:null, toolObj:null, _tool:null,
  pet:null,
  camYaw:0, camPitch:0.35, camDist:9, camMode:0, followYaw:0,
  botChatTimer:3,

  MAT(c){ if(!this._matC[c]) this._matC[c]=new THREE.MeshLambertMaterial({color:c}); return this._matC[c]; },
  MATB(c){ if(!this._matB[c]) this._matB[c]=new THREE.MeshBasicMaterial({color:c}); return this._matB[c]; },

  studTex(n){
    if(this._studTex[n]) return this._studTex[n];
    const cv=document.createElement('canvas'); cv.width=cv.height=128;
    const g=cv.getContext('2d');
    g.fillStyle='#ffffff'; g.fillRect(0,0,128,128);
    const cell=128/n;
    for(let ix=0;ix<n;ix++)for(let iy=0;iy<n;iy++){
      const cx=ix*cell+cell/2, cy=iy*cell+cell/2, r=cell*0.33;
      g.beginPath(); g.arc(cx,cy,r,0,Math.PI*2);
      g.fillStyle='#f4f4f4'; g.fill();
      g.lineWidth=Math.max(2,cell*0.09);
      g.strokeStyle='rgba(0,0,0,0.20)'; g.stroke();
      g.beginPath(); g.arc(cx-r*0.25,cy-r*0.25,r*0.45,0,Math.PI*2);
      g.fillStyle='rgba(255,255,255,0.65)'; g.fill();
    }
    const t=new THREE.CanvasTexture(cv);
    this._studTex[n]=t; return t;
  },
  MATSTUD(color,w,d){
    const n=U.clamp(Math.round(Math.max(w,d)/1.4),2,14);
    const key=color+'_'+n;
    if(this._studMat[key]) return this._studMat[key];
    const side=this.MAT(color);
    const top=new THREE.MeshLambertMaterial({color:color,map:this.studTex(n)});
    const arr=[side,side,top,side,side,side];
    this._studMat[key]=arr; return arr;
  },

  buildSkyDome(top,horizon){
    const cv=document.createElement('canvas'); cv.width=16; cv.height=256;
    const g=cv.getContext('2d');
    const gr=g.createLinearGradient(0,0,0,256);
    gr.addColorStop(0,top); gr.addColorStop(0.55,horizon); gr.addColorStop(1,horizon);
    g.fillStyle=gr; g.fillRect(0,0,16,256);
    const tex=new THREE.CanvasTexture(cv);
    const m=new THREE.Mesh(new THREE.SphereGeometry(150,16,12),
      new THREE.MeshBasicMaterial({map:tex,side:THREE.BackSide,fog:false,depthWrite:false}));
    m.renderOrder=-1;
    W.mesh(m);
  },
  buildSun(){
    if(!this._sunTex){
      const cv=document.createElement('canvas'); cv.width=cv.height=128;
      const g=cv.getContext('2d');
      const gr=g.createRadialGradient(64,64,6,64,64,64);
      gr.addColorStop(0,'rgba(255,255,230,1)');
      gr.addColorStop(0.35,'rgba(255,240,170,0.9)');
      gr.addColorStop(1,'rgba(255,240,170,0)');
      g.fillStyle=gr; g.fillRect(0,0,128,128);
      this._sunTex=new THREE.CanvasTexture(cv);
    }
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:this._sunTex,fog:false,depthWrite:false,transparent:true}));
    sp.scale.set(46,46,1); sp.position.set(70,95,-90);
    W.mesh(sp);
  },

  _faceCache:{},
  faceTex(skin){
    if(this._faceCache[skin]) return this._faceCache[skin];
    const cv=document.createElement('canvas'); cv.width=cv.height=64;
    const g=cv.getContext('2d');
    g.fillStyle=skin; g.fillRect(0,0,64,64);
    g.fillStyle='#10131f';
    g.fillRect(15,20,8,13); g.fillRect(41,20,8,13);
    g.lineWidth=4; g.strokeStyle='#10131f';
    g.beginPath(); g.arc(32,42,11,0.25*Math.PI,0.75*Math.PI); g.stroke();
    const t=new THREE.CanvasTexture(cv); this._faceCache[skin]=t; return t;
  },
  textTex(t,fill){
    fill=fill||'#ffffff';
    const cv=document.createElement('canvas'); const g=cv.getContext('2d');
    g.font='bold 44px Nunito, Arial Black';
    const w=Math.ceil(g.measureText(t).width)+28;
    cv.width=w; cv.height=64;
    const g2=cv.getContext('2d');
    g2.font='bold 44px Nunito, Arial Black'; g2.textAlign='center'; g2.textBaseline='middle';
    g2.lineWidth=8; g2.strokeStyle='#10131f'; g2.strokeText(t,w/2,34);
    g2.fillStyle=fill; g2.fillText(t,w/2,34);
    return new THREE.CanvasTexture(cv);
  },
  emojiTex(ch){
    const cv=document.createElement('canvas'); cv.width=cv.height=128;
    const g=cv.getContext('2d');
    g.font='100px serif'; g.textAlign='center'; g.textBaseline='middle';
    g.fillText(ch,64,70);
    return new THREE.CanvasTexture(cv);
  },

  makeAvatar(g,c){
    const skin=this.MAT(c.skin), shirt=this.MAT(c.shirt), pants=this.MAT(c.pants);
    const mk=(sx,sy,sz,m,x,y,z)=>{
      const q=new THREE.Mesh(this.GEO.box,m);
      q.scale.set(sx,sy,sz); q.position.set(x,y,z); g.add(q); return q;
    };
    const legL=new THREE.Group(); legL.position.set(-0.22,0.75,0);
    const lm1=new THREE.Mesh(this.GEO.box,pants); lm1.scale.set(0.4,0.75,0.4); lm1.position.y=-0.375; legL.add(lm1); g.add(legL);
    const legR=new THREE.Group(); legR.position.set(0.22,0.75,0);
    const lm2=new THREE.Mesh(this.GEO.box,pants); lm2.scale.set(0.4,0.75,0.4); lm2.position.y=-0.375; legR.add(lm2); g.add(legR);
    mk(0.9,0.65,0.45,shirt,0,1.075,0);
    const armL=new THREE.Group(); armL.position.set(-0.61,1.38,0);
    const am1=new THREE.Mesh(this.GEO.box,skin); am1.scale.set(0.3,0.6,0.34); am1.position.y=-0.3; armL.add(am1); g.add(armL);
    const armR=new THREE.Group(); armR.position.set(0.61,1.38,0);
    const am2=new THREE.Mesh(this.GEO.box,skin); am2.scale.set(0.3,0.6,0.34); am2.position.y=-0.3; armR.add(am2); g.add(armR);
    const faceM=new THREE.MeshLambertMaterial({map:this.faceTex(c.skin)});
    const head=new THREE.Mesh(this.GEO.box,[skin,skin,skin,skin,faceM,skin]);
    head.scale.set(0.55,0.5,0.5); head.position.set(0,1.66,0); g.add(head);
    return {legL:legL,legR:legR,armL:armL,armR:armR};
  },

  applyCosmetics(g){
    this.fxHalo=null;
    this.fxAura=null;
    const eq=Store.data.equip||{};
    if(eq.hat==='crown'){
      const gold=this.MAT('#ffd700');
      const base=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.34,0.16,10),gold);
      base.position.y=1.99; g.add(base);
      for(let i=0;i<5;i++){
        const sp=new THREE.Mesh(new THREE.ConeGeometry(0.07,0.2,6),gold);
        const a=i/5*Math.PI*2;
        sp.position.set(Math.cos(a)*0.24,2.15,Math.sin(a)*0.24); g.add(sp);
      }
    } else if(eq.hat==='tophat'){
      const blk=this.MAT('#15181d');
      const brim=new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,0.06,14),blk);
      brim.position.y=1.95; g.add(brim);
      const top=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.3,0.5,14),blk);
      top.position.y=2.22; g.add(top);
      const band=new THREE.Mesh(new THREE.CylinderGeometry(0.31,0.31,0.1,14),this.MAT('#c0392b'));
      band.position.y=2.02; g.add(band);
    } else if(eq.hat==='halo'){
      const halo=new THREE.Mesh(new THREE.TorusGeometry(0.34,0.06,8,20),this.MATB('#ffd32a'));
      halo.rotation.x=Math.PI/2; halo.position.y=2.5; g.add(halo);
      this.fxHalo=halo;
    } else if(eq.hat==='viking'){
      const sil=this.MAT('#cfd8dc');
      const helm=new THREE.Mesh(new THREE.CylinderGeometry(0.32,0.36,0.3,10),sil);
      helm.position.y=2.0; g.add(helm);
      [[-1],[1]].forEach(s=>{
        const horn=new THREE.Mesh(new THREE.ConeGeometry(0.09,0.4,7),this.MAT('#efebe0'));
        horn.position.set(s[0]*0.36,2.15,0); horn.rotation.z=s[0]*-0.7; g.add(horn);
      });
    } else if(eq.hat==='wizard'){
      const pur=this.MAT('#7b2fbe');
      const brim=new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.55,0.05,14),pur);
      brim.position.y=1.94; g.add(brim);
      const cone=new THREE.Mesh(new THREE.ConeGeometry(0.32,0.7,12),pur);
      cone.position.y=2.3; g.add(cone);
      const star=new THREE.Mesh(this.GEO.box,this.MATB('#ffd32a'));
      star.scale.setScalar(0.12); star.position.set(0,2.2,0.3); g.add(star);
    } else if(eq.hat==='cap'){
      const red=this.MAT('#e53935');
      const dome=new THREE.Mesh(new THREE.SphereGeometry(0.32,10,8,0,Math.PI*2,0,Math.PI/2),red);
      dome.position.y=1.93; g.add(dome);
      const brim=new THREE.Mesh(this.GEO.box,red);
      brim.scale.set(0.5,0.06,0.35); brim.position.set(0,1.94,0.4); g.add(brim);
    } else if(eq.hat==='demon'){
      [[-1],[1]].forEach(s=>{
        const horn=new THREE.Mesh(new THREE.ConeGeometry(0.09,0.45,7),this.MAT('#d32f2f'));
        horn.position.set(s[0]*0.24,2.12,0); horn.rotation.z=s[0]*-0.35; g.add(horn);
      });
    }
    if(eq.face==='glasses'){
      const gl=new THREE.Mesh(this.GEO.box,this.MAT('#15181d'));
      gl.scale.set(0.52,0.16,0.06); gl.position.set(0,1.72,0.27); g.add(gl);
    } else if(eq.face==='visor'){
      const v=new THREE.Mesh(this.GEO.box,this.MATB('#00e5ff'));
      v.scale.set(0.55,0.14,0.06); v.position.set(0,1.72,0.28); g.add(v);
    } else if(eq.face==='mask_ninja'){
      const m=new THREE.Mesh(this.GEO.box,this.MAT('#23272e'));
      m.scale.set(0.57,0.2,0.06); m.position.set(0,1.62,0.28); g.add(m);
    }
    if(eq.back==='wings'){
      const wm=this.MAT('#f8bbd0');
      [[-1,1],[1,-1]].forEach(s=>{
        const w=new THREE.Mesh(this.GEO.box,wm);
        w.scale.set(0.5,0.85,0.08);
        w.position.set(s[0]*0.58,1.3,-0.3);
        w.rotation.y=s[0]*0.55; w.rotation.z=s[0]*-0.18;
        g.add(w);
      });
    } else if(eq.back==='dragon_wings'){
      const wm=this.MAT('#b71c1c');
      [[-1,1],[1,-1]].forEach(s=>{
        const w=new THREE.Mesh(this.GEO.box,wm);
        w.scale.set(0.7,1.1,0.08);
        w.position.set(s[0]*0.68,1.35,-0.32);
        w.rotation.y=s[0]*0.5; w.rotation.z=s[0]*-0.25;
        g.add(w);
      });
    } else if(eq.back==='jetpack'){
      const gm=this.MAT('#90a4ae');
      [[-1],[1]].forEach(s=>{
        const t=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.16,0.7,8),gm);
        t.position.set(s[0]*0.28,1.15,-0.4); g.add(t);
        const f=new THREE.Mesh(new THREE.ConeGeometry(0.12,0.2,8),this.MATB('#ff7043'));
        f.rotation.x=Math.PI; f.position.set(s[0]*0.28,0.75,-0.4); g.add(f);
      });
    } else if(eq.back==='cape'){
      const c=new THREE.Mesh(this.GEO.box,this.MAT('#d32f2f'));
      c.scale.set(0.8,1.1,0.06);
      c.position.set(0,1.1,-0.3); c.rotation.x=0.1; g.add(c);
    }
    if(eq.aura==='aura_gold'){
      const r=new THREE.Mesh(new THREE.TorusGeometry(0.9,0.05,8,24),this.MATB('#ffd32a'));
      r.rotation.x=Math.PI/2; r.position.y=0.15; g.add(r); this.fxAura=r;
    } else if(eq.aura==='aura_rainbow'){
      const r=new THREE.Mesh(new THREE.TorusGeometry(0.9,0.05,8,24),this.MATB('#ff4da6'));
      r.rotation.x=Math.PI/2; r.position.y=0.15; g.add(r); this.fxAura=r;
    }
    this.trailType=eq.trail||null;
  },

  buildPet(id){
    const g=new THREE.Group();
    const add=(sx,sy,sz,m,x,y,z)=>{
      const q=new THREE.Mesh(this.GEO.box,m);
      q.scale.set(sx,sy,sz); q.position.set(x,y,z); g.add(q); return q;
    };
    if(id==='pet_dog'){
      const br=this.MAT('#8d6e63');
      add(0.7,0.45,1.0,br,0,0.35,0);
      add(0.5,0.45,0.5,br,0,0.6,0.6);
      add(0.12,0.3,0.12,br,-0.2,0.5,0.85); add(0.12,0.3,0.12,br,0.2,0.5,0.85);
      add(0.15,0.3,0.15,br,-0.2,0.12,0.3); add(0.15,0.3,0.15,br,0.2,0.12,0.3);
      add(0.15,0.15,0.15,br,-0.18,0.12,-0.3); add(0.15,0.15,0.15,br,0.18,0.12,-0.3);
      add(0.12,0.3,0.12,br,0,0.75,0.45);
    } else if(id==='pet_cat'){
      const gy=this.MAT('#bdbdbd');
      add(0.55,0.4,0.9,gy,0,0.32,0);
      add(0.45,0.4,0.45,gy,0,0.55,0.55);
      add(0.12,0.2,0.1,gy,-0.15,0.8,0.55); add(0.12,0.2,0.1,gy,0.15,0.8,0.55);
      add(0.12,0.25,0.12,gy,-0.15,0.1,0.25); add(0.12,0.25,0.12,gy,0.15,0.1,0.25);
      add(0.12,0.25,0.12,gy,-0.15,0.1,-0.25); add(0.12,0.25,0.12,gy,0.15,0.1,-0.25);
      add(0.1,0.5,0.1,gy,0,0.5,-0.5);
    } else if(id==='pet_dragon'){
      const gr=this.MAT('#43a047');
      add(0.7,0.55,1.1,gr,0,0.45,0);
      add(0.5,0.5,0.5,gr,0,0.75,0.65);
      add(0.3,0.3,0.08,this.MAT('#ffca28'),-0.09,0.85,0.9);
      add(0.3,0.3,0.08,this.MAT('#ffca28'),0.09,0.85,0.9);
      add(0.5,0.6,0.08,this.MAT('#2e7d32'),-0.5,0.7,0);
      add(0.5,0.6,0.08,this.MAT('#2e7d32'),0.5,0.7,0);
      add(0.16,0.3,0.16,gr,-0.2,0.15,0.3); add(0.16,0.3,0.16,gr,0.2,0.15,0.3);
      add(0.16,0.3,0.16,gr,-0.2,0.15,-0.3); add(0.16,0.3,0.16,gr,0.2,0.15,-0.3);
      add(0.15,0.15,0.6,gr,0,0.5,-0.8);
    } else return null;
    return g;
  },

  clearPet(){
    if(this.pet && this.pet.grp){
      if(this.pet.grp.parent) this.pet.grp.parent.remove(this.pet.grp);
      this.pet=null;
    }
  },

  init(canvas){
    this.canvas=canvas;
    this.renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:false,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
    // FIX: Enable auto clear and set initial clear color
    this.renderer.autoClear=true;
    this.renderer.setClearColor(0x87ceeb);
    this.scene=new THREE.Scene();
    this.camera=new THREE.PerspectiveCamera(60,1,0.1,300);
    this.scene.add(new THREE.HemisphereLight(0xffffff,0x8fa3c7,1.05));
    const dl=new THREE.DirectionalLight(0xfff2d6,0.75);
    dl.position.set(12,24,10); this.scene.add(dl);

    this.GEO={ box:new THREE.BoxGeometry(1,1,1), bit:new THREE.BoxGeometry(THREE.BoxGeometry)(0.17,0.17,0.17) };
    this._matC={}; this._matB={}; this._studTex={}; this._studMat={};

    this.player={
      pos:new THREE.Vector3(0,HY,7), vel:new THREE.Vector3(), prev:new THREE.Vector3(),
      onGround:false, coyote:0, groundC:null, iframe:0, speed:7, jumpV:12.4
    };
    this.playerGroup=new THREE.Group();
    this.playerGroup.visible=false;
    this.scene.add(this.playerGroup);

    this.blob=new THREE.Mesh(new THREE.CircleGeometry(0.55,20),
      new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.28,depthWrite:false}));
    this.blob.rotation.x=-Math.PI/2; this.blob.visible=false;
    this.scene.add(this.blob);

    const self=this;
    const resize=()=>{
      const w=window.innerWidth, h=window.innerHeight;
      self.renderer.setSize(w,h); self.camera.aspect=w/h; self.camera.updateProjectionMatrix();
    };
    window.addEventListener('resize',resize); resize();

    bindInput();
    requestAnimationFrame(this.frame.bind(this));
  },

  frame(now){
    requestAnimationFrame(this.frame.bind(this));
    if(!this._last) this._last=now;
    let dt=(now-this._last)/1000; this._last=now;
    if(dt>0.05) dt=0.05;
    if(dt<=0) return;
    this.time+=dt;

    Input.update(dt);

    if(this.mode==='lobby') this.lobbyUpdate(dt);
    else if(this.mode==='game' && this.gameUpdate && !this.finished) this.gameUpdate(dt);

    this.updateMovers(dt);
    if(this.playerOn) this.stepPlayer(dt);
    this.checkTriggers();
    if(this.playerOn && this.player.pos.y < W.killY) this.handleFall();
    this.updateInteract();
    if(!this.idle){
      Bots.update(dt);
      this.updateBotChat(dt);
    }
    FX.update(dt);
    this.updateTrail(dt);
    this.updateAvatar(dt);

    if(this.idle){
      this.renderer.render(this.scene,this.camera);
    } else {
      const sh=this.updateCamera(dt);
      this.renderer.render(this.scene,this.camera);
      if(sh) this.camera.position.sub(sh);
    }
  },

  updateBotChat(dt){
    this.botChatTimer-=dt;
    if(this.botChatTimer<=0){
      this.botChatTimer=U.rand(4,9);
      const aliveBots=Bots.all.filter(b=>!b.dead && b.grp && b.grp.parent);
      if(aliveBots.length>0){
        const bot=U.choice(aliveBots);
        const category = this.mode==='game' ? 'game' : 'lobby';
        BotChat.sayRandom(bot, category);
      }
    }
  },

  spawnTrail(){
    const P=this.player.pos;
    let color='#ffd32a';
    const t=this.trailType;
    if(t==='trail_rainbow') color='#'+new THREE.Color().setHSL((this.time*0.4)%1,1,0.6).getHexString();
    else if(t==='trail_fire') color='#ff7043';
    else if(t==='trail_bubble') color='#b3e5fc';
    const m=new THREE.Mesh(this.GEO.bit,new THREE.MeshBasicMaterial({color:color,transparent:true}));
    m.position.set(P.x+U.rand(-0.3,0.3), P.y-HY+U.rand(0.2,1.2), P.z+U.rand(-0.3,0.3));
    m.scale.setScalar(U.rand(0.7,1.4));
    this.scene.add(m);
    this.trailPs.push({m:m,tl:0,life:0.5});
  },
  updateTrail(dt){
    for(let i=this.trailPs.length-1;i>=0;i--){
      const p=this.trailPs[i]; p.tl+=dt;
      if(p.tl>=p.life){ this.scene.remove(p.m); p.m.material.dispose(); this.trailPs.splice(i,1); continue; }
      p.m.position.y+=dt*0.8;
      p.m.material.opacity=1-p.tl/p.life;
      p.m.scale.multiplyScalar(1-dt*1.5);
    }
  },
  clearTrail(){
    this.trailPs.forEach(p=>{ this.scene.remove(p.m); p.m.material.dispose(); });
    this.trailPs.length=0;
    this.trailType=null;
  },

  setTool(type){
    if(this.toolObj){
      if(this.toolObj.parent) this.toolObj.parent.remove(this.toolObj);
      this.toolObj=null;
    }
    this._tool=type;
    if(!type||!this.limbs) return;
    const s=new THREE.Group();
    if(type==='sword'){
      const skin=(Store.data.equip||{}).sword;
      let bladeMat=this.MAT('#e8eef4');
      if(skin==='sword_diamond') bladeMat=this.MATB('#7ff3ff');
      if(skin==='sword_fire') bladeMat=this.MATB('#ff7043');
      if(skin==='sword_gold') bladeMat=this.MAT('#ffd700');
      if(skin==='sword_ice') bladeMat=this.MATB('#aee6ff');
      if(skin==='sword_void') bladeMat=this.MAT('#7b2fbe');
      const blade=new THREE.Mesh(this.GEO.box,bladeMat);
      blade.scale.set(0.12,1.15,0.3); blade.position.set(0,0.42,0); s.add(blade);
      const guard=new THREE.Mesh(this.GEO.box,this.MAT('#ffd32a'));
      guard.scale.set(0.16,0.12,0.44); s.add(guard);
    } else if(type==='pick'){
      const handle=new THREE.Mesh(this.GEO.box,this.MAT('#6d4c41'));
      handle.scale.set(0.12,1.1,0.12); s.add(handle);
      const head=new THREE.Mesh(this.GEO.box,this.MAT('#b0bec5'));
      head.scale.set(0.75,0.2,0.2); head.position.y=0.5; s.add(head);
    } else if(type==='rod'){
      const handle=new THREE.Mesh(this.GEO.box,this.MAT('#6d4c41'));
      handle.scale.set(0.1,1.3,0.1); s.add(handle);
      const tip=new THREE.Mesh(this.GEO.box,this.MAT('#e53935'));
      tip.scale.set(0.08,0.2,0.08); tip.position.y=0.7; s.add(tip);
    }
    this.limbs.armR.add(s); s.position.set(0,-0.6,0.12);
    this.toolObj=s;
  },

  stepPlayer(dt){
    const P=this.player;
    if(!this.noMove){
      let mx=0, mf=0;
      if(!this.inputLock){ const a=Input.axis(); mx=a.x; mf=a.f; }
      const cy=this.camYaw, cs=Math.cos(cy), sn=Math.sin(cy);
      const rx=mx*cs-mf*sn;
      const rz=-mx*sn-mf*cs;
      const acc=P.onGround?70:45;
      P.vel.x=U.approach(P.vel.x, rx*P.speed, acc*dt);
      P.vel.z=U.approach(P.vel.z, rz*P.speed, acc*dt);
    }
    P.vel.y=Math.max(-34, P.vel.y+GRAV*dt);

    if(!this.inputLock){
      if(Input.jumpBuf<=0 && (Input.btnJump||keys['Space']) && P.onGround) Input.jumpBuf=0.06;
      if(Input.jumpBuf>0 && (P.onGround||P.coyote>0)){
        P.vel.y=P.jumpV; Input.jumpBuf=0; P.coyote=0; P.groundC=null; Sfx.jump();
      }
    }

    P.onGround=false; let landed=null;
    const steps=2, h=dt/steps;
    for(let i=0;i<steps;i++){
      P.prev.copy(P.pos);
      P.pos.x+=P.vel.x*h; P.pos.z+=P.vel.z*h; P.pos.y+=P.vel.y*h;
      const l=this.collide(P); if(l) landed=l;
    }
    if(landed){
      P.onGround=true; P.groundC=landed; P.coyote=0.13;
      if(P.vel.y<0){
        if(P.vel.y<-13){ FX.burst(P.pos.x,P.pos.y-HY,P.pos.z,'#cfd6dd',6,3,0.4); Sfx.land(); }
        P.vel.y=0;
      }
    } else { P.groundC=null; P.coyote-=dt; }
    if(P.iframe>0) P.iframe-=dt;
  },

  collide(P){
    let landed=null;
    for(let i=0;i<this.colliders.length;i++){
      const c=this.colliders[i];
      if(c.disabled||c.trigger) continue;
      const dx=P.pos.x-c.x, ox=c.hx+HX-Math.abs(dx); if(ox<=0) continue;
      const dy=P.pos.y-c.y, oy=c.hy+HY-Math.abs(dy); if(oy<=0) continue;
      const dz=P.pos.z-c.z, oz=c.hz+HZ-Math.abs(dz); if(oz<=0) continue;
      if(oy<ox && oy<oz){
        if(P.prev.y-HY >= c.y+c.hy-0.12 && P.vel.y<=0.01){ P.pos.y=c.y+c.hy+HY; landed=c; }
        else if(P.prev.y+HY <= c.y-c.hy+0.12 && P.vel.y>=0){ P.pos.y=c.y-c.hy-HY; P.vel.y=0; }
        else if(ox<oz){ P.pos.x += dx>0?ox:-ox; }
        else { P.pos.z += dz>0?oz:-oz; }
      } else if(ox<oz){ P.pos.x += dx>0?ox:-ox; }
      else { P.pos.z += dz>0?oz:-oz; }
    }
    if(landed && landed.onLand) landed.onLand();
    return landed;
  },

  updateMovers(dt){
    for(let i=0;i<this.movers.length;i++){
      const c=this.movers[i];
      const v=c.base[c.axis]+Math.sin(this.time*c.speed+c.phase)*c.amp;
      const delta=v-c[c.axis];
      c[c.axis]=v; c.mesh.position[c.axis]=v;
      if(this.player.groundC===c && this.player.onGround) this.player.pos[c.axis]+=delta;
    }
  },

  checkTriggers(){
    if(!this.playerOn) return;
    const P=this.player;
    for(let i=0;i<this.colliders.length;i++){
      const c=this.colliders[i];
      if(!c.trigger||c.disabled||!c.cb) continue;
      if(Math.abs(P.pos.x-c.x)<c.hx+HX && Math.abs(P.pos.y-c.y)<c.hy+HY && Math.abs(P.pos.z-c.z)<c.hz+HZ)
        c.cb(c);
    }
  },

  handleFall(){
    if(this.onFallCb) this.onFallCb();
    else this.spawnPlayer(this.spawnPt.x,this.spawnPt.y,this.spawnPt.z,false);
  },

  updateInteract(){
    if(this.inputLock||!this.playerOn||this.idle){ HUD.interact(null); return; }
    const P=this.player.pos;
    let best=null, bd=1e9;
    for(let i=0;i<this.interact.length;i++){
      const it=this.interact[i]; if(it.dead) continue;
      const d=Math.hypot(P.x-it.x, P.z-it.z);
      if(d<it.r && d<bd){ bd=d; best=it; }
    }
    if(best){
      HUD.interact(typeof best.label==='function'?best.label():best.label);
      if(Input.actionBuf>0){ Input.actionBuf=0; best.cb(); }
    } else HUD.interact(null);
  },

  applyChar(ci){
    const c=CHARS[ci]||CHARS[0];
    const g=this.playerGroup;
    while(g.children.length) g.remove(g.children[0]);
    this.limbs=this.makeAvatar(g,c);
    const tag=new THREE.Sprite(new THREE.SpriteMaterial({map:this.textTex('SEN','#ffd32a'),transparent:true,depthWrite:false}));
    tag.scale.set(1.5,0.42,1); tag.position.y=2.35; g.add(tag);
    this.applyCosmetics(g);
    this.toolObj=null;
    this.clearPet();
    const pid=(Store.data.equip||{}).pet;
    if(pid){
      const pg=this.buildPet(pid);
      if(pg){ this.scene.add(pg); this.pet={grp:pg}; }
    }
  },

  updateAvatar(dt){
    const g=this.playerGroup, P=this.player;
    g.visible=this.playerOn;
    this.blob.visible=false;
    if(!this.playerOn || !this.limbs) return;
    g.position.set(P.pos.x, P.pos.y-HY, P.pos.z);
    const hs=Math.hypot(P.vel.x,P.vel.z);
    let swing=0;
    if(hs>0.6 && P.onGround){ this.walkT+=dt*hs*1.7; swing=Math.sin(this.walkT)*0.65; }
    if(P.onGround){
      this.limbs.legL.rotation.x=swing; this.limbs.legR.rotation.x=-swing;
      this.limbs.armL.rotation.x=-swing*0.8;
      if(this.punch<=0) this.limbs.armR.rotation.x=swing*0.8;
    } else {
      this.limbs.legL.rotation.x=0.45; this.limbs.legR.rotation.x=-0.3;
      this.limbs.armL.rotation.x=-0.5; if(this.punch<=0) this.limbs.armR.rotation.x=-0.5;
    }
    if(this.punch>0){
      this.punch-=dt;
      this.limbs.armR.rotation.x=-2.4*Math.sin(U.clamp(1-this.punch/0.25,0,1)*Math.PI);
    }
    if(hs>0.6){
      const target=Math.atan2(P.vel.x,P.vel.z);
      let d=(target-g.rotation.y)%(Math.PI*2);
      if(d>Math.PI)d-=Math.PI*2; if(d<-Math.PI)d+=Math.PI*2;
      g.rotation.y+=d*Math.min(1,dt*12);
    }
    if(P.iframe>0) g.visible=(Math.floor(this.time*14)%2)===0;
    if(this.fxHalo) this.fxHalo.rotation.z+=dt*2;
    if(this.fxAura){
      this.fxAura.rotation.z+=dt*2;
      const eq=Store.data.equip||{};
      if(eq.aura==='aura_rainbow') this.fxAura.material.color.setHSL((this.time*0.4)%1,1,0.6);
    }
    if(this.trailType && hs>1.5){
      this.trailT-=dt;
      if(this.trailT<=0){ this.trailT=0.07; this.spawnTrail(); }
    }
    if(this.pet){
      const fy=g.rotation.y;
      const tx=P.x-Math.sin(fy)*1.5, tz=P.z-Math.cos(fy)*1.5;
      this.pet.grp.position.x=U.lerp(this.pet.grp.position.x,tx,1-Math.exp(-3*dt));
      this.pet.grp.position.z=U.lerp(this.pet.grp.position.z,tz,1-Math.exp(-3*dt));
      this.pet.grp.position.y=Math.abs(Math.sin(this.time*4))*0.12;
      this.pet.grp.rotation.y=Math.atan2(P.x-this.pet.grp.position.x,P.z-this.pet.grp.position.z);
    }
    let best=-1e9;
    for(let i=0;i<this.colliders.length;i++){
      const c=this.colliders[i];
      if(c.disabled||c.trigger) continue;
      const top=c.y+c.hy;
      if(top<=P.pos.y-HY+0.06 && top>best &&
         Math.abs(P.pos.x-c.x)<c.hx+0.6 && Math.abs(P.pos.z-c.z)<c.hz+0.6) best=top;
    }
    if(best>-1e8){
      this.blob.visible=true;
      this.blob.position.set(P.pos.x,best+0.03,P.pos.z);
      const hgt=P.pos.y-HY-best;
      this.blob.scale.setScalar(U.clamp(1-hgt*0.05,0.35,1));
    }
  },

  updateCamera(dt){
    const P=this.player.pos;
    if(this.camMode!==2){
      const hs=Math.hypot(P.vel.x,P.vel.z);
      const targetYaw = hs>0.8 ? Math.atan2(P.vel.x,P.vel.z) : this.followYaw;
      if(hs>0.8) this.followYaw = targetYaw;
      this.camYaw=lerpAngle(this.camYaw, this.followYaw+Math.PI, 1-Math.exp(-4*dt));
    }
    const cp=Math.cos(this.camPitch), sp=Math.sin(this.camPitch);
    const d=this.camDist;
    const target=new THREE.Vector3(
      P.x+Math.sin(this.camYaw)*cp*d,
      P.y+sp*d+1.2,
      P.z+Math.cos(this.camYaw)*cp*d
    );
    if(this.snapCam){
      this.camera.position.copy(target);
      this.camera.lookAt(P.x,P.y+1.2,P.z);
      this.snapCam=false;
    }
    else this.camera.position.lerp(target,1-Math.exp(-8*dt));
    let sh=null;
    if(this.shakeT>0){
      this.shakeT-=dt;
      const m=this.shakeM*Math.max(0,this.shakeT)*3;
      sh=new THREE.Vector3(U.rand(-m,m),U.rand(-m,m),0);
      this.camera.position.add(sh);
    }
    this.camera.lookAt(P.x,P.y+1.2,P.z);
    return sh;
  },
  shake(m){ this.shakeT=0.4; this.shakeM=m; },
  hurtFx(){ const el=$('dmgflash'); el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); },
  
  // FIX: Completely rewritten fadeDo to prevent freezing
  fadeDo(cb){
    const f=$('fade');
    // Immediately set opacity to 1 without transition issues
    f.style.transition='none';
    f.classList.add('on');
    // Force reflow to apply immediate style
    void f.offsetWidth;
    f.style.transition='opacity .08s';
    
    setTimeout(()=>{
      cb();
      // FIX: Clear WebGL buffer before render to prevent artifacts
      if(this.renderer && this.scene && this.camera){
        this.renderer.clear();
        this.renderer.render(this.scene, this.camera);
      }
      setTimeout(()=>{
        f.classList.remove('on');
      },100);
    },230);
  },

  buildLobby(){
    W.env('#4aa8ff',35,120,'#dff3ff',true);
    W.box(0,-0.5,0,44,1,44,'#58b849');
    const ring=new THREE.Mesh(new THREE.RingGeometry(6,13.4,36),this.MATB('#c2c8d2'));
    ring.rotation.x=-Math.PI/2; ring.position.y=0.02; W.mesh(ring);
    W.box(0,0.5,0,4.4,1,4.4,'#8d949e');
    const cg=new THREE.Group(); cg.position.set(0,2.7,0);
    const coin=new THREE.Mesh(new THREE.CylinderGeometry(1,1,0.22,24),this.MAT('#ffc233'));
    coin.rotation.z=Math.PI/2; cg.add(coin); W.mesh(cg);
    this.lobbyCoin=cg;
    const booth=new THREE.Group(); booth.position.set(0,0,-5.6);
    const counter=new THREE.Mesh(this.GEO.box,this.MAT('#ffb100'));
    counter.scale.set(2.6,1.1,1.2); counter.position.y=0.55; booth.add(counter);
    const gem=new THREE.Sprite(new THREE.SpriteMaterial({map:this.emojiTex('💎'),transparent:true,depthWrite:false}));
    gem.scale.set(1.4,1.4,1); gem.position.y=2.1; booth.add(gem);
    const sign=new THREE.Sprite(new THREE.SpriteMaterial({map:this.textTex('MARKET','#ffd32a'),transparent:true,depthWrite:false}));
    sign.scale.set(2.4,0.55,1); sign.position.y=2.9; booth.add(sign);
    W.mesh(booth);
    this.marketGem=gem;
    this.interact.push({x:0,z:-4.4,r:2.6,label:'💎 MARKET',cb:()=>Events.emit('reqShop')});
    this.emoSprites=[];
    const n=GAMES.length;
    const RAD= n>12 ? 13.5 : 10.6;
    for(let i=0;i<n;i++){
      const gmeta=GAMES[i];
      const a=i/n*Math.PI*2;
      const px=Math.sin(a)*RAD, pz=-Math.cos(a)*RAD;
      const grp=new THREE.Group(); grp.position.set(px,0,pz);
      grp.rotation.y=Math.atan2(-px,-pz);
      const mk=(sx,sy,sz,x,y,z,mm)=>{
        const q=new THREE.Mesh(this.GEO.box,mm); q.scale.set(sx,sy,sz); q.position.set(x,y,z); grp.add(q);
      };
      mk(0.55,3.1,0.55,-1.15,1.55,0,this.MAT(gmeta.color));
      mk(0.55,3.1,0.55, 1.15,1.55,0,this.MAT(gmeta.color));
      mk(2.9,0.7,0.6, 0,3.4,0,this.MAT(gmeta.color));
      const pad=new THREE.Mesh(this.GEO.box,this.MATB(gmeta.color));
      pad.scale.set(2.2,0.12,1.6); pad.position.set(0,0.07,2.1); grp.add(pad);
      const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:this.emojiTex(gmeta.emoji),transparent:true,depthWrite:false}));
      sp.scale.set(1.9,1.9,1); sp.position.set(0,4.6,0); grp.add(sp);
      this.emoSprites.push({sp:sp,ph:i});
      const plate=new THREE.Sprite(new THREE.SpriteMaterial({map:this.textTex(gmeta.name),transparent:true,depthWrite:false}));
      plate.scale.set(2.9,0.62,1); plate.position.set(0,2.6,0.4); grp.add(plate);
      W.mesh(grp);
      const fx=-px/RAD, fz=-pz/RAD;
      this.interact.push({x:px+fx*2.1, z:pz+fz*2.1, r:2.7,
        label:'▶ '+gmeta.name, cb:(id=>()=>Events.emit('reqGame',id))(gmeta.id)});
    }
    this.clouds=[];
    for(let i=0;i<6;i++){
      const cl=new THREE.Mesh(this.GEO.box,this.MAT('#ffffff'));
      cl.scale.set(U.rand(3,6),1,U.rand(1.6,2.6));
      cl.position.set(U.rand(-30,30),U.rand(12,17),U.rand(-30,30));
      W.mesh(cl); this.clouds.push({m:cl,v:U.rand(0.4,1)});
    }
    for(let i=0;i<3;i++){
      const b=Bots.make(null,U.rand(-8,8),U.rand(-4,6));
      b.mode='wander';
      b.wander={cx:0,cz:0,r:11,tx:U.rand(-6,6),tz:U.rand(-6,6),wait:U.rand(0,2)};
      b.speed=U.rand(3,4.2);
      b.respawnPos.set(b.pos.x,0,b.pos.z);
    }
    this.spawnPt={x:0,y:HY+0.02,z:7.5};
  },
  lobbyUpdate(dt){
    if(this.lobbyCoin){
      this.lobbyCoin.rotation.y+=dt*2.2;
      this.lobbyCoin.position.y=2.7+Math.sin(this.time*2)*0.15;
    }
    if(this.marketGem){
      this.marketGem.position.y=2.1+Math.sin(this.time*2.4)*0.18;
    }
    for(let i=0;i<this.emoSprites.length;i++){
      const e=this.emoSprites[i];
      e.sp.position.y=4.6+Math.sin(this.time*2+e.ph)*0.25;
    }
    for(let i=0;i<this.clouds.length;i++){
      const c=this.clouds[i]; c.m.position.x+=c.v*dt;
      if(c.m.position.x>40) c.m.position.x=-40;
    }
    if(this.idle){
      const a=this.time*0.1;
      this.camera.position.set(Math.sin(a)*17,8.5,Math.cos(a)*17);
      this.camera.lookAt(0,2.2,0);
    }
  },

  runCleanups(){ while(this.cleanupFns.length){ try{this.cleanupFns.pop()();}catch(e){} } },

  spawnPlayer(x,y,z,setSpawn){
    const P=this.player;
    P.pos.set(x,y,z); P.vel.set(0,0,0); P.iframe=0; P.onGround=false; P.groundC=null;
    if(setSpawn!==false) this.spawnPt={x:x,y:y,z:z};
    this.playerOn=true;
  },

  makeApi(meta){
    const E=this;
    return {
      meta:meta,
      spawn:(x,topY,z)=>{ E.spawnPlayer(x,topY+HY+0.02,z); E.snapCam=true; },
      update:fn=>{ E.gameUpdate=fn; },
      fall:fn=>{ E.onFallCb=fn; },
      win:(score,coins,msg)=>E.finish(true,score,coins,msg),
      lose:(msg,score,coins)=>E.finish(false,score||0,coins||0,msg),
      hearts:(n,max)=>HUD.hearts(n,max),
      stat:t=>HUD.stat(t),
      toast:(t,d)=>HUD.toast(t,d),
      big:(t,c,d)=>HUD.big(t,c,d),
      onExit:fn=>E.cleanupFns.push(fn),
      interact:(x,z,r,label,cb)=>E.interact.push({x:x,z:z,r:r,label:label,cb:cb})
    };
  },

  // FIX: Added renderer.clear() to prevent frozen canvas
  startGame(meta){
    if(!meta) return;
    this.runId++;
    this.finished=false; this.gameUpdate=null; this.onFallCb=null;
    this.noMove=!!meta.noMove;
    this.inputLock=(meta.controls===false);
    this.playerOn=true;
    this.punch=0; this.player.iframe=0; this.player.speed=7;
    this.camMode=0; this.camDist=9; this.camPitch=0.35;
    this.camYaw=0; this.followYaw=0;
    W.clear();
    this.mode='game'; this.currentMeta=meta;
    HUD.game(meta);
    HUD.setControls(meta.controls!==false);
    meta.enter(this.makeApi(meta));
    const P=this.player.pos;
    const cp=Math.cos(this.camPitch), sp=Math.sin(this.camPitch);
    this.camera.position.set(
      P.x+Math.sin(this.camYaw)*cp*this.camDist,
      P.y+sp*this.camDist+1.2,
      P.z+Math.cos(this.camYaw)*cp*this.camDist
    );
    this.camera.lookAt(P.x,P.y+1.2,P.z);
    this.snapCam=true;
    // FIX: Clear WebGL buffer and force render
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
  },

  // FIX: Added renderer.clear() to prevent frozen canvas
  toLobby(){
    this.finished=false; this.gameUpdate=null; this.onFallCb=null;
    this.noMove=false; this.inputLock=false;
    W.clear();
    this.buildLobby();
    this.mode='lobby'; this.idle=false; this.currentMeta=null;
    this.playerGroup.visible=true;
    this.spawnPlayer(this.spawnPt.x,this.spawnPt.y,this.spawnPt.z,false);
    HUD.lobby(); HUD.show(true); HUD.setControls(true);
    this.camMode=0; this.camDist=9; this.camPitch=0.35;
    this.camYaw=0; this.followYaw=0;
    const P=this.player.pos;
    const cp=Math.cos(this.camPitch), sp=Math.sin(this.camPitch);
    this.camera.position.set(
      P.x+Math.sin(this.camYaw)*cp*this.camDist,
      P.y+sp*this.camDist+1.2,
      P.z+Math.cos(this.camYaw)*cp*this.camDist
    );
    this.camera.lookAt(P.x,P.y+1.2,P.z);
    this.snapCam=true;
    // FIX: Clear WebGL buffer and force render
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
  },

  idleLobby(){
    this.inputLock=true; this.playerOn=false;
    W.clear();
    this.buildLobby();
    this.mode='lobby'; this.idle=true; this.currentMeta=null;
    this.playerGroup.visible=false;
  },

  // FIX: Added renderer.clear() to prevent frozen canvas
  enterLobby(){
    this.idle=false; this.inputLock=false;
    this.playerGroup.visible=true;
    this.spawnPlayer(this.spawnPt.x,this.spawnPt.y,this.spawnPt.z,false);
    HUD.lobby(); HUD.show(true); HUD.setControls(true);
    this.camMode=0; this.camDist=9; this.camPitch=0.35;
    this.camYaw=0; this.followYaw=0;
    const P=this.player.pos;
    const cp=Math.cos(this.camPitch), sp=Math.sin(this.camPitch);
    this.camera.position.set(
      P.x+Math.sin(this.camYaw)*cp*this.camDist,
      P.y+sp*this.camDist+1.2,
      P.z+Math.cos(this.camYaw)*cp*this.camDist
    );
    this.camera.lookAt(P.x,P.y+1.2,P.z);
    this.snapCam=true;
    // FIX: Clear WebGL buffer and force render
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
  },

  finish(win,score,coins,msg){
    if(this.finished || !this.currentMeta) return;
    this.finished=true; this.inputLock=true;
    HUD.interact(null);
    if(win){ Sfx.win(); FX.confetti(this.player.pos.x,this.player.pos.y+1,this.player.pos.z); }
    else Sfx.lose();
    const nb=Store.setBest(this.currentMeta.id, score);
    if(coins>0) Store.addCoins(coins);
    HUD.coins();
    Events.emit('result',{win:win,score:score,coins:coins,msg:msg||'',
      name:this.currentMeta.name,emoji:this.currentMeta.emoji,
      best:Store.getBest(this.currentMeta.id),newBest:nb,id:this.currentMeta.id});
  }
};

/* ============================================================
   BOT SİSTEMİ
   ============================================================ */
const Bots = {
  all:[],
  names:['xX_Pro_TR_Xx','NoobMaster61','BlokUstası','KralCan_34','Elmas_Efe','RoboAyşe',
         'SpeedyMert','GamerZeynep','DevAdam07','KüçükNinja','TıkCanavarı','YARDIMCI_37'],
  used:[],
  pickName(){
    const avail=this.names.filter(n=>this.used.indexOf(n)<0);
    const n=avail.length?U.choice(avail):'Bot'+U.randi(99);
    this.used.push(n); return n;
  },
  make(colors,x,z,name){
    const g=new THREE.Group();
    if(!colors){
      const a=U.choice(CHARS), b=U.choice(CHARS), c=U.choice(CHARS);
      colors={skin:a.skin,shirt:b.shirt,pants:c.pants};
    }
    const limbs=Engine.makeAvatar(g,colors);
    const tag=new THREE.Sprite(new THREE.SpriteMaterial({map:Engine.textTex(name||this.pickName()),transparent:true,depthWrite:false}));
    tag.scale.set(2.3,0.52,1); tag.position.y=2.3; g.add(tag);
    W.mesh(g);
    const bot={grp:g,limbs:limbs,pos:new THREE.Vector3(x,0,z),feetY:0,prevFeet:0,vy:0,
      onGround:false,speed:5,yaw:g.rotation.y,yawT:null,walkT:0,swing:0,hspd:0,punchT:0,
      mode:'idle',path:null,idx:0,safeIdx:0,safePos:new THREE.Vector3(x,0,z),loop:false,
      wander:{cx:x,cz:z,r:5,tx:x,tz:z,wait:0},
      fallBelow:-20,dead:false,respawnT:0,respawnPos:new THREE.Vector3(x,0,z),wait:0,
      push:{x:0,z:0}};
    g.position.set(x,0,z);
    this.all.push(bot);
    return bot;
  },
  clear(){ this.all.length=0; this.used.length=0; },
  groundAt(x,z,maxFeet){
    let best=null;
    for(let i=0;i<Engine.colliders.length;i++){
      const c=Engine.colliders[i];
      if(c.disabled||c.trigger) continue;
      const top=c.y+c.hy;
      if(top>maxFeet+0.6) continue;
      if(Math.abs(x-c.x)<=c.hx+0.35 && Math.abs(z-c.z)<=c.hz+0.35){
        if(best===null||top>best) best=top;
      }
    }
    return best;
  },
  kill(b,delay){
    if(b.dead) return;
    b.dead=true; b.respawnT=(delay==null?2.5:delay);
    b.grp.visible=false;
    FX.burst(b.pos.x,b.feetY+1,b.pos.z,'#ffd32a',12,6,0.7);
  },
  respawn(b){
    b.dead=false; b.grp.visible=true;
    b.pos.copy(b.respawnPos); b.feetY=b.respawnPos.y; b.vy=0;
    if(b.mode==='path'&&b.path) b.idx=b.safeIdx;
  },
  physics(b,dt){
    b.prevFeet=b.feetY;
    if(b.push.x||b.push.z){
      b.pos.x+=b.push.x*dt; b.pos.z+=b.push.z*dt;
      b.push.x*=Math.max(0,1-dt*3); b.push.z*=Math.max(0,1-dt*3);
      if(Math.abs(b.push.x)<0.1)b.push.x=0;
      if(Math.abs(b.push.z)<0.1)b.push.z=0;
    }
    b.vy=Math.max(-34,b.vy-30*dt);
    b.feetY+=b.vy*dt;
    const wasG=b.onGround;
    b.onGround=false;
    const g=this.groundAt(b.pos.x,b.pos.z,Math.max(b.prevFeet,b.feetY));
    if(g!==null){
      if(b.feetY<=g && b.vy<=0){ b.feetY=g; b.vy=0; b.onGround=true; }
      else if(wasG && b.feetY>g && b.feetY-g<0.55 && b.vy<=0.01){ b.feetY=g; b.vy=0; b.onGround=true; }
    }
    if(!b.dead && b.feetY<b.fallBelow) this.kill(b);
    b.grp.position.set(b.pos.x,b.feetY,b.pos.z);
  },
  anim(b,dt){
    let swing=b.swing;
    if(b.hspd>0.5 && b.onGround){ b.walkT+=dt*b.hspd*1.7; swing=Math.sin(b.walkT)*0.65; }
    else swing*=Math.max(0,1-dt*10);
    b.swing=swing;
    const L=b.limbs;
    if(b.onGround){
      L.legL.rotation.x=swing; L.legR.rotation.x=-swing;
      L.armL.rotation.x=-swing*0.8;
      if(b.punchT<=0) L.armR.rotation.x=swing*0.8;
    } else {
      L.legL.rotation.x=0.45; L.legR.rotation.x=-0.3;
      L.armL.rotation.x=-0.5;
      if(b.punchT<=0) L.armR.rotation.x=-0.5;
    }
    if(b.punchT>0){
      b.punchT-=dt;
      L.armR.rotation.x=-2.4*Math.sin(U.clamp(1-b.punchT/0.25,0,1)*Math.PI);
    }
    if(b.yawT!==null){
      let d=(b.yawT-b.grp.rotation.y)%(Math.PI*2);
      if(d>Math.PI)d-=Math.PI*2; if(d<-Math.PI)d+=Math.PI*2;
      b.grp.rotation.y+=d*Math.min(1,dt*10);
    }
    b.grp.position.set(b.pos.x,b.feetY,b.pos.z);
  },
  walkPath(b,dt){
    if(!b.path||b.path.length===0){ b.hspd=0; return; }
    if(b.idx>=b.path.length){
      if(b.loop){
        b.idx=0;
        const p0=b.path[0];
        b.pos.set(p0.x,p0.y,p0.z); b.feetY=p0.y; b.vy=0; b.safePos.copy(b.pos);
      } else { b.hspd=0; return; }
    }
    const tgt=b.path[b.idx];
    const dx=tgt.x-b.pos.x, dz=tgt.z-b.pos.z;
    const d=Math.hypot(dx,dz);
    if(d<0.45){
      b.safePos.set(tgt.x,tgt.y,tgt.z);
      b.idx++; b.safeIdx=Math.min(b.idx,b.path.length-1);
      b.hspd=0;
    } else {
      const st=Math.min(b.speed*dt,d);
      b.pos.x+=dx/d*st; b.pos.z+=dz/d*st;
      b.hspd=b.speed; b.yawT=Math.atan2(dx,dz);
      if(b.onGround){
        const ahead=this.groundAt(b.pos.x+dx/d*1.0, b.pos.z+dz/d*1.0, b.feetY);
        if(tgt.y-b.feetY>0.75 || ahead===null) b.vy=12.4;
      }
    }
  },
  walkWander(b,dt){
    const w=b.wander;
    if(w.wait>0){ w.wait-=dt; b.hspd=0; return; }
    const dx=w.tx-b.pos.x, dz=w.tz-b.pos.z;
    const d=Math.hypot(dx,dz);
    if(d<0.7){
      const a=U.rand(0,Math.PI*2), r=U.rand(0.4,1)*w.r;
      w.tx=w.cx+Math.cos(a)*r; w.tz=w.cz+Math.sin(a)*r;
      w.wait=U.rand(0.6,2.6); b.hspd=0;
    } else {
      const st=Math.min(b.speed*dt,d);
      b.pos.x+=dx/d*st; b.pos.z+=dz/d*st;
      b.hspd=b.speed; b.yawT=Math.atan2(dx,dz);
    }
    if(b.onGround && Math.random()<dt*0.12) b.vy=10.5;
  },
  stepTo(b,tx,tz,spd,dt){
    const dx=tx-b.pos.x, dz=tz-b.pos.z;
    const d=Math.hypot(dx,dz);
    if(d>0.15){
      const st=Math.min(spd*dt,d);
      b.pos.x+=dx/d*st; b.pos.z+=dz/d*st;
      b.hspd=spd; b.yawT=Math.atan2(dx,dz);
    } else b.hspd=0;
    this.physics(b,dt);
    this.anim(b,dt);
    return d;
  },
  update(dt){
    for(let i=0;i<this.all.length;i++){
      const b=this.all[i];
      if(b.dead){ b.respawnT-=dt; if(b.respawnT<=0) this.respawn(b); continue; }
      if(b.mode==='manual') continue;
      if(b.wait>0){ b.wait-=dt; b.hspd=0; this.physics(b,dt); this.anim(b,dt); continue; }
      if(b.mode==='path') this.walkPath(b,dt);
      else if(b.mode==='wander') this.walkWander(b,dt);
      else b.hspd=0;
      this.physics(b,dt);
      this.anim(b,dt);
    }
  }
};
