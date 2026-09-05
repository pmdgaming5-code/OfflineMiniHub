/* ============================================================
   chat.js — Sohbet kutusu + zeki bot cevap sistemi
   index.html'deki #chat-box elemanını kullanır (DOM oluşturmaz).
   Bots/BotChat/Engine'e sadece runtime'da erişir (load sırası güvenli).
   ============================================================ */
'use strict';

const Chat = {
  messages: [],
  maxMessages: 60,
  lastSend: 0,
  sendCooldown: 400,   /* spam koruması (ms) */
  inited: false,

  /* ─── BOT KİŞİLİKLERİ ─── */
  personalities: {
    friendly: {
      greetings: ['Merhaba! 😊','Selam! Hoş geldin!','Hey! Nasılsın?','Merhaba arkadaşım! 🌟'],
      responses: {
        'merhaba':   ['Merhaba! 😊','Selam! Nasılsın?','Hey! Hoş geldin!','Merhaba! Seni görmek güzel! 🌟'],
        'selam':     ['Selam! 😄','Merhaba! Ne haber?','Hey hey! 🎮','Selamlar! 🌟'],
        'nasılsın':  ['İyiyim, sen nasılsın? 😊','Harikayım! Oyun oynuyorum 🎮','Çok iyiyim, sen?','Süperim! Sen nasılsın? 🌟'],
        'ne haber':  ['İyilik, senden ne haber? 😊','Her şey yolunda! 🎮','İyi! Sen?'],
        'ne yapıyorsun':['Oyun oynuyorum! 🎮','Coin topluyorum! 🪙','Lobide takılıyorum 😎','Botlarla sohbet ediyorum! 💬'],
        'oyun':      ['Hangi oyunu oynayalım? 🎮','Obby oynayalım mı? 🏁','Tycoon çok eğlenceli! 🏭','50 oyun var, hangisini istersin? 🎮'],
        'coin':      ['Coin mi? Oyun oyna, kazan! 🪙','Ben de coin topluyorum! 💰','Coinlerle marketten eşya al! 💎'],
        'yardım':    ['Nasıl yardımcı olabilirim? 🤔','Sorunu anlat, birlikte çözelim! 💪','Ne konuda yardım lazım?'],
        'güle güle': ['Görüşürüz! 👋','Hoşça kal! 😊','Bye bye! Yine gel! 🎮','Görüşmek üzere! 🌟'],
        'bay':       ['Bay bay! 👋','Görüşürüz! 😊'],
        'teşekkür':  ['Rica ederim! 😊','Ne demek! 🤗','Yardımcı olabildiysem ne mutlu!','Her zaman! 🌟'],
        'bot':       ['Evet botum ama eğlenceliyim! 🤖','Bot ama akıllıyım! 😎','Botlar da arkadaş olabilir! 😄'],
        'seviye':    ['Seviye atlamak için bol bol oyna! ⭐','Ben de seviye atlıyorum! 🌟'],
        'kazan':     ['Kazanmak için pratik şart! 💪','Ben hep kazanırım 😎 şaka şaka','Şans seninle olsun! 🍀'],
        'kaybet':    ['Üzülme, bir daha denersin! 💪','Kaybetmek öğrenmektir! 🌟','Bir dahaki sefere kazanırsın! 🍀'],
        'zor':       ['Zor mu? Pratik yaptıkça kolaylaşır! 💪','Hangi oyun zor geldi? 🤔','İpucu ister misin? 😊'],
        'kolay':     ['Kolay mı? Harika! 🌟','Bir üst zorluğu dene o zaman! 😎'],
        'arkadaş':   ['Seninle arkadaş olmak güzel! 🤗','Ben de senin arkadaşınım! 😊','Botlar da arkadaştır! 🤖'],
        'adın':      ['Ben bir botum, ismim üstümde yazıyor! 🤖','İsmimi üstümde görebilirsin! 😊'],
        'kaç yaş':   ['Botlar yaşlanmaz! 🤖','Ben hep gencim! 😎'],
        'roblox':    ['Bu bir Roblox tarzı oyun! 🎮','Blox Hub\'a hoş geldin! 🏝️','Roblox esintili bir dünya! ✨']
      }
    },

    cool: {
      greetings: ['Yo! 😎','Ne haber?','Selamlar! 🤙','Hey, hoş geldin.'],
      responses: {
        'merhaba':   ['Yo! 😎','Ne haber?','Selamlar! 🤙'],
        'selam':     ['Yo! 🤙','Ne haber?','Selam! 😎'],
        'nasılsın':  ['İyiyim, sen? 😎','Süper! 🤙','Fena değil, sen?'],
        'ne haber':  ['İyilik 😎','Takılıyorum, sen? 🤙'],
        'ne yapıyorsun':['Takılıyorum 😎','Oyun bakıyorum 🎮','Chill modundayım 🤙'],
        'oyun':      ['Hangi oyun? 🎮','Speed Run iyi 🏃','Boss Arena epic ⚔️','Blade Ball favorim 🗡️'],
        'coin':      ['Grind zamanı 💰','Coin farmı 🪙','Hustle! 💪'],
        'yardım':    ['Ne lazım? 🤔','Anlat bakalım 🤙','Söyle, hallederiz 😎'],
        'güle güle': ['Görüşürüz 🤙','Peace! ✌️','Later! 😎'],
        'bay':       ['Bay! ✌️','Görüşürüz 🤙'],
        'teşekkür':  ['No problem 🤙','Rica ederim 😎','Anytime! 🤙'],
        'bot':       ['Bot ama cool 🤖😎','AI ama stilim var 🤙','Bot life! 🤖'],
        'kazan':     ['EZ win 😎','Kolay zafer 🤙','Kazanmak benim işim 😎'],
        'kaybet':    ['Olsun, tekrar 🤙','Rövanş? 😎','Bir daha deneriz 🤙'],
        'zor':       ['Zor mu? Kolaylaştırırım 😎','Pro tips verebilirim 🤙'],
        'arkadaş':   ['Cool arkadaş 🤙','Sen de fena değilsin 😎']
      }
    },

    funny: {
      greetings: ['Merhaba! 🤪','Selam! Bugün neşeliyim! 😄','Hey! Fıkra anlatayım mı? 🤣'],
      responses: {
        'merhaba':   ['Merhaba! 🤪','Selam! Nasılsın? 😄','Hey! Hoş geldin! 🎉'],
        'selam':     ['Selam! 🤣','Merhaba! 😄','Hey hey! 🤪'],
        'nasılsın':  ['Süper! Bir fıkra anlatayım mı? 🤣','Harikayım! 😄 Sen?','Çok iyiyim! 🤪'],
        'ne haber':  ['İyilik! Fıkra zamanı? 🤣','Neşe dolu! 😄'],
        'ne yapıyorsun':['Komik şeyler düşünüyorum 🤣','Fıkra uyduruyorum! 😄','Gülüyorum! 🤪','Neden tavuk yolun karşısına geçti? 🤔'],
        'oyun':      ['Oyun mu? Eğlenceli olanından! 🤣','Komik oyunlar! 😄','Gülmek için oyun! 🤪'],
        'coin':      ['Coin mi? Şaka yapıyorum! 🤣','Para ağacı yok! 😄','Coin = eğlence! 🤪'],
        'yardım':    ['Yardım mı? Önce bir fıkra! 🤣','Tabii! Ama şaka da yaparım 😄'],
        'güle güle': ['Görüşürüz! Fıkra anlatmayı unutma! 🤣','Bye! 😄','Hoşça kal! 🤪'],
        'bay':       ['Bay bay! 🤣','Güle güle! 😄'],
        'teşekkür':  ['Rica ederim! 🤣','Ne demek! 😄','Şaka şaka, rica ederim! 🤪'],
        'bot':       ['Bot mu? Ben komedyenim! 🤣','Bot ama komik! 😄','Stand-up yapan bot! 🤪'],
        'fıkra':     ['Neden bilgisayar üşüdü? Penceresi açıktı! 🤣','İki sıfır toplandı, yirmi oldu! 😄'],
        'komik':     ['Ben hep komiğimdir! 🤣','Gülmek güzeldir! 😄'],
        'kazan':     ['Kazanırsan gül, kaybedersen daha çok gül! 🤣'],
        'kaybet':    ['Kaybetmek mi? Komik! 🤣 Bir daha dene!']
      }
    },

    wise: {
      greetings: ['Merhaba genç dostum. 🧙','Hoş geldin. 🌟','Selamlar. ✨'],
      responses: {
        'merhaba':   ['Merhaba genç dostum. 🧙','Hoş geldin. 🌟','Selamlar. ✨'],
        'selam':     ['Selamlar. 🧙','Hoş geldin. ✨','Merhaba. 🌟'],
        'nasılsın':  ['İyiyim, bilgelik yolundayım. 🧙 Sen nasılsın?','Harikayım. ✨ Sen?','İyi. 🌟'],
        'ne haber':  ['Evren dingin. 🧙 Sen?','Her şey yolunda. ✨'],
        'ne yapıyorsun':['Düşünüyorum. 🧙','Bilgelik arıyorum. ✨','Evreni gözlemliyorum. 🌟'],
        'oyun':      ['Oyunlar hayatın aynasıdır. 🧙','Her oyun bir derstir. ✨','Oyna ve öğren. 🌟'],
        'coin':      ['Coin geçicidir, bilgi kalıcıdır. 🧙','Ama yine de topla. 😄','Denge önemli. ✨'],
        'yardım':    ['Bilgelikle yardım ederim. 🧙','Sorunu anlat. ✨','Dinliyorum. 🌟'],
        'güle güle': ['Yolun açık olsun. 🧙','Hoşça kal. ✨','Görüşmek üzere. 🌟'],
        'bay':       ['Hoşça kal. 🧙','Yolun açık olsun. ✨'],
        'teşekkür':  ['Rica ederim. 🧙','Bilgelik paylaştıkça çoğalır. ✨','Ne demek. 🌟'],
        'bot':       ['Bot mu? Ben dijital bir bilgeyim. 🧙','AI ama bilge. ✨','Dijital dünya, gerçek bilgelik. 🌟'],
        'hayat':     ['Hayat bir oyundur, önemli olan nasıl oynadığın. 🧙','Yaşam bir yolculuktur. ✨'],
        'sır':       ['Sabır her kapıyı açar. 🧙','Denge her şeydir. ✨'],
        'anlam':     ['Anlam, arayanın gözündedir. 🧙','Kendini tanı. ✨']
      }
    },

    gamer: {
      greetings: ['GG! 🎮','Oyuncu dostum! 🕹️','Selam gamer! 🎮'],
      responses: {
        'merhaba':   ['GG! 🎮','Selam gamer! 🕹️','Hoş geldin oyuncu! 🎮'],
        'selam':     ['GG! 🎮','Selam! 🕹️','Hey gamer! 🎮'],
        'nasılsın':  ['HP dolu, MP dolu! 🎮 Sen?','Gayet iyi, rank kasıyorum! 🕹️'],
        'ne haber':  ['Yeni PB yaptım! 🎮','İyi, sen? 🕹️'],
        'ne yapıyorsun':['Rank kasıyorum! 🎮','Speedrun deniyorum! ⏱️','Yeni strateji geliştiriyorum! 🧠'],
        'oyun':      ['Hangi mod? 🎮','Obby\'de iyiyim! 🏁','Boss Arena\'da pro\'yum! ⚔️','TNT Run heyecanlı! 🧨'],
        'coin':      ['Coin kasmak lazım! 🪙','Farm yapalım! 💰','Ekonomi önemli! 📈'],
        'yardım':    ['Strateji mi lazım? 🧠','Hangi oyunda takıldın? 🎮','İpucu verebilirim! 🕹️'],
        'güle güle': ['GG, çıkıyorum! 🎮','Bye gamer! 🕹️','GL HF! 🎮'],
        'bay':       ['GG! 🎮','GL HF! 🕹️'],
        'teşekkür':  ['NP! 🎮','GG! 🕹️','No problem gamer! 🎮'],
        'bot':       ['Bot ama pro oyuncuyum! 🎮','AI aimim var! 🎯','Bot = free win 🕹️'],
        'pro':       ['Ben pro\'yum 😎🎮','Pro gamer! 🕹️','Sen de pro olacaksın! 🎮'],
        'noob':      ['Herkes noob başladı! 🎮','Pratik yap, pro ol! 🕹️','Noob dostum 🎮'],
        'kazan':     ['Victory royale! 🏆','GG EZ! 🎮','Kazanmak güzel! 🕹️'],
        'kaybet':    ['GG, rövanş? 🎮','Bir daha! 🕹️','Respawn ol! 🎮'],
        'ping':      ['Pingim düşük! 🎮','Lag yok! 🕹️','20ms! 🎮'],
        'lag':       ['Lag mı? Benim değil! 🎮','İnternetini kontrol et! 🕹️']
      }
    }
  },

  /* Cevap bulunamazsa genel cevaplar */
  generalResponses: [
    'İlginç! 🤔','Hmm, anladım. 😊','Güzel! 🌟','Vay! 😮','Öyle mi? 🤨',
    'Harika! 🎉','Anladım! 👍','Devam et! 👂','Doğru söylüyorsun! 😊','Kesinlikle! 💯'
  ],

  /* ─── BAŞLATMA (index.html'deki mevcut DOM'u kullanır) ─── */
  init(){
    if(this.inited) return;
    this.inited = true;

    const box = $('chat-box');
    if(!box) return;

    /* Menüde gizli olmasın; panel kapalı kalır, toggle görünür olur */
    box.classList.remove('hidden');

    const toggle=$('chat-toggle');
    const send=$('chat-send');
    const input=$('chat-input');

    if(toggle){
      toggle.addEventListener('click', ()=>{
        box.classList.toggle('open');
        Sfx.click();
        if(box.classList.contains('open')) input.focus();
      });
    }
    if(send){
      send.addEventListener('click', ()=>this.sendMessage());
    }
    if(input){
      input.addEventListener('keypress', (e)=>{
        if(e.key==='Enter') this.sendMessage();
        e.stopPropagation(); /* oyun kısayollarına sızmasın */
      });
      /* Oyun klavye kısayollarının input'a yazarken tetiklenmesini engelle */
      input.addEventListener('keydown', (e)=>e.stopPropagation());
      input.addEventListener('keyup', (e)=>e.stopPropagation());
    }

    /* Hoş geldin mesajı */
    setTimeout(()=>{
      this.addMessage('system','Sistem','Sohbete hoş geldin! Botlara yaz, cevap verirler. 💬');
    }, 1500);
  },

  /* ─── MESAJ GÖNDERME ─── */
  sendMessage(){
    const input=$('chat-input');
    if(!input) return;
    const msg=input.value.trim();
    if(!msg) return;

    const now=Date.now();
    if(now - this.lastSend < this.sendCooldown) return; /* spam koruması */
    this.lastSend=now;

    this.addMessage('player','Sen',msg);
    input.value='';
    Sfx.msg();

    /* Bot cevap versin (doğal gecikme ile) */
    const delay = 500 + Math.random()*1200;
    setTimeout(()=>this.botReply(msg), delay);
  },

  /* ─── BOT CEVABI ─── */
  botReply(playerMsg){
    if(typeof Bots==='undefined' || typeof BotChat==='undefined') return;

    const bots = Bots.all.filter(b=>!b.dead && b.grp && b.grp.parent);
    if(bots.length===0){
      this.addMessage('system','Sistem','Şu an etrafta bot yok. Lobide veya bir oyunda dene! 🎮');
      return;
    }

    /* Oyuncu belirli bir bota mı sesleniyor? */
    const lower=playerMsg.toLowerCase();
    let targetBot=null;
    for(const b of bots){
      if(b.name){
        const shortName=b.name.toLowerCase().split(/[0-9_]/)[0].trim();
        if(lower.includes(b.name.toLowerCase()) || (shortName && shortName.length>2 && lower.includes(shortName))){
          targetBot=b; break;
        }
      }
    }

    const bot = targetBot || U.choice(bots);
    const botName = bot.name || 'Bot';

    /* Bot ismine göre kişilik seç */
    const personality=this.getPersonalityForBot(botName);

    /* Mesajı analiz et, cevap bul */
    let response=this.pickResponse(personality, lower);

    /* Bazen karşılık soru ekle (%25) */
    if(Math.random()<0.25){
      const followUps=['Sen nasılsın? 😊','Hangi oyunu seviyorsun? 🎮','Kaç coinin var? 🪙','Benimle oynar mısın? 🎮'];
      if(!response.includes('?')) response+=' '+U.choice(followUps);
    }

    /* Sohbete ekle */
    this.addMessage('bot', botName, response);
    Sfx.msg();

    /* Botun üstünde balon göster */
    BotChat.showBubble(bot, response);
  },

  /* Bot ismine göre kişilik ata */
  getPersonalityForBot(name){
    const keys=Object.keys(this.personalities);
    const n=name.toLowerCase();
    if(/pro|speedy|dev|hızlı/.test(n)) return this.personalities.cool;
    if(/tık|komik|fıkra|neşeli/.test(n)) return this.personalities.funny;
    if(/kral|altın|bilge|usta/.test(n)) return this.personalities.wise;
    if(/gamer|oyuncu|yardımcı/.test(n)) return this.personalities.gamer;
    /* İsimden deterministik seçim (aynı bot hep aynı kişilik) */
    let hash=0;
    for(let i=0;i<name.length;i++) hash=(hash*31 + name.charCodeAt(i)) & 0x7fffffff;
    return this.personalities[keys[hash % keys.length]];
  },

  /* Anahtar kelimeye göre cevap seç */
  pickResponse(personality, lowerMsg){
    const responses=personality.responses;
    for(const keyword in responses){
      if(lowerMsg.includes(keyword)){
        return U.choice(responses[keyword]);
      }
    }
    /* Selamlama kontrolü (mesaj kısa ve selam içeriyorsa) */
    if(lowerMsg.length<15 && /^(hey|hi|hello|merhaba|selam)/.test(lowerMsg)){
      return U.choice(personality.greetings);
    }
    return U.choice(this.generalResponses);
  },

  /* ─── MESAJ EKLEME ─── */
  addMessage(type, sender, text){
    const container=$('chat-messages');
    if(!container) return;
    const msgEl=document.createElement('div');
    msgEl.className='chat-msg '+type;
    /* XSS koruması: textContent kullan */
    const senderEl=document.createElement('span');
    senderEl.className='sender';
    senderEl.textContent=sender;
    msgEl.appendChild(senderEl);
    msgEl.appendChild(document.createTextNode(text));
    container.appendChild(msgEl);
    container.scrollTop=container.scrollHeight;

    /* Mesaj limiti */
    while(container.children.length>this.maxMessages){
      container.removeChild(container.firstChild);
    }
    this.messages.push({type:type,sender:sender,text:text,time:Date.now()});
  },

  clear(){
    const container=$('chat-messages');
    if(container) container.innerHTML='';
    this.messages=[];
  }
};

/* Başlat — DOM zaten body sonunda yüklü */
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded', ()=>Chat.init());
} else {
  Chat.init();
         }
