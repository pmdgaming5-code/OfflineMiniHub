/* ============================================================
   games-pack3.js — Oyun 31-40
   ============================================================ */
'use strict';

/* ============ 31) PROP HUNT ============ */
defGame({id:'prophunt'}, function(api){
  W.env('#3a4a3a',25,75,'#5a6a5a',false);
  W.killY=-8;
  let tl=60, hearts=3, done=false;
  let disguised=false, disguiseT=0, disguiseCd=0;
  W.box(0,-0.5,0,30,1,30,'#5a6a5a');
  for(let i=0;i<12;i++){
    const x=U.rand(-12,12), z=U.rand(-12,12);
    const type=U.randi(3);
    let m;
    if(type===0) m=new THREE.Mesh(Engine.GEO.box,Engine.MAT('#8d6e63'));
    else if(type===1) m=new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,1,8),Engine.MAT('#78909c'));
    else m=new THREE.Mesh(new THREE.ConeGeometry(0.6,1.2,8),Engine.MAT('#4caf50'));
    m.position.set(x,0.6,z); W.mesh(m);
  }
  const crate=new THREE.Mesh(Engine.GEO.box,Engine.MAT('#8d6e63'));
  crate.scale.set(1.2,1.2,1.2); crate.visible=false; W.mesh(crate);
  const seeker=Bots.make({skin:'#ff6b6b',shirt:'#c0392b',pants:'#7b241c'},0,0,'Avcı');
  seeker.mode='manual'; seeker.fallBelow=-100; seeker.speed=3;
  seeker.targetX=U.rand(-12,12); seeker.targetZ=U.rand(-12,12);
  api.hearts(3,3);
  api.spawn(10,0,10);
  let dmgCd=0;
  api.update(dt=>{
    if(done)return;
    tl-=dt; dmgCd=Math.max(0,dmgCd-dt); disguiseCd=Math.max(0,disguiseCd-dt);
    if(tl<=0){ done=true; api.win(500,30,'Saklanmayı başardın! 📦'); return; }
    const P=Engine.player;
    if(Input.actionBuf>0){
      Input.actionBuf=0;
      if(disguiseCd<=0 && !disguised){
        disguised=true; disguiseT=5; disguiseCd=8;
        Sfx.click();
        api.toast('📦 Saklandın! 5 sn',1);
      }
    }
    if(disguised){
      disguiseT-=dt;
      crate.visible=true;
      crate.position.set(P.pos.x,P.pos.y-HY+0.6,P.pos.z);
      if(disguiseT<=0){ disguised=false; crate.visible=false; }
    } else {
      crate.visible=false;
    }
    const dTarget=Math.hypot(seeker.targetX-seeker.pos.x,seeker.targetZ-seeker.pos.z);
    if(dTarget<1){ seeker.targetX=U.rand(-12,12); seeker.targetZ=U.rand(-12,12); }
    Bots.stepTo(seeker,seeker.targetX,seeker.targetZ,seeker.speed,dt);
    const ds=Math.hypot(seeker.pos.x-P.pos.x,seeker.pos.z-P.pos.z);
    const hs=Math.hypot(P.vel.x,P.vel.z);
    if(ds<3 && hs>1.5 && !disguised && dmgCd<=0){
      dmgCd=2;
      hearts--; api.hearts(hearts,3);
      Engine.hurtFx(); Engine.shake(0.4); Sfx.hit();
      api.toast('👀 Bulundun!',1);
      api.spawn(U.rand(-12,12),0,U.rand(-12,12));
      if(hearts<=0){ done=true; api.lose('Yakalandın! 📦',0,4); return; }
    }
    api.timer(Math.max(0,Math.ceil(tl)));
    api.stat('📦 Saklan!'+(disguised?' (GİZLİ)':disguiseCd>0?' CD:'+Math.ceil(disguiseCd):' ✋ saklan'));
  });
});

