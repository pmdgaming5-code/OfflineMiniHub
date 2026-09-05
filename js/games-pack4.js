/* ============================================================
   games-pack4.js — Oyun 41-50
   ============================================================ */
'use strict';

/* ============ 41) KILIÇ ROYALE ============ */
defGame({id:'swordroyale'}, function(api){
  W.env('#5c3a2b',25,75,'#6a4a3a',false);
  W.killY=-8;
  let kills=0, done=false, hearts=3;
  W.box(0,-0.5,0,26,1,26,'#8a6a5a');
  [[0,-13],[0,13],[-13,0],[13,0]].forEach((p,i)=>{
    if(i<2)W.box(p[0],0.6,p[1],26,1.2,0.7,'#6a4a3a');
    else W.box(p[0],0.6,p[1],0.7,1.2,26,'#6a4a3a');
  });
  Engine.setTool('sword');
  api.onExit(()=>Engine.setTool(null));
  const fighters=[];
  for(let i=0;i<4;i++){
    const a=i/4*Math.PI*2;
    const x=Math.cos(a)*8, z=Math.sin(a)*8;
    const b=Bots.make(null,x,z);
    b.mode='manual'; b.fallBelow=-100; b.hp=30; b.spd=3; b.atk=U.rand(0.5,1.5);
    fighters.push(b);
  }
  api.hearts(3,3);
  api.spawn(0,0,0);
  let atkCd=0, dmgCd=0;
  api.update(dt=>{
    if(done)return;
    atkCd=Math.max(0,atkCd-dt); dmgCd=Math.max(0,dmgCd-dt);
    const P=Engine.player;
    if(Input.actionBuf>0){
      Input.actionBuf=0;
      if(atkCd<=0){
        atkCd=0.4; Engine.punch=0.25;
        let hitAny=false;
        fighters.slice().forEach(f=>{
          const d=Math.hypot(f.pos.x-P.pos.x,f.pos.z-P.pos.z);
          if(d<3.2){
            hitAny=true; f.hp-=12; f.punchT=0.2;
            FX.burst(f.pos.x,f.feetY+1.2,f.pos.z,'#ffd32a',6,4,0.4);
            FX.floatText(f.pos.x,f.feetY+2.4,f.pos.z,'-12','#ffd32a');
            if(f.hp<=0){
              FX.burst(f.pos.x,f.feetY+1,f.pos.z,'#ff6b6b',16,7,0.8);
              Sfx.boom();
              if(f.grp.parent)Engine.scene.remove(f.grp);
              let i=Bots.all.indexOf(f); if(i>=0)Bots.all.splice(i,1);
              let j=fighters.indexOf(f); if(j>=0)fighters.splice(j,1);
              kills++;
              if(fighters.length===0){ done=true; api.win(500+kills*20,35,'Son kalan sensin! ⚔️'); }
            }
          }
        });
        if(hitAny)Sfx.hit();
      }
    }
    fighters.slice().forEach(f=>{
      Bots.stepTo(f,P.pos.x,P.pos.z,f.spd,dt);
      f.atk-=dt;
      const d=Math.hypot(f.pos.x-P.pos.x,f.pos.z-P.pos.z);
      if(d<1.7&&f.atk<=0){
        f.atk=1.2; f.punchT=0.25;
        if(P.iframe<=0){
          hearts--; api.hearts(hearts,3);
          P.iframe=1;
          Engine.hurtFx(); Engine.shake(0.4); Sfx.hit();
          if(hearts<=0){ done=true; api.lose('Elendin! ⚔️',kills*20,4); return; }
        }
      }
    });
    api.stat('⚔️ Kalan: '+fighters.length+' | 💀 '+kills);
  });
});

