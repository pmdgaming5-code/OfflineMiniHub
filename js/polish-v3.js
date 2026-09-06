/* ============================================================
   polish-v3.js — Çok katlı Roblox tarzı lobi + oyun giriş ekranı
   Mevcut 50 oyunun mantığını korur; sadece sunum/erişim katmanını iyileştirir.
   ============================================================ */
'use strict';
(function(){
  if(typeof Engine==='undefined'||typeof THREE==='undefined') return;
  if(window.__bloxPolishV3) return;
  window.__bloxPolishV3=true;

  const $=id=>document.getElementById(id);
  const safeText=v=>String(v==null?'':v);

  /* ---------- Çok katlı lobi ---------- */
  if(!Engine.__multiFloorLobby){
    Engine.__multiFloorLobby=true;
    const originalBuildLobby=Engine.buildLobby.bind(Engine);
    const originalLobbyUpdate=Engine.lobbyUpdate?Engine.lobbyUpdate.bind(Engine):null;

    Engine.buildLobby=function(){
      /* Eski halka lobi yerine 5 geniş kat: 10 oyun / kat. */
      this.interact=[];
      this.emoSprites=[];
      this.clouds=[];
      this.lobbyCoin=null;
      this.marketGem=null;
      this.lobbyFloorCount=5;
      this.lobbyFloorHeight=6;
      this.lobbyFloorY=[];
      this.lobbyPortals=[];

      W.env('#66bfff',45,150,'#e8f7ff',true);

      const floorCols=['#46a965','#4d8edb','#7b61c8','#d77a32','#c64c61'];
      const floorNames=['KLASİKLER','YARIŞ & REKABET','MACERA & HAYATTA KALMA','SİMÜLASYON & TYCOON','EFSANE & KAOS'];
      const groups=[
        GAMES.slice(0,10),GAMES.slice(10,20),GAMES.slice(20,30),GAMES.slice(30,40),GAMES.slice(40,50)
      ];

      /* Zemin ve katlar */
      for(let f=0;f<this.lobbyFloorCount;f++){
        const topY=f*this.lobbyFloorHeight;
        this.lobbyFloorY.push(topY);
        const floor=W.box(0,topY-0.5,0,38,1,24,floorCols[f]);
        floor.tag='lobby-floor-'+f;

        const edgeZ=11.5;
        W.box(0,topY+0.55,-edgeZ,38,1,0.6,'#d7e4ef');
        W.box(0,topY+0.55,edgeZ,38,1,0.6,'#d7e4ef');
        W.box(-18.5,topY+0.55,0,0.6,1,23,'#d7e4ef');
        W.box(18.5,topY+0.55,0,0.6,1,23,'#d7e4ef');

        /* Kat başlığı */
        const title=new THREE.Sprite(new THREE.SpriteMaterial({
          map:this.textTex('KAT '+(f+1)+' • '+floorNames[f],'#fff'),transparent:true,depthWrite:false
        }));
        title.scale.set(6.2,0.9,1);
        title.position.set(0,topY+5.3,-9.7);
        W.mesh(title);

        /* 10 oyun: 5 + 5, geniş aralıklı */
        const xs=[-14,-7,0,7,14];
        const zs=[-3.5,5.0];
        groups[f].forEach((gmeta,i)=>{
          const row=Math.floor(i/5), col=i%5;
          const px=xs[col], pz=zs[row];
          const grp=new THREE.Group();
          grp.position.set(px,topY,pz);
          const facing=Math.atan2(-px,-pz);
          grp.rotation.y=facing;

          const mat=this.MATB(gmeta.color);
          const pillarL=new THREE.Mesh(this.GEO.box,mat);
          pillarL.scale.set(0.48,2.5,0.48); pillarL.position.set(-1.25,1.25,0);
          const pillarR=pillarL.clone(); pillarR.position.x=1.25;
          const beam=new THREE.Mesh(this.GEO.box,mat);
          beam.scale.set(3.0,0.52,0.52); beam.position.set(0,2.72,0);
          grp.add(pillarL,pillarR,beam);

          const pad=new THREE.Mesh(this.GEO.box,this.MATB(gmeta.color));
          pad.scale.set(2.9,0.1,1.75); pad.position.set(0,0.08,1.95); grp.add(pad);

          const icon=new THREE.Sprite(new THREE.SpriteMaterial({
            map:this.emojiTex(gmeta.emoji),transparent:true,depthWrite:false
          }));
          icon.scale.set(1.6,1.6,1); icon.position.set(0,4.05,0); grp.add(icon);
          this.emoSprites.push({sp:icon,ph:f*20+i});

          const plate=new THREE.Sprite(new THREE.SpriteMaterial({
            map:this.textTex(gmeta.name,'#fff'),transparent:true,depthWrite:false
          }));
          plate.scale.set(2.9,0.62,1); plate.position.set(0,2.0,0.25); grp.add(plate);

          const numPlate=new THREE.Sprite(new THREE.SpriteMaterial({
            map:this.textTex(String(i+1).padStart(2,'0'),'#ffd32a'),transparent:true,depthWrite:false
          }));
          numPlate.scale.set(0.9,0.46,1); numPlate.position.set(-1.65,2.95,0.05); grp.add(numPlate);

          W.mesh(grp);
          this.lobbyPortals.push({floor:f,meta:gmeta,group:grp});

          /* Etkileşim artık Y seviyesiyle de filtreleniyor. */
          this.interact.push({
            x:px, y:topY+HY, z:pz+1.95, r:2.15, floor:f,
            label:'▶ '+gmeta.name,
            cb:(id=>()=>Events.emit('reqGame',id))(gmeta.id)
          });
        });

        /* Kat asansörü: aynı X/Z kullanılabilir çünkü updateInteract Y'yi kontrol ediyor. */
        const ex=16.0, ez=8.0;
        const shaft=new THREE.Mesh(this.GEO.box,this.MAT('#e9eef5'));
        shaft.scale.set(2.2,4.0,2.2); shaft.position.set(ex,topY+2.0,ez); W.mesh(shaft);
        const glow=new THREE.Mesh(this.GEO.box,this.MATB('#00a2ff'));
        glow.scale.set(1.5,0.12,1.5); glow.position.set(ex,topY+0.12,ez); W.mesh(glow);

        if(f>0){
          const downLabel=new THREE.Sprite(new THREE.SpriteMaterial({map:this.textTex('⬇ KAT '+f,'#fff'),transparent:true,depthWrite:false}));
          downLabel.scale.set(2.1,0.52,1); downLabel.position.set(ex,topY+3.1,ez); W.mesh(downLabel);
          this.interact.push({
            x:ex-1.8,y:topY+HY,z:ez,r:1.55,floor:f,
            label:'⬇ Kat '+f,
            cb:(target=>()=>this.teleportLobbyFloor(target))(f-1)
          });
        }
        if(f<this.lobbyFloorCount-1){
          const upLabel=new THREE.Sprite(new THREE.SpriteMaterial({map:this.textTex('⬆ KAT '+(f+2),'#ffd32a'),transparent:true,depthWrite:false}));
          upLabel.scale.set(2.2,0.52,1); upLabel.position.set(ex+2.0,topY+3.1,ez); W.mesh(upLabel);
          this.interact.push({
            x:ex+1.8,y:topY+HY,z:ez,r:1.55,floor:f,
            label:'⬆ Kat '+(f+2),
            cb:(target=>()=>this.teleportLobbyFloor(target))(f+1)
          });
        }
      }

      /* Kattaşım için fonksiyon. */
      this.teleportLobbyFloor=function(target){
        target=Math.max(0,Math.min(this.lobbyFloorCount-1,target|0));
        const y=this.lobbyFloorY[target];
        this.spawnPlayer(0,y+HY+0.02,8.5,false);
        this.playerOn=true;
        this.snapCam=true;
        this.camMode=0;
        this.camDist=9;
        HUD.toast('🛗 KAT '+(target+1)+' • '+floorNames[target],1.1);
        Sfx.door();
      };

      /* Ana spawn alanı */
      const spawnPad=new THREE.Mesh(this.GEO.box,this.MATB('#ffd32a'));
      spawnPad.scale.set(7,0.12,4.2); spawnPad.position.set(0,0.07,8.5); W.mesh(spawnPad);
      const hub=new THREE.Sprite(new THREE.SpriteMaterial({map:this.textTex('BLOX HUB','#fff'),transparent:true,depthWrite:false}));
      hub.scale.set(5.5,1.2,1); hub.position.set(0,3.8,8.0); W.mesh(hub);

      /* Market ve bilgi kioskları */
      const kiosk=(x,z,label,color,emoji,cb)=>{
        const body=new THREE.Mesh(this.GEO.box,this.MAT(color));
        body.scale.set(3.2,1.1,2.0); body.position.set(x,0.55,z); W.mesh(body);
        const icon=new THREE.Sprite(new THREE.SpriteMaterial({map:this.emojiTex(emoji),transparent:true,depthWrite:false}));
        icon.scale.set(1.2,1.2,1); icon.position.set(x,2.1,z); W.mesh(icon);
        const sign=new THREE.Sprite(new THREE.SpriteMaterial({map:this.textTex(label,'#fff'),transparent:true,depthWrite:false}));
        sign.scale.set(2.6,0.58,1); sign.position.set(x,2.85,z); W.mesh(sign);
        this.interact.push({x:x,y:HY,z:z,r:2.3,floor:0,label:label,cb:cb});
      };
      kiosk(-13.2,8.5,'💎 MARKET','#ffb100','💎',()=>Events.emit('reqShop'));
      kiosk(13.2,8.5,'🎒 AVATAR','#8a5cf6','🧍',()=>{ if(typeof renderChars==='function')renderChars(); openScreen('screen-avatar'); });

      /* Kompakt asansör tanıtımı */
      const ev=new THREE.Sprite(new THREE.SpriteMaterial({map:this.textTex('🛗 KATLAR','#00a2ff'),transparent:true,depthWrite:false}));
      ev.scale.set(2.8,0.62,1); ev.position.set(16,4.8,8); W.mesh(ev);

      /* Botlar */
      for(let i=0;i<3;i++){
        const b=Bots.make(null,U.rand(-10,10),U.rand(2,7));
        b.mode='wander';
        b.wander={cx:0,cz:5,r:8,tx:U.rand(-7,7),tz:U.rand(1,9),wait:U.rand(0,2)};
        b.speed=U.rand(3,4.2);
        b.respawnPos.set(b.pos.x,0,b.pos.z);
      }

      this.spawnPt={x:0,y:HY+0.02,z:8.5};
      this.lobbyFloorNames=floorNames;
      this.lobbyFloorColors=floorCols;
    };

    Engine.lobbyUpdate=function(dt){
      /* Eski animasyonların bulut/icon kısmı korunuyor. */
      if(originalLobbyUpdate) originalLobbyUpdate(dt);
      if(this.lobbyPortals){
        for(let i=0;i<this.lobbyPortals.length;i++){
          const p=this.lobbyPortals[i];
          if(p&&p.group) p.group.position.y=p.floor*this.lobbyFloorHeight;
        }
      }
    };
  }

  /* ---------- Katlara uygun etkileşim ---------- */
  if(!Engine.__yAwareLobbyInteract){
    Engine.__yAwareLobbyInteract=true;
    Engine.updateInteract=function(){
      if(this.inputLock||!this.playerOn||this.idle){ HUD.interact(null); return; }
      const P=this.player.pos;
      let best=null,bd=1e9;
      for(let i=0;i<this.interact.length;i++){
        const it=this.interact[i]; if(it.dead)continue;
        const dx=P.x-it.x, dz=P.z-it.z;
        const dy=(typeof it.y==='number')?Math.abs(P.y-it.y):0;
        const yLimit=this.mode==='lobby'?2.35:2.6;
        if(dy>yLimit)continue;
        const d=Math.hypot(dx,dz);
        if(d<it.r&&d<bd){bd=d;best=it;}
      }
      if(best){
        HUD.interact(typeof best.label==='function'?best.label():best.label);
        if(Input.actionBuf>0){Input.actionBuf=0;best.cb();}
      }else HUD.interact(null);
    };
  }

  /* ---------- Roblox tarzı oyun seçim kartlarını cilala ---------- */
  const enhanceCards=()=>{
    const cards=document.querySelectorAll('.gcard');
    cards.forEach(card=>{
      if(card.dataset.polished==='1')return;
      card.dataset.polished='1';
      card.classList.add('rbx-game-card');
      const ico=card.querySelector('.gc-ico');
      if(ico){
        const hero=document.createElement('div');
        hero.className='rbx-card-hero';
        hero.textContent=ico.textContent||'🎮';
        card.insertBefore(hero,card.firstChild);
        ico.classList.add('legacy-ico');
      }
    });
  };
  if(typeof window.renderGames==='function'&&!window.__renderGamesPolish){
    window.__renderGamesPolish=true;
    const oldRenderGames=window.renderGames;
    window.renderGames=function(){
      oldRenderGames();
      requestAnimationFrame(enhanceCards);
    };
  }

  /* ---------- Oyun giriş ekranı: karakter + oyun bilgisi ---------- */
  let introEl=null;
  const closeIntro=()=>{ if(introEl&&introEl.parentNode)introEl.parentNode.removeChild(introEl); introEl=null; };
  const openIntro=(id,launch)=>{
    const meta=GAMES.find(g=>g.id===id); if(!meta){launch();return;}
    closeIntro();
    const c=CHARS[Store.data.char]||CHARS[0];
    introEl=document.createElement('div');
    introEl.id='game-intro';
    introEl.innerHTML=
      '<div class="game-intro-card">'+
        '<div class="game-intro-top"><span>🎮 OYUN '+(GAMES.indexOf(meta)+1)+'/50</span><span>⭐ '+('★'.repeat(meta.diff))+'</span></div>'+
        '<div class="game-intro-hero" style="--intro-color:'+safeText(meta.color)+'">'+
          '<div class="game-intro-icon">'+safeText(meta.emoji)+'</div>'+
          '<div><div class="game-intro-name">'+safeText(meta.name)+'</div><div class="game-intro-desc">'+safeText(meta.desc)+'</div></div>'+
        '</div>'+
        '<div class="game-intro-character">'+
          '<div class="game-intro-character-label">SEN</div>'+
          '<div class="game-intro-avatar">'+(typeof avatarDOM==='function'?avatarDOM(c):'<div>🧍</div>')+'</div>'+ 
          '<div class="game-intro-char-name">'+safeText(c.name)+'</div>'+ 
        '</div>'+ 
        '<div class="game-intro-actions"><button id="game-intro-back" class="btn-secondary">◀ GERİ</button><button id="game-intro-play" class="btn-primary">▶ OYUNA GİR</button></div>'+ 
      '</div>';
    document.body.appendChild(introEl);
    const back=$('game-intro-back'), play=$('game-intro-play');
    if(back)back.onclick=()=>{Sfx.click();closeIntro();};
    if(play)play.onclick=()=>{Sfx.click();closeIntro();launch();};
  };

  if(typeof window.startGameById==='function'&&!window.__startIntroPolish){
    window.__startIntroPolish=true;
    const oldStart=window.startGameById;
    window.startGameById=function(id,opts){
      if(opts&&opts.skipIntro)return oldStart(id);
      openIntro(id,()=>oldStart(id));
    };
  }

  /* ---------- Sonuç ekranı merkezi ve daha okunaklı ---------- */
  const injectStyle=()=>{
    if($('polish-v3-style'))return;
    const s=document.createElement('style');
    s.id='polish-v3-style';
    s.textContent=`
      #over-emoji{display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;text-align:center!important;margin:0 auto 6px!important;line-height:1.05!important}
      .over-card{text-align:center!important;align-items:center!important;justify-items:center!important;margin:auto!important}
      .over-card>*{margin-left:auto;margin-right:auto}
      #game-intro{position:fixed;inset:0;z-index:175;display:flex;align-items:center;justify-content:center;padding:20px;background:radial-gradient(circle at 50% 20%,rgba(0,162,255,.2),rgba(8,11,20,.96) 65%);backdrop-filter:blur(8px)}
      .game-intro-card{width:min(520px,94vw);max-height:92vh;overflow:auto;border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:20px;background:linear-gradient(160deg,rgba(38,45,66,.98),rgba(18,22,35,.98));box-shadow:0 30px 80px rgba(0,0,0,.55);text-align:center}
      .game-intro-top{display:flex;justify-content:space-between;color:#aeb8ce;font-size:12px;font-weight:900;letter-spacing:1px;margin-bottom:14px}
      .game-intro-hero{display:flex;align-items:center;gap:14px;padding:16px;border-radius:18px;background:linear-gradient(135deg,var(--intro-color,#2f7df6),rgba(15,18,32,.35));box-shadow:inset 0 0 0 1px rgba(255,255,255,.12);text-align:left}
      .game-intro-icon{width:72px;height:72px;flex:0 0 72px;border-radius:18px;background:rgba(0,0,0,.22);display:flex;align-items:center;justify-content:center;font-size:42px;box-shadow:0 8px 20px rgba(0,0,0,.2)}
      .game-intro-name{font-family:Arial Black,sans-serif;font-size:25px;color:#fff}.game-intro-desc{font-size:13px;color:#e0e6f5;margin-top:5px}
      .game-intro-character{margin:18px auto 8px;width:min(280px,70vw);padding:14px 14px 10px;border-radius:20px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.09)}
      .game-intro-character-label{font-size:11px;color:#ffd32a;font-weight:900;letter-spacing:2px}
      .game-intro-avatar{height:145px;display:flex;align-items:center;justify-content:center;overflow:hidden}.game-intro-avatar .avo{transform:scale(1.7);transform-origin:center}
      .game-intro-avatar .av-head{margin-top:0}.game-intro-char-name{font-weight:900;color:#fff;font-size:14px;margin-top:5px}
      .game-intro-actions{display:flex;gap:10px;justify-content:center;margin-top:15px}.game-intro-actions button{min-width:130px}
      .rbx-card-hero{height:110px;display:flex;align-items:center;justify-content:center;font-size:58px;background:linear-gradient(135deg,var(--gc,#2f7df6),rgba(255,255,255,.12));border-bottom:1px solid rgba(255,255,255,.08)}
      .gcard.rbx-game-card .legacy-ico{display:none!important}
      @media(max-width:760px){.game-intro-card{padding:15px;border-radius:20px}.game-intro-name{font-size:20px}.game-intro-icon{width:60px;height:60px;flex-basis:60px;font-size:34px}.game-intro-avatar{height:125px}.game-intro-actions button{min-width:0;flex:1}}
    `;
    document.head.appendChild(s);
  };
  injectStyle();

  /* Eski buildLobby kodu bazı sürümlerde geç bağlanırsa referans kalsın. */
  void originalBuildLobby;
})();
