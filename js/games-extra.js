/* ============================================================
   games-extra.js — games.js üzerine güvenli genişletme katmanı
   Marketli oyun geliştirmeleri + MEGA TYCOON + 5 yeni oyun
   ============================================================ */
'use strict';

(function(){
  const byId=id=>GAMES.find(g=>g.id===id);

  /* ---------------- Ortak yardımcılar ---------------- */
  function wrapEnter(metaId,decorate){
    const meta=byId(metaId);
    if(!meta||typeof meta.enter!=='function') return;
    const original=meta.enter;
    meta.enter=function(baseApi){
      let updater=null;
      const proxy=Object.create(baseApi);
      proxy.update=fn=>{ updater=fn; baseApi.update(fn); };
      const extra=decorate(proxy);
      original(proxy);
      if(updater && typeof extra==='function') baseApi.update(dt=>{ updater(dt); extra(dt); });
    };
  }

  /* 1) OBBY — toplanabilir coinler */
  wrapEnter('obby',api=>{
    let coinN=0;
    const coins=[
      [2.5,1.4,-10],[5,2.2,-17.5],[-4.5,3.8,-32],
      [4.5,5.2,-48],[-2,6,-55],[0,7,-64]
    ];
    const oldWin=api.win.bind(api);
    api.win=(score,c,msg)=>oldWin(score,(c||0)+coinN*2,(msg||'')+' • 🪙 x'+coinN);
    return ()=>{
      /* yalnızca ilk frame'de üret */
      if(api.__coinSpawned) return;
      api.__coinSpawned=true;
      coins.forEach(p=>{
        const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:Engine.emojiTex('🪙'),transparent:true,depthWrite:false}));
        sp.scale.set(0.9,0.9,1); sp.position.set(p[0],p[1],p[2]); W.mesh(sp);
        const c=W.box(p[0],p[1]-0.3,p[2],1.2,1.2,1.2,'#000',{trigger:true});
        c.mesh=sp;
        c.cb=()=>{
          if(c.disabled) return;
          coinN++; Sfx.coin(); FX.burst(p[0],p[1],p[2],'#ffd32a',8,4,0.5); W.removeC(c);
        };
      });
    };
  });

  /* 2) TOWER — dönen çubuklar */
  wrapEnter('tower',api=>{
    const bars=[
      {y:8*1.85,s:1.7,a:0},
      {y:15*1.85,s:-2.1,a:2},
      {y:21*1.85,s:2.5,a:4}
    ];
    bars.forEach(b=>{
      const m=new THREE.Mesh(Engine.GEO.box,Engine.MAT('#ff2020'));
      m.scale.set(7.5,0.45,0.45); W.mesh(m); b.m=m;
    });
    let hitCd=0;
    return dt=>{
      hitCd=Math.max(0,hitCd-dt);
      const P=Engine.player.pos;
      bars.forEach(b=>{
        b.a+=b.s*dt; b.m.position.set(0,b.y,0); b.m.rotation.y=b.a;
        if(hitCd>0||Math.abs(P.y-b.y)>=1.4) return;
        for(const sgn of [1,-1]){
          const hx=Math.cos(b.a+(sgn===1?0:Math.PI))*3.4;
          const hz=Math.sin(b.a+(sgn===1?0:Math.PI))*3.4;
          if(Math.hypot(P.x-hx,P.z-hz)<1.1){
            const len=Math.hypot(P.x,P.z)||1;
            P.vel.x+=(P.x/len)*13; P.vel.z+=(P.z/len)*13;
            hitCd=0.25; Engine.shake(0.3); Sfx.hit(); HUD.toast('💥 Çubuk çarptı!',0.8);
            break;
          }
        }
      });
    };
  });

  /* 5) SPEED RUN — ek coin şeridi */
  wrapEnter('speed',api=>{
    let coinN=0, spawnT=1.2;
    const oldLose=api.lose.bind(api);
    api.lose=(msg,score,coins)=>oldLose(msg,score,(coins||0)+coinN);
    function spawnCoin(z){
      const lx=U.choice([-2.6,0,2.6]);
      const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:Engine.emojiTex('🪙'),transparent:true,depthWrite:false}));
      sp.scale.set(0.9,0.9,1); sp.position.set(lx,1,z); W.mesh(sp);
      const c=W.box(lx,1,z,1.1,1.4,1.1,'#000',{trigger:true}); c.mesh=sp; c.cb=()=>{ if(c.disabled)return; coinN++; Sfx.coin(); W.removeC(c); };
    }
    return dt=>{
      spawnT-=dt;
      if(spawnT<=0){
        spawnT=U.rand(1.5,2.8);
        if(Engine.playerOn) spawnCoin(Engine.player.pos.z-U.rand(18,30));
      }
    };
  });

  /* 8) DISASTER — yıldırım */
  wrapEnter('disaster',api=>{
    let boltT=4.5;
    function strike(){
      const x=U.rand(-11,11),z=U.rand(-11,11);
      const ring=new THREE.Mesh(new THREE.RingGeometry(1.4,1.8,22),
        new THREE.MeshBasicMaterial({color:'#ffd32a',transparent:true,opacity:0.9,side:THREE.DoubleSide,depthWrite:false}));
      ring.rotation.x=-Math.PI/2; ring.position.set(x,0.08,z); W.mesh(ring);
      const beam=new THREE.Mesh(Engine.GEO.box,Engine.MATB('#fff59d'));
      beam.scale.set(0.5,30,0.5); beam.position.set(x,15,z); W.mesh(beam);
      FX.burst(x,1,z,'#fff59d',16,8,0.6); FX.ring(x,0.1,z,'#ffd32a');
      Engine.shake(0.3); Sfx.boom();
      const P=Engine.player.pos;
      if(Math.hypot(P.x-x,P.z-z)<2.0) api.toast('⚡ Yıldırım!',0.9);
      for(const b of Bots.all){
        if(!b.dead&&Math.hypot(b.pos.x-x,b.pos.z-z)<2.0){
          b.respawnPos.set(U.rand(-9,9),0,U.rand(-9,9)); Bots.kill(b,2.5);
        }
      }
      setTimeout(()=>{Engine.scene.remove(ring);Engine.scene.remove(beam);},140);
    }
    return dt=>{
      boltT-=dt;
      if(boltT<=0){boltT=U.rand(4.5,7);strike();}
    };
  });

  /* 10) BOSS — aralıklı kalp kutusu */
  wrapEnter('boss',api=>{
    let hearts=5,heartT=6,spawned=[];
    const oldHearts=api.hearts.bind(api);
    api.hearts=(n,m)=>{ hearts=n; oldHearts(n,m); };
    function spawnHeart(){
      if(hearts>=5) return;
      const hx=U.rand(-8,8), hz=U.rand(-8,8);
      const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:Engine.emojiTex('❤️'),transparent:true,depthWrite:false}));
      sp.scale.set(1,1,1); sp.position.set(hx,1.2,hz); W.mesh(sp);
      const c=W.box(hx,1,hz,1.4,2,1.4,'#000',{trigger:true}); c.mesh=sp;
      c.cb=()=>{
        if(c.disabled)return;
        hearts=Math.min(5,hearts+1); oldHearts(hearts,5); Sfx.coin();
        FX.burst(hx,1.2,hz,'#ff4d5e',10,4,0.6); W.removeC(c);
      };
      spawned.push(c);
    }
    return dt=>{
      heartT-=dt;
      if(heartT<=0){heartT=8;spawnHeart();}
      for(let i=spawned.length-1;i>=0;i--) if(spawned[i].disabled) spawned.splice(i,1);
    };
  });

  /* ========================================================
     6) MEGA TYCOON — damlatıcı / konveyör / kolektör / rebirth
     ======================================================== */
  const tycoon=byId('tycoon');
  if(tycoon){
    tycoon.name='MEGA TYCOON';
    tycoon.desc='Konveyör kur, damlatıcı aç, REBIRTH yap!';
    tycoon.enter=function(api){
      W.env('#8fd3ff',35,110,'#e8f7ff',true); W.killY=-30;
      let money=0,total=0,mult=1,done=false;
      const cds=[],orbs=[],droppers=[],gens=[];
      let beltSpeed=2.5;
      Engine.player.speed=7.5;

      W.box(0,-0.5,0,44,1,44,'#6abe4f');
      const plot=new THREE.Mesh(Engine.GEO.box,Engine.MATB('#b7c4cf'));
      plot.scale.set(24,0.1,26); plot.position.set(0,0.05,-4); W.mesh(plot);
      const belt=new THREE.Mesh(Engine.GEO.box,Engine.MATB('#37474f'));
      belt.scale.set(2.2,0.25,16); belt.position.set(0,0.35,0); belt.visible=false; W.mesh(belt);
      const collector=new THREE.Group(); collector.position.set(0,0,8); collector.visible=false;
      const cbox=new THREE.Mesh(Engine.GEO.box,Engine.MAT('#ffb100'));
      cbox.scale.set(3,2,2); cbox.position.y=1; collector.add(cbox);
      const cmouth=new THREE.Mesh(Engine.GEO.box,Engine.MATB('#10131f'));
      cmouth.scale.set(1.6,1.2,0.2); cmouth.position.set(0,1,-1.02); collector.add(cmouth); W.mesh(collector);

      const mkPad=(x,z,label)=>{
        const p=new THREE.Mesh(Engine.GEO.box,Engine.MATB('#2ed573'));
        p.scale.set(2.6,0.15,2.6); p.position.set(x,0.08,z); W.mesh(p);
        const s=new THREE.Sprite(new THREE.SpriteMaterial({map:Engine.textTex(label),transparent:true,depthWrite:false}));
        s.scale.set(2.8,0.66,1); s.position.set(x,2.1,z); W.mesh(s);
        return {pad:p,spr:s};
      };
      const mkButton=(x,z,val)=>{
        const base=new THREE.Mesh(new THREE.CylinderGeometry(1.3,1.5,0.7,16),Engine.MAT('#c0392b')); base.position.set(x,0.35,z); W.mesh(base);
        const btn=new THREE.Mesh(new THREE.CylinderGeometry(0.85,0.85,0.35,16),Engine.MAT('#ff6b6b')); btn.position.set(x,0.85,z); W.mesh(btn);
        const st={cd:0}; cds.push(st);
        api.interact(x,z,2.4,()=> '🔴 BAS  (+$'+val*mult+')',()=>{
          if(st.cd>0||done)return; st.cd=0.35; const gain=val*mult; money+=gain; total+=gain;
          btn.position.y=0.7; FX.burst(x,1.2,z,'#ffd32a',8,4,0.5); FX.floatText(x,2.4,z,'+$'+gain,'#2ed573'); Sfx.coin();
        });
        gens.push({tick:dt2=>{btn.position.y=U.approach(btn.position.y,0.85,dt2*3);}});
      };
      function spawnOre(x,val,color){
        if(orbs.length>=40)return;
        const m=new THREE.Mesh(Engine.GEO.box,Engine.MATB(color)); m.scale.setScalar(0.5); m.position.set(x,2.7,-8); W.mesh(m);
        orbs.push({m:m,v:val,state:0});
      }
      function addDropper(x,val,color){
        const d=new THREE.Mesh(Engine.GEO.box,Engine.MAT(color)); d.scale.set(1.8,1.4,1.8); d.position.set(x,2,-8); W.mesh(d);
        const ch=new THREE.Mesh(Engine.GEO.box,Engine.MAT('#546e7a')); ch.scale.set(0.5,1,0.5); ch.position.set(x,3,-8); W.mesh(ch);
        droppers.push({x:x,val:val,color:color,acc:U.rand(0,2),interval:2.5});
      }
      mkButton(7,10,1);
      const stages=[
        {cost:15,name:'KONVEYÖR',label:'🛠 $15',apply(){beltSpeed=2.5;belt.visible=true;collector.visible=true;addDropper(-4,2,'#78909c');}},
        {cost:40,name:'DAMLATICI II',label:'🏭 $40',apply(){addDropper(0,4,'#4db6ac');}},
        {cost:75,name:'DAMLATICI III',label:'🏭 $75',apply(){addDropper(4,6,'#7986cb');}},
        {cost:120,name:'DUVARLAR',label:'🧱 $120',apply(){
          W.box(-12,1.5,-4,0.8,3,26,'#e0e0e0'); W.box(12,1.5,-4,0.8,3,26,'#e0e0e0');
          W.box(0,1.5,-17,24,3,0.8,'#e0e0e0'); W.box(-7.5,1.5,9,9,3,0.8,'#e0e0e0'); W.box(7.5,1.5,9,9,3,0.8,'#e0e0e0');
          const arch=new THREE.Mesh(Engine.GEO.box,Engine.MAT('#ffb100')); arch.scale.set(6,1,1); arch.position.set(0,3.3,9); W.mesh(arch);
        }},
        {cost:200,name:'HIZ FANI',label:'🌀 $200',apply(){beltSpeed=4.5;api.toast('🌀 Konveyör hızlandı!');}},
        {cost:350,name:'ALTIN DAMLATICI',label:'👑 $350',apply(){addDropper(-2,12,'#ffd32a');}},
        {cost:600,name:'KOLEKTÖR x2',label:'✖️2 $600',apply(){mult*=2;api.toast('✖️2 KAZANÇ ÇARPANI!');}},
        {cost:1000,name:'MEGA BUTON',label:'🔴 $1000',apply(){mkButton(-7,10,10);}},
        {cost:2000,name:'REBIRTH',label:'💫 $2000',apply(){done=true;api.win(Math.floor(total),60,'💫 REBIRTH! Toplam $'+Math.floor(total)+' kazandın');}}
      ];
      let bought=0;
      stages.forEach((s,i)=>{
        const x=-12+(i%5)*6,z=13+Math.floor(i/5)*3.5,pads=mkPad(x,z,s.label);
        const it=api.interact(x,z,2.4,()=>{
          if(i===8&&bought<8)return '🔒 Önce diğer 8 yükseltme!';
          return money>=s.cost?'🛒 '+s.name+' — $'+s.cost:'🔒 $'+s.cost+' lazım';
        },()=>{
          if(done)return;
          if(i===8&&bought<8){api.toast('Önce diğer yükseltmeleri al! 🔒');return;}
          if(money<s.cost)return;
          money-=s.cost; bought++; it.dead=true; Engine.scene.remove(pads.pad); Engine.scene.remove(pads.spr);
          Sfx.buy(); api.toast('🏗 '+s.name+' kuruldu!'); FX.burst(x,1,z,'#2ed573',16,6,0.8); s.apply();
        });
      });
      const vb=Bots.make(null,U.rand(-6,6),U.rand(6,12),'MüşteriAli');
      vb.mode='wander'; vb.wander={cx:0,cz:11,r:8,tx:0,tz:11,wait:1}; vb.speed=3.5; vb.fallBelow=-12; vb.respawnPos.set(0,0,11);
      api.spawn(0,0,16);
      api.update(dt=>{
        cds.forEach(s=>{s.cd=Math.max(0,s.cd-dt);});
        gens.forEach(g=>{if(g.tick)g.tick(dt);});
        droppers.forEach(d=>{d.acc+=dt;if(d.acc>=d.interval){d.acc=0;spawnOre(d.x,d.val,d.color);}});
        for(let i=orbs.length-1;i>=0;i--){
          const o=orbs[i];
          if(o.state===0){o.m.position.y-=6*dt;if(o.m.position.y<=0.75){o.m.position.y=0.75;o.state=1;}}
          else {o.m.position.z+=beltSpeed*dt;if(o.m.position.z>=7.6){
            const gain=o.v*mult; money+=gain; total+=gain; FX.burst(0,1.2,8,'#ffd32a',6,3,0.5); FX.floatText(0,2.6,8,'+$'+gain,'#ffd32a'); Engine.scene.remove(o.m); orbs.splice(i,1);
          }}
        }
        api.stat('💰 $'+Math.floor(money)+' | 📈 $'+Math.floor(total)+' | x'+mult);
      });
    };
  }

  /* ---------------- 11) TNT RUN ---------------- */
  defGame({
    id:'tntrun',name:'TNT RUN',emoji:'🧨',color:'#ff5252',
    desc:'Bastığın blok patlar! 60 saniye hayatta kal!',
    enter(api){
      W.env('#26345c',30,90,'#5a6fae',false); W.killY=-6;
      let tl=60,hearts=3,done=false; const tiles=[];
      const pal=['#ff8a80','#ffd180','#80d8ff','#b9f6ca','#ea80fc'];
      for(let i=0;i<9;i++)for(let j=0;j<9;j++){const x=(i-4)*2,z=(j-4)*2,c=W.box(x,-0.25,z,1.9,0.5,1.9,U.choice(pal));c.st='ok';c.fuse=0;c.tx=x;c.tz=z;tiles.push(c);}
      const rb=[];
      for(let k=0;k<2;k++){const b=Bots.make(null,U.rand(-4,4),U.rand(-4,4));b.mode='manual';b.fallBelow=-5;b.speed=5.5;b.target={x:0,z:0};b.tt=0;rb.push(b);}
      const tileAt=(x,z)=>{for(const c of tiles)if(c.st==='ok'&&Math.abs(x-c.tx)<0.95&&Math.abs(z-c.tz)<0.95)return c;return null;};
      const ignite=c=>{if(c&&c.st==='ok'){c.st='fuse';c.fuse=0.55;c.mesh.material=Engine.MATB('#ff5252');}};
      api.hearts(3,3);api.spawn(0,0,0);
      api.fall(()=>{hearts--;api.hearts(hearts,3);Engine.hurtFx();Sfx.hit();if(hearts<=0){done=true;api.lose('Patlayıp gittin! 🧨',Math.floor(60-tl),3+Math.floor((60-tl)/10));return;}tiles.forEach(c=>{if(Math.abs(c.tx)<2.5&&Math.abs(c.tz)<2.5){c.st='ok';c.disabled=false;c.mesh.scale.set(1,1,1);c.mesh.position.y=-0.25;}});api.spawn(0,0,0);});
      api.update(dt=>{
        if(done)return;tl-=dt;if(tl<=0){done=true;api.win(600,25,'60 saniye hayatta kaldın! 🧨');return;}
        let alive=0;
        for(const c of tiles){if(c.st==='ok')alive++;if(c.st==='fuse'){c.fuse-=dt;const s=0.85+0.15*Math.abs(Math.sin(Engine.time*25));c.mesh.scale.x=s;c.mesh.scale.z=s;if(c.fuse<=0){c.st='gone';c.disabled=true;FX.burst(c.tx,0,c.tz,'#ff5252',8,4,0.5);c.mesh.scale.set(0.01,0.01,0.01);}}}
        if(alive<8){tiles.forEach(c=>{c.st='ok';c.disabled=false;c.mesh.scale.set(1,1,1);c.mesh.position.y=-0.25;c.mesh.material=Engine.MATSTUD('#e8e8e8',1.9,1.9);});}
        const P=Engine.player.pos;if(Engine.player.onGround)ignite(tileAt(P.x,P.z));
        rb.forEach(b=>{if(b.dead)return;b.tt-=dt;if(b.tt<=0){b.tt=U.rand(0.8,1.6);const opts=tiles.filter(c=>c.st==='ok');if(opts.length){const t=U.choice(opts);b.target={x:t.tx,z:t.tz};}}Bots.stepTo(b,b.target.x,b.target.z,b.speed,dt);if(b.onGround)ignite(tileAt(b.pos.x,b.pos.z));if(b.feetY<-4){b.respawnPos.set(0,0,0);Bots.kill(b,2);}});
        api.stat('⏱ '+Math.ceil(tl)+'s | 🧱 '+alive);
      });
    }
  });

  /* ---------------- 12) BRIDGE RACE ---------------- */
  defGame({
    id:'bridge',name:'BRIDGE RACE',emoji:'🌉',color:'#31a2ff',
    desc:'Blokları topla, köprü kur, botlardan önce bitir!',
    enter(api){
      W.env('#4aa8ff',35,110,'#dff3ff',true);W.killY=-8;
      let t=0,done=false,blocks=1,blockT=0;const anchorZ=-2,UNIT=1.2,MAXL=37;
      W.box(-7,-0.5,2,6,1,8,'#9aa7b8');W.box(0,-0.5,2,6,1,8,'#9aa7b8');W.box(7,-0.5,2,6,1,8,'#9aa7b8');W.box(0,-0.5,-50,22,1,8,'#ffd32a');
      const fin=W.box(0,1,-49,20,2,2,'#000',{trigger:true});
      const rb=[];
      fin.cb=()=>{if(done)return;done=true;let place=1;rb.forEach(r=>{if(r.prog>-Engine.player.pos.z+2)place++;});api.win(400-place*80-Math.floor(t*3),30+(3-place)*8,place+'. oldun! Süre: '+t.toFixed(1)+' sn');};
      const flag=new THREE.Sprite(new THREE.SpriteMaterial({map:Engine.emojiTex('🏁'),transparent:true,depthWrite:false}));flag.scale.set(2.5,2.5,1);flag.position.set(0,3.5,-50);W.mesh(flag);
      W.box(-3.5,0.75,-24,0.5,1.5,56,'#e8e8e8');W.box(3.5,0.75,-24,0.5,1.5,56,'#e8e8e8');
      function mkBridge(x){const m=new THREE.Mesh(Engine.GEO.box,Engine.MAT('#8d6e63'));m.scale.set(4,0.5,0.02);m.position.set(x,-0.25,anchorZ);W.mesh(m);const c=W.box(x,-0.25,anchorZ,4,0.5,0.02,'#8d6e63');c.mesh=m;c.disabled=true;return{len:0,mesh:m,col:c};}
      function setBridge(b,x){const d=Math.max(0.02,b.len*UNIT);b.mesh.scale.z=d;b.mesh.position.z=anchorZ-d/2;b.col.hz=d/2;b.col.z=anchorZ-d/2;b.col.disabled=b.len===0;b.col.mesh.position.z=b.mesh.position.z;}
      const pb=mkBridge(0);
      for(let z=-6;z>=-42;z-=4)[-1.3,0,1.3].forEach(x=>{const m=new THREE.Mesh(Engine.GEO.box,Engine.MATB(U.choice(['#ff8a80','#80d8ff','#b9f6ca','#ffd180'])));m.scale.setScalar(0.7);m.position.set(x,0.4,z);W.mesh(m);const c=W.box(x,0.4,z,1,1,1,'#000',{trigger:true});c.mesh=m;c.cb=()=>{if(blocks<8){blocks++;Sfx.tap();syncStack();}W.removeC(c);};});
      const stackGrp=new THREE.Group();Engine.playerGroup.add(stackGrp);function syncStack(){while(stackGrp.children.length>blocks)stackGrp.remove(stackGrp.children[0]);while(stackGrp.children.length<blocks){const q=new THREE.Mesh(Engine.GEO.box,Engine.MATB('#80d8ff'));q.scale.setScalar(0.5);q.position.set(0,2.15+stackGrp.children.length*0.34,0);stackGrp.add(q);}}syncStack();api.onExit(()=>{if(stackGrp.parent)stackGrp.parent.remove(stackGrp);});
      [-7,7].forEach(x=>{const b=Bots.make(null,x,1);b.mode='manual';b.fallBelow=-100;b.yawT=Math.PI;b.prog=0;b.blocks=1;b.bridge=mkBridge(x);b.lx=x;rb.push(b);});
      api.spawn(0,0,3);api.fall(()=>{blocks=Math.max(0,blocks-2);syncStack();Sfx.hit();Engine.hurtFx();api.spawn(0,0,3);api.toast('💫 Blokların saçıldı!',1);});
      api.update(dt=>{if(done)return;t+=dt;blockT+=dt;if(blockT>=1.8){blockT=0;if(blocks<8){blocks++;syncStack();}}const P=Engine.player.pos,endZ=anchorZ-pb.len*UNIT;if(P.z<endZ+0.6&&blocks>0&&pb.len<MAXL){blocks--;syncStack();pb.len++;setBridge(pb,0);Sfx.tap();}
        rb.forEach(r=>{const lead=-P.z,rate=0.85+U.clamp((lead-r.prog)*0.02,-0.25,0.5);r.blocks+=dt*rate;const bEnd=anchorZ-r.bridge.len*UNIT;r.pos.z=Math.max(bEnd+0.3,r.pos.z-4.5*dt);r.prog=-r.pos.z;if(r.pos.z<=bEnd+0.35&&r.blocks>=1&&r.bridge.len<MAXL){r.blocks-=1;r.bridge.len++;setBridge(r.bridge,r.lx);}r.pos.x=r.lx;r.hspd=4.5;Bots.physics(r,dt);Bots.anim(r,dt);});
        api.stat('🧱 '+blocks+' blok | 📏 '+Math.floor(-P.z)+'m');
      });
    }
  });

  /* ---------------- 13) SUMO ROYALE ---------------- */
  defGame({
    id:'sumo',name:'SUMO ROYALE',emoji:'🤼',color:'#ffb100',
    desc:'Herkesi platformdan it! (✋ = dalga atma)',
    enter(api){
      W.env('#ff9d5c',30,95,'#ffe0b2',true);W.killY=-8;let lives=3,dashCd=0,done=false;
      W.box(0,-0.5,0,15,1,15,'#e0e0e0');const edge=new THREE.Mesh(new THREE.RingGeometry(7,7.6,32),Engine.MATB('#ff4d5e'));edge.rotation.x=-Math.PI/2;edge.position.y=0.02;W.mesh(edge);
      const sb=[];for(let i=0;i<3;i++){const a=i/3*Math.PI*2,b=Bots.make(null,Math.cos(a)*4,Math.sin(a)*4);b.mode='manual';b.fallBelow=-7;b.speed=3.6;b.chargeT=U.rand(1,3);b.charging=0.0;sb.push(b);}
      const aliveBots=()=>sb.filter(b=>!b.dead);
      api.hearts(3,3);api.spawn(0,0,0);api.fall(()=>{lives--;api.hearts(lives,3);Engine.hurtFx();Sfx.hit();if(lives<=0){done=true;api.lose('Platformdan düştün! 🤼',100-aliveBots().length*25,4);return;}api.spawn(0,0,0);Engine.player.iframe=1.5;});
      api.update(dt=>{if(done)return;dashCd=Math.max(0,dashCd-dt);const P=Engine.player;if(Input.actionBuf>0){Input.actionBuf=0;if(dashCd<=0){dashCd=1.1;const yaw=Engine.playerGroup.rotation.y;P.vel.x+=Math.sin(yaw)*13;P.vel.z+=Math.cos(yaw)*13;FX.ring(P.pos.x,0.1,P.pos.z,'#ffb100');Sfx.jump();}}
        const ents=[{p:P.pos,player:true}].concat(aliveBots().map(b=>({p:b.pos,b:b})));sb.forEach(b=>{if(b.dead)return;b.chargeT-=dt;if(b.chargeT<=0){b.chargeT=U.rand(2,4);b.charging=0.8;}if(b.charging>0)b.charging-=dt;let best=null,bd=1e9;ents.forEach(e=>{if(e.b===b)return;const d=Math.hypot(e.p.x-b.pos.x,e.p.z-b.pos.z);if(d>0.1&&d<bd){bd=d;best=e;}});if(best){Bots.stepTo(b,best.p.x,best.p.z,b.charging>0?7.5:b.speed,dt);}else{Bots.physics(b,dt);Bots.anim(b,dt);}});
        sb.forEach(b=>{if(b.dead)return;const dx=b.pos.x-P.pos.x,dz=b.pos.z-P.pos.z,d=Math.hypot(dx,dz);if(d<1.25&&d>0.001){const hs=Math.hypot(P.vel.x,P.vel.z);b.push.x+=dx/d*(7+hs*2.2);b.push.z+=dz/d*(7+hs*2.2);P.vel.x-=dx/d*3;P.vel.z-=dz/d*3;}});
        const al=aliveBots();for(let i=0;i<al.length;i++)for(let j=i+1;j<al.length;j++){const a=al[i],b=al[j],dx=b.pos.x-a.pos.x,dz=b.pos.z-a.pos.z,d=Math.hypot(dx,dz);if(d<1.2&&d>0.001){a.push.x-=dx/d*6;a.push.z-=dz/d*6;b.push.x+=dx/d*6;b.push.z+=dz/d*6;}}
        sb.forEach(b=>{if(b.dead&&!b.celebrated){b.celebrated=true;api.toast('💥 Bir rakip düştü! Kalan: '+aliveBots().length,1);}});
        if(aliveBots().length===0&&!done){done=true;api.win(300+lives*50,30+lives*4,lives+' can ile son ayakta kalan!');}
        api.stat('💨 Dalga: '+(dashCd<=0?'HAZIR':'...')+' | 🤼 '+aliveBots().length+' rakip');
      });
    }
  });

  /* ---------------- 14) MADEN SIMÜLATÖRÜ ---------------- */
  defGame({
    id:'mine',name:'MADEN SİM',emoji:'⛏️',color:'#8d6e63',
    desc:'Cevher kaz, kazma yükselt, $1000 yap!',
    enter(api){
      W.env('#2a1d18',20,60,'#4a3524',false);Engine.setTool('pick');api.onExit(()=>Engine.setTool(null));
      let money=0,dmg=1,pickLvl=0,tier=1,done=false,mineCd=0,veinT=0;const ORES=[{n:'KÖMÜR',c:'#37474f',hp:2,v:1},{n:'DEMİR',c:'#b0bec5',hp:4,v:3},{n:'ALTIN',c:'#ffd32a',hp:7,v:8},{n:'ELMAS',c:'#4dd0e1',hp:12,v:25}];
      W.box(0,-0.5,2,30,1,22,'#6d4c41');const back=new THREE.Mesh(Engine.GEO.box,Engine.MAT('#1d130d'));back.scale.set(30,10,1);back.position.set(0,5,-8);W.mesh(back);
      const genOre=()=>{const r=Math.random()*100,dCh=Math.min(18,2+2*tier),gCh=10+2*tier,iCh=25;if(r<dCh)return 3;if(r<dCh+gCh)return 2;if(r<dCh+gCh+iCh)return 1;return 0;};
      const blocks=[];function buildVein(){blocks.forEach(b=>{W.removeC(b.col);if(b.col&&b.col.mesh&&b.col.mesh!==b.m)b.col.mesh.visible=false;});blocks.length=0;for(let i=0;i<6;i++)for(let j=0;j<5;j++){const o=ORES[genOre()],x=(i-2.5)*1.35,y=0.7+j*1.35,z=-5.5,mat=new THREE.MeshLambertMaterial({color:o.c});const m=new THREE.Mesh(Engine.GEO.box,mat);m.scale.set(1.25,1.25,1.25);m.position.set(x,y,z);Engine.scene.add(m);Engine.items.push(m);const col=W.box(x,y,z,1.25,1.25,1.25,o.c);col.mesh.visible=false;blocks.push({m:m,col:col,hp:o.hp+(tier-1),x:x,y:y,z:z,o:o});}api.toast('⛏️ DAMAR #'+tier+' hazır!',1.2);}
      buildVein();const PICKS=[{n:'DEMİR KAZMA',cost:30,d:2},{n:'ALTIN KAZMA',cost:100,d:4},{n:'ELMAS KAZMA',cost:300,d:8}];
      PICKS.forEach((p,i)=>{const x=-8+i*8,z=8,pad=new THREE.Mesh(Engine.GEO.box,Engine.MATB('#2ed573'));pad.scale.set(2.6,0.15,2.6);pad.position.set(x,0.08,z);W.mesh(pad);const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:Engine.textTex('⛏ $'+p.cost),transparent:true,depthWrite:false}));sp.scale.set(2.4,0.6,1);sp.position.set(x,2.1,z);W.mesh(sp);const it=api.interact(x,z,2.4,()=>pickLvl>i?'✔ ALINDI':(pickLvl===i?'🛒 '+p.n+' — $'+p.cost:'🔒 Önce alt kademe'),()=>{if(done||pickLvl!==i||money<p.cost)return;money-=p.cost;pickLvl=i+1;dmg=p.d;it.dead=true;Engine.scene.remove(pad);Engine.scene.remove(sp);Sfx.buy();api.toast('⛏ '+p.n+' alındı! Güç: '+dmg);});});
      api.spawn(0,0,4);api.update(dt=>{if(done)return;mineCd=Math.max(0,mineCd-dt);const P=Engine.player,yaw=Engine.playerGroup.rotation.y,fx=Math.sin(yaw),fz=Math.cos(yaw);if(Input.actionBuf>0){Input.actionBuf=0;if(mineCd<=0){mineCd=.4;Engine.punch=.25;let best=null,bd=1e9;blocks.forEach(b=>{if(b.hp<=0)return;const dx=b.x-P.pos.x,dz=b.z-P.pos.z,d=Math.hypot(dx,dz)||1,dot=(dx/d)*fx+(dz/d)*fz;if(d<3&&dot>0.45&&d<bd){bd=d;best=b;}});if(best){best.hp-=dmg;Sfx.tap();best.m.material.emissive.setHex(0xffffff);best.m.material.emissiveIntensity=0.5;setTimeout(()=>{if(best.m.material)best.m.material.emissiveIntensity=0;},80);FX.burst(best.x,best.y,best.z,best.o.c,6,3,0.4);if(best.hp<=0){money+=best.o.v;FX.floatText(best.x,best.y+0.8,best.z,'+$'+best.o.v,'#ffd32a');Sfx.coin();Engine.scene.remove(best.m);W.removeC(best.col);}}}}
        if(veinT===0&&blocks.every(b=>b.hp<=0)){veinT=2;api.toast('💎 Damar tükendi! Yenisi geliyor...',1.5);}if(veinT>0){veinT-=dt;if(veinT<=0){veinT=0;tier++;buildVein();}}if(!done&&money>=1000){done=true;api.win(Math.floor(money),45,'DAMAR #'+tier+' • Maden zengini! ⛏️');}api.stat('💰 $'+Math.floor(money)+' / 1000 | ⛏ Güç '+dmg+' | Damar #'+tier);});
    }
  });

  /* ---------------- 15) ZOMBİ İSTİLASI ---------------- */
  defGame({
    id:'zombie',name:'ZOMBİ İSTİLASI',emoji:'🧟',color:'#7cb342',
    desc:'5 dalga zombiye karşı kılıçla hayatta kal!',
    enter(api){
      W.env('#1c2b1a',25,70,'#33452c',false);Engine.setTool('sword');api.onExit(()=>Engine.setTool(null));
      let hearts=5,wave=0,kills=0,atkCd=0,restT=2,done=false;const zombies=[];W.box(0,-0.5,0,26,1,26,'#4a5d3a');
      [[0,-13],[0,13],[-13,0],[13,0]].forEach((p,i)=>{if(i<2)W.box(p[0],0.9,p[1],26,1.8,0.7,'#3e2723');else W.box(p[0],0.9,p[1],0.7,1.8,26,'#3e2723');});
      for(let i=0;i<6;i++){const g=new THREE.Mesh(Engine.GEO.box,Engine.MAT('#78909c'));g.scale.set(0.8,1.1,0.25);g.position.set(U.rand(-9,9),0.55,U.rand(-9,9));W.mesh(g);}
      function spawnWave(n){const cnt=Math.min(8,2+n);for(let i=0;i<cnt;i++){const a=U.rand(0,Math.PI*2),x=Math.cos(a)*10,z=Math.sin(a)*10,zb=Bots.make({skin:'#7cb342',shirt:'#4e342e',pants:'#3e2723'},x,z,'Zombi'+U.randi(99));zb.mode='manual';zb.fallBelow=-100;zb.hp=20+n*5;zb.spd=2.2+n*0.25;zb.atk=U.rand(0.5,1.5);zombies.push(zb);}api.big('🧟 DALGA '+n,'#33691e',1.4);Sfx.trap();}
      function killZ(z){FX.burst(z.pos.x,z.feetY+1,z.pos.z,'#7cb342',16,7,0.8);Sfx.boom();Engine.scene.remove(z.grp);let i=Bots.all.indexOf(z);if(i>=0)Bots.all.splice(i,1);i=zombies.indexOf(z);if(i>=0)zombies.splice(i,1);kills++;}
      api.hearts(5,5);api.spawn(0,0,0);api.update(dt=>{if(done)return;atkCd=Math.max(0,atkCd-dt);const P=Engine.player;if(Input.actionBuf>0){Input.actionBuf=0;if(atkCd<=0){atkCd=.45;Engine.punch=.25;let hitAny=false;zombies.slice().forEach(z=>{const d=Math.hypot(z.pos.x-P.pos.x,z.pos.z-P.pos.z);if(d<3.2){hitAny=true;z.hp-=10;z.punchT=0.2;FX.burst(z.pos.x,z.feetY+1.2,z.pos.z,'#ff4d5e',6,4,0.4);FX.floatText(z.pos.x,z.feetY+2.4,z.pos.z,'-10','#ff4d5e');if(z.hp<=0)killZ(z);}});if(hitAny)Sfx.hit();}}
        zombies.slice().forEach(z=>{Bots.stepTo(z,P.pos.x,P.pos.z,z.spd,dt);z.atk-=dt;const d=Math.hypot(z.pos.x-P.pos.x,z.pos.z-P.pos.z);if(d<1.7&&z.atk<=0){z.atk=1.2;z.punchT=0.25;if(P.iframe<=0){hearts--;api.hearts(hearts,5);P.iframe=1;Engine.hurtFx();Engine.shake(0.4);Sfx.hit();if(hearts<=0){done=true;api.lose('Zombiler seni yendi! 🧟',kills*10+(wave-1)*100,6);return;}}}});
        if(zombies.length===0){restT-=dt;if(restT<=0){wave++;if(wave>5){done=true;api.win(500+kills*10,40+hearts*3,kills+' zombi avladın! 🧟');return;}spawnWave(wave);restT=3;if(hearts<5){const hx=U.rand(-6,6),hz=U.rand(-6,6),sp=new THREE.Sprite(new THREE.SpriteMaterial({map:Engine.emojiTex('❤️'),transparent:true,depthWrite:false}));sp.scale.set(1,1,1);sp.position.set(hx,1.2,hz);W.mesh(sp);const c=W.box(hx,1,hz,1.4,2,1.4,'#000',{trigger:true});c.mesh=sp;c.cb=()=>{if(c.disabled)return;hearts=Math.min(5,hearts+1);api.hearts(hearts,5);Sfx.coin();FX.burst(hx,1.2,hz,'#ff4d5e',10,4,0.6);W.removeC(c);};}}}}
        api.stat('🧟 DALGA '+Math.max(1,wave)+'/5 | 💀 '+kills+' | kalan '+zombies.length);
      });
    }
  });
})();
