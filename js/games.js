'use strict';
const GAMES=[];
function defGame(m){GAMES.push(m);}

/* ============ 1) OBBY ============ */
defGame({
  id:'obby',name:'OBBY',emoji:'🏁',color:'#3ecf5a',
  desc:'Düşmeden bitişe ulaş! Botlarla yarış!',
  enter(api){
    W.env('#4aa8ff',40,110,'#dff3ff',true);W.killY=-8;
    let t=0,done=false,cp={x:0,y:0,z:0},coinN=0;
    const setCp=(x,y,z)=>{if(cp.x!==x||cp.z!==z){cp={x:x,y:y,z:z};api.toast('✅ Checkpoint!');Sfx.door();}};
    const mk=(x,y,z,w,d,c)=>W.box(x,y-0.5,z,w,1,d,c);
    const pathPts=[{x:0,y:0,z:0}];
    mk(0,0,0,6,6,'#9aa7b8').onLand=()=>setCp(0,0,0);
    const S=[
      [0,0,-6,3,3,0],[2.5,0.4,-10,2.6,2.6,0],[5,0.8,-13.5,2.6,2.6,0],[5,1.2,-17.5,3.4,3.4,1],
      [2,1.6,-21,2.4,2.4,0],[-1.5,2,-24.5,2.4,2.4,2],[-4.5,2.4,-28,2.4,2.4,0],[-4.5,2.8,-32,3.4,3.4,1],
      [-2,3.2,-36,2.4,2.4,0],[1.5,3.6,-39.5,2.4,2.4,0],[4.5,4,-43,2.4,2.4,3],[4.5,4.2,-48,2.4,2.4,0],
      [1.5,4.6,-51.5,2.4,2.4,0],[-2,5,-55,3.4,3.4,1],[-2,5.2,-59.5,2.4,2.4,2],[1,5.6,-63.5,2.4,2.4,0],
      [0,6,-68,6,6,9]];
    const cols=['#ff9f43','#ee5a6f'];
    S.forEach((s,i)=>{
      const x=s[0],y=s[1],z=s[2],w=s[3],d=s[4],flag=s[5];
      pathPts.push({x:x,y:y,z:z});
      if(flag===2||flag===3){W.mover(x,y-0.5,z,w,1,d,'#a29bfe',{axis:'x',amp:flag===2?2.2:1.8,speed:1.3,phase:i});return;}
      const c=mk(x,y,z,w,d,flag===1?'#b8e986':(flag===9?'#ffd32a':cols[i%2]));
      if(flag===1){c.onLand=()=>setCp(x,y,z);
        const pole=new THREE.Mesh(Engine.GEO.box,Engine.MAT('#6d4c41'));pole.scale.set(0.12,2,0.12);pole.position.set(x+w/2-0.2,y+1,z);W.mesh(pole);
        const fl=new THREE.Mesh(Engine.GEO.box,Engine.MAT('#ff4d5e'));fl.scale.set(0.7,0.45,0.06);fl.position.set(x+w/2-0.6,y+1.7,z);W.mesh(fl);}
      if(flag===9){c.onLand=()=>{if(done)return;done=true;
          const sc=Math.max(20,Math.round(400-t*6));
          api.win(sc,15+Math.max(0,25-Math.floor(t/4))+coinN*2,'Süre: '+t.toFixed(1)+' sn • 🪙 x'+coinN);};
        const tr=new THREE.Sprite(new THREE.SpriteMaterial({map:Engine.emojiTex('🏆'),transparent:true,depthWrite:false}));
        tr.scale.set(2,2,1);tr.position.set(x,y+2.2,z);W.mesh(tr);}
    });
    [[2.5,1.4,-10],[5,2.2,-17.5],[-4.5,3.8,-32],[4.5,5.2,-48],[-2,6,-55],[0,7,-64]].forEach(p=>{
      const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:Engine.emojiTex('🪙'),transparent:true,depthWrite:false}));
      sp.scale.set(0.9,0.9,1);sp.position.set(p[0],p[1],p[2]);W.mesh(sp);
      const c=W.box(p[0],p[1]-0.3,p[2],1.2,1.2,1.2,'#000',{trigger:true});
      c.mesh=sp;
      c.cb=()=>{coinN++;Sfx.coin();FX.burst(p[0],p[1],p[2],'#ffd32a',8,4,0.5);W.removeC(c);};
    });
    const r1=Bots.make(null,0.9,0);r1.mode='path';r1.path=pathPts;r1.loop=true;r1.speed=5.7;r1.fallBelow=-8;r1.respawnPos.set(0,0,0);
    const r2=Bots.make(null,-0.9,0);r2.mode='path';r2.path=pathPts;r2.loop=true;r2.speed=6.3;r2.fallBelow=-8;r2.wait=1.0;r2.respawnPos.set(0,0,0);
    api.spawn(0,0,0);
    api.fall(()=>{api.spawn(cp.x,cp.y,cp.z);Engine.hurtFx();Sfx.hit();api.toast('💫 Düştün! Checkpointten devam',1.2);});
    api.update(dt=>{t+=dt;api.stat('⏱ '+t.toFixed(1)+' sn');});
  }
});

/* ============ 2) TOWER OF HELL ============ */
defGame({
  id:'tower',name:'TOWER OF HELL',emoji:'🗼',color:'#ff4d5e',
  desc:'Süre dolmadan tepeye tırman! Düşersen en başa!',
  enter(api){
    W.env('#1b2a55',30,95,'#5a4a7a',false);W.killY=-6;
    let tl=75,maxH=0,done=false;
    W.box(0,-0.5,0,8,1,8,'#4a5568');
    const pathPts=[{x:0,y:0,z:0}];
    const bars=[{y:8*1.85,s:1.7,a:0},{y:15*1.85,s:-2.1,a:2},{y:21*1.85,s:2.5,a:4}];
    bars.forEach(b=>{const m=new THREE.Mesh(Engine.GEO.box,Engine.MAT('#ff2020'));m.scale.set(7.5,0.45,0.45);W.mesh(m);b.m=m;});
    const N=26,cols=['#ff6b6b','#4ecdc4'];
    for(let i=1;i<=N;i++){
      const a=i*0.72,r=5.6;
      const x=Math.cos(a)*r,z=Math.sin(a)*r,y=i*1.85;
      pathPts.push({x:x,y:y,z:z});
      if(i%6===0)W.mover(x,y-0.25,z,3,0.5,3,'#ffd32a',{axis:'x',amp:1.5,speed:1.2,phase:i});
      else W.box(x,y-0.25,z,3,0.5,3,cols[i%2]);
    }
    const a=(N+1)*0.72,r=5.6;
    const tx=Math.cos(a)*r,tz=Math.sin(a)*r,ty=(N+1)*1.85;
    pathPts.push({x:tx,y:ty,z:tz});
    const topC=W.box(tx,ty-0.25,tz,4,0.5,4,'#ffd32a');
    topC.onLand=()=>{if(done)return;done=true;api.win(200+Math.round(tl*10),12+Math.ceil(tl/5),'Kalan süre: '+tl.toFixed(0)+' sn');};
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.7,0.7,N*1.85+6,10),Engine.MAT('#20294d'));
    pole.position.set(0,(N*1.85+6)/2,0);W.mesh(pole);
    const flag=new THREE.Sprite(new THREE.SpriteMaterial({map:Engine.emojiTex('🏆'),transparent:true,depthWrite:false}));
    flag.scale.set(2.2,2.2,1);flag.position.set(tx,ty+2,tz);W.mesh(flag);
    const cb=Bots.make(null,0,0);cb.mode='path';cb.path=pathPts;cb.loop=true;cb.speed=5.2;cb.fallBelow=-6;cb.respawnPos.set(0,0,0);
    api.spawn(0,0,0);
    api.fall(()=>{api.spawn(0,0,0);Engine.hurtFx();Sfx.hit();api.toast('💀 EN ALTA DÖNDÜN!',1.4);});
    api.update(dt=>{
      tl-=dt;
      bars.forEach(b=>{
        b.a+=b.s*dt;b.m.position.set(0,b.y,0);b.m.rotation.y=b.a;
        const P=Engine.player.pos;
        if(Math.abs(P.y-b.y)<1.4){
          for(const sgn of[1,-1]){
            const ang=b.a+(sgn===1?0:Math.PI);
            const hx=Math.cos(ang)*3.4,hz=Math.sin(ang)*3.4;
            const d=Math.hypot(P.x-hx,P.z-hz);
            if(d<1.1){
              const len=Math.hypot(P.x,P.z)||1;
              P.vel.x+=(P.x/len)*13;P.vel.z+=(P.z/len)*13;
              Engine.shake(0.3);Sfx.hit();
            }
          }
        }
      });
      const P=Engine.player;
      maxH=Math.max(maxH,P.pos.y-HY);
      if(tl<=0&&!done){api.lose('Süre doldu! ⏰',Math.floor(maxH),4);return;}
      api.stat('⏱ '+Math.ceil(tl)+'s | KAT '+Math.min(N,Math.floor(maxH/1.85))+'/'+N);
    });
  }
});

/* ============ 3) FLOOR IS LAVA ============ */
defGame({
  id:'lava',name:'FLOOR IS LAVA',emoji:'🌋',color:'#ff8f2a',
  desc:'Lav yükseliyor! Altın platforma tırman!',
  enter(api){
    W.env('#200a0a',18,60,'#7a1f0f',false);W.killY=-40;
    let t=0,maxY=0,done=false,lavaY=-3;
    W.box(0,-0.5,0,24,1,24,'#4a3524');
    const pathPts=[{x:0,y:0,z:0}];
    let px=0,pz=3;
    const cols=['#a8552f','#c96a35'];
    for(let i=1;i<=17;i++){
      const ang=U.rand(0,Math.PI*2),rr=U.rand(2.1,3.3);
      let nx=U.clamp(px+Math.cos(ang)*rr,-9,9);
      let nz=U.clamp(pz+Math.sin(ang)*rr,-9,9);
      W.box(nx,i*1.7-0.25,nz,2.6,0.5,2.6,cols[i%2]);
      pathPts.push({x:nx,y:i*1.7,z:nz});
      px=nx;pz=nz;
    }
    const topY=18*1.7;
    pathPts.push({x:px,y:topY,z:pz});
    const top=W.box(px,topY-0.25,pz,4,0.5,4,'#ffd32a');
    top.onLand=()=>{if(done)return;done=true;api.win(300+Math.floor(maxY)*10,30,'Zirveye ulaştın! 🔝');};
    const tf=new THREE.Sprite(new THREE.SpriteMaterial({map:Engine.emojiTex('👑'),transparent:true,depthWrite:false}));
    tf.scale.set(2,2,1);tf.position.set(px,topY+1.6,pz);W.mesh(tf);
    const lava=new THREE.Mesh(new THREE.PlaneGeometry(90,90),new THREE.MeshBasicMaterial({color:'#ff4d00',transparent:true,opacity:0.95}));
    lava.rotation.x=-Math.PI/2;lava.position.y=lavaY;W.mesh(lava);
    const lb=Bots.make(null,1.5,0);lb.mode='path';lb.path=pathPts;lb.speed=5.0;lb.fallBelow=-40;lb.respawnPos.set(0,0,0);
    api.spawn(0,0,0);
    api.update(dt=>{
      t+=dt;
      lavaY=-3+t*0.33+Math.max(0,t-40)*0.02;
      lava.position.y=lavaY;
      lava.material.opacity=0.85+Math.sin(t*6)*0.1;
      const P=Engine.player;
      maxY=Math.max(maxY,P.pos.y-HY);
      for(let i=0;i<Bots.all.length;i++){const b=Bots.all[i];
        if(!b.dead&&b.feetY<lavaY+0.15){b.respawnPos.set(0,0,0);
          FX.burst(b.pos.x,lavaY+0.4,b.pos.z,'#ff4d00',14,7,0.8);Bots.kill(b,3);}}
      if(!done&&(P.pos.y-HY)<lavaY+0.05){
        FX.burst(P.pos.x,lavaY+0.3,P.pos.z,'#ff4d00',24,8,0.9);Sfx.boom();
        api.lose('Lav seni yuttu! 🔥',Math.floor(maxY),2+Math.floor(maxY/6));return;}
      api.stat('🌋 '+lavaY.toFixed(0)+'m | ⬆ '+maxY.toFixed(0)+'m');
    });
  }
});