/* ============ 32) ARSENAL ============ */
defGame({id:'arsenal'}, function(api){
  W.env('#3d2b2b',25,75,'#5a3a3a',false);
  W.killY=-8;
  let wave=1, maxWave=3, kills=0, done=false, hearts=3;
  W.box(0,-0.5,0,30,1,30,'#6e5a5a');
  [[0,-15],[0,15],[-15,0],[15,0]].forEach((p,i)=>{
    if(i<2)W.box(p[0],0.6,p[1],30,1.2,0.7,'#4e3a3a');
    else W.box(p[0],0.6,p[1],0.7,1.2,30,'#4e3a3a');
  });
  Engine.setTool('sword');
  api.onExit(()=>Engine.setTool(null));
  const enemies=[];
  function spawnWave(n){
    const cnt=2+n;
    for(let i=0;i<cnt;i++){
      const a=U.rand(0,Math.PI*2);
      const x=Math.cos(a)*12, z=Math.sin(a)*12;
      const b=Bots.make({skin:'#ff6b6b',shirt:'#8b0000',pants:'#4a0000'},x,z,'Düşman'+U.randi(99));
      b.mode='manual'; b.fallBelow=-100; b.hp=20+n*10; b.spd=2+n*0.3; b.atk=U.rand(0.5,1.5);
      enemies.push(b);
    }
    api.big('🔫 DALGA '+n,'#c0392b',1.4);
    Sfx.trap();
  }
  function killEnemy(e){
    FX.burst(e.pos.x,e.feetY+1,e.pos.z,'#ff6b6b',16,7,0.8);
    Sfx.boom();
    if(e.grp.parent)Engine.scene.remove(e.grp);
    let i=Bots.all.indexOf(e); if(i>=0)Bots.all.splice(i,1);
    i=enemies.indexOf(e); if(i>=0)enemies.splice(i,1);
    kills++;
  }
  api.hearts(3,3);
  api.spawn(0,0,0);
  let atkCd=0, dmgCd=0;
  spawnWave(1);
  api.update(dt=>{
    if(done)return;
    atkCd=Math.max(0,atkCd-dt); dmgCd=Math.max(0,dmgCd-dt);
    const P=Engine.player;
    if(Input.actionBuf>0){
      Input.actionBuf=0;
      if(atkCd<=0){
        atkCd=0.4; Engine.punch=0.25;
        let hitAny=false;
        enemies.slice().forEach(e=>{
          const d=Math.hypot(e.pos.x-P.pos.x,e.pos.z-P.pos.z);
          if(d<3.5){
            hitAny=true; e.hp-=15; e.punchT=0.2;
            FX.burst(e.pos.x,e.feetY+1.2,e.pos.z,'#ffd32a',6,4,0.4);
            FX.floatText(e.pos.x,e.feetY+2.4,e.pos.z,'-15','#ffd32a');
            if(e.hp<=0) killEnemy(e);
          }
        });
        if(hitAny)Sfx.hit();
      }
    }
    enemies.slice().forEach(e=>{
      Bots.stepTo(e,P.pos.x,P.pos.z,e.spd,dt);
      e.atk-=dt;
      const d=Math.hypot(e.pos.x-P.pos.x,e.pos.z-P.pos.z);
      if(d<1.7&&e.atk<=0){
        e.atk=1.2; e.punchT=0.25;
        if(P.iframe<=0){
          hearts--; api.hearts(hearts,3);
          P.iframe=1;
          Engine.hurtFx(); Engine.shake(0.4); Sfx.hit();
          if(hearts<=0){ done=true; api.lose('Yenildin! 🔫',kills*10,4); return; }
        }
      }
    });
    if(enemies.length===0){
      if(wave>=maxWave){ done=true; api.win(500+kills*10,30,'Tüm dalgaları temizledin! 🔫'); return; }
      wave++;
      spawnWave(wave);
    }
    api.stat('🔫 DALGA '+wave+'/'+maxWave+' | 💀 '+kills);
  });
});

