/* ============================================================
   games-pack2.js — Oyun 21-30
   ============================================================ */
'use strict';

/* ============ 21) KIRMIZI YEŞİL IŞIK ============ */
defGame({id:'redlight'}, function(api){
  W.env('#4aa8ff',35,110,'#dff3ff',true);
  W.killY=-8;
  let tl=45, done=false, green=true, lightT=0, nextSwitch=U.rand(2,4), redTime=0;
  let hearts=3;
  W.box(0,-0.5,-20,12,1,60,'#9aa7b8');
  const finishZ=-48;
  const fin=W.box(0,-0.5,finishZ,12,1,4,'#ffd32a');
  fin.onLand=()=>{ if(done)return; done=true; api.win(500,30,'Bitişe ulaştın! 🚦'); };
  const light=new THREE.Mesh(Engine.GEO.box,Engine.MATB('#2ecc71'));
  light.scale.set(1,1,1); light.position.set(0,4,5); W.mesh(light);
  const rb=[];
  for(let i=0;i<3;i++){
    const b=Bots.make(null,U.rand(-3,3),U.rand(-5,-2));
    b.mode='manual'; b.fallBelow=-8; b.speed=4;
    rb.push(b);
  }
  api.hearts(3,3);
  api.spawn(0,0,8);
  api.update(dt=>{
    if(done)return;
    tl-=dt;
    if(tl<=0){ done=true; api.lose('Süre doldu! 🚦',0,4); return; }
    lightT+=dt;
    if(lightT>=nextSwitch){
      lightT=0; green=!green;
      nextSwitch=green?U.rand(2,4):U.rand(1.5,3);
      light.material.color.setHex(green?0x2ecc71:0xff4d5e);
      api.toast(green?'🟢 YEŞİL! Koş!':'🔴 KIRMIZI! Dur!',0.8);
      Sfx.click();
    }
    if(!green) redTime+=dt; else redTime=0;
    const P=Engine.player;
    if(!green && redTime>0.4){
      const hs=Math.hypot(P.vel.x,P.vel.z);
      if(hs>2.0){
        hearts--; api.hearts(hearts,3);
        Engine.hurtFx(); Engine.shake(0.4); Sfx.hit();
        api.toast('🔴 Kıpırdadın! -1 can',1);
        redTime=0;
        if(hearts<=0){ done=true; api.lose('Elendin! 🔴',0,4); return; }
      }
    }
    rb.forEach(b=>{
      if(green){ Bots.stepTo(b,b.pos.x,finishZ,b.speed,dt); }
      else { Bots.physics(b,dt); Bots.anim(b,dt); }
      if(b.pos.z<finishZ+2){ b.pos.z=U.rand(-5,-2); b.pos.x=U.rand(-3,3); }
    });
    api.timer(Math.max(0,Math.ceil(tl)));
    api.stat(green?'🟢 KOŞ!':'🔴 DUR!');
  });
});

