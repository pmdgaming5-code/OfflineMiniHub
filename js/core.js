/* ============================================================
   core.js — Kayıt, olaylar, sesler, karakterler, MARKET eşyaları
   ============================================================ */
'use strict';

const $ = id => document.getElementById(id);

const U = {
  clamp:(v,a,b)=> v<a?a:(v>b?b:v),
  lerp:(a,b,t)=> a+(b-a)*t,
  rand:(a,b)=> a+Math.random()*(b-a),
  randi:n=> Math.floor(Math.random()*n),
  choice:arr=> arr[Math.floor(Math.random()*arr.length)],
  approach(v,t,d){ return v<t ? Math.min(t,v+d) : Math.max(t,v-d); }
};

const Events = {
  m:{},
  on(e,f){ (this.m[e]=this.m[e]||[]).push(f); },
  emit(e,...a){ (this.m[e]||[]).forEach(f=>f(...a)); }
};

const Store = {
  KEY:'bloxhub_v1', data:null,
  load(){
    try{ this.data = JSON.parse(localStorage.getItem(this.KEY)) || {}; }
    catch(e){ this.data = {}; }
    if(!Array.isArray(this.data.owned)) this.data.owned=[0];
    if(typeof this.data.coins!=='number') this.data.coins=0;
    if(typeof this.data.char!=='number') this.data.char=0;
    if(!this.data.best) this.data.best={};
    if(typeof this.data.muted!=='boolean') this.data.muted=false;
    if(!Array.isArray(this.data.items)) this.data.items=[];
    if(typeof this.data.equip!=='object'||!this.data.equip)
      this.data.equip={hat:null,face:null,back:null,trail:null,sword:null};
  },
  save(){ try{ localStorage.setItem(this.KEY, JSON.stringify(this.data)); }catch(e){} },
  addCoins(n){
    this.data.coins = Math.max(0, this.data.coins + n);
    this.save(); Events.emit('coins');
  },
  setBest(id,score){
    const b = this.data.best[id]||0;
    if(score>b){ this.data.best[id]=score; this.save(); return true; }
    return false;
  },
  getBest(id){ return this.data.best[id]||0; },
  hasItem(id){ return this.data.items.indexOf(id)>=0; },
  buyItem(it){
    if(this.data.coins<it.cost) return false;
    this.addCoins(-it.cost);
    this.data.items.push(it.id);
    this.data.equip[it.slot]=it.id;
    this.save(); return true;
  },
  toggleEquip(it){
    this.data.equip[it.slot] = (this.data.equip[it.slot]===it.id)? null : it.id;
    this.save();
  }
};

const SHOP = [
  {id:'glasses',      name:'PİLOT GÖZLÜĞÜ',  icon:'🕶️', cost:80,  slot:'face',  desc:'Karizma +10'},
  {id:'tophat',       name:'SİLİNDİR ŞAPKA', icon:'🎩', cost:100, slot:'hat',   desc:'Centilmen görün'},
  {id:'halo',         name:'HALE',           icon:'😇', cost:120, slot:'hat',   desc:'Döner altın halka'},
  {id:'crown',        name:'ALTIN TAÇ',      icon:'👑', cost:150, slot:'hat',   desc:'Kral sensin'},
  {id:'wings',        name:'PERİ KANATLARI', icon:'🧚', cost:200, slot:'back',  desc:'Sırtında parlar'},
  {id:'sword_fire',   name:'ATEŞ KILIÇ',     icon:'🔥', cost:220, slot:'sword', desc:'Lav rengi çelik'},
  {id:'trail_star',   name:'YILDIZ İZİ',     icon:'✨', cost:250, slot:'trail', desc:'Yürürken parılda'},
  {id:'sword_diamond',name:'ELMAS KILIÇ',    icon:'💎', cost:300, slot:'sword', desc:'Efsanevi parlaklık'},
  {id:'trail_rainbow',name:'GÖKKUŞAĞI İZİ',  icon:'🌈', cost:400, slot:'trail', desc:'Renk fırtınası'}
];

const Sfx = {
  ctx:null, on:true,
  ensure(){
    if(!this.ctx){
      const AC = window.AudioContext||window.webkitAudioContext;
      if(AC) this.ctx = new AC();
    }
    if(this.ctx && this.ctx.state==='suspended') this.ctx.resume();
  },
  tone(f,d,type,v,slide,when){
    if(!this.on) return;
    this.ensure(); if(!this.ctx) return;
    type=type||'square'; v=v||0.12; when=when||0;
    const t=this.ctx.currentTime+when;
    const o=this.ctx.createOscillator(), g=this.ctx.createGain();
    o.type=type; o.frequency.setValueAtTime(f,t);
    if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),t+d);
    g.gain.setValueAtTime(v,t);
    g.gain.exponentialRampToValueAtTime(0.001,t+d);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(t); o.stop(t+d+0.02);
  },
  click(){ this.tone(620,0.06,'square',0.09); },
  jump(){ this.tone(260,0.18,'square',0.11,240); },
  land(){ this.tone(140,0.08,'triangle',0.09,-40); },
  coin(){ this.tone(988,0.07,'square',0.11,0,0); this.tone(1319,0.12,'square',0.11,0,0.07); },
  buy(){ this.tone(523,0.08,'square',0.11,0,0); this.tone(784,0.12,'square',0.11,0,0.08); },
  hit(){ this.tone(150,0.22,'sawtooth',0.17,-90); },
  trap(){ this.tone(220,0.3,'sawtooth',0.17,-160); },
  boom(){ this.tone(90,0.4,'sawtooth',0.2,-60); this.tone(50,0.5,'triangle',0.2,-20,0.02); },
  door(){ this.tone(392,0.1,'triangle'); this.tone(523,0.14,'triangle',0.12,0,0.09); },
  tap(){ this.tone(740,0.05,'triangle',0.09); },
  level(){ [523,659,784,1047].forEach((f,i)=>this.tone(f,0.12,'square',0.11,0,i*0.08)); },
  win(){ [523,659,784,1047,1319].forEach((f,i)=>this.tone(f,0.16,'square',0.12,0,i*0.1)); },
  lose(){ this.tone(330,0.5,'sawtooth',0.14,-200); this.tone(196,0.6,'sawtooth',0.11,-90,0.2); }
};
document.addEventListener('pointerdown', ()=>Sfx.ensure());

const CHARS = [
  {name:'ÇAYLAK',     skin:'#ffd23f', shirt:'#31a2ff', pants:'#274b7a', cost:0},
  {name:'NİNJA',      skin:'#f2f2f2', shirt:'#23272e', pants:'#23272e', cost:60},
  {name:'İTFAİYECİ',  skin:'#ffcf9e', shirt:'#ff5722', pants:'#37474f', cost:120},
  {name:'UZAYLI',     skin:'#8be04a', shirt:'#9b59b6', pants:'#4a148c', cost:180},
  {name:'ROBO-PANDA', skin:'#ffffff', shirt:'#15181d', pants:'#15181d', cost:260},
  {name:'ALTIN KRAL', skin:'#ffd700', shirt:'#ffffff', pants:'#c0392b', cost:400}
];

function avatarDOM(c){
  return '<div class="avo" style="--skin:'+c.skin+';--shirt:'+c.shirt+';--pants:'+c.pants+'">'+
    '<div class="av-head"><div class="av-eye l"></div><div class="av-eye r"></div><div class="av-smile"></div></div>'+
    '<div class="av-row"><div class="av-arm"></div><div class="av-torso"></div><div class="av-arm"></div></div>'+
    '<div class="av-row2"><div class="av-leg"></div><div class="av-leg"></div></div></div>';
}