/* ============ 33) PRISON ESCAPE ============ */
defGame({id:'prison'}, function(api){
  W.env('#4a4a5c',25,75,'#5a5a6c',false);
  W.killY=-8;
  let keys=0, done=false;
  W.box(0,-0.5,0,30,1,30,'#6a6a7c');
  [[0,-15],[0,15],[-15,0],[15,0]].forEach((p,i)=>{
    if(i<2)W.box(p[0],0.6,p[1],30,1.2,0.7,'#4a4a5c');
    else W.box(p[0],0.6,p[1],0.7,1.2,30,'#4a4a5c');
  });
  for(let i=0;i<8;i++){
    W.box(U.rand(-12,12),0.75,U.rand(-12,12),U.rand(2,5),1.5,1,'#5a5a6c');
  }
  for(let i=0;i<3;i++){
    const x=U.rand(-12,12), z=U.rand(-12,12);
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:Engine.emojiTex('🔑'),transparent:true,depthWrite:false}));
    sp.scale.set(1,1,1); sp.position.set(x,1,z); W.mesh(sp);
    const c=W.box(x,1,z,1.2,1.5,1.2,'#000',{trigger:true});
    c.mesh=sp;
    c.cb=()=>{ if(c.disabled)return; keys++; Sfx.coin(); FX.floatText(x,1.8,z,'ANAHTAR '+keys+'/3','#ffd32a'); W.removeC(c);
      if(keys>=3){ api.toast('🔓 Kapı açık! Kaç!',1.5); }
    };
  }
  const exitPad=W.box(0,-0.5,-13,4,1,3,'#2ed573');
  exitPad.onLand=()=>{
    if(done)return;
    if(keys>=3){ done=true; api.win(500,30,'Hapisten kaçtın! 🔓'); }
    else { api.toast('🔒 '+keys+'/3 anahtar lazım',1); api.spawn(0,0,12); }
  };
  const guards=[];
  for(let i=0;i<2;i++){
    const b=Bots.make(null,U.rand(-8,8),U.rand(-8,8));
    b.mode='wander';
    b.wander={cx:0,cz:0,r:12,tx:U.rand(-10,10),tz:U.rand(-10,10),wait:U.rand(0,1)};
    b.speed=3; b.fallBelow=-100; b.respawnPos.set(U.rand(-10,10),0,U.rand(-10,10));
    guards.push(b);
  }
  api.spawn(0,0,12);
  let dmgCd=0;
  api.update(dt=>{
    if(done)return;
    dmgCd=Math.max(0,dmgCd-dt);
    const P=Engine.player;
    guards.forEach(b=>{
      const d=Math.hypot(b.pos.x-P.pos.x,b.pos.z-P.pos.z);
      if(d<1.5 && dmgCd<=0){
        dmgCd=2;
        Engine.hurtFx(); Engine.shake(0.4); Sfx.hit();
        api.toast('👮 Yakalandın! Başa dön',1.2);
        api.spawn(0,0,12);
      }
    });
    api.stat('🔑 '+keys+'/3'+(keys>=3?' KAÇ!':''));
  });
});