/* ============ 22) MURDER MYSTERY ============ */
defGame({id:'murder'}, function(api){
  W.env('#2b2b3d',25,75,'#4a4a5e',false);
  W.killY=-8;
  let tl=60, hearts=3, done=false, clues=0;
  W.box(0,-0.5,0,30,1,30,'#5a5a6e');
  [[0,-15],[0,15],[-15,0],[15,0]].forEach((p,i)=>{
    if(i<2)W.box(p[0],0.6,p[1],30,1.2,0.7,'#3e3e4e');
    else W.box(p[0],0.6,p[1],0.7,1.2,30,'#3e3e4e');
  });
  for(let i=0;i<8;i++){
    W.box(U.rand(-12,12),0.75,U.rand(-12,12),U.rand(1.5,3),1.5,U.rand(1.5,3),'#6e6e7e');
  }
  const murderer=Bots.make({skin:'#ff6b6b',shirt:'#8b0000',pants:'#4a0000'},8,8,'Katil');
  murderer.mode='manual'; murderer.fallBelow=-100; murderer.speed=3.5;
  for(let i=0;i<3;i++){
    const b=Bots.make(null,U.rand(-10,10),U.rand(-10,10));
    b.mode='wander';
    b.wander={cx:0,cz:0,r:12,tx:U.rand(-10,10),tz:U.rand(-10,10),wait:U.rand(0,2)};
    b.speed=2.5; b.fallBelow=-100; b.respawnPos.set(U.rand(-10,10),0,U.rand(-10,10));
  }
  for(let i=0;i<5;i++){
    const x=U.rand(-12,12), z=U.rand(-12,12);
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:Engine.emojiTex('🔍'),transparent:true,depthWrite:false}));
    sp.scale.set(1,1,1); sp.position.set(x,1,z); W.mesh(sp);
    const c=W.box(x,1,z,1.2,1.5,1.2,'#000',{trigger:true});
    c.mesh=sp;
    c.cb=()=>{ if(c.disabled)return; clues++; Sfx.coin(); FX.floatText(x,1.8,z,'İPUCU '+clues+'/5','#ffd32a'); W.removeC(c);
      if(clues>=5 && !done){ done=true; api.win(500,35,'Gizemi çözdün! 🔍'); }
    };
  }
  api.hearts(3,3);
  api.spawn(-10,0,-10);
  let dmgCd=0;
  api.update(dt=>{
    if(done)return;
    tl-=dt; dmgCd=Math.max(0,dmgCd-dt);
    if(tl<=0){ done=true; api.win(300+clues*40,20+clues*3,'Hayatta kaldın! '+clues+' ipucu'); return; }
    const P=Engine.player;
    Bots.stepTo(murderer,P.pos.x,P.pos.z,murderer.speed,dt);
    const dm=Math.hypot(murderer.pos.x-P.pos.x,murderer.pos.z-P.pos.z);
    if(dm<1.5 && dmgCd<=0){
      dmgCd=1.5;
      hearts--; api.hearts(hearts,3);
      Engine.hurtFx(); Engine.shake(0.5); Sfx.hit();
      api.toast('🔪 Katil seni yakaladı!',1);
      if(hearts<=0){ done=true; api.lose('Katil seni yakaladı! 🔪',clues*10,4); return; }
    }
    api.timer(Math.max(0,Math.ceil(tl)));
    api.stat('🔍 '+clues+'/5 | 🔪 Kaç!');
  });
});

/* ============ 23) KING OF THE HILL ============ */
defGame({id:'kinghill'}, function(api){
  W.env('#4aa8ff',35,110,'#dff3ff',true);
  W.killY=-8;
  let progress=0, done=false, tl=60;
  W.box(0,-0.5,0,24,1,24,'#9aa7b8');
  W.box(0,0.5,0,6,2,6,'#ffd32a');
  const rb=[];
  for(let i=0;i<3;i++){
    const a=i/3*Math.PI*2;
    const b=Bots.make(null,Math.cos(a)*8,Math.sin(a)*8);
    b.mode='manual'; b.fallBelow=-8; b.speed=3.5;
    rb.push(b);
  }
  api.spawn(0,0,10);
  api.update(dt=>{
    if(done)return;
    tl-=dt;
    if(tl<=0){
      if(progress>=100){ done=true; api.win(500,30,'Tepenin kralısın! 👑'); }
      else { done=true; api.lose('Süre doldu! %'+Math.floor(progress),Math.floor(progress)*5,4); }
      return;
    }
    const P=Engine.player;
    const onHill=Math.abs(P.pos.x)<3 && Math.abs(P.pos.z)<3 && P.pos.y-HY>1.0;
    if(onHill){ progress=Math.min(100,progress+dt*12); }
    if(progress>=100 && !done){ done=true; api.win(500,30,'Tepenin kralısın! 👑'); return; }
    rb.forEach(b=>{
      Bots.stepTo(b,0,0,b.speed,dt);
      const dx=P.pos.x-b.pos.x, dz=P.pos.z-b.pos.z;
      const d=Math.hypot(dx,dz);
      if(d<1.2&&d>0.001){ P.vel.x+=dx/d*6; P.vel.z+=dz/d*6; }
    });
    api.timer(Math.max(0,Math.ceil(tl)));
    api.stat('👑 %'+Math.floor(progress)+(onHill?' (TEPEDESİN!)':''));
  });
});