/* ============ 42) OK SAVAŞI ============ */
defGame({id:'bowbattle'}, function(api){
  W.env('#2b4a3d',25,75,'#3a5a4a',false);
  W.killY=-8;
  let kills=0, target=12, hearts=3, done=false;
  W.box(0,-0.5,0,30,1,30,'#5a7a6a');
  [[0,-15],[0,15],[-15,0],[15,0]].forEach((p,i)=>{
    if(i<2)W.box(p[0],0.6,p[1],30,1.2,0.7,'#4a6a5a');
    else W.box(p[0],0.6,p[1],0.7,1.2,30,'#4a6a5a');
  });
  const enemies=[];
  const arrows=[];
  function spawnEnemy(){
    const a=U.rand(0,Math.PI*2);
    const x=Math.cos(a)*13, z=Math.sin(a)*13;
    const b=Bots.make({skin:'#ff6b6b',shirt:'#8b4513',pants:'#3e2723'},x,z,'Okçu'+U.randi(99));
    b.mode='manual'; b.fallBelow=-100; b.hp=15; b.spd=2.5;
    enemies.push(b);
  }
  for(let i=0;i<3;i++) spawnEnemy();
  api.hearts(3,3);
  api.spawn(0,0,0);
  let atkCd=0, dmgCd=0, spawnT=3;
  api.update(dt=>{
    if(done)return;
    atkCd=Math.max(0,atkCd-dt); dmgCd=Math.max(0,dmgCd-dt); spawnT-=dt;
    const P=Engine.player;
    if(spawnT<=0 && enemies.length<5 && kills<target){ spawnT=2.5; spawnEnemy(); }
    if(Input.actionBuf>0){
      Input.actionBuf=0;
      if(atkCd<=0){
        atkCd=0.5; Engine.punch=0.25;
        Sfx.tap();
        const yaw=Engine.playerGroup.rotation.y;
        const dx=Math.sin(yaw), dz=Math.cos(yaw);
        const m=new THREE.Mesh(Engine.GEO.box,Engine.MATB('#ffd32a'));
        m.scale.set(0.1,0.1,0.6);
        m.position.set(P.pos.x,P.pos.y+0.5,P.pos.z);
        W.mesh(m);
        arrows.push({m:m,x:P.pos.x,y:P.pos.y+0.5,z:P.pos.z,dx:dx,dz:dz,dist:0});
      }
    }
    for(let i=arrows.length-1;i>=0;i--){
      const a=arrows[i];
      a.x+=a.dx*20*dt; a.z+=a.dz*20*dt;
      a.dist+=20*dt;
      a.m.position.set(a.x,a.y,a.z);
      a.m.rotation.y=Math.atan2(a.dx,a.dz);
      let hit=false;
      for(let j=enemies.length-1;j>=0;j--){
        const e=enemies[j];
        const d=Math.hypot(e.pos.x-a.x,e.pos.z-a.z);
        if(d<1.2){
          e.hp-=15; e.punchT=0.2;
          FX.burst(e.pos.x,e.feetY+1.2,e.pos.z,'#ffd32a',6,4,0.4);
          FX.floatText(e.pos.x,e.feetY+2.4,e.pos.z,'-15','#ffd32a');
          hit=true;
          if(e.hp<=0){
            FX.burst(e.pos.x,e.feetY+1,e.pos.z,'#ff6b6b',16,7,0.8);
            Sfx.boom();
            if(e.grp.parent)Engine.scene.remove(e.grp);
            let k=Bots.all.indexOf(e); if(k>=0)Bots.all.splice(k,1);
            enemies.splice(j,1);
            kills++;
            if(kills>=target){ done=true; api.win(500,35,target+' okçu yendin! 🏹'); }
          }
          break;
        }
      }
      if(hit || a.dist>20){
        Engine.scene.remove(a.m);
        arrows.splice(i,1);
      }
    }
    enemies.slice().forEach(e=>{
      Bots.stepTo(e,P.pos.x,P.pos.z,e.spd,dt);
      const d=Math.hypot(e.pos.x-P.pos.x,e.pos.z-P.pos.z);
      if(d<1.7 && dmgCd<=0){
        dmgCd=1.2;
        if(P.iframe<=0){
          hearts--; api.hearts(hearts,3);
          P.iframe=1;
          Engine.hurtFx(); Engine.shake(0.4); Sfx.hit();
          if(hearts<=0){ done=true; api.lose('Okçular seni yendi! 🏹',kills*10,4); return; }
        }
      }
    });
    api.stat('🏹 '+kills+'/'+target+' | ❤️ '+hearts);
  });
});