/* ============ 34) PIZZA USTASI ============ */
defGame({id:'pizza'}, function(api){
  W.env('#ffcc80',35,110,'#ffe0b2',true);
  W.killY=-8;
  let pizzas=0, target=5, done=false;
  let currentOrder=null, collected=[];
  W.box(0,-0.5,0,24,1,24,'#d7a86e');
  const toppings=[
    {e:'🍄',x:-8,z:-8},
    {e:'🧀',x:8,z:-8},
    {e:'🍖',x:-8,z:8},
    {e:'🫒',x:8,z:8}
  ];
  toppings.forEach(t=>{
    const m=new THREE.Mesh(Engine.GEO.box,Engine.MATB('#8d6e63'));
    m.scale.set(2,1,2); m.position.set(t.x,0.5,t.z); W.mesh(m);
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:Engine.emojiTex(t.e),transparent:true,depthWrite:false}));
    sp.scale.set(1.5,1.5,1); sp.position.set(t.x,1.8,t.z); W.mesh(sp);
    const c=W.box(t.x,1,t.z,2,2,2,'#000',{trigger:true});
    c.mesh=m; c.topping=t.e;
    c.cb=()=>{
      if(currentOrder && currentOrder.topping===t.e && collected.indexOf(t.e)<0){
        collected.push(t.e);
        Sfx.coin();
        FX.floatText(t.x,2,t.z,t.e+' alındı!','#2ed573');
      }
    };
  });
  const counter=W.box(0,-0.5,10,6,1,3,'#ffd32a');
  counter.onLand=()=>{
    if(done)return;
    if(currentOrder && collected.indexOf(currentOrder.topping)>=0){
      pizzas++;
      Sfx.win();
      FX.floatText(0,2,10,'🍕 Teslim! '+pizzas+'/'+target,'#ffd32a');
      currentOrder=null; collected=[];
      if(pizzas>=target){ done=true; api.win(500,30,target+' pizza yaptın! 🍕'); return; }
      newOrder();
    } else if(currentOrder){
      api.toast('Önce '+currentOrder.topping+' istasyonuna git!',1);
    }
  };
  function newOrder(){
    currentOrder={topping:U.choice(toppings).e};
    collected=[];
    api.toast('SİPARİŞ: '+currentOrder.topping+' pizzası yap!',1.5);
  }
  newOrder();
  api.spawn(0,0,0);
  api.update(dt=>{
    if(done)return;
    api.stat('🍕 '+pizzas+'/'+target+(currentOrder?' | Sipariş: '+currentOrder.topping:''));
  });
});

/* ============ 35) LUNAPARK TYCOON ============ */
defGame({id:'themepark'}, function(api){
  W.env('#ffb347',35,110,'#ffe4b5',true);
  W.killY=-30;
  let money=0, target=500, done=false;
  W.box(0,-0.5,0,36,1,36,'#7cb342');
  const rides=[];
  const gens=[];
  const RIDE_TYPES=[
    {n:'ATLI KARINCA',cost:30,income:2,e:'🎠'},
    {n:'DÖNME DOLAP',cost:80,income:5,e:'🎡'},
    {n:'ROLLER COASTER',cost:150,income:10,e:'🎢'}
  ];
  RIDE_TYPES.forEach((rt,i)=>{
    const x=-10+i*10, z=8;
    const pad=new THREE.Mesh(Engine.GEO.box,Engine.MATB('#2ed573'));
    pad.scale.set(3,0.15,3); pad.position.set(x,0.08,z); W.mesh(pad);
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:Engine.textTex(rt.e+' $'+rt.cost),transparent:true,depthWrite:false}));
    sp.scale.set(3,0.75,1); sp.position.set(x,2,z); W.mesh(sp);
    const it=api.interact(x,z,3,
      ()=>rides.some(r=>r.type===rt)?'✔ KURULU':(money>=rt.cost?'🛒 '+rt.n+' — $'+rt.cost:'🔒 $'+rt.cost+' lazım'),
      ()=>{
        if(done)return;
        if(rides.some(r=>r.type===rt))return;
        if(money<rt.cost)return;
        money-=rt.cost;
        it.dead=true;
        Engine.scene.remove(pad); Engine.scene.remove(sp);
        const m=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.5,2,12),Engine.MAT('#ff6b6b'));
        m.position.set(x,1,z-6); W.mesh(m);
        rides.push({type:rt,mesh:m});
        gens.push({income:rt.income,acc:0});
        Sfx.buy(); api.toast('🎡 '+rt.n+' kuruldu!');
        FX.burst(x,1,z-6,'#ffd32a',16,6,0.8);
      });
  });
  api.spawn(0,0,12);
  api.update(dt=>{
    if(done)return;
    gens.forEach(g=>{
      g.acc+=dt;
      if(g.acc>=2){
        g.acc=0;
        money+=g.income;
        FX.floatText(U.rand(-10,10),2,U.rand(-6,2),'+$'+g.income,'#ffd32a');
      }
    });
    rides.forEach(r=>{ r.mesh.rotation.y+=dt; });
    if(money>=target && !done){ done=true; api.win(500,35,'Lunapark kurdun! 🎡'); }
    api.stat('💰 $'+Math.floor(money)+'/$'+target+' | 🎡 '+rides.length+' atraksiyon');
  });
});