/* ============ 4) COLOR BLOCK ============ */
defGame({
  id:'color',name:'COLOR BLOCK',emoji:'🎨',color:'#8a5cf6',
  desc:'Gösterilen renge koş! Botlardan hızlı ol!',
  enter(api){
    W.env('#26345c',30,90,'#5a6fae',false);W.killY=-6;
    const COLS=[
      {n:'KIRMIZI',c:'#ff4757',e:'🟥'},{n:'MAVİ',c:'#3b82f6',e:'🟦'},
      {n:'SARI',c:'#ffd32a',e:'🟨'},{n:'YEŞİL',c:'#2ed573',e:'🟩'}];
    const tiles=[],tilePos=[[],[],[],[]];
    for(let i=0;i<7;i++)for(let j=0;j<7;j++){
      const ci=U.randi(4);
      const x=(i-3)*2,z=(j-3)*2;
      const c=W.box(x,-0.25,z,1.9,0.5,1.9,COLS[ci].c);
      c.ci=ci;tiles.push(c);
      tilePos[ci].push({x:x,z:z});
    }
    const cbots=[];
    [[-1.2,'MAVICAN_06'],[1.2,'RenkAvı']].forEach(p=>{
      const b=Bots.make(null,p[0],1.2,p[1]);
      b.mode='manual';b.fallBelow=-100;b.speed=6.4;
      b.goal={x:0,z:0};
      cbots.push(b);
    });
    const pending=[];
    let round=0,phase='idle',pt=0,target=0,done=false,restored=[];
    const startRound=()=>{
      round++;target=U.randi(4);phase='show';pt=3.2;
      api.big(COLS[target].e+' '+COLS[target].n+'!',COLS[target].c,3);
      Sfx.click();
      api.stat('TUR '+round+'/5');
      cbots.forEach(b=>{if(b.dead)return;const opts=tilePos[target];b.goal=opts.length?U.choice(opts):{x:0,z:0};});
    };
    const die=msg=>{if(done)return;api.lose(msg+' • '+(round-1)+' tur hayatta kaldın',(round-1)*100,(round-1)*6);};
    startRound();
    api.spawn(0,0,0);
    api.fall(()=>die('Yanlış renkteydin! 🎨'));
    api.update(dt=>{
      pt-=dt;
      for(const c of tiles){
        if(c.animDown){const s=Math.max(0.05,c.mesh.scale.y-dt*3);c.mesh.scale.y=s;c.mesh.position.y=-0.5+0.25*s;}
        else if(c.animUp){const s=Math.min(1,c.mesh.scale.y+dt*3);c.mesh.scale.y=s;c.mesh.position.y=-0.5+0.25*s;if(s>=1)c.animUp=false;}
      }
      for(let i=restored.length-1;i>=0;i--){const c=restored[i];
        const P=Engine.player.pos;
        if(Math.abs(P.x-c.x)>1.4||Math.abs(P.z-c.z)>1.4){c.disabled=false;c.animUp=true;restored.splice(i,1);}}
      cbots.forEach(b=>{if(b.dead)return;Bots.stepTo(b,b.goal.x,b.goal.z,b.speed,dt);});
      if(phase==='show'&&pt<=0){
        phase='drop';pt=2.6;
        tiles.forEach(c=>{if(c.ci!==target){c.disabled=true;c.animDown=true;}});
        Sfx.trap();
        cbots.forEach(b=>{if(b.dead)return;let safe=false;
          for(const c of tiles){if(c.ci===target&&!c.disabled&&Math.hypot(b.pos.x-c.x,b.pos.z-c.z)<1.05){safe=true;break;}}
          if(!safe){Bots.kill(b,9999);pending.push(b);FX.floatText(b.pos.x,2,b.pos.z,'😵','#ff4d5e');}});
      } else if(phase==='drop'&&pt<=0){
        if(round>=5){done=true;api.win(500,30,'5 turun hepsinde hayatta kaldın!');return;}
        phase='restore';pt=1.1;
        tiles.forEach(c=>{if(c.disabled){
          const P=Engine.player.pos;
          if(Math.abs(P.x-c.x)<1.4&&Math.abs(P.z-c.z)<1.4)restored.push(c);
          else{c.disabled=false;c.animUp=true;}
          c.animDown=false;}});
        pending.forEach((b,i)=>{b.dead=false;b.grp.visible=true;b.pos.set((i-0.5)*1.2,0,1.2);b.feetY=0;b.vy=0;});
        pending.length=0;
      } else if(phase==='restore'&&pt<=0){startRound();}
    });
  }
});

/* ============ 5) SPEED RUN ============ */
defGame({
  id:'speed',name:'SPEED RUN',emoji:'⚡',color:'#28c7d9',
  desc:'Rakip botla yarış! Engellerden kaç!',
  enter(api){
    W.env('#12082b',25,80,'#3b1e63',false);W.killY=-20;
    let t=0,hearts=3,inv=0,dist=0,done=false,nextZ=-18,coinN=0;
    const obs=[];
    const floorC=W.box(0,-0.5,0,9,1,300,'#3a3f75');
    const wallL=W.box(-4.3,1,0,0.6,2.4,300,'#2c2f55');
    const wallR=W.box(4.3,1,0,0.6,2.4,300,'#2c2f55');
    const stripL=new THREE.Mesh(Engine.GEO.box,Engine.MATB('#28c7d9'));stripL.scale.set(0.15,0.15,300);stripL.position.set(-3.9,0.35,0);W.mesh(stripL);
    const stripR=stripL.clone();stripR.position.x=3.9;W.mesh(stripR);
    const lanes=[-2.6,0,2.6];
    const rival=Bots.make({skin:'#ffd23f',shirt:'#23272e',pants:'#23272e'},0,0,'RAKİP_34');
    rival.mode='manual';rival.fallBelow=-100;
    let rivalDist=0,rivalX=0,rivalLane=0,laneT=0,crashT=U.rand(6,10);
    function spawnRow(z){
      const type=U.randi(3);
      if(type===0){
        const c=W.box(0,0.45,z,8.2,0.9,0.7,'#ff9f1c',{trigger:true});
        c.hit=false;c.cb=()=>hitCheck(c,true);obs.push(c);
      } else {
        const cnt=type===1?1:2;
        const idx=[0,1,2].sort(()=>Math.random()-0.5).slice(0,cnt);
        idx.forEach(li=>{const c=W.box(lanes[li],1,z,1.9,2,1,'#ef476f',{trigger:true});
          c.hit=false;c.cb=()=>hitCheck(c,false);obs.push(c);});
      }
      if(Math.random()<0.22){
        const lx=U.choice(lanes);
        const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:Engine.emojiTex('🪙'),transparent:true,depthWrite:false}));
        sp.scale.set(0.9,0.9,1);sp.position.set(lx,1,z-2);W.mesh(sp);
        const c=W.box(lx,1,z-2,1.1,1.4,1.1,'#000',{trigger:true});
        c.mesh=sp;c.cb=()=>{coinN++;Sfx.coin();W.removeC(c);};
        obs.push(c);
      }
    }
    function hitCheck(c,isHurdle){
      if(done||c.hit||inv>0)return;
      const P=Engine.player;
      if(isHurdle&&(P.pos.y-HY)>0.95)return;
      c.hit=true;damage();
    }
    function damage(){
      hearts--;api.hearts(hearts,3);
      inv=1.3;Engine.hurtFx();Engine.shake(0.4);Sfx.hit();
      if(hearts<=0){done=true;api.lose('Araba hurdaya döndü! 💥',dist,Math.floor(dist/12)+2+coinN);}
    }
    api.hearts(3,3);
    api.spawn(0,0,0);
    api.update(dt=>{
      if(done)return;
      t+=dt;inv=Math.max(0,inv-dt);
      const P=Engine.player;
      const spd=10+Math.min(17,t*0.5);
      P.vel.z=-spd;
      P.vel.x=U.approach(P.vel.x,Input.axis().x*9,60*dt);
      const cz=P.pos.z-100;
      floorC.mesh.position.z=cz;floorC.z=cz;
      [wallL,wallR].forEach(wl=>{wl.mesh.position.z=cz;wl.z=cz;});
      stripL.position.z=cz;stripR.position.z=cz;
      while(nextZ>P.pos.z-70){spawnRow(nextZ);nextZ-=U.rand(6,8);}
      for(let i=obs.length-1;i>=0;i--){if(obs[i].z>P.pos.z+16){W.removeC(obs[i]);obs.splice(i,1);}}
      dist=Math.floor(-P.pos.z);
      rivalDist+=(spd+U.clamp((dist-rivalDist)*0.18,-4,4))*dt;
      laneT-=dt;
      if(laneT<=0){laneT=1.7;rivalLane=U.choice(lanes);}
      rivalX=U.approach(rivalX,rivalLane,10*dt);
      crashT-=dt;
      if(crashT<=0){crashT=U.rand(7,12);rivalDist=Math.max(0,rivalDist-7);
        FX.burst(rivalX,1,-rivalDist,'#ff9f1c',16,7,0.7);Sfx.hit();}
      rival.pos.set(rivalX,0,-rivalDist);
      rival.hspd=spd;rival.yawT=Math.PI;
      Bots.physics(rival,dt);Bots.anim(rival,dt);
      api.stat('⚡'+dist+'m | 🤖'+Math.floor(rivalDist)+'m | 🪙'+coinN);
    });
  }
});

