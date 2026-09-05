'use strict';
const GAMES=[];
function defGame(m){GAMES.push(m);}

/* ============ 1) OBBY ============ */
defGame({
  id:'obby',name:'OBBY',emoji:'🏁',color:'#3ecf5a',
  desc:'Düşmeden bitişe ulaş! Botlarla yarış!',
  enter(api){
    W.env('#4aa8ff',40,110,'#dff3ff',true);W.killY=-8;
    let t=0,done=false,cp={x:0,y:0,z:0};
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
          api.win(sc,15+Math.max(0,25-Math.floor(t/4)),'Süre: '+t.toFixed(1)+' sn');};
        const tr=new THREE.Sprite(new THREE.SpriteMaterial({map:Engine.emojiTex('🏆'),transparent:true,depthWrite:false}));
        tr.scale.set(2,2,1);tr.position.set(x,y+2.2,z);W.mesh(tr);}
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
    let t=0,hearts=3,inv=0,dist=0,done=false,nextZ=-18;
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
      if(hearts<=0){done=true;api.lose('Araba hurdaya döndü! 💥',dist,Math.floor(dist/12)+2);}
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
      api.stat('⚡'+dist+'m | 🤖'+Math.floor(rivalDist)+'m');
    });
  }
});

/* ============ 6) BUTTON TYCOON (games-extra.js'te MEGA'ya override edilecek) ============ */
defGame({
  id:'tycoon',name:'BUTTON TYCOON',emoji:'🏭',color:'#2ed573',
  desc:'Butonlara bas, üreteçler kur, $500 yap!',
  enter(api){
    W.env('#8fd3ff',35,110,'#e8f7ff',true);W.killY=-30;
    let money=0,done=false;
    const gens=[],cds=[],orbs=[];
    Engine.player.speed=7.5;
    W.box(0,-0.5,0,44,1,44,'#6abe4f');
    W.box(-11.2,1.5,0,17.6,3,0.8,'#9aa0a8');
    W.box(11.2,1.5,0,17.6,3,0.8,'#9aa0a8');
    const gate=W.box(0,1.5,0,3.2,3,0.8,'#ff4d5e');
    [[-16,14],[16,14],[-16,-14],[16,-14]].forEach(p=>{
      const tr=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.4,2,8),Engine.MAT('#6d4c41'));
      tr.position.set(p[0],1,p[1]);W.mesh(tr);
      const cr=new THREE.Mesh(new THREE.ConeGeometry(1.4,2.6,8),Engine.MAT('#2e9e44'));
      cr.position.set(p[0],3.2,p[1]);W.mesh(cr);
    });
    const mkPad=(x,z,priceSprite)=>{
      const p=new THREE.Mesh(Engine.GEO.box,Engine.MATB('#2ed573'));
      p.scale.set(2.6,0.15,2.6);p.position.set(x,0.08,z);W.mesh(p);
      const s=new THREE.Sprite(new THREE.SpriteMaterial({map:Engine.textTex(priceSprite),transparent:true,depthWrite:false}));
      s.scale.set(2.6,0.62,1);s.position.set(x,2,z);W.mesh(s);
      return {pad:p,spr:s};
    };
    const floatMoney=(x,z,txt)=>FX.floatText(x,2.4,z,txt,'#2ed573');
    const mkButton=(x,z,val)=>{
      const base=new THREE.Mesh(new THREE.CylinderGeometry(1.3,1.5,0.7,16),Engine.MAT('#c0392b'));
      base.position.set(x,0.35,z);W.mesh(base);
      const btn=new THREE.Mesh(new THREE.CylinderGeometry(0.85,0.85,0.35,16),Engine.MAT('#ff6b6b'));
      btn.position.set(x,0.85,z);W.mesh(btn);
      const st={cd:0};cds.push(st);
      api.interact(x,z,2.4,()=>'🔴 BAS  (+$'+val+')',()=>{
        if(st.cd>0||done)return;
        st.cd=0.35;money+=val;
        btn.position.y=0.7;
        FX.burst(x,1.2,z,'#ffd32a',8,4,0.5);
        floatMoney(x,z,'+$'+val);
        Sfx.coin();
      });
      gens.push({tick:dt2=>{btn.position.y=U.approach(btn.position.y,0.85,dt2*3);}});
    };
    mkButton(0,12,1);
    mkButton(0,-12,5);
    const mkGen=(x,z,cost,income,name)=>{
      const pads=mkPad(x,z,'🏭 $'+cost);
      const it=api.interact(x,z,2.4,
        ()=>money>=cost?'🛒 '+name+' — $'+cost:'🔒 $'+cost+' lazım',
        ()=>{
          if(money<cost||done)return;
          money-=cost;it.dead=true;
          Engine.scene.remove(pads.pad);Engine.scene.remove(pads.spr);
          Sfx.buy();api.toast(name+' kuruldu! 🏭');
          FX.burst(x,1,z,'#2ed573',16,6,0.8);
          const b=new THREE.Mesh(Engine.GEO.box,Engine.MAT('#78909c'));
          b.scale.set(1.9,1.4,1.9);b.position.set(x,0.7,z);W.mesh(b);
          const ch=new THREE.Mesh(Engine.GEO.box,Engine.MAT('#546e7a'));
          ch.scale.set(0.5,1.1,0.5);ch.position.set(x+0.5,1.9,z);W.mesh(ch);
          let acc=0;
          gens.push({tick:dt2=>{
            acc+=dt2;
            if(acc>=3){
              acc-=3;
              if(orbs.length<14) spawnOrb(x,z,income);
            }
          }});
        });
    };
    mkGen(10,12,15,5,'ÜRETEÇ I');
    mkGen(-10,12,40,12,'ÜRETEÇ II');
    mkGen(10,-12,120,30,'MEGA ÜRETEÇ');
    const gp=mkPad(0,4,'🚪 $60');
    const gi=api.interact(0,4,2.4,
      ()=>money>=60?'🔓 KAPIYI AÇ — $60':'🔒 Kapı için $60 lazım',
      ()=>{
        if(money<60)return;
        money-=60;gi.dead=true;
        W.removeC(gate);
        Engine.scene.remove(gp.pad);Engine.scene.remove(gp.spr);
        Sfx.buy();api.toast('🚪 2. BÖLGE AÇILDI!');
        FX.burst(0,1.5,0,'#ffd32a',20,7,0.9);
      });
    function spawnOrb(x,z,val){
      const ox=x+U.rand(-1,1),oz=z+U.rand(1.6,2.6);
      const m=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.35,0.14,14),Engine.MAT('#ffd32a'));
      m.rotation.x=Math.PI/2;m.position.set(ox,0.8,oz);W.mesh(m);
      const c=W.box(ox,0.9,oz,1.4,1.8,1.4,'#000',{trigger:true});
      c.mesh=m;
      c.cb=()=>{
        money+=val;
        FX.floatText(ox,1.6,oz,'+$'+val,'#ffd32a');
        Sfx.coin();
        W.removeC(c);
        const i=orbs.indexOf(c);if(i>=0)orbs.splice(i,1);
      };
      orbs.push(c);
    }
    const vb=Bots.make(null,U.rand(-6,6),U.rand(6,12),'MüşteriAli');
    vb.mode='wander';
    vb.wander={cx:0,cz:9,r:9,tx:0,tz:9,wait:1};
    vb.speed=3.5;vb.fallBelow=-12;vb.respawnPos.set(0,0,10);
    api.spawn(0,0,16);
    api.update(dt=>{
      cds.forEach(s=>{s.cd=Math.max(0,s.cd-dt);});
      gens.forEach(g=>{if(g.tick)g.tick(dt);});
      orbs.forEach(o=>{if(!o.disabled)o.mesh.rotation.z+=dt*3;});
      if(!done&&money>=500){done=true;api.win(Math.floor(money),40,'İmparatorluk kuruldu! 👑');}
      api.stat('💰 $'+Math.floor(money)+' / 500');
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
      meteors.push({x:x,z:z,t:0,state:0,ring:ring,mesh:null,fv:0});
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
      }
      for(let i=meteors.length-1;i>=0;i--){
        const m=meteors[i];m.t+=dt;
        if(m.state===0){
          m.ring.material.opacity=0.5+0.5*Math.abs(Math.sin(m.t*12));
          const k=1-Math.min(1,m.t/1.1);
          m.ring.scale.setScalar(Math.max(0.2,k));
          if(m.t>=1.1){
            m.state=1;
            m.mesh=new THREE.Mesh(new THREE.SphereGeometry(0.75,10,8),Engine.MATB('#5b3a29'));
            m.mesh.position.set(m.x,32,m.z);W.mesh(m.mesh);
          }
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
    Engine.camMode=2;Engine.camDist=6;Engine.camPitch=0.35;Engine.camYaw=0;
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
    let hearts=5,hp=220,HP0=220,st='chase',stT=0,atkCd=0,done=false;
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
    const boss=new THREE.Group();boss.position.set(0,0,-6);
    const bossMats=[];
    const bpart=(sx,sy,sz,color,x,y,z)=>{
      const m=new THREE.MeshLambertMaterial({color:color});
      bossMats.push(m);
      const q=new THREE.Mesh(Engine.GEO.box,m);
      q.scale.set(sx,sy,sz);q.position.set(x,y,z);boss.add(q);return q;
    };
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