/* ============ 36) ARABA EZME ============ */
defGame({id:'carcrush'}, function(api){
  W.env('#90a4ae',30,95,'#cfd8dc',true);
  W.killY=-8;
  let crushed=0, target=15, hearts=3, done=false;
  W.box(0,-0.5,0,30,1,30,'#78909c');
  const cars=[];
  let spawnT=1;
  function spawnCar(){
    const m=new THREE.Mesh(Engine.GEO.box,Engine.MATB(U.choice(['#e74c3c','#3498db','#f1c40f','#2ecc71'])));
    m.scale.set(2,1,3);
    const side=U.randi(2);
    const x=side===0?-16:16;
    const z=U.rand(-12,12);
    m.position.set(x,0.5,z); W.mesh(m);
    cars.push({m:m,x:x,z:z,vx:side===0?6:-6,active:true});
  }
  api.hearts(3,3);
  api.spawn(0,0,0);
  let dmgCd=0;
  api.update(dt=>{
    if(done)return;
    dmgCd=Math.max(0,dmgCd-dt);
    const P=Engine.player;
    spawnT-=dt;
    if(spawnT<=0){ spawnT=Math.max(0.8,2-crushed*0.05); spawnCar(); }
    for(let i=cars.length-1;i>=0;i--){
      const c=cars[i];
      if(!c.active)continue;
      c.x+=c.vx*dt;
      c.m.position.x=c.x;
      if(Math.abs(c.x)>18){ Engine.scene.remove(c.m); cars.splice(i,1); continue; }
      const dx=Math.abs(c.x-P.pos.x), dz=Math.abs(c.z-P.pos.z);
      if(dx<1.5 && dz<2){
        const playerFeet=P.pos.y-HY;
        if(playerFeet>1.2 && P.vel.y<0){
          c.active=false; Engine.scene.remove(c.m); cars.splice(i,1);
          crushed++;
          Sfx.boom(); Engine.shake(0.3);
          FX.burst(c.x,0.5,c.z,'#ffd32a',16,7,0.7);
          FX.floatText(c.x,1.5,c.z,'EZDİN! +1','#ffd32a');
          P.vel.y=8;
          if(crushed>=target){ done=true; api.win(500,35,target+' araba ezdin! 🚗'); return; }
        } else if(dmgCd<=0){
          dmgCd=1.5;
          hearts--; api.hearts(hearts,3);
          Engine.hurtFx(); Engine.shake(0.4); Sfx.hit();
          if(hearts<=0){ done=true; api.lose('Arabalar seni ezdi! 🚗',crushed*10,4); return; }
        }
      }
    }
    api.stat('🚗 '+crushed+'/'+target+' | ❤️ '+hearts);
  });
});