/* ============ 43) YARIŞ ROYALE ============ */
defGame({id:'raceroyale'}, function(api){
  W.env('#4aa8ff',35,110,'#dff3ff',true);
  W.killY=-8;
  let done=false;
  const trackLen=60;
  W.box(0,-0.5,-trackLen/2,10,1,trackLen+10,'#9aa7b8');
  const finishZ=-trackLen;
  const racers=[];
  const fin=W.box(0,-0.5,finishZ,10,1,4,'#ffd32a');
  fin.onLand=()=>{
    if(done)return;
    done=true;
    let place=1;
    racers.forEach(r=>{ if(r.pos.z<finishZ+3) place++; });
    api.win(500-place*50,30,'Yarışı '+place+'. bitirdin! 🏎️');
  };
  for(let i=0;i<3;i++){
    const b=Bots.make(null,U.rand(-3,3),2);
    b.mode='manual'; b.fallBelow=-100; b.speed=4+U.rand(0,1.5);
    racers.push(b);
  }
  api.spawn(0,0,2);
  api.update(dt=>{
    if(done)return;
    const P=Engine.player;
    racers.forEach(r=>{
      if(r.pos.z>finishZ+2) Bots.stepTo(r,r.pos.x,finishZ,r.speed,dt);
      else { Bots.physics(r,dt); Bots.anim(r,dt); }
    });
    api.stat('🏎️ '+Math.floor(Math.max(0,-P.pos.z))+'/'+trackLen+'m');
  });
});

/* ============ 44) PLATFORM BULMACA ============ */
defGame({id:'puzzle'}, function(api){
  W.env('#3a3a5c',25,75,'#4a4a6c',false);
  W.killY=-10;
  let done=false;
  W.box(0,-0.5,1,8,1,8,'#6a6a8c');
  const goal=W.box(0,-0.5,-38,8,1,6,'#ffd32a');
  goal.onLand=()=>{ if(done)return; done=true; api.win(500,30,'Bulmacayı çözdün! 🧩'); };
  const toggles=[];
  for(let i=0;i<9;i++){
    const z=-5-i*3.5;
    const x=(i%2===0?-1.5:1.5);
    const c=W.box(x,-0.25,z,3,0.5,3,'#4ecdc4');
    c.togglePhase=i*0.6;
    c.on=true;
    toggles.push(c);
  }
  api.spawn(0,0,1);
  api.fall(()=>{ api.spawn(0,0,1); Engine.hurtFx(); Sfx.hit(); });
  api.update(dt=>{
    if(done)return;
    const t=Engine.time;
    toggles.forEach(c=>{
      const on=Math.sin(t*1.5+c.togglePhase)>-0.3;
      if(on!==c.on){
        c.on=on;
        c.disabled=!on;
        c.mesh.visible=on;
      }
    });
    api.stat('🧩 Platformlar yanıp sönüyor!');
  });
});