/* ============ 6) MEGA TYCOON ============ */
defGame({
  id:'tycoon',name:'MEGA TYCOON',emoji:'🏭',color:'#2ed573',
  desc:'Konveyör kur, damlatıcı aç, REBIRTH yap!',
  enter(api){
    W.env('#8fd3ff',35,110,'#e8f7ff',true);W.killY=-30;
    let money=0,total=0,mult=1,done=false;
    const gens=[],cds=[],ores=[],droppers=[];
    let beltSpeed=2.5;
    Engine.player.speed=7.5;
    W.box(0,-0.5,0,44,1,44,'#6abe4f');
    const plot=new THREE.Mesh(Engine.GEO.box,Engine.MATB('#b7c4cf'));
    plot.scale.set(24,0.1,26);plot.position.set(0,0.05,-4);W.mesh(plot);
    const belt=new THREE.Mesh(Engine.GEO.box,Engine.MATB('#37474f'));
    belt.scale.set(2.2,0.25,16);belt.position.set(0,0.35,0);belt.visible=false;W.mesh(belt);
    const collector=new THREE.Group();collector.position.set(0,0,8);collector.visible=false;
    const cbox=new THREE.Mesh(Engine.GEO.box,Engine.MAT('#ffb100'));
    cbox.scale.set(3,2,2);cbox.position.y=1;collector.add(cbox);
    const cmouth=new THREE.Mesh(Engine.GEO.box,Engine.MATB('#10131f'));
    cmouth.scale.set(1.6,1.2,0.2);cmouth.position.set(0,1,-1.02);collector.add(cmouth);
    W.mesh(collector);
    const mkPad=(x,z,label)=>{
      const p=new THREE.Mesh(Engine.GEO.box,Engine.MATB('#2ed573'));
      p.scale.set(2.6,0.15,2.6);p.position.set(x,0.08,z);W.mesh(p);
      const s=new THREE.Sprite(new THREE.SpriteMaterial({map:Engine.textTex(label),transparent:true,depthWrite:false}));
      s.scale.set(2.8,0.66,1);s.position.set(x,2.1,z);W.mesh(s);
      return {pad:p,spr:s};
    };
    const mkButton=(x,z,val)=>{
      const base=new THREE.Mesh(new THREE.CylinderGeometry(1.3,1.5,0.7,16),Engine.MAT('#c0392b'));
      base.position.set(x,0.35,z);W.mesh(base);
      const btn=new THREE.Mesh(new THREE.CylinderGeometry(0.85,0.85,0.35,16),Engine.MAT('#ff6b6b'));
      btn.position.set(x,0.85,z);W.mesh(btn);
      const st={cd:0};cds.push(st);
      api.interact(x,z,2.4,()=>'🔴 BAS  (+$'+val*mult+')',()=>{
        if(st.cd>0||done)return;
        st.cd=0.35;const gain=val*mult;
        money+=gain;total+=gain;
        btn.position.y=0.7;
        FX.burst(x,1.2,z,'#ffd32a',8,4,0.5);
        FX.floatText(x,2.4,z,'+$'+gain,'#2ed573');
        Sfx.coin();
      });
      gens.push({tick:dt2=>{btn.position.y=U.approach(btn.position.y,0.85,dt2*3);}});
    };
    function spawnOre(x,val,color){
      if(ores.length>=40)return;
      const m=new THREE.Mesh(Engine.GEO.box,Engine.MATB(color));
      m.scale.setScalar(0.5);m.position.set(x,2.7,-8);W.mesh(m);
      ores.push({m:m,v:val,state:0});
    }
    function addDropper(x,val,color){
      const d=new THREE.Mesh(Engine.GEO.box,Engine.MAT(color));
      d.scale.set(1.8,1.4,1.8);d.position.set(x,2,-8);W.mesh(d);
      const ch=new THREE.Mesh(Engine.GEO.box,Engine.MAT('#546e7a'));
      ch.scale.set(0.5,1,0.5);ch.position.set(x,3,-8);W.mesh(ch);
      droppers.push({x:x,val:val,color:color,acc:U.rand(0,2),interval:2.5});
    }
    mkButton(7,10,1);
    const stages=[
      {cost:15,name:'KONVEYÖR',label:'🛠 $15',apply(){belt.visible=true;collector.visible=true;addDropper(-4,2,'#78909c');}},
      {cost:40,name:'DAMLATICI II',label:'🏭 $40',apply(){addDropper(0,4,'#4db6ac');}},
      {cost:75,name:'DAMLATICI III',label:'🏭 $75',apply(){addDropper(4,6,'#7986cb');}},
      {cost:120,name:'DUVARLAR',label:'🧱 $120',apply(){
        W.box(-12,1.5,-4,0.8,3,26,'#e0e0e0');W.box(12,1.5,-4,0.8,3,26,'#e0e0e0');
        W.box(0,1.5,-17,24,3,0.8,'#e0e0e0');
        W.box(-7.5,1.5,9,9,3,0.8,'#e0e0e0');W.box(7.5,1.5,9,9,3,0.8,'#e0e0e0');
        const arch=new THREE.Mesh(Engine.GEO.box,Engine.MAT('#ffb100'));
        arch.scale.set(6,1,1);arch.position.set(0,3.3,9);W.mesh(arch);}},
      {cost:200,name:'HIZ FANI',label:'🌀 $200',apply(){beltSpeed=4.5;api.toast('🌀 Konveyör hızlandı!');}},
      {cost:350,name:'ALTIN DAMLATICI',label:'👑 $350',apply(){addDropper(-2,12,'#ffd32a');}},
      {cost:600,name:'KOLEKTÖR x2',label:'✖️2 $600',apply(){mult*=2;api.toast('✖️2 KAZANÇ ÇARPANI!');}},
      {cost:1000,name:'MEGA BUTON',label:'🔴 $1000',apply(){mkButton(-7,10,10);}},
      {cost:2000,name:'REBIRTH',label:'💫 $2000',apply(){
        done=true;
        api.win(Math.floor(total),60,'💫 REBIRTH! Toplam $'+Math.floor(total)+' kazandın');}}
    ];
    let bought=0;
    stages.forEach((s,i)=>{
      const x=-12+(i%5)*6,z=13+Math.floor(i/5)*3.5;
      const pads=mkPad(x,z,s.label);
      const it=api.interact(x,z,2.4,
        ()=>{
          if(i===8&&bought<8)return '🔒 Önce diğer 8 yükseltme!';
          return money>=s.cost?'🛒 '+s.name+' — $'+s.cost:'🔒 $'+s.cost+' lazım';
        },
        ()=>{
          if(done)return;
          if(i===8&&bought<8){api.toast('Önce diğer yükseltmeleri al! 🔒');return;}
          if(money<s.cost)return;
          money-=s.cost;bought++;
          it.dead=true;
          Engine.scene.remove(pads.pad);Engine.scene.remove(pads.spr);
          Sfx.buy();api.toast('🏗 '+s.name+' kuruldu!');
          FX.burst(x,1,z,'#2ed573',16,6,0.8);
          s.apply();
        });
    });
    const vb=Bots.make(null,U.rand(-6,6),U.rand(6,12),'MüşteriAli');
    vb.mode='wander';vb.wander={cx:0,cz:11,r:8,tx:0,tz:11,wait:1};
    vb.speed=3.5;vb.fallBelow=-12;vb.respawnPos.set(0,0,11);
    api.spawn(0,0,16);
    api.update(dt=>{
      cds.forEach(s=>{s.cd=Math.max(0,s.cd-dt);});
      gens.forEach(g=>{if(g.tick)g.tick(dt);});
      droppers.forEach(d=>{d.acc+=dt;if(d.acc>=d.interval){d.acc=0;spawnOre(d.x,d.val,d.color);}});
      for(let i=ores.length-1;i>=0;i--){
        const o=ores[i];
        if(o.state===0){o.m.position.y-=6*dt;if(o.m.position.y<=0.75){o.m.position.y=0.75;o.state=1;}}
        else{o.m.position.z+=beltSpeed*dt;
          if(o.m.position.z>=7.6){
            const gain=o.v*mult;
            money+=gain;total+=gain;
            FX.burst(0,1.2,8,'#ffd32a',6,3,0.5);
            FX.floatText(0,2.6,8,'+$'+gain,'#ffd32a');
            Engine.scene.remove(o.m);
            ores.splice(i,1);}}
      }
      api.stat('💰 $'+Math.floor(money)+' | 📈 $'+Math.floor(total)+' | x'+mult);
    });
  }
});

/* ============ 7) DOORS ============ */
defGame({
  id:'doors',name:'DOORS',emoji:'🚪',color:'#b3803e',
  desc:'Doğru kapıyı hatırla, tuzaklardan kaç! 8 oda.',
  enter(api){
    W.env('#1a1d26',20,70,'#3a3f4d',false);W.killY=-30;
    let room=1,hearts=3,correct=0,phase='hint',pt=0,locked=false,done=false;
    const ROOMS=8;
    let roomCols=[],roomMeshes=[],doorMats=[];
    const addRC=c=>roomCols.push(c);
    const addRM=m=>{roomMeshes.push(m);W.mesh(m);return m;};
    function clearRoom(){
      roomCols.forEach(c=>W.removeC(c));
      roomMeshes.forEach(m=>Engine.scene.remove(m));
      roomCols=[];roomMeshes=[];doorMats=[];
    }
    function buildRoom(){
      clearRoom();
      addRC(W.box(0,-0.5,0,12,1,14,'#3a3f4b'));
      addRC(W.box(-6.3,2,0,0.6,4,14,'#2f3340'));
      addRC(W.box(6.3,2,0,0.6,4,14,'#2f3340'));
      addRC(W.box(0,2,7.3,13,4,0.6,'#2f3340'));
      const n=room<4?2:3;
      correct=U.randi(n);
      const xs=n===2?[-2,2]:[-3.2,0,3.2];
      const edges=[-6];
      xs.forEach(x=>{edges.push(x-0.95,x+0.95);});
      edges.push(6);
      for(let i=0;i<edges.length;i+=2){
        const a=edges[i],b=edges[i+1];
        if(b-a>0.05)addRC(W.box((a+b)/2,2,-5.8,(b-a),4,0.5,'#2f3340'));
      }
      addRC(W.box(0,3.55,-5.8,12,0.9,0.5,'#2f3340'));
      doorMats=[];
      xs.forEach((x,i)=>{
        const dm=new THREE.MeshLambertMaterial({color:'#8b5a2b'});
        doorMats.push(dm);
        const d=new THREE.Mesh(Engine.GEO.box,dm);
        d.scale.set(1.7,2.7,0.35);d.position.set(x,1.35,-5.8);
        addRM(d);
        const lbl=new THREE.Sprite(new THREE.SpriteMaterial({map:Engine.textTex(String.fromCharCode(65+i)),transparent:true,depthWrite:false}));
        lbl.scale.set(1.1,0.6,1);lbl.position.set(x,3.1,-5.6);
        addRM(lbl);
        const tr=W.box(x,1.3,-5.55,1.8,2.6,0.9,'#000',{trigger:true});
        tr.cb=()=>enterDoor(i);
        addRC(tr);
      });
      phase='hint';pt=0;locked=false;
      api.stat('ODA '+room+'/'+ROOMS);
    }
    function enterDoor(i){
      if(locked||done)return;locked=true;
      if(i===correct){
        Sfx.door();
        Engine.fadeDo(()=>{
          room++;
          if(room>ROOMS){done=true;api.win(200+hearts*100,25+hearts*5,'Tüm odaları geçtin! 🗝️');return;}
          api.toast('✅ DOĞRU KAPI!',1);
          buildRoom();
          api.spawn(0,0,4.2);
        });
      } else {
        hearts--;api.hearts(hearts,3);
        Sfx.trap();Engine.hurtFx();Engine.shake(0.5);
        for(let k=0;k<6;k++){
          const sp=new THREE.Mesh(new THREE.ConeGeometry(0.25,1.4,6),Engine.MATB('#ff4d5e'));
          const P=Engine.player.pos;
          sp.position.set(P.x+U.rand(-1.2,1.2),0,P.z+U.rand(-1.2,1.2));
          W.mesh(sp);
          FX.spawn(sp,0.5,(m,e,l)=>{m.scale.y=Math.sin(Math.min(1,e/l*1.2)*Math.PI)*1.4+0.01;});
        }
        if(hearts<=0){done=true;api.lose('Tuzaklara yakalandın! 🪤',(room-1)*100,(room-1)*5);return;}
        Engine.fadeDo(()=>{api.toast('❌ TUZAK! Baştan bu odaya...',1.4);buildRoom();api.spawn(0,0,4.2);});
      }
    }
    buildRoom();
    api.hearts(3,3);
    api.spawn(0,0,4.2);
    api.update(dt=>{
      pt+=dt;
      if(phase==='hint'){
        const k=Math.max(0,1-pt/1.1);
        doorMats.forEach((m,i)=>{
          if(i===correct&&pt<1.1){
            m.emissive.setHex(0x2ecc40);
            m.emissiveIntensity=(0.4+0.6*Math.abs(Math.sin(pt*10)))*k+0.15;
          } else {m.emissive.setHex(0x000000);m.emissiveIntensity=0;}
        });
        if(pt>=1.1)phase='play';
      }
    });
  }
});