/* ============ 24) FREEZE TAG ============ */
defGame({id:'freezetag'}, function(api){
  W.env('#87ceeb',30,95,'#e0f7ff',true);
  W.killY=-8;
  let tl=60, done=false, freezes=0, frozenT=0;
  W.box(0,-0.5,0,26,1,26,'#e8f4f8');
  [[0,-13],[0,13],[-13,0],[13,0]].forEach((p,i)=>{
    if(i<2)W.box(p[0],0.6,p[1],26,1.2,0.6,'#b0d8e8');
    else W.box(p[0],0.6,p[1],0.7,1.2,26,'#b0d8e8');
  });
  const freezer=Bots.make({skin:'#80d8ff',shirt:'#00a8e8',pants:'#0077b6'},8,8,'Dondurucu');
  freezer.mode='manual'; freezer.fallBelow=-100; freezer.speed=3.8;
  freezer.freeTX=0; freezer.freeTZ=0;
  api.spawn(0,0,0);
  let dmgCd=0;
  api.onExit(()=>{ Engine.noMove=false; });
  api.update(dt=>{
    if(done)return;
    tl-=dt; dmgCd=Math.max(0,dmgCd-dt);
    if(tl<=0){ done=true; api.win(500-freezes*50,30-freezes*5,'Hayatta kaldın! ❄️'); return; }
    const P=Engine.player;
    if(frozenT>0){
      frozenT-=dt;
      P.vel.x=0; P.vel.z=0;
      Engine.noMove=true;
    } else {
      Engine.noMove=false;
    }
    const df=Math.hypot(freezer.pos.x-P.pos.x,freezer.pos.z-P.pos.z);
    if(df<1.5 && dmgCd<=0 && frozenT<=0){
      dmgCd=2;
      freezes++;
      frozenT=3;
      freezer.freeTX=U.rand(-10,10); freezer.freeTZ=U.rand(-10,10);
      Engine.hurtFx(); Sfx.hit();
      api.toast('❄️ Dondun! 3 saniye bekle',1);
      if(freezes>=3){ done=true; api.lose('Çok dondun! ❄️',0,4); return; }
    }
    if(frozenT>0){
      Bots.stepTo(freezer,freezer.freeTX,freezer.freeTZ,freezer.speed,dt);
    } else {
      Bots.stepTo(freezer,P.pos.x,P.pos.z,freezer.speed,dt);
    }
    api.timer(Math.max(0,Math.ceil(tl)));
    api.stat('❄️ '+freezes+'/3'+(frozenT>0?' DONMUŞ!':''));
  });
});

/* ============ 25) DODGEBALL ============ */
defGame({id:'dodgeball'}, function(api){
  W.env('#ff9d5c',30,95,'#ffe0b2',true);
  W.killY=-8;
  let tl=60, hearts=3, score=0, done=false;
  W.box(0,-0.5,0,16,1,30,'#e8a87c');
  const balls=[];
  let spawnT=1;
  function spawnBall(){
    const m=new THREE.Mesh(new THREE.SphereGeometry(0.4,10,8),Engine.MATB('#e74c3c'));
    const x=U.rand(-6,6);
    m.position.set(x,1,-14); W.mesh(m);
    balls.push({m:m,x:x,z:-14,vz:8+score*0.2,active:true,dodged:false});
  }
  api.hearts(3,3);
  api.spawn(0,0,8);
  let dmgCd=0;
  api.update(dt=>{
    if(done)return;
    tl-=dt; dmgCd=Math.max(0,dmgCd-dt);
    if(tl<=0){ done=true; api.win(300+score*10,20+Math.floor(score/2),score+' top atlattın! 🏐'); return; }
    const P=Engine.player;
    spawnT-=dt;
    if(spawnT<=0){ spawnT=Math.max(0.5,1.5-score*0.05); spawnBall(); }
    P.vel.x=U.approach(P.vel.x,Input.axis().x*8,60*dt);
    for(let i=balls.length-1;i>=0;i--){
      const b=balls[i];
      if(!b.active)continue;
      b.z+=b.vz*dt;
      b.m.position.z=b.z;
      const d=Math.hypot(b.x-P.pos.x,b.z-P.pos.z);
      if(d<1.0 && dmgCd<=0){
        b.active=false; Engine.scene.remove(b.m); balls.splice(i,1);
        dmgCd=1;
        hearts--; api.hearts(hearts,3);
        Engine.hurtFx(); Engine.shake(0.4); Sfx.hit();
        if(hearts<=0){ done=true; api.lose('Vuruldun! 🏐',score*10,4); return; }
        continue;
      }
      if(b.z>P.pos.z+2 && !b.dodged){
        b.dodged=true; score++;
        FX.floatText(b.x,1.5,b.z,'+1','#2ed573');
      }
      if(b.z>16){ Engine.scene.remove(b.m); balls.splice(i,1); }
    }
    api.timer(Math.max(0,Math.ceil(tl)));
    api.stat('🏐 '+score+' | ❤️ '+hearts);
  });
});