/* ============ 37) RAGDOLL FİZİĞİ ============ */
defGame({id:'ragdoll'}, function(api){
  W.env('#81d4fa',35,110,'#e1f5fe',true);
  W.killY=-15;
  let coins=0, target=20, done=false;
  W.box(0,-0.5,0,30,1,30,'#aed581');
  [[-8,-8],[8,-8],[-8,8],[8,8],[0,0]].forEach(p=>{
    const c=W.box(p[0],-0.2,p[1],2.5,0.4,2.5,'#ff4081');
    c.isTramp=true;
  });
  const coinItems=[];
  function spawnAirCoin(){
    const x=U.rand(-12,12), z=U.rand(-12,12), y=U.rand(3,7);
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:Engine.emojiTex('🪙'),transparent:true,depthWrite:false}));
    sp.scale.set(1,1,1); sp.position.set(x,y,z); W.mesh(sp);
    const c={x:x,y:y,z:z,hx:0.8,hy:0.8,hz:0.8,mesh:sp,trigger:true,disabled:false,tag:null,cb:null,onLand:null};
    Engine.colliders.push(c);
    c.cb=()=>{ if(c.disabled)return; coins++; Sfx.coin(); FX.floatText(x,y,z,'+1','#ffd32a'); W.removeC(c);
      if(coins>=target && !done){ done=true; api.win(500,30,target+' coin topladın! 🎈'); }
    };
    coinItems.push(c);
  }
  for(let i=0;i<12;i++) spawnAirCoin();
  api.spawn(0,0,5);
  api.fall(()=>{ api.spawn(0,0,5); Sfx.hit(); });
  api.update(dt=>{
    if(done)return;
    const P=Engine.player;
    if(P.onGround && P.groundC && P.groundC.isTramp){
      P.vel.y=20;
      Sfx.jump();
      FX.ring(P.pos.x,0.3,P.pos.z,'#ff4081');
    }
    if(coinItems.filter(c=>!c.disabled).length<4){ spawnAirCoin(); }
    api.stat('🪙 '+coins+'/'+target+' | Zıpla ve topla!');
  });
});

/* ============ 38) TOP OBBY ============ */
defGame({id:'ballrun'}, function(api){
  W.env('#4aa8ff',35,110,'#dff3ff',true);
  W.killY=-8;
  let done=false;
  Engine.player.speed=9;
  api.onExit(()=>{ Engine.player.speed=7; });
  const mk=(x,y,z,w,d,c)=>W.box(x,y-0.5,z,w,1,d,c);
  mk(0,0,0,6,6,'#9aa7b8');
  let cp={x:0,y:0,z:0};
  const cols=['#ff9f43','#ee5a6f'];
  const S=[
    [0,0,-6,3,3,0],[2,0.4,-10,2.4,2.4,0],[4,0.8,-14,2.4,2.4,0],[4,1.2,-18,3,3,1],
    [1,1.6,-22,2.2,2.2,0],[-1,2,-26,2.2,2.2,2],[-3,2.4,-30,2.2,2.2,0],[-3,2.8,-34,3,3,1],
    [0,3.2,-38,2.2,2.2,0],[2,3.6,-42,2.2,2.2,0],[3,4,-46,3,3,9]
  ];
  S.forEach((s,i)=>{
    const x=s[0],y=s[1],z=s[2],w=s[3],d=s[4],flag=s[5];
    if(flag===2){
      W.mover(x,y-0.5,z,w,1,d,'#a29bfe',{axis:'x',amp:2,speed:1.5,phase:i});
      return;
    }
    const c=mk(x,y,z,w,d,flag===1?'#b8e986':(flag===9?'#ffd32a':cols[i%2]));
    if(flag===1){ c.onLand=()=>{ cp={x:x,y:y,z:z}; api.toast('✅ Checkpoint!'); }; }
    if(flag===9){ c.onLand=()=>{ if(done)return; done=true; api.win(500,30,'Top obby bitirdin! ⚽'); }; }
  });
  api.spawn(0,0,0);
  api.fall(()=>{ api.spawn(cp.x,cp.y,cp.z); Engine.hurtFx(); Sfx.hit(); });
  api.update(dt=>{
    const P=Engine.player;
    api.stat('⚽ Mesafe: '+Math.floor(Math.max(0,-P.pos.z))+'m');
  });
});