/* ============ 8) AFET SURVIVAL ============ */
defGame({
  id:'disaster',name:'AFET SURVIVAL',emoji:'☄️',color:'#ff6b35',
  desc:'Meteorlardan 60 sn hayatta kal! Botlar da kaçıyor!',
  enter(api){
    W.env('#3a2030',25,80,'#8a4a3a',false);W.killY=-30;
    let tl=60,hearts=5,inv=0,spawnT=0.8,done=false;
    const meteors=[];
    W.box(0,-0.5,0,26,1,26,'#8d6e3f');
    W.box(0,0.6,-13,26,1.2,0.6,'#5d4626');
    W.box(0,0.6,13,26,1.2,0.6,'#5d4626');
    W.box(-13,0.6,0,0.6,1.2,26,'#5d4626');
    W.box(13,0.6,0,0.6,1.2,26,'#5d4626');
    for(let i=0;i<3;i++){
      const b=Bots.make(null,U.rand(-8,8),U.rand(-8,8));
      b.mode='wander';
      b.wander={cx:0,cz:0,r:10,tx:U.rand(-8,8),tz:U.rand(-8,8),wait:U.rand(0,1)};
      b.speed=5;b.fallBelow=-12;b.respawnPos.set(U.rand(-9,9),0,U.rand(-9,9));
    }
    function damage(){
      if(inv>0)return;
      hearts--;api.hearts(hearts,5);
      inv=1;Engine.hurtFx();Engine.shake(0.5);Sfx.hit();
      if(hearts<=0){done=true;api.lose('Meteorlar seni yakaladı! ☄️',Math.floor((60-tl))*2,4);}
    }
    function spawnMeteor(){
      const x=U.rand(-11,11),z=U.rand(-11,11);
      const ring=new THREE.Mesh(new THREE.RingGeometry(2.2,2.6,26),
        new THREE.MeshBasicMaterial({color:'#ff2020',transparent:true,opacity:0.9,side:THREE.DoubleSide,depthWrite:false}));
      ring.rotation.x=-Math.PI/2;ring.position.set(x,0.08,z);W.mesh(ring);
      meteors.push({x:x,z:z,t:0,state:0,ring:ring,mesh:null,fv:0,bolt:false});
    }
    function spawnBolt(){
      const x=U.rand(-11,11),z=U.rand(-11,11);
      const ring=new THREE.Mesh(new THREE.RingGeometry(1.4,1.8,22),
        new THREE.MeshBasicMaterial({color:'#ffd32a',transparent:true,opacity:0.9,side:THREE.DoubleSide,depthWrite:false}));
      ring.rotation.x=-Math.PI/2;ring.position.set(x,0.08,z);W.mesh(ring);
      meteors.push({x:x,z:z,t:0,state:0,ring:ring,mesh:null,fv:0,bolt:true});
    }
    api.hearts(5,5);
    api.spawn(0,0,0);
    api.update(dt=>{
      if(done)return;
      tl-=dt;inv=Math.max(0,inv-dt);
      if(tl<=0){done=true;api.win(100+hearts*50,15+hearts*4,hearts+' can ile hayatta kaldın!');return;}
      spawnT-=dt;
      const iv=U.lerp(1.5,0.55,U.clamp((60-tl)/60,0,1));
      if(spawnT<=0){
        spawnT=iv;spawnMeteor();
        if(tl<25&&Math.random()<0.4)spawnMeteor();
        if(tl<30&&Math.random()<0.5)spawnBolt();
      }
      for(let i=meteors.length-1;i>=0;i--){
        const m=meteors[i];m.t+=dt;
        if(m.state===0){
          m.ring.material.opacity=0.5+0.5*Math.abs(Math.sin(m.t*12));
          const k=1-Math.min(1,m.t/(m.bolt?0.6:1.1));
          m.ring.scale.setScalar(Math.max(0.2,k));
          if(m.t>=(m.bolt?0.6:1.1)){
            m.state=1;
            if(m.bolt){
              m.mesh=new THREE.Mesh(Engine.GEO.box,Engine.MATB('#fff59d'));
              m.mesh.scale.set(0.5,30,0.5);m.mesh.position.set(m.x,15,m.z);W.mesh(m.mesh);
            } else {
              m.mesh=new THREE.Mesh(new THREE.SphereGeometry(0.75,10,8),Engine.MATB('#5b3a29'));
              m.mesh.position.set(m.x,32,m.z);W.mesh(m.mesh);
            }
          }
        } else if(m.bolt){
          FX.burst(m.x,1,m.z,'#fff59d',16,8,0.6);
          FX.ring(m.x,0.1,m.z,'#ffd32a');
          Engine.shake(0.3);Sfx.boom();
          const P=Engine.player.pos;
          if(Math.hypot(P.x-m.x,P.z-m.z)<2.0)damage();
          for(let bi=0;bi<Bots.all.length;bi++){const b=Bots.all[bi];
            if(!b.dead&&Math.hypot(b.pos.x-m.x,b.pos.z-m.z)<2.0){
              b.respawnPos.set(U.rand(-9,9),0,U.rand(-9,9));Bots.kill(b,2.5);}}
          Engine.scene.remove(m.ring);Engine.scene.remove(m.mesh);
          meteors.splice(i,1);
        } else {
          m.fv+=70*dt;m.mesh.position.y-=m.fv*dt;
          FX.burst(m.mesh.position.x,m.mesh.position.y,m.mesh.position.z,'#ff9f43',1,1,0.3);
          if(m.mesh.position.y<=0.8){
            FX.burst(m.x,0.5,m.z,'#ff9f43',20,9,0.8);
            FX.ring(m.x,0.1,m.z,'#ff4d00');
            Engine.shake(0.35);Sfx.boom();
            const P=Engine.player.pos;
            if(Math.hypot(P.x-m.x,P.z-m.z)<2.7&&P.y<3)damage();
            for(let bi=0;bi<Bots.all.length;bi++){const b=Bots.all[bi];
              if(!b.dead&&Math.hypot(b.pos.x-m.x,b.pos.z-m.z)<2.7){
                b.respawnPos.set(U.rand(-9,9),0,U.rand(-9,9));Bots.kill(b,2.5);}}
            Engine.scene.remove(m.ring);Engine.scene.remove(m.mesh);
            meteors.splice(i,1);
          }
        }
      }
      api.stat('⏱ '+Math.ceil(tl)+'s | ❤️ '+hearts);
    });
  }
});

/* ============ 9) CLICKER SIM ============ */
defGame({
  id:'clicker',name:'CLICKER SIM',emoji:'💥',color:'#ff4da6',
  desc:'60 saniye tıkla, güç topla, seviye atla!',
  controls:false,noMove:true,
  enter(api){
    W.env('#2a1d44',20,60,'#6b4d8a',false);W.killY=-30;
    let t=60,power=0,lvl=1,clickPow=1,autoLvl=0,acc=0,
        up1cost=60,up2cost=150,done=false;
    W.box(0,-0.5,0,14,1,14,'#6d4c41');
    const carpet=new THREE.Mesh(Engine.GEO.box,Engine.MATB('#c0392b'));
    carpet.scale.set(2.4,0.06,7);carpet.position.set(0,0.03,-0.5);W.mesh(carpet);
    const dummy=new THREE.Group();dummy.position.set(0,0,-1.7);
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.12,1.2,8),Engine.MAT('#5d4037'));
    pole.position.y=0.6;dummy.add(pole);
    const bag=new THREE.Mesh(Engine.GEO.box,Engine.MAT('#d9a066'));
    bag.scale.set(1,1.5,0.75);bag.position.y=1.75;dummy.add(bag);
    const belt=new THREE.Mesh(Engine.GEO.box,Engine.MAT('#3e2723'));
    belt.scale.set(1.04,0.2,0.79);belt.position.y=1.75;dummy.add(belt);
    W.mesh(dummy);
    let dummyT=0;
    Engine.camMode=2;Engine.camDist=6;Engine.camPitch=0.3;Engine.camYaw=0;
    api.onExit(()=>{Engine.camMode=0;Engine.camDist=9;Engine.camPitch=0.35;});
    const bb=Bots.make(null,2.3,0.6);
    bb.mode='manual';bb.fallBelow=-100;bb.yawT=Math.PI;
    let botT=0.7;
    api.spawn(0,0,0.9);
    const ui=$('clickerUI');
    ui.classList.remove('hidden');
    api.onExit(()=>ui.classList.add('hidden'));
    const myRun=Engine.runId;
    function refreshUI(){
      $('clk-power').textContent=Math.floor(power);
      $('clk-lvl').textContent=lvl;
      $('clk-up1c').textContent='-'+up1cost+' 💪';
      $('clk-up2c').textContent=autoLvl>=2?'MAX':'-'+up2cost+' 💪';
      $('clk-up1').classList.toggle('off',power<up1cost);
      $('clk-up2').classList.toggle('off',power<up2cost||autoLvl>=2);
    }
    function checkLevel(){
      while(power>=30*lvl*lvl){
        lvl++;
        Sfx.level();
        api.big('⭐ SEVİYE '+lvl+'!','#8a5cf6',1.2);
        FX.confetti(Engine.player.pos.x,Engine.player.pos.y+1,Engine.player.pos.z);
      }
    }
    function tap(withAnim){
      power+=clickPow;
      if(withAnim){
        Engine.punch=0.25;dummyT=0.35;
        FX.floatText(0,2.9,-1.7,'+'+clickPow,'#ffd32a');
        FX.burst(0,1.9,-1.7,'#ffd32a',4,3,0.4);
        Sfx.tap();
      }
      checkLevel();refreshUI();
    }
    const onBtn=e=>{e.preventDefault();if(Engine.runId===myRun&&!done)tap(true);};
    $('clk-btn').addEventListener('pointerdown',onBtn);
    $('clk-up1').addEventListener('pointerdown',e=>{
      e.preventDefault();
      if(Engine.runId!==myRun||done)return;
      if(power>=up1cost){power-=up1cost;clickPow*=2;up1cost*=3;Sfx.buy();refreshUI();}
    });
    $('clk-up2').addEventListener('pointerdown',e=>{
      e.preventDefault();
      if(Engine.runId!==myRun||done)return;
      if(autoLvl<2&&power>=up2cost){power-=up2cost;autoLvl++;up2cost=400;Sfx.buy();refreshUI();}
    });
    refreshUI();
    api.stat('💥 Tıkla!');
    api.update(dt=>{
      if(done)return;
      t-=dt;
      $('clk-time').textContent=Math.ceil(t);
      if(dummyT>0){dummyT-=dt;dummy.rotation.x=-0.45*Math.sin(U.clamp(1-dummyT/0.35,0,1)*Math.PI);}
      else dummy.rotation.x=0;
      if(autoLvl>0){acc+=dt*autoLvl;while(acc>=1){acc-=1;tap(false);}}
      botT-=dt;
      if(botT<=0){botT=0.75;bb.punchT=0.25;FX.burst(2.3,1.9,-0.4,'#ff4da6',3,2.5,0.35);}
      Bots.physics(bb,dt);Bots.anim(bb,dt);
      if(t<=0){
        done=true;
        const coins=Math.floor(power/20)+(lvl-1)*5;
        api.win(Math.floor(power),coins,'Seviye '+lvl+' • Tık gücü x'+clickPow);
      }
    });
  }
});

