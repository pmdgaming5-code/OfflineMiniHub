/* ============================================================
   camera-follow-fix.js — 3. şahıs kamera/karakter yön stabilitesi
   Hareket yönü ile takip kamerası arasında geri besleme döngüsünü keser.
   ============================================================ */
'use strict';
(function(){
  if(typeof Engine==='undefined'||typeof THREE==='undefined')return;
  if(Engine.__cameraFollowFixV2)return;
  Engine.__cameraFollowFixV2=true;

  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  let stableYaw=Engine.playerGroup?Engine.playerGroup.rotation.y:0;
  let candidateYaw=stableYaw;
  let candidateTime=0;
  const TURN_DELAY=0.12;
  const TURN_THRESHOLD=0.055;
  const TURN_SPEED=8;

  function angleDelta(a,b){
    let d=(b-a)%(Math.PI*2);
    if(d>Math.PI)d-=Math.PI*2;
    if(d<-Math.PI)d+=Math.PI*2;
    return d;
  }

  const originalAvatar=Engine.updateAvatar.bind(Engine);
  Engine.updateAvatar=function(dt){
    originalAvatar(dt);
    const g=this.playerGroup, P=this.player;
    if(!g||!P||!this.playerOn)return;

    const hs=Math.hypot(P.vel.x,P.vel.z);
    if(hs>0.6){
      const wanted=Math.atan2(P.vel.x,P.vel.z);
      const diff=angleDelta(stableYaw,wanted);
      if(Math.abs(diff)>TURN_THRESHOLD){
        if(Math.abs(angleDelta(candidateYaw,wanted))>TURN_THRESHOLD*0.65){
          candidateYaw=wanted;
          candidateTime=0;
        }else{
          candidateTime+=dt;
        }
        if(candidateTime>=TURN_DELAY){
          stableYaw=wanted;
          candidateTime=0;
        }
      }else{
        candidateYaw=stableYaw;
        candidateTime=0;
      }
    }else{
      candidateYaw=stableYaw;
      candidateTime=0;
    }

    const d=angleDelta(g.rotation.y,stableYaw);
    g.rotation.y+=d*(1-Math.exp(-TURN_SPEED*dt));
  };

  Engine.updateCamera=function(dt){
    if(!this.camera||!this.player)return;
    const P=this.player.pos;
    const g=this.playerGroup;
    if(this.camMode!==2){
      /* Kamera artık velocity'yi takip etmiyor. Karakterin gecikmeli,
         stabil yönünü takip ediyor; böylece kamera↔hareket feedback loop'u yok. */
      const facing=g?g.rotation.y:stableYaw;
      this.followYaw=facing;
      this.camYaw=lerpAngle(this.camYaw,facing+Math.PI,1-Math.exp(-5*dt));
    }

    const cp=Math.cos(this.camPitch), sp=Math.sin(this.camPitch), d=this.camDist;
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

  function resetCameraState(){
    const g=Engine.playerGroup;
    stableYaw=g?g.rotation.y:Engine.camYaw;
    candidateYaw=stableYaw;
    candidateTime=0;
    Engine.followYaw=stableYaw;
  }

  const oldStart=Engine.startGame.bind(Engine);
  Engine.startGame=function(meta){
    const r=oldStart(meta);
    resetCameraState();
    return r;
  };

  const oldLobby=Engine.enterLobby.bind(Engine);
  Engine.enterLobby=function(){
    const r=oldLobby();
    resetCameraState();
    return r;
  };
})();