/* ============ 45) MÜZİKAL SANDALYE ============ */
defGame({id:'musical'}, function(api){
  W.env('#ff9d5c',35,95,'#ffe0b2',true);
  W.killY=-8;
  let round=1, maxRound=5, hearts=3, done=false;
  let musicOn=true, musicT=0, nextStop=U.rand(3,6);
  W.box(0,-0.5,0,24,1,24,'#e8b87c');
  const chairs=[];
  function setupRound(){
    chairs.forEach(c=>W.removeC(c));
    chairs.length=0;
    const numChairs=maxRound-round+1;
    for(let i=0;i<numChairs;i++){
      const a=i/numChairs*Math.PI*2;
      const x=Math.cos(a)*6, z=Math.sin(a)*6;
      const c=W.box(x,0.25,z,2,0.5,2,'#ffd32a');
      c.isChair=true;
      chairs.push(c);
    }
    musicOn=true; musicT=0; nextStop=U.rand(3,6);
    api.toast('🎵 Müzik çalıyor! Sandalyeye hazırlan!',1.2);
  }
  api.hearts(3,3);
  api.spawn(0,0,0);
  setupRound();
  api.update(dt=>{
    if(done)return;
    const P=Engine.player;
    if(musicOn){
      musicT+=dt;
      if(musicT>=nextStop){
        musicOn=false;
        api.big('🛑 MÜZİK DURDU!','#ff4d5e',1.5);
        Sfx.trap();
        let onChair=false;
        chairs.forEach(c=>{
          if(!c.disabled && Math.abs(P.pos.x-c.x)<c.hx+0.4 && Math.abs(P.pos.z-c.z)<c.hz+0.4 && Math.abs((P.pos.y-HY)-(c.y+c.hy))<0.5){
            onChair=true;
          }
        });
        if(onChair){
          api.toast('✅ Sandalyedesin! Tur '+round,1.2);
          Sfx.coin();
          round++;
          if(round>maxRound){ done=true; api.win(500,30,'Tüm turları geçtin! 🪑'); return; }
          setTimeout(()=>{ if(!done) setupRound(); },1500);
        } else {
          hearts--; api.hearts(hearts,3);
          Engine.hurtFx(); Sfx.hit();
          api.toast('🛑 Sandalye bulamadın! -1 can',1.2);
          if(hearts<=0){ done=true; api.lose('Sandalye kalmadı! 🪑',round*20,4); return; }
          setTimeout(()=>{ if(!done) setupRound(); },1500);
        }
      }
    }
    api.stat('🪑 Tur '+round+'/'+maxRound+' | '+(musicOn?'🎵 Çalıyor...':'🛑 DUR!'));
  });
});

/* ============ 46) AFET SURVIVAL 2 ============ */
defGame({id:'naturdis2'}, function(api){
  W.env('#5c3a3a',25,80,'#7a4a4a',false);
  W.killY=-30;
  let tl=60, hearts=5, inv=0, done=false;
  W.box(0,-0.5,0,26,1,26,'#8d6e5f');
  [[0,-13],[0,13],[-13,0],[13,0]].forEach((p,i)=>{
    if(i<2)W.box(p[0],0.6,p[1],26,1.2,0.6,'#5d4636');
    else W.box(p[0],0.6,p[1],0.6,1.2,26,'#5d4636');
  });
  const meteors=[];
  let spawnT=1;
  let tornadoX=-10, tornadoZ=-10;
  const tornado=new THREE.Mesh(new THREE.ConeGeometry(1.5,4,12),new THREE.MeshBasicMaterial({color:'#b0bec5',transparent:true,opacity:0.6}));
  tornado.position.set(tornadoX,2,tornadoZ); W.mesh(tornado);
  api.hearts(5,5);
  api.spawn(0,0,0);
  function damage(){
    if(inv>0)return;
    hearts--; api.hearts(hearts,5);
    inv=1; Engine.hurtFx(); Engine.shake(0.5); Sfx.hit();
    if(hearts<=0){ done=true; api.lose('Afetler seni yakaladı! 🌪️',Math.floor((60-tl))*2,4); }
  }
  api.update(dt=>{
    if(done)return;
    tl-=dt; inv=Math.max(0,inv-dt);
    if(tl<=0){ done=true; api.win(100+hearts*50,15+hearts*4,hearts+' can ile hayatta kaldın!'); return; }
    const P=Engine.player;
    spawnT-=dt;
    if(spawnT<=0){
      spawnT=Math.max(0.5,1.5-(60-tl)*0.015);
      const x=U.rand(-11,11), z=U.rand(-11,11);
      const ring=new THREE.Mesh(new THREE.RingGeometry(2,2.4,26),new THREE.MeshBasicMaterial({color:'#ff2020',transparent:true,opacity:0.9,side:THREE.DoubleSide,depthWrite:false}));
      ring.rotation.x=-Math.PI/2; ring.position.set(x,0.08,z); W.mesh(ring);
      meteors.push({x:x,z:z,t:0,ring:ring});
    }
    for(let i=meteors.length-1;i>=0;i--){
      const m=meteors[i]; m.t+=dt;
      m.ring.material.opacity=0.5+0.5*Math.abs(Math.sin(m.t*12));
      if(m.t>=1){
        FX.burst(m.x,0.5,m.z,'#ff9f43',18,8,0.8);
        FX.ring(m.x,0.1,m.z,'#ff4d00');
        Engine.shake(0.3); Sfx.boom();
        if(Math.hypot(P.pos.x-m.x,P.pos.z-m.z)<2.5 && P.y<3) damage();
        Engine.scene.remove(m.ring);
        meteors.splice(i,1);
      }
    }
    const dx=P.pos.x-tornadoX, dz=P.pos.z-tornadoZ;
    const d=Math.hypot(dx,dz)||1;
    tornadoX+=dx/d*2.5*dt;
    tornadoZ+=dz/d*2.5*dt;
    tornado.position.set(tornadoX,2,tornadoZ);
    tornado.rotation.y+=dt*10;
    if(Math.hypot(P.pos.x-tornadoX,P.pos.z-tornadoZ)<2.2){ damage(); }
    api.timer(Math.max(0,Math.ceil(tl)));
    api.stat('❤️ '+hearts+' | 🌪️ Kaç!');
  });
});