/* ============ 10) BOSS ARENA ============ */
defGame({
  id:'boss',name:'BOSS ARENA',emoji:'⚔️',color:'#c0392b',
  desc:'Yardımcı botla birlikte boss\'u yen!',
  enter(api){
    W.env('#1c0b20',25,75,'#5a1f2a',false);W.killY=-30;
    Engine.setTool('sword');
    api.onExit(()=>Engine.setTool(null));
    let hearts=5,hp=220,HP0=220,st='chase',stT=0,atkCd=0,done=false,heartT=6;
    const boss=new THREE.Group();boss.position.set(0,0,-6);
    const bossMats=[];
    const bpart=(sx,sy,sz,color,x,y,z)=>{
      const m=new THREE.MeshLambertMaterial({color:color});
      bossMats.push(m);
      const q=new THREE.Mesh(Engine.GEO.box,m);
      q.scale.set(sx,sy,sz);q.position.set(x,y,z);boss.add(q);return q;
    };
    W.box(0,-0.5,0,26,1,26,'#6b4226');
    [[0,-13],[0,13],[-13,0],[13,0]].forEach((p,i)=>{
      if(i<2)W.box(p[0],0.6,p[1],26,1.2,0.7,'#4a2c17');
      else W.box(p[0],0.6,p[1],0.7,1.2,26,'#4a2c17');
    });
    [[-11,-11],[11,-11],[-11,11],[11,11]].forEach(p=>{
      const t=new THREE.Mesh(Engine.GEO.box,Engine.MAT('#3e2723'));
      t.scale.set(0.4,2.4,0.4);t.position.set(p[0],1.2,p[1]);W.mesh(t);
      const f=new THREE.Mesh(Engine.GEO.box,Engine.MATB('#ff9f1c'));
      f.scale.set(0.5,0.5,0.5);f.position.set(p[0],2.6,p[1]);W.mesh(f);
    });
    bpart(1.7,1.9,1.2,'#c0392b',0,1.75,0);
    bpart(1.1,1,1,'#e74c3c',0,3.2,0);
    bpart(0.22,0.22,0.1,'#fff',-0.25,3.3,0.51);
    bpart(0.22,0.22,0.1,'#fff',0.25,3.3,0.51);
    bpart(0.1,0.1,0.06,'#111',-0.25,3.3,0.58);
    bpart(0.1,0.1,0.06,'#111',0.25,3.3,0.58);
    const bArmL=new THREE.Group();bArmL.position.set(-1.05,2.4,0);boss.add(bArmL);
    const aL=new THREE.Mesh(Engine.GEO.box,new THREE.MeshLambertMaterial({color:'#a93226'}));
    bossMats.push(aL.material);aL.scale.set(0.5,1.5,0.5);aL.position.y=-0.75;bArmL.add(aL);
    const bArmR=new THREE.Group();bArmR.position.set(1.05,2.4,0);boss.add(bArmR);
    const aR=new THREE.Mesh(Engine.GEO.box,new THREE.MeshLambertMaterial({color:'#a93226'}));
    bossMats.push(aR.material);aR.scale.set(0.5,1.5,0.5);aR.position.y=-0.75;bArmR.add(aR);
    bpart(0.6,0.8,0.6,'#922b21',-0.5,0.4,0);
    bpart(0.6,0.8,0.6,'#922b21',0.5,0.4,0);
    W.mesh(boss);
    let bossFlash=0,deadT=0;
    const ally=Bots.make(null,0,7);
    ally.mode='manual';ally.fallBelow=-100;ally.speed=6;
    let allyAtk=0.8;
    function dmgPlayer(){
      const P=Engine.player;
      if(P.iframe>0)return;
      hearts--;api.hearts(hearts,5);
      P.iframe=1.1;
      Engine.hurtFx();Engine.shake(0.5);Sfx.hit();
      const dx=P.pos.x-boss.position.x,dz=P.pos.z-boss.position.z;
      const l=Math.hypot(dx,dz)||1;
      P.pos.x+=dx/l*1.3;P.pos.z+=dz/l*1.3;
      if(hearts<=0&&!done){done=true;api.lose('Boss seni yendi! 💀',HP0-hp,8);}
    }
    function hitBoss(dmg){
      if(hp<=0||st==='dead')return;
      hp-=dmg;bossFlash=Math.max(bossFlash,0.14);
      Sfx.hit();Engine.shake(0.15);
      FX.burst(boss.position.x,2,boss.position.z,'#ffd32a',8,5,0.5);
      FX.floatText(boss.position.x,3.8,boss.position.z,'-'+dmg,'#ff4d5e');
      HUD.boss(Math.max(0,hp)/HP0);
      if(hp<=0&&!done){done=true;st='dead';deadT=0;api.toast('👹 BOSS YENİLDİ!',1.6);}
    }
    HUD.boss(1);
    api.hearts(5,5);
    api.spawn(0,0,7);
    api.update(dt=>{
      if(st==='dead'){
        deadT+=dt;
        boss.rotation.z+=dt*2.5;
        boss.scale.setScalar(Math.max(0.01,1-deadT));
        if(deadT>=1&&hearts>0)api.win(100+hearts*25,45+hearts*5,hearts+' can ile zafer! ⚔️');
        return;
      }
      heartT-=dt;
      if(heartT<=0&&hearts<5){
        heartT=8;
        const hx=U.rand(-8,8),hz=U.rand(-8,8);
        const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:Engine.emojiTex('❤️'),transparent:true,depthWrite:false}));
        sp.scale.set(1,1,1);sp.position.set(hx,1.2,hz);W.mesh(sp);
        const c=W.box(hx,1,hz,1.4,2,1.4,'#000',{trigger:true});
        c.mesh=sp;
        c.cb=()=>{hearts=Math.min(5,hearts+1);api.hearts(hearts,5);Sfx.coin();FX.burst(hx,1.2,hz,'#ff4d5e',10,4,0.6);W.removeC(c);};
      }
      const P=Engine.player;
      atkCd=Math.max(0,atkCd-dt);
      bossFlash=Math.max(0,bossFlash-dt);
      const dx=P.pos.x-boss.position.x,dz=P.pos.z-boss.position.z;
      const dist=Math.hypot(dx,dz);
      const phase2=hp<HP0/2;
      if(Input.actionBuf>0){
        Input.actionBuf=0;
        if(atkCd<=0){atkCd=0.45;Engine.punch=0.25;if(dist<3.2)hitBoss(12);}
      }
      const yaw=Math.atan2(dx,dz);
      let d=(yaw-boss.rotation.y)%(Math.PI*2);
      if(d>Math.PI)d-=Math.PI*2;if(d<-Math.PI)d+=Math.PI*2;
      boss.rotation.y+=d*Math.min(1,dt*6);
      if(st==='chase'){
        const sp=phase2?4.8:3.2;
        if(dist>1.1){boss.position.x+=dx/dist*sp*dt;boss.position.z+=dz/dist*sp*dt;}
        boss.position.x=U.clamp(boss.position.x,-11,11);
        boss.position.z=U.clamp(boss.position.z,-11,11);
        bArmL.rotation.x=U.approach(bArmL.rotation.x,0,dt*8);
        bArmR.rotation.x=U.approach(bArmR.rotation.x,0,dt*8);
        if(dist<2.7){st='windup';stT=phase2?0.42:0.55;}
      } else if(st==='windup'){
        stT-=dt;
        bArmL.rotation.x=-2.3;bArmR.rotation.x=-2.3;
        boss.position.x+=U.rand(-0.03,0.03);
        if(stT<=0){
          st='rest';stT=phase2?0.55:0.9;
          FX.ring(boss.position.x,0.1,boss.position.z,'#ff4d5e');
          Engine.shake(0.3);Sfx.boom();
          if(dist<3.5)dmgPlayer();
          if(!ally.dead&&Math.hypot(ally.pos.x-boss.position.x,ally.pos.z-boss.position.z)<3.5){
            ally.respawnPos.set(0,0,9);Bots.kill(ally,4);
            api.toast('🤖 Bot yere serildi! 4 sn...',1.2);}
          bArmL.rotation.x=0.5;bArmR.rotation.x=0.5;
        }
      } else if(st==='rest'){
        stT-=dt;
        bArmL.rotation.x=U.approach(bArmL.rotation.x,0,dt*6);
        bArmR.rotation.x=U.approach(bArmR.rotation.x,0,dt*6);
        if(stT<=0)st='chase';
      }
      if(dist<1.3&&dist>0.001){
        P.pos.x+=dx/dist*(1.3-dist);P.pos.z+=dz/dist*(1.3-dist);
      }
      bossMats.forEach(m=>{
        if(bossFlash>0){m.emissive.setHex(0xffffff);m.emissiveIntensity=0.7;}
        else if(st==='windup'){m.emissive.setHex(0xff2200);m.emissiveIntensity=0.5;}
        else{m.emissive.setHex(phase2?0x660000:0x000000);m.emissiveIntensity=phase2?0.5:0;}
      });
      boss.position.y=Math.abs(Math.sin(Engine.time*4))*0.12;
      if(!ally.dead){
        const ax=ally.pos.x-boss.position.x,az=ally.pos.z-boss.position.z;
        const ad=Math.hypot(ax,az)||1;
        if(ad>2.6){Bots.stepTo(ally,boss.position.x+ax/ad*2.2,boss.position.z+az/ad*2.2,ally.speed,dt);}
        else{
          ally.hspd=0;
          ally.yawT=Math.atan2(-ax,-az);
          Bots.physics(ally,dt);Bots.anim(ally,dt);
          allyAtk-=dt;
          if(allyAtk<=0){allyAtk=1.15;ally.punchT=0.25;hitBoss(5);}
        }
      }
      api.stat('⚔️ SKOR: '+(HP0-Math.max(0,hp))+'/'+HP0);
    });
  }
});

/* ============ 11) TNT RUN ============ */
defGame({
  id:'tntrun',name:'TNT RUN',emoji:'🧨',color:'#ff5252',
  desc:'Bastığın blok patlar! 60 saniye hayatta kal!',
  enter(api){
    W.env('#26345c',30,90,'#5a6fae',false);W.killY=-6;
    let tl=60,hearts=3,done=false;
    const tiles=[];
    const pal=['#ff8a80','#ffd180','#80d8ff','#b9f6ca','#ea80fc'];
    for(let i=0;i<9;i++)for(let j=0;j<9;j++){
      const x=(i-4)*2,z=(j-4)*2;
      const c=W.box(x,-0.25,z,1.9,0.5,1.9,U.choice(pal));
      c.st='ok';c.fuse=0;c.tx=x;c.tz=z;
      tiles.push(c);
    }
    const rb=[];
    for(let k=0;k<2;k++){
      const b=Bots.make(null,U.rand(-4,4),U.rand(-4,4));
      b.mode='manual';b.fallBelow=-5;b.speed=5.5;
      b.target={x:0,z:0};b.tt=0;
      rb.push(b);
    }
    function tileAt(x,z){
      for(const c of tiles){
        if(c.st==='ok'&&Math.abs(x-c.tx)<0.95&&Math.abs(z-c.tz)<0.95)return c;
      }
      return null;
    }
    function ignite(c){if(c.st!=='ok')return;c.st='fuse';c.fuse=0.55;c.mesh.material=Engine.MATB('#ff5252');}
    function restoreAll(){
      tiles.forEach(c=>{c.st='ok';c.disabled=false;c.animUp=true;});
      api.toast('🔄 ZEMİN YENİLENDİ!',1.2);
    }
    api.hearts(3,3);
    api.spawn(0,0,0);
    api.fall(()=>{
      hearts--;api.hearts(hearts,3);
      Engine.hurtFx();Sfx.hit();
      if(hearts<=0){done=true;api.lose('Patlayıp gittin! 🧨',Math.floor(60-tl),3+Math.floor((60-tl)/10));return;}
      tiles.forEach(c=>{if(Math.abs(c.tx)<2.5&&Math.abs(c.tz)<2.5){c.st='ok';c.disabled=false;c.mesh.scale.y=1;c.mesh.position.y=-0.25;}});
      api.spawn(0,0,0);
    });
    api.update(dt=>{
      if(done)return;
      tl-=dt;
      if(tl<=0){done=true;api.win(600,25,'60 saniye hayatta kaldın! 🧨');return;}
      let alive=0;
      for(const c of tiles){
        if(c.st==='ok')alive++;
        if(c.st==='fuse'){
          c.fuse-=dt;
          const s=0.85+0.15*Math.abs(Math.sin(Engine.time*25));
          c.mesh.scale.x=s;c.mesh.scale.z=s;
          if(c.fuse<=0){c.st='gone';c.disabled=true;FX.burst(c.tx,0,c.tz,'#ff5252',8,4,0.5);c.mesh.scale.set(0.01,0.01,0.01);}
        }
      }
      if(alive<8)restoreAll();
      const P=Engine.player;
      if(P.onGround){const c=tileAt(P.pos.x,P.pos.z);if(c)ignite(c);}
      rb.forEach(b=>{
        if(b.dead)return;
        b.tt-=dt;
        if(b.tt<=0){
          b.tt=U.rand(0.8,1.6);
          const opts=tiles.filter(c=>c.st==='ok');
          if(opts.length){const t=U.choice(opts);b.target={x:t.tx,z:t.tz};}
        }
        Bots.stepTo(b,b.target.x,b.target.z,b.speed,dt);
        if(b.onGround){const c=tileAt(b.pos.x,b.pos.z);if(c)ignite(c);}
        if(b.feetY<-4){b.respawnPos.set(0,0,0);Bots.kill(b,2);}
      });
      api.stat('⏱ '+Math.ceil(tl)+'s | 🧱 '+alive);
    });
  }
});