/* ============ 26) BAYRAK KAPMA ============ */
defGame({id:'ctf'}, function(api){
  W.env('#4aa8ff',35,110,'#dff3ff',true);
  W.killY=-8;
  let captures=0, done=false, hasFlag=false;
  W.box(0,-0.5,0,20,1,40,'#9aa7b8');
  W.box(0,-0.5,15,8,1,6,'#3ecf5a');
  W.box(0,-0.5,-15,8,1,6,'#ff4d5e');
  const flagObj=new THREE.Mesh(Engine.GEO.box,Engine.MATB('#ff4d5e'));
  flagObj.scale.set(0.3,1.5,0.3); flagObj.position.set(0,1,-15); W.mesh(flagObj);
  const rb=[];
  for(let i=0;i<2;i++){
    const b=Bots.make(null,U.rand(-5,5),U.rand(-10,-5));
    b.mode='manual'; b.fallBelow=-100; b.speed=3.5;
    rb.push(b);
  }
  api.spawn(0,0,15);
  let dmgCd=0;
  api.update(dt=>{
    if(done)return;
    dmgCd=Math.max(0,dmgCd-dt);
    const P=Engine.player;
    if(!hasFlag){
      const df=Math.hypot(flagObj.position.x-P.pos.x,flagObj.position.z-P.pos.z);
      if(df<1.5){
        hasFlag=true;
        flagObj.visible=false;
        api.toast('🚩 Bayrağı aldın! Üsse dön!',1.2);
        Sfx.coin();
      }
    }
    if(hasFlag){
      flagObj.visible=true;
      flagObj.position.set(P.pos.x,P.pos.y+1.5,P.pos.z);
      const db=Math.hypot(P.pos.x-0,P.pos.z-15);
      if(db<4){
        captures++;
        hasFlag=false;
        flagObj.visible=true;
        flagObj.position.set(0,1,-15);
        api.toast('🚩 Bayrak teslim! '+captures+'/3',1.2);
        Sfx.win();
        if(captures>=3){ done=true; api.win(500,35,'3 bayrak kaptın! 🚩'); return; }
      }
    }
    rb.forEach(b=>{
      if(hasFlag){
        Bots.stepTo(b,P.pos.x,P.pos.z,b.speed,dt);
        const d=Math.hypot(b.pos.x-P.pos.x,b.pos.z-P.pos.z);
        if(d<1.5 && dmgCd<=0){
          dmgCd=2;
          if(hasFlag){
            hasFlag=false;
            flagObj.visible=true;
            flagObj.position.set(0,1,-15);
            api.toast('💥 Yakalandın! Bayrak düştü',1.2);
            Engine.hurtFx(); Sfx.hit();
            api.spawn(0,0,15);
          }
        }
      } else {
        Bots.stepTo(b,0,-15,b.speed*0.6,dt);
      }
    });
    api.stat('🚩 '+captures+'/3'+(hasFlag?' BAYRAK SENDE!':''));
  });
});

/* ============ 27) JAILBREAK ============ */
defGame({id:'jailbreak'}, function(api){
  W.env('#3d4a5c',25,75,'#5a6a7c',false);
  W.killY=-8;
  let done=false;
  W.box(0,-0.5,-25,10,1,60,'#7a8a9c');
  for(let z=-5;z>=-50;z-=6){
    W.box(U.rand(-3,3),0.75,z,U.rand(2,4),1.5,1,'#5a6a7c');
  }
  const guards=[];
  for(let i=0;i<3;i++){
    const b=Bots.make(null,U.rand(-3,3),-10-i*12);
    b.mode='manual'; b.fallBelow=-100; b.speed=2.5;
    b.patrolT=U.rand(0,6);
    guards.push(b);
  }
  const exitZ=-55;
  const exit=W.box(0,-0.5,exitZ,10,1,4,'#2ed573');
  exit.onLand=()=>{ if(done)return; done=true; api.win(500,30,'Hapisten kaçtın! 🔓'); };
  api.spawn(0,0,2);
  let dmgCd=0;
  api.update(dt=>{
    if(done)return;
    dmgCd=Math.max(0,dmgCd-dt);
    const P=Engine.player;
    guards.forEach(b=>{
      b.patrolT+=dt;
      const tx=Math.sin(b.patrolT*b.speed)*4;
      Bots.stepTo(b,tx,b.pos.z,b.speed,dt);
      const d=Math.hypot(b.pos.x-P.pos.x,b.pos.z-P.pos.z);
      if(d<1.5 && dmgCd<=0){
        dmgCd=2;
        Engine.hurtFx(); Engine.shake(0.4); Sfx.hit();
        api.toast('👮 Gardiyan yakaladı! Başa dön',1.2);
        api.spawn(0,0,2);
      }
    });
    api.stat('🔓 Kaçış! Mesafe: '+Math.floor(Math.max(0,-P.pos.z))+'m');
  });
});