/* ============ 47) OBBY KULESİ ============ */
defGame({id:'obbytower'}, function(api){
  W.env('#4aa8ff',35,100,'#dff3ff',true);
  W.killY=-8;
  let done=false;
  W.box(0,-0.5,0,10,1,10,'#9aa7b8');
  let cp={x:0,y:0,z:0};
  const N=18;
  for(let i=1;i<=N;i++){
    const a=i*0.9;
    const x=Math.cos(a)*5, z=Math.sin(a)*5, y=i*1.7;
    const c=W.box(x,y-0.25,z,3,0.5,3,i%2?'#ff9f43':'#4ecdc4');
    if(i%6===0){
      c.onLand=()=>{ cp={x:x,y:y,z:z}; api.toast('✅ Checkpoint! Kat '+i); };
    }
    if(i===N){
      c.onLand=()=>{ if(done)return; done=true; api.win(500,30,'Kuleyi tırmandın! 🏗️'); };
    }
  }
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.7,0.7,N*1.7+6,10),Engine.MAT('#5a6a8c'));
  pole.position.set(0,(N*1.7+6)/2,0); W.mesh(pole);
  api.spawn(0,0,0);
  api.fall(()=>{ api.spawn(cp.x,cp.y,cp.z); Engine.hurtFx(); Sfx.hit(); });
  api.update(dt=>{
    const P=Engine.player;
    api.stat('🏗️ Kat '+Math.floor(Math.max(0,(P.pos.y-HY)/1.7))+'/'+N);
  });
});