/* ============ 12) BRIDGE RACE ============ */
defGame({
  id:'bridge',name:'BRIDGE RACE',emoji:'🌉',color:'#31a2ff',
  desc:'Blokları topla, köprü kur, botlardan önce bitir!',
  enter(api){
    W.env('#4aa8ff',35,110,'#dff3ff',true);W.killY=-8;
    let t=0,done=false;
    const anchorZ=-2,UNIT=1.2,MAXL=37;
    const lanes=[{x:-7},{x:0},{x:7}];
    lanes.forEach(l=>{W.box(l.x,-0.5,2,6,1,8,'#9aa7b8');});
    W.box(0,-0.5,-50,22,1,8,'#ffd32a');
    const fin=W.box(0,1,-49,20,2,2,'#000',{trigger:true});
    fin.cb=()=>{
      if(done)return;done=true;
      let place=1;
      rb.forEach(r=>{if(r.prog>-Engine.player.pos.z+2)place++;});
      api.win(400-place*80-Math.floor(t*3),30+(3-place)*8,place+'. oldun! Süre: '+t.toFixed(1)+' sn');
    };
    const flag=new THREE.Sprite(new THREE.SpriteMaterial({map:Engine.emojiTex('🏁'),transparent:true,depthWrite:false}));
    flag.scale.set(2.5,2.5,1);flag.position.set(0,3.5,-50);W.mesh(flag);
    W.box(-3.5,0.75,-24,0.5,1.5,56,'#e8e8e8');
    W.box(3.5,0.75,-24,0.5,1.5,56,'#e8e8e8');
    function mkBridge(x){
      const m=new THREE.Mesh(Engine.GEO.box,Engine.MAT('#8d6e63'));
      m.scale.set(4,0.5,0.02);m.position.set(x,-0.25,anchorZ);W.mesh(m);
      const c=W.box(x,-0.25,anchorZ,4,0.5,0.02,'#8d6e63');
      c.mesh=m;
      return {len:0,mesh:m,col:c};
    }
    function setBridge(b){
      const d=Math.max(0.02,b.len*UNIT);
      b.mesh.scale.z=d;
      b.mesh.position.z=anchorZ-d/2;
      b.col.hz=d/2;b.col.z=anchorZ-d/2;
      b.col.disabled=b.len===0;
    }
    const pb=mkBridge(0);
    let blocks=1,blockT=0;
    for(let z=-6;z>=-42;z-=4){
      [-1.3,0,1.3].forEach(x=>{
        const m=new THREE.Mesh(Engine.GEO.box,Engine.MATB(U.choice(['#ff8a80','#80d8ff','#b9f6ca','#ffd180'])));
        m.scale.setScalar(0.7);m.position.set(x,0.4,z);W.mesh(m);
        const c=W.box(x,0.4,z,1,1,1,'#000',{trigger:true});
        c.mesh=m;
        c.cb=()=>{if(blocks<8){blocks++;Sfx.tap();syncStack();}W.removeC(c);};
      });
    }
    const stackGrp=new THREE.Group();Engine.playerGroup.add(stackGrp);
    function syncStack(){
      while(stackGrp.children.length>blocks)stackGrp.remove(stackGrp.children[0]);
      while(stackGrp.children.length<blocks){
        const q=new THREE.Mesh(Engine.GEO.box,Engine.MATB('#80d8ff'));
        q.scale.setScalar(0.5);
        q.position.set(0,2.15+stackGrp.children.length*0.34,0);
        stackGrp.add(q);
      }
    }
    syncStack();
    api.onExit(()=>{if(stackGrp.parent)stackGrp.parent.remove(stackGrp);});
    const rb=[];
    [{x:-7},{x:7}].forEach(l=>{
      const bot=Bots.make(null,l.x,1);
      bot.mode='manual';bot.fallBelow=-100;bot.yawT=Math.PI;
      bot.prog=0;bot.blocks=1;bot.bridge=mkBridge(l.x);bot.lx=l.x;
      rb.push(bot);
    });
    api.spawn(0,0,3);
    api.fall(()=>{
      blocks=Math.max(0,blocks-2);syncStack();
      Sfx.hit();Engine.hurtFx();
      api.spawn(0,0,3);
      api.toast('💫 Blokların saçıldı!',1);
    });
    api.update(dt=>{
      if(done)return;
      t+=dt;blockT+=dt;
      if(blockT>=1.8){blockT=0;if(blocks<8){blocks++;syncStack();}}
      const P=Engine.player;
      const endZ=anchorZ-pb.len*UNIT;
      if(P.pos.z<endZ+0.6&&blocks>0&&pb.len<MAXL){
        blocks--;syncStack();pb.len++;setBridge(pb);Sfx.tap();
      }
      rb.forEach(r=>{
        const playerLead=-P.pos.z;
        const rate=0.85+U.clamp((playerLead-r.prog)*0.02,-0.25,0.5);
        r.blocks+=dt*rate;
        const bEnd=anchorZ-r.bridge.len*UNIT;
        r.pos.z=Math.max(bEnd+0.3,r.pos.z-4.5*dt);
        r.prog=-r.pos.z;
        if(r.pos.z<=bEnd+0.35&&r.blocks>=1&&r.bridge.len<MAXL){
          r.blocks-=1;r.bridge.len++;setBridge(r.bridge);
        }
        r.pos.x=r.lx;r.hspd=4.5;
        Bots.physics(r,dt);Bots.anim(r,dt);
      });
      api.stat('🧱 '+blocks+' blok | 📏 '+Math.floor(-P.pos.z)+'m');
    });
  }
});

/* ============ 13) SUMO ROYALE ============ */
defGame({
  id:'sumo',name:'SUMO ROYALE',emoji:'🤼',color:'#ffb100',
  desc:'Herkesi platformdan it! (✋ = dalga atma)',
  enter(api){
    W.env('#ff9d5c',30,95,'#ffe0b2',true);W.killY=-8;
    let lives=3,dashCd=0,done=false;
    W.box(0,-0.5,0,15,1,15,'#e0e0e0');
    const edge=new THREE.Mesh(new THREE.RingGeometry(7,7.6,32),Engine.MATB('#ff4d5e'));
    edge.rotation.x=-Math.PI/2;edge.position.y=0.02;W.mesh(edge);
    const sb=[];
    for(let i=0;i<3;i++){
      const a=i/3*Math.PI*2;
      const b=Bots.make(null,Math.cos(a)*4,Math.sin(a)*4);
      b.mode='manual';b.fallBelow=-7;b.speed=3.6;
      b.chargeT=U.rand(1,3);b.charging=0;
      sb.push(b);
    }
    function aliveBots(){return sb.filter(b=>!b.dead);}
    api.hearts(3,3);
    api.spawn(0,0,0);
    api.fall(()=>{
      lives--;api.hearts(lives,3);
      Engine.hurtFx();Sfx.hit();
      if(lives<=0){done=true;api.lose('Platformdan düştün! 🤼',100-aliveBots().length*25,4);return;}
      api.spawn(0,0,0);
      Engine.player.iframe=1.5;
    });
    api.update(dt=>{
      if(done)return;
      dashCd=Math.max(0,dashCd-dt);
      const P=Engine.player;
      if(Input.actionBuf>0){
        Input.actionBuf=0;
        if(dashCd<=0){
          dashCd=1.1;
          const yaw=Engine.playerGroup.rotation.y;
          P.vel.x+=Math.sin(yaw)*13;
          P.vel.z+=Math.cos(yaw)*13;
          FX.ring(P.pos.x,0.1,P.pos.z,'#ffb100');
          Sfx.jump();
        }
      }
      const ents=[{p:P.pos,player:true}].concat(aliveBots().map(b=>({p:b.pos,b:b})));
      sb.forEach(b=>{
        if(b.dead)return;
        b.chargeT-=dt;
        if(b.chargeT<=0){b.chargeT=U.rand(2,4);b.charging=0.8;}
        if(b.charging>0)b.charging-=dt;
        let best=null,bd=1e9;
        ents.forEach(e=>{
          if(e.b===b)return;
          const d=Math.hypot(e.p.x-b.pos.x,e.p.z-b.pos.z);
          if(d>0.1&&d<bd){bd=d;best=e;}
        });
        if(best){
          const spd=b.charging>0?7.5:b.speed;
          Bots.stepTo(b,best.p.x,best.p.z,spd,dt);
        } else {Bots.physics(b,dt);Bots.anim(b,dt);}
        if(b.charging>0)b.hspd=7.5;
      });
      sb.forEach(b=>{
        if(b.dead)return;
        const dx=b.pos.x-P.pos.x,dz=b.pos.z-P.pos.z;
        const d=Math.hypot(dx,dz);
        if(d<1.25&&d>0.001){
          const hs=Math.hypot(P.vel.x,P.vel.z);
          b.push.x+=dx/d*(7+hs*2.2);
          b.push.z+=dz/d*(7+hs*2.2);
          P.vel.x-=dx/d*3;P.vel.z-=dz/d*3;
        }
      });
      const al=aliveBots();
      for(let i=0;i<al.length;i++)for(let j=i+1;j<al.length;j++){
        const a=al[i],b=al[j];
        const dx=b.pos.x-a.pos.x,dz=b.pos.z-a.pos.z;
        const d=Math.hypot(dx,dz);
        if(d<1.2&&d>0.001){
          a.push.x-=dx/d*6;a.push.z-=dz/d*6;
          b.push.x+=dx/d*6;b.push.z+=dz/d*6;
        }
      }
      sb.forEach(b=>{
        if(b.dead&&!b.celebrated){
          b.celebrated=true;
          api.toast('💥 Bir rakip düştü! Kalan: '+aliveBots().length,1);
        }
      });
      if(aliveBots().length===0&&!done){
        done=true;
        api.win(300+lives*50,30+lives*4,lives+' can ile son ayakta kalan!');
      }
      api.stat('💨 Dalga: '+(dashCd<=0?'HAZIR':'...')+' | 🤼 '+aliveBots().length+' rakip');
    });
  }
});