/* ============ 28) PET SIMULATOR ============ */
defGame({id:'petsim'}, function(api){
  W.env('#ffb6c1',35,110,'#ffe4e1',true);
  W.killY=-8;
  let coins=0, target=200, done=false, pets=0;
  W.box(0,-0.5,0,30,1,30,'#c8a2c8');
  const coinItems=[];
  const petBots=[];
  function hatchPet(){
    const b=Bots.make(null,Engine.player.pos.x,Engine.player.pos.z);
    b.mode='manual'; b.fallBelow=-100; b.speed=4;
    petBots.push(b);
    api.toast('🥚 Yeni pet! Toplam: '+pets,1.2);
    Sfx.level();
  }
  function spawnCoin(){
    const x=U.rand(-13,13), z=U.rand(-13,13);
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:Engine.emojiTex('🪙'),transparent:true,depthWrite:false}));
    sp.scale.set(0.9,0.9,1); sp.position.set(x,0.8,z); W.mesh(sp);
    const c=W.box(x,0.8,z,1.2,1.2,1.2,'#000',{trigger:true});
    c.mesh=sp;
    c.cb=()=>{ if(c.disabled)return; coins++; Sfx.coin(); FX.floatText(x,1.5,z,'+1','#ffd32a'); W.removeC(c);
      if(coins%10===0 && pets<5){ pets++; hatchPet(); }
      if(coins>=target && !done){ done=true; api.win(500,30,'Hedefe ulaştın! 🐾'); }
    };
    coinItems.push(c);
  }
  for(let i=0;i<15;i++) spawnCoin();
  api.spawn(0,0,0);
  let genT=0;
  api.update(dt=>{
    if(done)return;
    const P=Engine.player;
    genT+=dt;
    if(genT>=3 && pets>0){
      genT=0;
      const gen=pets*2;
      coins+=gen;
      FX.floatText(P.pos.x,P.pos.y+2,P.pos.z,'+'+gen+' 🐾','#ffd32a');
      Sfx.coin();
      if(coins>=target && !done){ done=true; api.win(500,30,'Hedefe ulaştın! 🐾'); return; }
    }
    petBots.forEach(b=>{ Bots.stepTo(b,P.pos.x,P.pos.z,b.speed,dt); });
    if(coinItems.filter(c=>!c.disabled).length<5){ spawnCoin(); }
    api.stat('🪙 '+coins+'/'+target+' | 🐾 '+pets+' pet');
  });
});