/* ============ 48) COIN KOŞUSU ============ */
defGame({id:'coinrush'}, function(api){
  W.env('#ffd700',35,110,'#fff8dc',true);
  W.killY=-8;
  let tl=45, score=0, done=false;
  W.box(0,-0.5,0,30,1,30,'#c8a24a');
  const coinItems=[];
  function spawnCoin(){
    const x=U.rand(-13,13), z=U.rand(-13,13);
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:Engine.emojiTex('🪙'),transparent:true,depthWrite:false}));
    sp.scale.set(0.9,0.9,1); sp.position.set(x,0.8,z); W.mesh(sp);
    const c=W.box(x,0.8,z,1.2,1.2,1.2,'#000',{trigger:true});
    c.mesh=sp;
    c.cb=()=>{ if(c.disabled)return; score++; Sfx.coin(); FX.floatText(x,1.5,z,'+1','#ffd32a'); W.removeC(c); spawnCoin(); };
    coinItems.push(c);
  }
  for(let i=0;i<12;i++) spawnCoin();
  const rb=[];
  for(let i=0;i<2;i++){
    const b=Bots.make(null,U.rand(-10,10),U.rand(-10,10));
    b.mode='manual'; b.fallBelow=-100; b.speed=4; b.score=0; b.target=null;
    rb.push(b);
  }
  api.spawn(0,0,0);
  api.update(dt=>{
    if(done)return;
    tl-=dt;
    if(tl<=0){
      done=true;
      let place=1; rb.forEach(b=>{ if(b.score>score)place++; });
      api.win(300-place*40+score*5,15+(3-place)*8+Math.floor(score/2),place+'. oldun! '+score+' coin');
      return;
    }
    const P=Engine.player;
    rb.forEach(b=>{
      if(!b.target||b.target.disabled){
        let best=null, bd=1e9;
        coinItems.forEach(c=>{ if(c.disabled)return; const d=Math.hypot(c.x-b.pos.x,c.z-b.pos.z); if(d<bd){bd=d;best=c;} });
        b.target=best;
      }
      if(b.target){
        const d=Bots.stepTo(b,b.target.x,b.target.z,b.speed,dt);
        if(d<1.1){
          b.score++;
          if(!b.target.disabled){ b.target.disabled=true; if(b.target.mesh)Engine.scene.remove(b.target.mesh); W.removeC(b.target); spawnCoin(); }
          b.target=null;
        }
      } else { Bots.physics(b,dt); Bots.anim(b,dt); }
    });
    if(Math.random()<0.01){ for(let i=coinItems.length-1;i>=0;i--){ if(coinItems[i].disabled) coinItems.splice(i,1); } }
    api.timer(Math.max(0,Math.ceil(tl)));
    api.stat('🪙 SEN:'+score+' | 🤖 '+Math.max(rb[0].score,rb[1].score));
  });
});

/* ============ 49) LAV ZEMINI 2 ============ */
defGame({id:'lavafloor'}, function(api){
  W.env('#3a1010',20,70,'#7a2f1f',false);
  W.killY=-6;
  let round=0, maxRound=7, done=false;
  const COLS=[
    {n:'KIRMIZI',c:'#ff4757'},{n:'MAVİ',c:'#3b82f6'},{n:'SARI',c:'#ffd32a'},
    {n:'YEŞİL',c:'#2ed573'},{n:'MOR',c:'#a55eea'}
  ];
  const tiles=[], tilePos=[[],[],[],[],[]];
  for(let i=0;i<7;i++)for(let j=0;j<7;j++){
    const ci=U.randi(5);
    const x=(i-3)*2, z=(j-3)*2;
    const c=W.box(x,-0.25,z,1.9,0.5,1.9,COLS[ci].c);
    c.ci=ci; tiles.push(c);
    tilePos[ci].push({x:x,z:z});
  }
  let phase='show', pt=0, target=0, restored=[];
  const startRound=()=>{
    round++; target=U.randi(5); phase='show'; pt=2.5;
    api.big(COLS[target].n+'!',COLS[target].c,2.5);
    Sfx.click();
  };
  startRound();
  api.spawn(0,0,0);
  api.fall(()=>{ done=true; api.lose('Yanlış renk! '+(round-1)+' tur',(round-1)*100,(round-1)*6); });
  api.update(dt=>{
    if(done)return;
    pt-=dt;
    for(const c of tiles){
      if(c.animDown){ const s=Math.max(0.05,c.mesh.scale.y-dt*3); c.mesh.scale.y=s; c.mesh.position.y=-0.5+0.25*s; }
      else if(c.animUp){ const s=Math.min(1,c.mesh.scale.y+dt*3); c.mesh.scale.y=s; c.mesh.position.y=-0.5+0.25*s; if(s>=1)c.animUp=false; }
    }
    for(let i=restored.length-1;i>=0;i--){
      const c=restored[i]; const P=Engine.player.pos;
      if(Math.abs(P.x-c.x)>1.4||Math.abs(P.z-c.z)>1.4){ c.disabled=false; c.animUp=true; restored.splice(i,1); }
    }
    if(phase==='show'&&pt<=0){
      phase='drop'; pt=2.2;
      tiles.forEach(c=>{ if(c.ci!==target){ c.disabled=true; c.animDown=true; } });
      Sfx.trap();
    } else if(phase==='drop'&&pt<=0){
      if(round>=maxRound){ done=true; api.win(500,30,maxRound+' tur hayatta kaldın! 🔥'); return; }
      phase='restore'; pt=1;
      tiles.forEach(c=>{
        if(c.disabled){
          const P=Engine.player.pos;
          if(Math.abs(P.x-c.x)<1.4&&Math.abs(P.z-c.z)<1.4) restored.push(c);
          else{ c.disabled=false; c.animUp=true; }
          c.animDown=false;
        }
      });
    } else if(phase==='restore'&&pt<=0){
      startRound();
    }
    api.stat('🔥 Tur '+round+'/'+maxRound);
  });
});