/* ============ 14) MADEN SİM ============ */
defGame({
  id:'mine',name:'MADEN SİM',emoji:'⛏️',color:'#8d6e63',
  desc:'Cevher kaz, kazma yükselt, $1000 yap!',
  enter(api){
    W.env('#2a1d18',20,60,'#4a3524',false);W.killY=-30;
    Engine.setTool('pick');
    api.onExit(()=>Engine.setTool(null));
    let money=0,dmg=1,pickLvl=0,tier=1,done=false,mineCd=0,veinT=0;
    const ORES=[
      {n:'KÖMÜR',c:'#37474f',hp:2,v:1},
      {n:'DEMİR',c:'#b0bec5',hp:4,v:3},
      {n:'ALTIN',c:'#ffd32a',hp:7,v:8},
      {n:'ELMAS',c:'#4dd0e1',hp:12,v:25}];
    W.box(0,-0.5,2,30,1,22,'#6d4c41');
    const back=new THREE.Mesh(Engine.GEO.box,Engine.MAT('#1d130d'));
    back.scale.set(30,10,1);back.position.set(0,5,-8);W.mesh(back);
    function genOre(){
      const r=Math.random()*100;
      const dCh=Math.min(18,2+2*tier),gCh=10+2*tier,iCh=25;
      if(r<dCh)return 3;
      if(r<dCh+gCh)return 2;
      if(r<dCh+gCh+iCh)return 1;
      return 0;
    }
    const blocks=[];
    function buildVein(){
      blocks.forEach(b=>{W.removeC(b.col);b.col.mesh.material.dispose();});
      blocks.length=0;
      for(let i=0;i<6;i++)for(let j=0;j<5;j++){
        const oi=genOre();
        const o=ORES[oi];
        const x=(i-2.5)*1.35,y=0.7+j*1.35,z=-5.5;
        const mat=new THREE.MeshLambertMaterial({color:o.c});
        const m=new THREE.Mesh(Engine.GEO.box,mat);
        m.scale.set(1.25,1.25,1.25);m.position.set(x,y,z);
        Engine.scene.add(m);Engine.items.push(m);
        const col=W.box(x,y,z,1.25,1.25,1.25,o.c);
        col.mesh.visible=false;
        blocks.push({m:m,col:col,hp:o.hp+(tier-1),max:o.hp+(tier-1),o:o,x:x,y:y,z:z});
      }
      api.toast('⛏️ DAMAR #'+tier+' hazır!',1.2);
    }
    buildVein();
    const PICKS=[
      {n:'DEMİR KAZMA',cost:30,d:2},
      {n:'ALTIN KAZMA',cost:100,d:4},
      {n:'ELMAS KAZMA',cost:300,d:8}];
    PICKS.forEach((p,i)=>{
      const x=-8+i*8,z=8;
      const pad=new THREE.Mesh(Engine.GEO.box,Engine.MATB('#2ed573'));
      pad.scale.set(2.6,0.15,2.6);pad.position.set(x,0.08,z);W.mesh(pad);
      const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:Engine.textTex('⛏ $'+p.cost),transparent:true,depthWrite:false}));
      sp.scale.set(2.4,0.6,1);sp.position.set(x,2.1,z);W.mesh(sp);
      const it=api.interact(x,z,2.4,
        ()=>pickLvl>i?'✔ ALINDI':(pickLvl===i?'🛒 '+p.n+' — $'+p.cost:'🔒 Önce alt kademe'),
        ()=>{
          if(done||pickLvl!==i||money<p.cost)return;
          money-=p.cost;pickLvl=i+1;dmg=p.d;
          it.dead=true;
          Engine.scene.remove(pad);Engine.scene.remove(sp);
          Sfx.buy();api.toast('⛏ '+p.n+' alındı! Güç: '+dmg);
        });
    });
    api.spawn(0,0,4);
    api.update(dt=>{
      if(done)return;
      mineCd=Math.max(0,mineCd-dt);
      const P=Engine.player;
      const yaw=Engine.playerGroup.rotation.y;
      const fx=Math.sin(yaw),fz=Math.cos(yaw);
      if(Input.actionBuf>0){
        Input.actionBuf=0;
        if(mineCd<=0){
          mineCd=0.4;Engine.punch=0.25;
          let best=null,bd=1e9;
          blocks.forEach(b=>{
            if(b.hp<=0)return;
            const dx=b.x-P.pos.x,dz=b.z-P.pos.z;
            const d=Math.hypot(dx,dz);
            if(d<3){
              const dot=(dx/d)*fx+(dz/d)*fz;
              if(dot>0.45&&d<bd){bd=d;best=b;}
            }
          });
          if(best){
            best.hp-=dmg;
            Sfx.tap();
            best.m.material.emissive.setHex(0xffffff);
            best.m.material.emissiveIntensity=0.5;
            setTimeout(()=>{if(best.m.material)best.m.material.emissiveIntensity=0;},80);
            FX.burst(best.x,best.y,best.z,best.o.c,6,3,0.4);
            if(best.hp<=0){
              money+=best.o.v;
              FX.floatText(best.x,best.y+0.8,best.z,'+$'+best.o.v,'#ffd32a');
              Sfx.coin();
              Engine.scene.remove(best.m);
              W.removeC(best.col);
            }
          }
        }
      }
      if(veinT===0&&blocks.every(b=>b.hp<=0)){veinT=2;api.toast('💎 Damar tükendi! Yenisi geliyor...',1.5);}
      if(veinT>0){veinT-=dt;if(veinT<=0){veinT=0;tier++;buildVein();}}
      if(!done&&money>=1000){done=true;api.win(Math.floor(money),45,'DAMAR #'+tier+' • Maden zengini! ⛏️');}
      api.stat('💰 $'+Math.floor(money)+'/1000 | ⛏ Güç '+dmg+' | Damar #'+tier);
    });
  }
});

/* ============ 15) ZOMBİ İSTİLASI ============ */
defGame({
  id:'zombie',name:'ZOMBİ İSTİLASI',emoji:'🧟',color:'#7cb342',
  desc:'5 dalga zombiye karşı kılıçla hayatta kal!',
  enter(api){
    W.env('#1c2b1a',25,70,'#33452c',false);W.killY=-30;
    Engine.setTool('sword');
    api.onExit(()=>Engine.setTool(null));
    let hearts=5,wave=0,kills=0,atkCd=0,restT=2,done=false;
    const zombies=[];
    W.box(0,-0.5,0,26,1,26,'#4a5d3a');
    [[0,-13],[0,13],[-13,0],[13,0]].forEach((p,i)=>{
      if(i<2)W.box(p[0],0.9,p[1],26,1.8,0.7,'#3e2723');
      else W.box(p[0],0.9,p[1],0.7,1.8,26,'#3e2723');
    });
    for(let i=0;i<6;i++){
      const g=new THREE.Mesh(Engine.GEO.box,Engine.MAT('#78909c'));
      g.scale.set(0.8,1.1,0.25);
      g.position.set(U.rand(-9,9),0.55,U.rand(-9,9));W.mesh(g);
    }
    function spawnWave(n){
      const cnt=Math.min(8,2+n);
      for(let i=0;i<cnt;i++){
        const a=U.rand(0,Math.PI*2);
        const x=Math.cos(a)*10,z=Math.sin(a)*10;
        const zb=Bots.make({skin:'#7cb342',shirt:'#4e342e',pants:'#3e2723'},x,z,'Zombi'+U.randi(99));
        zb.mode='manual';zb.fallBelow=-100;
        zb.hp=20+n*5;zb.spd=2.2+n*0.25;zb.atk=U.rand(0.5,1.5);
        zombies.push(zb);
      }
      api.big('🧟 DALGA '+n,'#33691e',1.4);
      Sfx.trap();
    }
    function killZ(z){
      FX.burst(z.pos.x,z.feetY+1,z.pos.z,'#7cb342',16,7,0.8);
      Sfx.boom();
      Engine.scene.remove(z.grp);
      let i=Bots.all.indexOf(z);if(i>=0)Bots.all.splice(i,1);
      i=zombies.indexOf(z);if(i>=0)zombies.splice(i,1);
      kills++;
    }
    api.hearts(5,5);
    api.spawn(0,0,0);
    api.update(dt=>{
      if(done)return;
      atkCd=Math.max(0,atkCd-dt);
      const P=Engine.player;
      if(Input.actionBuf>0){
        Input.actionBuf=0;
        if(atkCd<=0){
          atkCd=0.45;Engine.punch=0.25;
          let hitAny=false;
          zombies.slice().forEach(z=>{
            const d=Math.hypot(z.pos.x-P.pos.x,z.pos.z-P.pos.z);
            if(d<3.2){
              hitAny=true;z.hp-=10;z.punchT=0.2;
              FX.burst(z.pos.x,z.feetY+1.2,z.pos.z,'#ff4d5e',6,4,0.4);
              FX.floatText(z.pos.x,z.feetY+2.4,z.pos.z,'-10','#ff4d5e');
              if(z.hp<=0)killZ(z);
            }
          });
          if(hitAny)Sfx.hit();
        }
      }
      zombies.slice().forEach(z=>{
        Bots.stepTo(z,P.pos.x,P.pos.z,z.spd,dt);
        z.atk-=dt;
        const d=Math.hypot(z.pos.x-P.pos.x,z.pos.z-P.pos.z);
        if(d<1.7&&z.atk<=0){
          z.atk=1.2;z.punchT=0.25;
          if(P.iframe<=0){
            hearts--;api.hearts(hearts,5);
            P.iframe=1;
            Engine.hurtFx();Engine.shake(0.4);Sfx.hit();
            if(hearts<=0){done=true;api.lose('Zombiler seni yedi! 🧟',kills*10+(wave-1)*100,6);return;}
          }
        }
      });
      if(zombies.length===0){
        restT-=dt;
        if(restT<=0){
          wave++;
          if(wave>5){done=true;api.win(500+kills*10,40+hearts*3,kills+' zombi avladın! 🧟');return;}
          spawnWave(wave);
          restT=3;
          if(hearts<5){
            const hx=U.rand(-6,6),hz=U.rand(-6,6);
            const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:Engine.emojiTex('❤️'),transparent:true,depthWrite:false}));
            sp.scale.set(1,1,1);sp.position.set(hx,1.2,hz);W.mesh(sp);
            const c=W.box(hx,1,hz,1.4,2,1.4,'#000',{trigger:true});
            c.mesh=sp;
            c.cb=()=>{hearts=Math.min(5,hearts+1);api.hearts(hearts,5);Sfx.coin();W.removeC(c);};
          }
        }
      }
      api.stat('🧟 DALGA '+Math.max(1,wave)+'/5 | 💀 '+kills+' | kalan '+zombies.length);
    });
  }
});

