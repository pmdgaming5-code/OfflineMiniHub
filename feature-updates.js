/* ============================================================
   feature-updates.js — Kamera + Pet/Aura + geniş Market + 3 oyun
   Mevcut engine/games kodunu ezmeden genişletir.
   ============================================================ */
'use strict';

(function(){
  /* ---------------- DOM / CAMERA UI ---------------- */
  const canvas=document.getElementById('game');
  if(canvas && !document.getElementById('cam-zone')){
    const zone=document.createElement('div');
    zone.id='cam-zone';
    canvas.insertAdjacentElement('afterend',zone);
  }
  const controls=document.getElementById('controls');
  if(controls && !document.getElementById('btn-cam')){
    const b=document.createElement('button');
    b.id='btn-cam'; b.className='cambtn'; b.textContent='🎥';
    controls.appendChild(b);
  }

  /* ---------------- STORE / SHOP ---------------- */
  const SHOP_FULL=[
    {id:'glasses',name:'PİLOT GÖZLÜĞÜ',icon:'🕶️',cost:80,slot:'face',desc:'Karizma +10'},
    {id:'visor',name:'NEON VİZÖR',icon:'🤖',cost:95,slot:'face',desc:'Gelecekten geldi'},
    {id:'mask_ninja',name:'NİNJA MASKESİ',icon:'🥷',cost:110,slot:'face',desc:'Gizlilik +50'},
    {id:'cap',name:'BEYZBOL ŞAPKASI',icon:'🧢',cost:90,slot:'hat',desc:'Günlük stil'},
    {id:'tophat',name:'SİLİNDİR ŞAPKA',icon:'🎩',cost:100,slot:'hat',desc:'Centilmen görün'},
    {id:'halo',name:'HALE',icon:'😇',cost:120,slot:'hat',desc:'Döner altın halka'},
    {id:'crown',name:'ALTIN TAÇ',icon:'👑',cost:150,slot:'hat',desc:'Kral sensin'},
    {id:'viking',name:'VİKİNG MİĞFERİ',icon:'⚔️',cost:180,slot:'hat',desc:'Boynuzlu güç'},
    {id:'wizard',name:'BÜYÜCÜ ŞAPKASI',icon:'🧙',cost:170,slot:'hat',desc:'+30 mana'},
    {id:'demon',name:'ŞEYTAN BOYNUZU',icon:'😈',cost:210,slot:'hat',desc:'Karanlık taraf'},
    {id:'wings',name:'PERİ KANATLARI',icon:'🧚',cost:200,slot:'back',desc:'Sırtında parlar'},
    {id:'dragon_wings',name:'EJDER KANADI',icon:'🐉',cost:340,slot:'back',desc:'Efsanevi'},
    {id:'jetpack',name:'JET ÇANTASI',icon:'🚀',cost:300,slot:'back',desc:'3...2...1...'},
    {id:'cape',name:'KAHRAMAN PELERİNİ',icon:'🦸',cost:160,slot:'back',desc:'Rüzgarda dalgalanır'},
    {id:'sword_fire',name:'ATEŞ KILIÇ',icon:'🔥',cost:220,slot:'sword',desc:'Lav rengi çelik'},
    {id:'sword_gold',name:'ALTIN KILIÇ',icon:'⚜️',cost:280,slot:'sword',desc:'Zengin parlaması'},
    {id:'sword_ice',name:'BUZ KILIÇ',icon:'❄️',cost:260,slot:'sword',desc:'Donmuş keskinlik'},
    {id:'sword_void',name:'BOŞLUK KILICI',icon:'🌌',cost:380,slot:'sword',desc:'Yasak güç'},
    {id:'sword_diamond',name:'ELMAS KILIÇ',icon:'💎',cost:300,slot:'sword',desc:'Efsanevi parlaklık'},
    {id:'trail_star',name:'YILDIZ İZİ',icon:'✨',cost:250,slot:'trail',desc:'Yürürken parılda'},
    {id:'trail_fire',name:'ATEŞ İZİ',icon:'🔥',cost:270,slot:'trail',desc:'Alev alev'},
    {id:'trail_bubble',name:'BALONCUK İZİ',icon:'🫧',cost:230,slot:'trail',desc:'Pıt pıt pıt'},
    {id:'trail_rainbow',name:'GÖKKUŞAĞI İZİ',icon:'🌈',cost:400,slot:'trail',desc:'Renk fırtınası'},
    {id:'aura_gold',name:'ALTIN AURA',icon:'🌟',cost:320,slot:'aura',desc:'Dönen enerji halkası'},
    {id:'aura_rainbow',name:'GÖKKUŞAĞI AURA',icon:'💫',cost:420,slot:'aura',desc:'Işıltı patlaması'},
    {id:'pet_dog',name:'YAVRU KÖPEK',icon:'🐶',cost:350,slot:'pet',desc:'Sadık dost'},
    {id:'pet_cat',name:'KEDİ',icon:'🐱',cost:350,slot:'pet',desc:'Miyav'},
    {id:'pet_dragon',name:'MİNİ EJDER',icon:'🐲',cost:500,slot:'pet',desc:'Nadir yaratık'}
  ];

  if(typeof Store!=='undefined'){
    const oldLoad=Store.load.bind(Store);
    Store.load=function(){
      oldLoad();
      if(typeof this.data.equip!=='object'||!this.data.equip) this.data.equip={};
      ['hat','face','back','trail','sword','aura','pet'].forEach(s=>{
        if(!(s in this.data.equip)) this.data.equip[s]=null;
      });
      this.save();
    };
  }
  if(typeof SHOP!=='undefined'){
    SHOP.splice(0,SHOP.length,...SHOP_FULL);
  }
  if(typeof Sfx!=='undefined'){
    Sfx.splash=function(){this.tone(400,0.2,'sine',0.1,-200);};
    Sfx.reel=function(){this.tone(800,0.05,'square',0.06,300);};
    Sfx.tick=function(){this.tone(1200,0.04,'square',0.08);};
  }

  /* ---------------- CAMERA ---------------- */
  function lerpAngle(a,b,t){let d=(b-a)%(Math.PI*2);if(d>Math.PI)d-=Math.PI*2;if(d<-Math.PI)d+=Math.PI*2;return a+d*t;}
  window.lerpAngle=lerpAngle;

  function bindCamera(){
    const zone=document.getElementById('cam-zone'), btn=document.getElementById('btn-cam');
    if(!zone||!btn||zone.__boundCamera) return;
    zone.__boundCamera=true;
    const pointers=new Map(); let lastPinch=0;
    zone.addEventListener('pointerdown',e=>{
      try{zone.setPointerCapture(e.pointerId);}catch(err){}
      pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(pointers.size===2){const p=[...pointers.values()];lastPinch=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);}
    });
    zone.addEventListener('pointermove',e=>{
      if(!pointers.has(e.pointerId))return;
      const prev=pointers.get(e.pointerId),dx=e.clientX-prev.x,dy=e.clientY-prev.y;
      pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(pointers.size===1){
        if(Engine.camMode!==2)Engine.camMode=2;
        Engine.camYaw-=dx*0.005;
        Engine.camPitch=U.clamp(Engine.camPitch+dy*0.004,0.05,1.25);
      }else if(pointers.size===2){
        const p=[...pointers.values()],d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);
        Engine.camDist=U.clamp(Engine.camDist-(d-lastPinch)*0.03,3,22);lastPinch=d;
      }
    });
    const up=e=>{pointers.delete(e.pointerId);};
    zone.addEventListener('pointerup',up);zone.addEventListener('pointercancel',up);
    btn.addEventListener('click',()=>{
      Engine.camMode=(Engine.camMode+1)%3;
      const names=['🎥 3. ŞAHIS TAKİP','🔍 YAKIN TAKİP','🕹️ SERBEST KAMERA'];
      if(Engine.camMode===0)Engine.camDist=9;
      if(Engine.camMode===1)Engine.camDist=5;
      HUD.toast(names[Engine.camMode],1.2);Sfx.click();
    });
  }

  if(typeof Engine!=='undefined'){
    Engine.camYaw=0;Engine.camPitch=0.35;Engine.camDist=9;Engine.camMode=0;Engine.followYaw=0;
    const oldInit=Engine.init.bind(Engine);
    Engine.init=function(canvas){
      oldInit(canvas);
      this.camYaw=0;this.camPitch=0.35;this.camDist=9;this.camMode=0;this.followYaw=0;
      bindCamera();
    };
    if(typeof Input!=='undefined'){
      const rawAxis=Input.axis.bind(Input);
      Input.axis=function(){
        const a=rawAxis();
        if(Engine.camMode===undefined)return a;
        const cy=Engine.camYaw,cs=Math.cos(cy),sn=Math.sin(cy);
        return {x:a.x*cs-a.f*sn,f:-a.x*sn-a.f*cs};
      };
    }
    Engine.updateCamera=function(dt){
      const P=this.player.pos;
      if(this.camMode!==2){
        const hs=Math.hypot(this.player.vel.x,this.player.vel.z);
        if(hs>0.8)this.followYaw=Math.atan2(this.player.vel.x,this.player.vel.z);
        this.camYaw=lerpAngle(this.camYaw,this.followYaw+Math.PI,1-Math.exp(-2.5*dt));
      }
      const cp=Math.cos(this.camPitch),sp=Math.sin(this.camPitch),d=this.camDist;
      const target=new THREE.Vector3(P.x+Math.sin(this.camYaw)*cp*d,P.y+sp*d+1.2,P.z+Math.cos(this.camYaw)*cp*d);
      if(this.snapCam){this.camera.position.copy(target);this.snapCam=false;}
      else this.camera.position.lerp(target,1-Math.exp(-8*dt));
      let sh=null;
      if(this.shakeT>0){this.shakeT-=dt;const m=this.shakeM*Math.max(0,this.shakeT)*3;sh=new THREE.Vector3(U.rand(-m,m),U.rand(-m,m),0);this.camera.position.add(sh);}
      this.camera.lookAt(P.x,P.y+1.2,P.z);return sh;
    };
  }

  /* ---------------- COSMETICS: AURA + PET + EXTRA ITEMS ---------------- */
  function add=(g,sx,sy,sz,m,x,y,z)=>{const q=new THREE.Mesh(Engine.GEO.box,m);q.scale.set(sx,sy,sz);q.position.set(x,y,z);g.add(q);return q;};
  function buildPet(id){
    const g=new THREE.Group();
    if(id==='pet_dog'){
      const m=Engine.MAT('#8d6e63');
      add(g,.7,.45,1,m,0,.35,0);add(g,.5,.45,.5,m,0,.6,.6);
      add(g,.12,.3,.12,m,-.2,.5,.85);add(g,.12,.3,.12,m,.2,.5,.85);
      add(g,.15,.3,.15,m,-.2,.12,.3);add(g,.15,.3,.15,m,.2,.12,.3);
      add(g,.15,.15,.15,m,-.18,.12,-.3);add(g,.15,.15,.15,m,.18,.12,-.3);add(g,.12,.3,.12,m,0,.75,.45);
    }else if(id==='pet_cat'){
      const m=Engine.MAT('#bdbdbd');
      add(g,.55,.4,.9,m,0,.32,0);add(g,.45,.4,.45,m,0,.55,.55);
      add(g,.12,.2,.1,m,-.15,.8,.55);add(g,.12,.2,.1,m,.15,.8,.55);
      add(g,.12,.25,.12,m,-.15,.1,.25);add(g,.12,.25,.12,m,.15,.1,.25);
      add(g,.12,.25,.12,m,-.15,.1,-.25);add(g,.12,.25,.12,m,.15,.1,-.25);add(g,.1,.5,.1,m,0,.5,-.5);
    }else if(id==='pet_dragon'){
      const gmat=Engine.MAT('#43a047');
      add(g,.7,.55,1.1,gmat,0,.45,0);add(g,.5,.5,.5,gmat,0,.75,.65);
      const gold=Engine.MAT('#ffca28');add(g,.3,.3,.08,gold,-.09,.85,.9);add(g,.3,.3,.08,gold,.09,.85,.9);
      const wing=Engine.MAT('#2e7d32');add(g,.5,.6,.08,wing,-.5,.7,0);add(g,.5,.6,.08,wing,.5,.7,0);
      add(g,.16,.3,.16,gmat,-.2,.15,.3);add(g,.16,.3,.16,gmat,.2,.15,.3);add(g,.16,.3,.16,gmat,-.2,.15,-.3);add(g,.16,.3,.16,gmat,.2,.15,-.3);add(g,.15,.15,.6,gmat,0,.5,-.8);
    }else return null;
    return g;
  }

  if(typeof Engine!=='undefined'){
    const rawApply=Engine.applyCosmetics.bind(Engine);
    Engine.applyCosmetics=function(g){
      this.fxAura=null;
      rawApply(g);
      const eq=Store.data.equip||{};
      if(eq.hat==='viking'){
        const sil=this.MAT('#cfd8dc'),helm=new THREE.Mesh(new THREE.CylinderGeometry(.32,.36,.3,10),sil);helm.position.y=2;g.add(helm);
        [-1,1].forEach(s=>{const horn=new THREE.Mesh(new THREE.ConeGeometry(.09,.4,7),this.MAT('#efebe0'));horn.position.set(s*.36,2.15,0);horn.rotation.z=s*-.7;g.add(horn);});
      }else if(eq.hat==='wizard'){
        const pur=this.MAT('#7b2fbe'),brim=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,.05,14),pur);brim.position.y=1.94;g.add(brim);
        const cone=new THREE.Mesh(new THREE.ConeGeometry(.32,.7,12),pur);cone.position.y=2.3;g.add(cone);
      }else if(eq.hat==='cap'){
        const red=this.MAT('#e53935'),dome=new THREE.Mesh(new THREE.SphereGeometry(.32,10,8,0,Math.PI*2,0,Math.PI/2),red);dome.position.y=1.93;g.add(dome);
        const brim=new THREE.Mesh(this.GEO.box,red);brim.scale.set(.5,.06,.35);brim.position.set(0,1.94,.4);g.add(brim);
      }else if(eq.hat==='demon'){
        [-1,1].forEach(s=>{const horn=new THREE.Mesh(new THREE.ConeGeometry(.09,.45,7),this.MAT('#d32f2f'));horn.position.set(s*.24,2.12,0);horn.rotation.z=s*-.35;g.add(horn);});
      }
      if(eq.face==='visor'){const v=new THREE.Mesh(this.GEO.box,this.MATB('#00e5ff'));v.scale.set(.55,.14,.06);v.position.set(0,1.72,.28);g.add(v);}
      else if(eq.face==='mask_ninja'){const m=new THREE.Mesh(this.GEO.box,this.MAT('#23272e'));m.scale.set(.57,.2,.06);m.position.set(0,1.62,.28);g.add(m);}
      if(eq.back==='dragon_wings'){
        const wm=this.MAT('#b71c1c');[[-1,1],[1,-1]].forEach(s=>{const w=new THREE.Mesh(this.GEO.box,wm);w.scale.set(.7,1.1,.08);w.position.set(s[0]*.68,1.35,-.32);w.rotation.y=s[0]*.5;w.rotation.z=s[0]*-.25;g.add(w);});
      }else if(eq.back==='jetpack'){
        const gm=this.MAT('#90a4ae');[-1,1].forEach(s=>{const t=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.7,8),gm);t.position.set(s*.28,1.15,-.4);g.add(t);const f=new THREE.Mesh(new THREE.ConeGeometry(.12,.2,8),this.MATB('#ff7043'));f.rotation.x=Math.PI;f.position.set(s*.28,.75,-.4);g.add(f);});
      }else if(eq.back==='cape'){
        const c=new THREE.Mesh(this.GEO.box,this.MAT('#d32f2f'));c.scale.set(.8,1.1,.06);c.position.set(0,1.1,-.3);c.rotation.x=.1;g.add(c);
      }
      if(eq.aura==='aura_gold'||eq.aura==='aura_rainbow'){
        const r=new THREE.Mesh(new THREE.TorusGeometry(.9,.05,8,24),this.MATB(eq.aura==='aura_gold'?'#ffd32a':'#ff4da6'));
        r.rotation.x=Math.PI/2;r.position.y=.15;g.add(r);this.fxAura=r;
      }
      this.trailType=eq.trail||null;
    };
    const rawApplyChar=Engine.applyChar.bind(Engine);
    Engine.applyChar=function(i){
      if(this.pet){this.scene.remove(this.pet.grp);this.pet=null;}
      rawApplyChar(i);
      const pid=(Store.data.equip||{}).pet;
      if(pid){const pg=buildPet(pid);if(pg){this.scene.add(pg);this.pet={grp:pg};}}
    };
    const rawUpdateAvatar=Engine.updateAvatar.bind(Engine);
    Engine.updateAvatar=function(dt){
      rawUpdateAvatar(dt);
      if(this.fxAura){this.fxAura.rotation.z+=dt*2;const eq=Store.data.equip||{};if(eq.aura==='aura_rainbow')this.fxAura.material.color.setHSL((this.time*.4)%1,1,.6);}
      if(this.pet&&this.player){
        const P=this.player.pos,g=this.playerGroup,fy=g.rotation.y,tx=P.x-Math.sin(fy)*1.5,tz=P.z-Math.cos(fy)*1.5;
        this.pet.grp.position.x=U.lerp(this.pet.grp.position.x,tx,1-Math.exp(-3*dt));
        this.pet.grp.position.z=U.lerp(this.pet.grp.position.z,tz,1-Math.exp(-3*dt));
        this.pet.grp.position.y=Math.abs(Math.sin(this.time*4))*.12;
        this.pet.grp.rotation.y=Math.atan2(P.x-this.pet.grp.position.x,P.z-this.pet.grp.position.z);
      }
    };
    const rawTool=Engine.setTool.bind(Engine);
    Engine.setTool=function(type){
      rawTool(type);
      if(type==='rod' && this.limbs){
        if(this.toolObj&&this.toolObj.parent)this.toolObj.parent.remove(this.toolObj);
        const s=new THREE.Group();
        const h=new THREE.Mesh(this.GEO.box,this.MAT('#6d4c41'));h.scale.set(.1,1.3,.1);s.add(h);
        const t=new THREE.Mesh(this.GEO.box,this.MAT('#e53935'));t.scale.set(.08,.2,.08);t.position.y=.7;s.add(t);
        this.limbs.armR.add(s);s.position.set(0,-.6,.12);this.toolObj=s;this._tool=type;
      }
    };
  }

  /* ---------------- GAME PATCH HELPERS ---------------- */
  const byId=id=>typeof GAMES!=='undefined'?GAMES.find(g=>g.id===id):null;
  function wrap(id,fn){
    const m=byId(id);if(!m||typeof m.enter!=='function'||m.__featurePatch)return;
    const original=m.enter;m.enter=function(api){original(api);fn(api);};m.__featurePatch=true;
  }
  wrap('clicker',api=>{Engine.camMode=2;Engine.camDist=6;Engine.camPitch=.3;Engine.camYaw=0;if(api.onExit)api.onExit(()=>{Engine.camMode=0;Engine.camDist=9;Engine.camPitch=.35;});});
  ['boss','zombie'].forEach(id=>wrap(id,api=>{Engine.setTool('sword');if(api.onExit)api.onExit(()=>Engine.setTool(null));}));

  /* ---------------- 16) BALIK TUTMA ---------------- */
  if(typeof defGame==='function'&&!byId('fishing'))defGame({
    id:'fishing',name:'BALIK TUTMA',emoji:'🎣',color:'#29b6f6',desc:'Oltayı at, tam zamanında çek!',
    enter(api){
      Engine.setTool('rod');if(api.onExit)api.onExit(()=>Engine.setTool(null));
      W.env('#4aa8ff',35,110,'#dff3ff',true);W.killY=-4;
      let t=60,earned=0,done=false,state='idle',waitT=0,biteT=0;
      const FISH=[{n:'Çipura',v:5,c:'#90caf9',p:.5},{n:'Levrek',v:12,c:'#a5d6a7',p:.3},{n:'Kılıç Balığı',v:25,c:'#b39ddb',p:.14},{n:'EFSANE',v:60,c:'#ffd32a',p:.06}];
      W.box(0,-.5,4,10,1,12,'#8d6e63');W.box(0,-.4,-16,40,.3,26,'#1976d2');
      const fl=new THREE.Mesh(new THREE.SphereGeometry(.22,8,8),Engine.MATB('#ff1744'));fl.visible=false;W.mesh(fl);
      const ex=new THREE.Sprite(new THREE.SpriteMaterial({map:Engine.emojiTex('❗'),transparent:true,depthWrite:false}));ex.scale.set(1.2,1.2,1);ex.visible=false;W.mesh(ex);
      const pick=()=>{let r=Math.random();for(const f of FISH){if(r<f.p)return f;r-=f.p;}return FISH[0];};
      api.spawn(0,0,6);
      const cast=()=>{state='wait';waitT=U.rand(1.2,4);fl.visible=true;fl.position.set(U.rand(-1,1),.2,U.rand(-6,-4));ex.visible=false;Sfx.splash();};
      api.update(dt=>{if(done)return;t-=dt;if(t<=0){done=true;api.win(Math.floor(earned),10+Math.floor(earned/20),'$'+Math.floor(earned)+' kazandın! 🎣');return;}
        if(state==='wait'){waitT-=dt;fl.position.y=.2+Math.sin(Engine.time*4)*.08;if(waitT<=0){state='bite';biteT=.9;ex.visible=true;ex.position.set(fl.position.x,1.2,fl.position.z);Sfx.reel();}}
        else if(state==='bite'){biteT-=dt;fl.position.y=.2+Math.sin(Engine.time*20)*.2;if(biteT<=0){state='idle';fl.visible=false;ex.visible=false;api.toast('🐟 Kaçırdın!',1);}}
        if(Input.actionBuf>0){Input.actionBuf=0;if(state==='idle')cast();else if(state==='wait'){state='idle';fl.visible=false;api.toast('🎣 Çok erken!',1);}else{const f=pick();earned+=f.v;state='idle';fl.visible=false;ex.visible=false;Sfx.coin();FX.floatText(0,1.6,-2,'+'+f.v+' '+f.n,'#ffd32a');}}
        api.stat('⏱ '+Math.ceil(t)+'s | 💰 $'+Math.floor(earned));
      });
    }
  });

  /* ---------------- 17) BOMBA KİMDE ---------------- */
  if(typeof defGame==='function'&&!byId('bomb'))defGame({
    id:'bomb',name:'BOMBA KİMDE',emoji:'💣',color:'#ff5252',desc:'Bombayı üzerinde tutma!',
    enter(api){
      W.env('#3d2b52',25,75,'#6b4d8a',false);W.killY=-8;let hearts=3,round=0,done=false;const ROUNDS=5;
      W.box(0,-.5,0,22,1,22,'#5d4a72');const bots=[];for(let i=0;i<3;i++){const a=i/3*Math.PI*2,b=Bots.make(null,Math.cos(a)*5,Math.sin(a)*5);b.mode='manual';b.speed=4;b.alive=true;bots.push(b);}
      const bomb=new THREE.Mesh(new THREE.SphereGeometry(.45,10,8),Engine.MAT('#212121'));W.mesh(bomb);let holder=null,bombT=0,passCd=0;
      const alive=()=>bots.filter(b=>b.alive);const start=()=>{round++;holder=U.choice(['player',...alive()]);bombT=Math.max(4,11-round);passCd=1;api.big('💣 TUR '+round,'#ff5252',1.2);};
      const explode=()=>{const P=Engine.player;if(holder==='player'){FX.burst(P.pos.x,P.pos.y,P.pos.z,'#ff5252',24,9,1);Engine.shake(.6);hearts--;api.hearts(hearts,3);Engine.hurtFx();if(hearts<=0){done=true;api.lose('Bomba patladı! 💥',round*100,4);return;}}else if(holder&&holder.alive){holder.alive=false;holder.grp.visible=false;}
        if(round>=ROUNDS){done=true;api.win(300+hearts*60,25+hearts*5,hearts+' can ile hayatta!');return;}if(alive().length===0){done=true;api.win(400,35,'Tüm botları patlattın!');return;}start();};
      api.hearts(3,3);api.spawn(0,0,0);start();
      api.update(dt=>{if(done)return;bombT-=dt;passCd=Math.max(0,passCd-dt);const P=Engine.player;bots.forEach(b=>{if(!b.alive)return;let tx=U.rand(-8,8),tz=U.rand(-8,8);if(holder===b){const dx=b.pos.x-P.pos.x,dz=b.pos.z-P.pos.z,d=Math.hypot(dx,dz)||1;tx=b.pos.x+dx/d*3;tz=b.pos.z+dz/d*3;}Bots.stepTo(b,U.clamp(tx,-9,9),U.clamp(tz,-9,9),b.speed,dt);});
        if(passCd<=0&&holder==='player'){for(const b of bots)if(b.alive&&Math.hypot(b.pos.x-P.pos.x,b.pos.z-P.pos.z)<1.7){holder=b;passCd=1;break;}}
        if(passCd<=0&&holder&&holder.alive&&Math.hypot(holder.pos.x-P.pos.x,holder.pos.z-P.pos.z)<1.7){holder='player';passCd=1;}
        if(holder==='player')bomb.position.set(P.pos.x,P.pos.y+1.4,P.pos.z);else if(holder)bomb.position.set(holder.pos.x,holder.feetY+2.4,holder.pos.z);
        bomb.rotation.y+=dt*3;if(bombT<=0)explode();api.stat('💣 '+Math.max(0,bombT).toFixed(1)+'s | TUR '+round+'/'+ROUNDS);
      });
    }
  });

  /* ---------------- 18) HAZİNE AVI ---------------- */
  if(typeof defGame==='function'&&!byId('scavenger'))defGame({
    id:'scavenger',name:'HAZİNE AVI',emoji:'💎',color:'#ab47bc',desc:'Botlardan önce mücevherleri topla!',
    enter(api){
      W.env('#26345c',30,90,'#5a6fae',false);W.killY=-8;let t=45,pScore=0,done=false;W.box(0,-.5,0,26,1,26,'#4a5568');
      const gems=[];function spawnGem(){const type=Math.random()<.15?'diamond':'gem',color=type==='diamond'?'#4dd0e1':U.choice(['#ab47bc','#ec407a','#66bb6a','#ffa726']),m=new THREE.Mesh(new THREE.OctahedronGeometry(.4),Engine.MATB(color)),x=U.rand(-11,11),z=U.rand(-11,11);m.position.set(x,.9,z);W.mesh(m);gems.push({m,x,z,type,val:type==='diamond'?5:1});}
      for(let i=0;i<8;i++)spawnGem();const rb=[];for(let i=0;i<2;i++){const b=Bots.make(null,U.rand(-8,8),U.rand(-8,8));b.mode='manual';b.speed=4.2;b.score=0;rb.push(b);}const collect=(g,player)=>{const i=gems.indexOf(g);if(i>=0)gems.splice(i,1);Engine.scene.remove(g.m);Sfx.coin();if(player){pScore+=g.val;FX.floatText(g.x,1.6,g.z,'+'+g.val,'#ffd32a');}spawnGem();};
      api.spawn(0,0,0);api.update(dt=>{if(done)return;t-=dt;if(t<=0){done=true;let place=1;rb.forEach(b=>{if(b.score>pScore)place++;});api.win(300-place*60+pScore*10,15+pScore,place+'. oldun!');return;}const P=Engine.player;
        for(let i=gems.length-1;i>=0;i--){const g=gems[i];g.m.rotation.y+=dt*2;g.m.position.y=.9+Math.sin(Engine.time*3+i)*.15;if(Math.hypot(g.x-P.pos.x,g.z-P.pos.z)<1.2)collect(g,true);}
        rb.forEach(b=>{let best=null,bd=1e9;gems.forEach(g=>{const d=Math.hypot(g.x-b.pos.x,g.z-b.pos.z);if(d<bd){bd=d;best=g;}});if(best){const d=Bots.stepTo(b,best.x,best.z,b.speed,dt);if(d<1.1){b.score+=best.val;collect(best,false);}}});
        const mx=Math.max(rb[0].score,rb[1].score);api.stat('⏱ '+Math.ceil(t)+'s | 💎 SEN:'+pScore+' | 🤖 '+mx);
      });
    }
  });

  if(typeof GAMES!=='undefined'){
    /* GAMES was already rendered by the base file before this extension runs. */
  }
})();