/* ========= 50) FİNAL GAUNTLET ============ */  
defGame({id:'gauntlet'}, function(api){  
  W.env('#2b1230',25,75,'#5a1f2a',false);  
  W.killY=-10;  
  let phase=1, done=false;  
  let hearts=5, score=0;  
  let cp={x:0,y:0,z:0};  
  W.box(0,-0.5,0,20,1,20,'#6b4226');  
  api.hearts(5,5);  
  api.spawn(0,0,0);  
  let phaseT=0;  
  api.big('BÖLÜM 1/3: OBBY','#ffd32a',2);  
  const mk=(x,y,z,w,d,c)=>W.box(x,y-0.5,z,w,1,d,c);  
  mk(0,0,0,6,6,'#9aa7b8');  
  const S=[  
    [0,0,-6,3,3,0],[2,0.4,-10,2.4,2.4,0],[4,0.8,-14,2.4,2.4,0],[4,1.2,-18,3,3,1],  
    [1,1.6,-22,2.2,2.2,0],[-1,2,-26,2.2,2.2,2],[-3,2.4,-30,2.2,2.2,0],[-3,2.8,-34,3,3,1],  
    [0,3.2,-38,2.2,2.2,0],[2,3.6,-42,2.2,2.2,0],[3,4,-46,3,3,9]  
  ];  
  const cols=['#ff9f43','#ee5a6f'];  
  S.forEach((s,i)=>{  
    const x=s[0],y=s[1],z=s[2],w=s[3],d=s[4],flag=s[5];  
    if(flag===2){  
      W.mover(x,y-0.5,z,w,1,d,'#a29bfe',{axis:'x',amp:2,speed:1.5,phase:i});  
      return;  
    }  
    const c=mk(x,y,z,w,d,flag===1?'#b8e986':(flag===9?'#ffd32a':cols[i%2]));  
    if(flag===1){ c.onLand=()=>{ cp={x:x,y:y,z:z}; }; }  
    if(flag===9){ c.onLand=()=>{ if(phase===1){ phase=2; api.big('BÖLÜM 2/3: BOSS','#ff4d5e',2); api.spawn(0,0,0); Engine.setTool('sword'); } }; }  
  });  
  api.fall(()=>{  
    hearts--; api.hearts(hearts,5);  
    Engine.hurtFx(); Sfx.hit();  
    if(hearts<=0){ done=true; api.lose('Gauntlet seni yendi! 🏆',score,4); return; }  
    if(phase===1) api.spawn(cp.x,cp.y,cp.z);  
    else if(phase===2) api.spawn(0,0,7);  
  });  
  let bossHp=150, bossMaxHp=150, atkCd=0, bossState='chase', bossT=0, bossDead=false;  
  let boss;  
  let coinCount=0, coinT=0;  
  const coins=[];  
  api.update(dt=>{  
    if(done)return;  
    const P=Engine.player;  
    phaseT+=dt;  
    if(phase===1){  
      api.stat('BÖLÜM 1: OBBY | Bitişe ulaş!');  
    } else if(phase===2){  
      atkCd=Math.max(0,atkCd-dt);  
      if(!boss){  
        boss=new THREE.Group();  
        const body=new THREE.Mesh(Engine.GEO.box,Engine.MAT('#c0392b'));  
        body.scale.set(1.5,1.8,1.2); body.position.y=1.8; boss.add(body);  
        const head=new THREE.Mesh(Engine.GEO.box,Engine.MAT('#e74c3c'));  
        head.scale.set(1,1,1); head.position.y=3; boss.add(head);  
        boss.position.set(0,0,-6);  
        Engine.scene.add(boss);  
      }  
      if(Input.actionBuf>0){  
        Input.actionBuf=0;  
        if(atkCd<=0){  
          atkCd=0.4; Engine.punch=0.25;  
          const d=Math.hypot(boss.position.x-P.pos.x,boss.position.z-P.pos.z);  
          if(d<3.5){  
            bossHp-=10;  
            Sfx.hit(); Engine.shake(0.15);  
            FX.burst(boss.position.x,2,boss.position.z,'#ffd32a',8,5,0.5);  
            FX.floatText(boss.position.x,3.8,boss.position.z,'-10','#ff4d5e');  
            HUD.boss(Math.max(0,bossHp)/bossMaxHp);  
            if(bossHp<=0 && !bossDead){  
              bossDead=true;  
              if(boss.parent)Engine.scene.remove(boss);  
              FX.confetti(boss.position.x,boss.position.y+2,boss.position.z);  
              api.toast('👹 BOSS YENİLDİ! Bölüm 3 başlıyor!',1.5);  
              phase=3;  
              api.big('BÖLÜM 3/3: COIN RUSH','#ffd32a',2);  
              Engine.setTool(null);  
              api.spawn(0,0,0);  
            }  
          }  
        }  
      }  
      if(!bossDead){  
        bossT+=dt;  
        if(bossState==='chase'){  
          const dx=P.pos.x-boss.position.x, dz=P.pos.z-boss.position.z;  
          const d=Math.hypot(dx,dz)||1;  
          boss.position.x+=dx/d*3*dt;  
          boss.position.z+=dz/d*3*dt;  
          boss.rotation.y=Math.atan2(dx,dz);  
          if(d<2){ bossState='attack'; bossT=0; }  
        } else if(bossState==='attack'){  
          if(bossT>=0.5){  
            const dx=P.pos.x-boss.position.x, dz=P.pos.z-boss.position.z;  
            const d=Math.hypot(dx,dz);  
            if(d<2.5 && P.iframe<=0){  
              hearts--; api.hearts(hearts,5);  
              P.iframe=1;  
              Engine.hurtFx(); Engine.shake(0.4); Sfx.hit();  
              if(hearts<=0){ done=true; api.lose('Boss seni yendi! ⚔️',score,4); return; }  
            }  
            bossState='rest'; bossT=0;  
          }  
        } else if(bossState==='rest'){  
          if(bossT>=1){ bossState='chase'; bossT=0; }  
        }  
      }  
      api.stat('BÖLÜM 2: BOSS | ⚔️ HP: '+Math.max(0,bossHp)+'/'+bossMaxHp);  
    } else if(phase===3){  
      coinT+=dt;  
      if(coinT>=0.8){  
        coinT=0;  
        const x=U.rand(-8,8), z=U.rand(-8,8);  
        const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:Engine.emojiTex('🪙'),transparent:true,depthWrite:false}));  
        sp.scale.set(0.9,0.9,1); sp.position.set(x,0.8,z); W.mesh(sp);  
        const c=W.box(x,0.8,z,1.2,1.2,1.2,'#000',{trigger:true});  
        c.mesh=sp;  
        c.cb=()=>{ if(c.disabled)return; coinCount++; score+=10; Sfx.coin(); FX.floatText(x,1.5,z,'+10','#ffd32a'); W.removeC(c); };  
        coins.push(c);  
      }  
      if(phaseT>=30){  
        done=true;  
        api.win(500+coinCount*10,40,'Gauntlet tamamlandı! '+coinCount+' coin 🏆'); return;  
      }  
      api.stat('BÖLÜM 3: COIN RUSH | 🪙 '+coinCount+' | ⏱ '+Math.ceil(30-phaseT)+'s');  
    }  
  });  
});  