/* ============ 16) BALIK TUTMA ============ */
defGame({
  id:'fishing',name:'BALIK TUTMA',emoji:'🎣',color:'#29b6f6',
  desc:'Oltayı at, tam zamanında çek, efsane balığı yakala!',
  enter(api){
    W.env('#4aa8ff',35,110,'#dff3ff',true);W.killY=-4;
    Engine.setTool('rod');
    api.onExit(()=>Engine.setTool(null));
    let t=60,earned=0,done=false;
    let state='idle',waitT=0,biteT=0;
    const FISH=[
      {n:'Çipura',v:5,c:'#90caf9',p:0.5},
      {n:'Levrek',v:12,c:'#a5d6a7',p:0.3},
      {n:'Kılıç Balığı',v:25,c:'#b39ddb',p:0.14},
      {n:'EFSANE BALIK',v:60,c:'#ffd32a',p:0.06}];
    const sea=new THREE.Mesh(Engine.GEO.box,Engine.MATB('#1976d2'));
    sea.scale.set(40,0.3,26);sea.position.set(0,-0.4,-16);W.mesh(sea);
    W.box(0,-0.5,4,10,1,12,'#8d6e63');
    const rodTip={x:0,z:-4};
    const float=new THREE.Mesh(new THREE.SphereGeometry(0.22,8,8),Engine.MATB('#ff1744'));
    float.visible=false;W.mesh(float);
    const ex=new THREE.Sprite(new THREE.SpriteMaterial({map:Engine.textTex('❗','#ff1744'),transparent:true,depthWrite:false}));
    ex.scale.set(1.2,1.2,1);ex.visible=false;W.mesh(ex);
    const fb=Bots.make(null,3,3,'BalıkçıBot');
    fb.mode='manual';fb.fallBelow=-100;fb.yawT=Math.PI;
    let fbT=U.rand(2,5);
    function pickFish(){
      let r=Math.random();
      for(const f of FISH){if(r<f.p)return f;r-=f.p;}
      return FISH[0];
    }
    function cast(){
      state='wait';waitT=U.rand(1.2,4);
      float.visible=true;
      float.position.set(rodTip.x+U.rand(-1,1),0.2,rodTip.z-U.rand(2,5));
      ex.visible=false;
      Sfx.splash();
      FX.ring(float.position.x,0.1,float.position.z,'#b3e5fc');
    }
    api.spawn(0,0,6);
    api.update(dt=>{
      if(done)return;
      t-=dt;
      if(t<=0){done=true;api.win(Math.floor(earned),10+Math.floor(earned/20),'$'+Math.floor(earned)+' kazandın! 🎣');return;}
      fbT-=dt;
      if(fbT<=0){fbT=U.rand(3,6);FX.floatText(3,2.5,3,U.choice(['🐟 +5','🐠 +8','🎣 Yakaladım!']),'#29b6f6');}
      Bots.physics(fb,dt);Bots.anim(fb,dt);
      if(state==='wait'){
        waitT-=dt;
        float.position.y=0.2+Math.sin(Engine.time*4)*0.08;
        if(waitT<=0){
          state='bite';biteT=0.9;
          ex.visible=true;ex.position.set(float.position.x,1.2,float.position.z);
          Sfx.reel();
        }
      } else if(state==='bite'){
        biteT-=dt;
        float.position.y=0.2+Math.sin(Engine.time*20)*0.2;
        ex.position.y=1.2+Math.sin(Engine.time*10)*0.2;
        if(biteT<=0){
          state='idle';float.visible=false;ex.visible=false;
          api.toast('🐟 Kaçırdın! Çok geç.',1);
        }
      }
      if(Input.actionBuf>0){
        Input.actionBuf=0;
        Engine.punch=0.25;
        if(state==='idle'){cast();}
        else if(state==='wait'){
          state='idle';float.visible=false;ex.visible=false;
          api.toast('🎣 Çok erken çektin!',1);
        } else if(state==='bite'){
          const f=pickFish();
          earned+=f.v;
          state='idle';float.visible=false;ex.visible=false;
          Sfx.coin();
          FX.burst(rodTip.x,0.5,rodTip.z-3,f.c,14,5,0.8);
          FX.floatText(rodTip.x,1.6,rodTip.z-2,'+'+f.v+' '+f.n,'#ffd32a');
        }
      }
      api.stat('⏱ '+Math.ceil(t)+'s | 💰 $'+Math.floor(earned)+' | '+(state==='bite'?'❗ ÇEK!':state==='wait'?'Bekle...':'✋ Oltayı at'));
    });
  }
});

/* ============ 17) BOMBA KİMDE ============ */
defGame({
  id:'bomb',name:'BOMBA KİMDE',emoji:'💣',color:'#ff5252',
  desc:'Bombayı üzerinde tutma! Yaklaşınca bota geçir!',
  enter(api){
    W.env('#3d2b52',25,75,'#6b4d8a',false);W.killY=-8;
    let hearts=3,round=0,done=false;
    const ROUNDS=5;
    W.box(0,-0.5,0,22,1,22,'#5d4a72');
    [[0,-11],[0,11],[-11,0],[11,0]].forEach((p,i)=>{
      if(i<2)W.box(p[0],0.6,p[1],22,1.2,0.6,'#3e2723');
      else W.box(p[0],0.6,p[1],0.6,1.2,22,'#3e2723');
    });
    const bots=[];
    for(let i=0;i<3;i++){
      const a=i/3*Math.PI*2;
      const b=Bots.make(null,Math.cos(a)*5,Math.sin(a)*5);
      b.mode='manual';b.fallBelow=-100;b.speed=4;b.alive=true;
      bots.push(b);
    }
    const bomb=new THREE.Mesh(new THREE.SphereGeometry(0.45,10,8),Engine.MAT('#212121'));
    W.mesh(bomb);
    const fuse=new THREE.Mesh(Engine.GEO.box,Engine.MATB('#ff9100'));
    fuse.scale.set(0.1,0.25,0.1);bomb.add(fuse);fuse.position.y=0.5;
    let holder=null;
    let bombT=0,passCd=0;
    function aliveBots(){return bots.filter(b=>b.alive);}
    function startRound(){
      round++;
      const pool=['player'].concat(aliveBots());
      holder=U.choice(pool);
      bombT=Math.max(4,11-round);
      passCd=1;
      api.big('💣 TUR '+round,'#ff5252',1.2);
      Sfx.trap();
    }
    function explode(){
      const P=Engine.player;
      if(holder==='player'){
        FX.burst(P.pos.x,P.pos.y,P.pos.z,'#ff5252',24,9,1);
        Engine.shake(0.6);Sfx.boom();
        hearts--;api.hearts(hearts,3);
        Engine.hurtFx();
        if(hearts<=0){done=true;api.lose('Bomba elinde patladı! 💥',round*100,4);return;}
        api.toast('💥 Patladın! Kalan tur: '+(ROUNDS-round),1.4);
      } else if(holder&&holder.alive){
        FX.burst(holder.pos.x,holder.feetY+1,holder.pos.z,'#ff5252',24,9,1);
        Sfx.boom();
        holder.alive=false;holder.grp.visible=false;
        api.toast('💥 '+aliveBots().length+' bot kaldı!',1.2);
      }
      if(round>=ROUNDS){done=true;api.win(300+hearts*60,25+hearts*5,hearts+' can ile hayatta kaldın!');return;}
      if(aliveBots().length===0){done=true;api.win(400,35,'Tüm botları patlattın! 💣');return;}
      startRound();
    }
    api.hearts(3,3);
    api.spawn(0,0,0);
    startRound();
    api.update(dt=>{
      if(done)return;
      bombT-=dt;passCd=Math.max(0,passCd-dt);
      const P=Engine.player;
      if(Math.floor(bombT*2)!==Math.floor((bombT+dt)*2))Sfx.tick();
      bots.forEach(b=>{
        if(!b.alive)return;
        if(holder===b){
          const dx=b.pos.x-P.pos.x,dz=b.pos.z-P.pos.z;
          const d=Math.hypot(dx,dz)||1;
          b.tx=b.pos.x+dx/d*3;b.tz=b.pos.z+dz/d*3;
        } else {
          if(!b.tx||Math.random()<dt*0.5){b.tx=U.rand(-8,8);b.tz=U.rand(-8,8);}
        }
        b.tx=U.clamp(b.tx,-9,9);b.tz=U.clamp(b.tz,-9,9);
        Bots.stepTo(b,b.tx,b.tz,b.speed,dt);
      });
      if(passCd<=0){
        if(holder==='player'){
          for(const b of bots){
            if(!b.alive)continue;
            if(Math.hypot(b.pos.x-P.pos.x,b.pos.z-P.pos.z)<1.7){
              holder=b;passCd=1;Sfx.door();
              api.toast('💣 Bombayı geçirdin!',0.8);break;
            }
          }
        } else if(holder&&holder.alive){
          if(Math.hypot(holder.pos.x-P.pos.x,holder.pos.z-P.pos.z)<1.7){
            holder='player';passCd=1;Sfx.trap();
            api.toast('💣 Bomba SENDE! Kaç!',0.9);
          }
        }
      }
      if(holder==='player'){bomb.position.set(P.pos.x,P.pos.y+1.4,P.pos.z);}
      else if(holder){bomb.position.set(holder.pos.x,holder.feetY+2.4,holder.pos.z);}
      bomb.rotation.y+=dt*3;
      const s=1+Math.max(0,(3-bombT))*0.08*Math.abs(Math.sin(Engine.time*10));
      bomb.scale.setScalar(s);
      if(bombT<=0)explode();
      api.stat('💣 '+Math.max(0,bombT).toFixed(1)+'s | TUR '+round+'/'+ROUNDS+' | '+(holder==='player'?'SENDE!':'güvende'));
    });
  }
});

/* ============ 18) HAZİNE AVI ============ */
defGame({
  id:'scavenger',name:'HAZİNE AVI',emoji:'💎',color:'#ab47bc',
  desc:'Botlardan önce mücevherleri topla! 45 saniye.',
  enter(api){
    W.env('#26345c',30,90,'#5a6fae',false);W.killY=-8;
    let t=45,pScore=0,done=false;
    W.box(0,-0.5,0,26,1,26,'#4a5568');
    [[0,-13],[0,13],[-13,0],[13,0]].forEach((p,i)=>{
      if(i<2)W.box(p[0],0.9,p[1],26,1.8,0.6,'#37474f');
      else W.box(p[0],0.9,p[1],0.6,1.8,26,'#37474f');
    });
    for(let i=0;i<6;i++){
      W.box(U.rand(-8,8),0.75,U.rand(-8,8),U.rand(1.5,3),1.5,U.rand(1.5,3),'#607d8b');
    }
    const gems=[];
    function spawnGem(){
      const type=Math.random()<0.15?'diamond':'gem';
      const color=type==='diamond'?'#4dd0e1':U.choice(['#ab47bc','#ec407a','#66bb6a','#ffa726']);
      const m=new THREE.Mesh(new THREE.OctahedronGeometry(0.4),Engine.MATB(color));
      const x=U.rand(-11,11),z=U.rand(-11,11);
      m.position.set(x,0.9,z);W.mesh(m);
      gems.push({m:m,x:x,z:z,type:type,val:type==='diamond'?5:1});
    }
    for(let i=0;i<8;i++)spawnGem();
    const rb=[];
    for(let i=0;i<2;i++){
      const b=Bots.make(null,U.rand(-8,8),U.rand(-8,8));
      b.mode='manual';b.fallBelow=-100;b.speed=4.2;b.score=0;b.target=null;
      rb.push(b);
    }
    function collectGem(g,byPlayer){
      const i=gems.indexOf(g);if(i>=0)gems.splice(i,1);
      FX.burst(g.x,0.9,g.z,'#ffffff',10,5,0.5);
      Engine.scene.remove(g.m);
      Sfx.coin();
      if(byPlayer){pScore+=g.val;FX.floatText(g.x,1.6,g.z,'+'+g.val,'#ffd32a');}
      spawnGem();
    }
    api.spawn(0,0,0);
    api.update(dt=>{
      if(done)return;
      t-=dt;
      if(t<=0){
        done=true;
        let place=1;rb.forEach(b=>{if(b.score>pScore)place++;});
        api.win(300-place*60+pScore*10,15+(3-place)*8+pScore,place+'. oldun! '+pScore+' puan');
        return;
      }
      const P=Engine.player;
      for(let i=gems.length-1;i>=0;i--){
        const g=gems[i];
        g.m.rotation.y+=dt*2;
        g.m.position.y=0.9+Math.sin(Engine.time*3+i)*0.15;
        if(Math.hypot(g.x-P.pos.x,g.z-P.pos.z)<1.2){collectGem(g,true);}
      }
      rb.forEach(b=>{
        if(!b.target||gems.indexOf(b.target)<0){
          let best=null,bd=1e9;
          gems.forEach(g=>{const d=Math.hypot(g.x-b.pos.x,g.z-b.pos.z);if(d<bd){bd=d;best=g;}});
          b.target=best;
        }
        if(b.target){
          const d=Bots.stepTo(b,b.target.x,b.target.z,b.speed,dt);
          if(d<1.1){b.score+=b.target.val;collectGem(b.target,false);b.target=null;}
        } else {Bots.physics(b,dt);Bots.anim(b,dt);}
      });
      const botMax=Math.max(rb[0].score,rb[1].score);
      api.stat('⏱ '+Math.ceil(t)+'s | 💎 SEN:'+pScore+' | 🤖 '+botMax);
    });
  }
});