/* ============ 39) ONLY UP ============ */
defGame({id:'onlyup'}, function(api){
  W.env('#2b3a5c',25,85,'#4a5a7c',false);
  W.killY=-10;
  let done=false, maxY=0;
  W.box(0,-0.5,0,8,1,8,'#6a7a9c');
  let cp={x:0,y:0,z:0};
  const N=20;
  for(let i=1;i<=N;i++){
    const a=i*0.8;
    const x=Math.cos(a)*4, z=Math.sin(a)*4, y=i*1.8;
    const c=W.box(x,y-0.25,z,2.6,0.5,2.6,i%2?'#ff6b6b':'#4ecdc4');
    if(i%5===0){
      c.onLand=()=>{ cp={x:x,y:y,z:z}; api.toast('✅ Checkpoint! Kat '+i); };
    }
    if(i===N){
      c.onLand=()=>{ if(done)return; done=true; api.win(500,30,'Zirveye ulaştın! 🧗'); };
    }
  }
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.6,N*1.85+6,10),Engine.MAT('#3a4a6c'));
  pole.position.set(0,(N*1.85+6)/2,0); W.mesh(pole);
  api.spawn(0,0,0);
  api.fall(()=>{ api.spawn(cp.x,cp.y,cp.z); Engine.hurtFx(); Sfx.hit(); api.toast('💫 Düştün! Checkpointe dön',1); });
  api.update(dt=>{
    const P=Engine.player;
    maxY=Math.max(maxY,P.pos.y-HY);
    api.stat('🧗 '+Math.floor(maxY)+'m | Kat '+Math.floor(maxY/1.85)+'/'+N);
  });
});

/* ============ 40) HAFIZA EŞLEŞTİRME ============ */
defGame({id:'memory'}, function(api){
  W.env('#4a3a5c',25,75,'#5a4a6c',false);
  W.killY=-8;
  let done=false, moves=0;
  W.box(0,-0.5,0,20,1,20,'#6a5a7c');
  const emojis=['🍎','🍌','🍇','🍓'];
  let deck=[];
  emojis.forEach(e=>{ deck.push(e,e); });
  deck.sort(()=>Math.random()-0.5);
  let first=null, lock=false, matched=0;
  for(let i=0;i<8;i++){
    const row=Math.floor(i/4), col=i%4;
    const x=(col-1.5)*3, z=(row-0.5)*3;
    const c=W.box(x,-0.25,z,2.4,0.5,2.4,'#8a7a9c');
    c.emoji=deck[i]; c.revealed=false; c.matched=false;
    c.x=x; c.z=z;
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:Engine.emojiTex(deck[i]),transparent:true,depthWrite:false}));
    sp.scale.set(1.5,1.5,1); sp.position.set(x,1,z); sp.visible=false; W.mesh(sp);
    c.sprite=sp;
    c.onLand=()=>{
      if(lock||c.matched||c.revealed)return;
      c.revealed=true;
      c.sprite.visible=true;
      c.mesh.material=Engine.MATB('#ffd32a');
      Sfx.click();
      if(!first){
        first=c;
      } else {
        moves++;
        lock=true;
        const a=first, b=c;
        setTimeout(()=>{
          if(done)return;
          if(a.emoji===b.emoji){
            a.matched=true; b.matched=true;
            matched++;
            FX.burst(a.x,1,a.z,'#2ed573',10,5,0.6);
            FX.burst(b.x,1,b.z,'#2ed573',10,5,0.6);
            Sfx.coin();
            if(matched>=4){ done=true; api.win(Math.max(100,500-moves*10),30,matched+' eş buldun! '+moves+' hamle'); }
          } else {
            a.revealed=false; b.revealed=false;
            a.sprite.visible=false; b.sprite.visible=false;
            a.mesh.material=Engine.MAT('#8a7a9c');
            b.mesh.material=Engine.MAT('#8a7a9c');
          }
          first=null; lock=false;
        },1000);
      }
    };
  }
  api.spawn(0,0,8);
  api.update(dt=>{
    api.stat('🧠 '+matched+'/4 eş | '+moves+' hamle');
  });
});
