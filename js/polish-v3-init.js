/* polish-v3-init.js — main.js boot'u polish-v3'ten önce çalıştığı için ilk lobiyi yeniden kurar. */
'use strict';
(function(){
  if(typeof Engine==='undefined'||typeof W==='undefined'||!Engine||Engine.mode!=='lobby'||typeof Engine.buildLobby!=='function')return;
  const idle=!!Engine.idle;
  W.clear();
  Engine.buildLobby();
  Engine.mode='lobby';
  Engine.idle=idle;
  Engine.currentMeta=null;
  Engine.playerGroup.visible=!idle;
  Engine.inputLock=idle;
  if(idle){
    Engine.playerOn=false;
  }else{
    Engine.playerOn=true;
    Engine.spawnPlayer(Engine.spawnPt.x,Engine.spawnPt.y,Engine.spawnPt.z,false);
  }
  Engine.snapCam=true;
})();