/* ============ 29) BAL TOPLAMA ============ */
defGame({id:'beeswarm'}, function(api){
  W.env('#ffd700',35,110,'#fff8dc',true);
  W.killY=-8;
  let honey=0, target=50, hearts=3, done=false;
  W.box(0,-0.5,0,28,1,28,'#7cb342');
  const flowers=[];
  function spawnFlower(){
    const x=U.rand(-12,12), z=U.rand(-12,12);
    const m=new THREE.Mesh(Engine.GEO.box,Engine.MATB(U.choice(['#ff69b4','#ff6347','#9370db'])));
    m.scale.set(0.6,0.5,0.6); m.position.set(x,0.3,z); W.mesh(m);
    const c=W.box(x,0.5,z,1.2,1.2,1.2,'#000',{trigger:true});
    c.mesh=m;
    c.cb=()=>{ if(c.disabled)return; honey+=2; Sfx.coin(); FX.floatText(x,1.2,z,'+2 🍯','#ffd700'); W.removeC(c);
      if(honey>=target && !done){ done=true; api.win(500,30,'Kovanı doldurdun! 🍯'); }
    };
    flowers.push(c);
  }
  for(let i=0;i<12;i++) spawnFlower();
  const bees=[];
  for(let i=0;i<3;i++){
    const m=new THREE.Mesh(new THREE.SphereGeometry(0.3,8,6),Engine.MATB('#ffd700'));
    m.position.set(U.rand(-10,10),1,U.rand(-10,10)); W.mesh(m);
    bees.push({m:m,x:m.position.x,z:m.position.z,spd:2+U.rand(0,1)});
  }
  api.hearts(3,3);
  api.spawn(0,0,0);
  let dmgCd=0;
  api.update(dt=>{
    if(done)return;
    dmgCd=Math.max(0,dmgCd-dt);
    const P=Engine.player;
    for(const b of bees){
      const dx=P.pos.x-b.x, dz=P.pos.z-b.z;
      const d=Math.hypot(dx,dz)||1;
      b.x+=dx/d*b.spd*dt;
      b.z+=dz/d*b.spd*dt;
      b.m.position.set(b.x,1+Math.sin(Engine.time*5)*0.2,b.z);
      if(d<1.0 && dmgCd<=0){
        dmgCd=1.5;
        hearts--; api.hearts(hearts,3);
        Engine.hurtFx(); Sfx.hit();
        api.toast('🐝 Sokuldun!',1);
        if(hearts<=0){ done=true; api.lose('Çok sokuldun! 🐝',honey,4); return; }
      }
    }
    if(flowers.filter(c=>!c.disabled).length<4){ spawnFlower(); }
    api.stat('🍯 '+honey+'/'+target+' | ❤️ '+hearts);
  });
});

/* ============ 30) SAKLAMBAÇ ============ */
defGame({id:'hide'}, function(api){
  W.env('#2b3a4a',25,75,'#4a5a6a',false);
  W.killY=-8;
  let tl=60, hearts=3, done=false;
  W.box(0,-0.5,0,30,1,30,'#5a6a7a');
  const spots=[];
  for(let i=0;i<10;i++){
    const x=U.rand(-12,12), z=U.rand(-12,12);
    const w=U.rand(1.5,3), d=U.rand(1.5,3);
    W.box(x,0.9,z,w,1.8,d,'#6a7a8a');
    spots.push({x:x,z:z});
  }
  const seeker=Bots.make({skin:'#ff6b6b',shirt:'#c0392b',pants:'#7b241c'},0,0,'Ebe');
  seeker.mode='manual'; seeker.fallBelow=-100; seeker.speed=3;
  seeker.targetX=U.rand(-12,12); seeker.targetZ=U.rand(-12,12);
  api.hearts(3,3);
  api.spawn(10,0,10);
  let dmgCd=0;
  api.update(dt=>{
    if(done)return;
    tl-=dt; dmgCd=Math.max(0,dmgCd-dt);
    if(tl<=0){ done=true; api.win(500,30,'Saklanmayı başardın! 🙈'); return; }
    const P=Engine.player;
    const dTarget=Math.hypot(seeker.targetX-seeker.pos.x,seeker.targetZ-seeker.pos.z);
    if(dTarget<1){ seeker.targetX=U.rand(-12,12); seeker.targetZ=U.rand(-12,12); }
    Bots.stepTo(seeker,seeker.targetX,seeker.targetZ,seeker.speed,dt);
    const ds=Math.hypot(seeker.pos.x-P.pos.x,seeker.pos.z-P.pos.z);
    const hs=Math.hypot(P.vel.x,P.vel.z);
    if(ds<3 && hs>2 && dmgCd<=0){
      dmgCd=2;
      hearts--; api.hearts(hearts,3);
      Engine.hurtFx(); Engine.shake(0.4); Sfx.hit();
      api.toast('👀 Bulundun! Saklan!',1);
      const s=U.choice(spots);
      api.spawn(s.x,0,s.z);
      if(hearts<=0){ done=true; api.lose('Çok bulundun! 👀',0,4); return; }
    }
    api.timer(Math.max(0,Math.ceil(tl)));
    api.stat('🙈 Saklan! | ❤️ '+hearts+(ds<4?' ⚠️ YAKIN!':''));
  });
});
