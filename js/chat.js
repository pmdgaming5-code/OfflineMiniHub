/* ============================================================
   chat.js — Oyuncu-Bot Sohbet Sistemi
   Oyuncu "merhaba (bot adı)" yazar, bot cevap verir
   ============================================================ */
'use strict';

const Chat = {
  messages: [],
  maxMessages: 50,
  
  // Bot kişilikleri - her bot farklı karakterde
  personalities: {
    friendly: {
      greetings: ['Merhaba! 😊', 'Selam! Hoş geldin!', 'Hey! Nasılsın?'],
      responses: {
        'merhaba': ['Merhaba! 😊', 'Selam! Nasılsın?', 'Hey! Hoş geldin!'],
        'selam': ['Selam! 😄', 'Merhaba! Ne haber?', 'Hey hey! 🎮'],
        'nasılsın': ['İyiyim, teşekkürler! Sen nasılsın? 😊', 'Harikayım! Oyun oynuyorum 🎮', 'Çok iyiyim, sen?'],
        'ne yapıyorsun': ['Oyun oynuyorum! 🎮', 'Coin', 'Coin topluyorum! 🪙', 'Lobide takılıyorum 😎'],
        'oyun': ['Hangi oyunu oynayalım? 🎮', 'OBBY oynayalım mı? 🏁', 'Tycoon çok eğlenceli! 🏭'],
        'coin': ['Coin mi istiyorsun? Oyun oyna! 🪙', 'Ben de coin topluyorum! 💰', 'Coinlerle eşya alabilirsin! 💎'],
        'yardım': ['Nasıl yardımcı olabilirim? 🤔', 'Sorunu anlat, çözelim! 💪', 'Ne konuda yardım lazım?'],
        'güle güle': ['Görüşürüz! 👋', 'Hoşça kal! 😊', 'Bye bye! 🎮'],
        'teşekkür': ['Rica ederim! 😊', 'Ne demek! 🤗', 'Yardımcı olabildiysem ne mutlu!'],
        'bot': ['Evet, ben bir botum! 🤖 Ama eğlenceliyim!', 'Bot ama akıllıyım! 😎', 'Botlar da insan olabilir! 😄']
      }
    },
    cool: {
      greetings: ['Yo! 😎', 'Ne haber?', 'Selamlar! 🤙'],
      responses: {
        'merhaba': ['Yo! 😎', 'Ne haber?', 'Selamlar! 🤙'],
        'selam': ['Yo! 🤙', 'Ne haber?', 'Selam! 😎'],
        'nasılsın': ['İyiyim, sen? 😎', 'Süper! 🤙', 'Fena değil, sen?'],
        'ne yapıyorsun': ['Takılıyorum 😎', 'Oyun bakıyorum 🎮', 'Chill modundayım 🤙'],
        'oyun': ['Hangi oyun? 🎮', 'Speed Run iyi 🏃', 'Boss Arena epic ⚔️'],
        'coin': ['Grind zamanı 💰', 'Coin farmı 🪙', 'Hustle! 💪'],
        'yardım': ['Ne lazım? 🤔', 'Anlat bakalım 🤙', 'Söyle, hallederiz 😎'],
        'güle güle': ['Görüşürüz 🤙', 'Peace! ✌️', 'Later! 😎'],
        'teşekkür': ['No problem 🤙', 'Rica ederim 😎', 'Anytime! 🤙'],
        'bot': ['Bot ama cool 🤖😎', 'AI ama stilim var 🤙', 'Bot life! 🤖']
      }
    },
    funny: {
      greetings: ['Merhaba! 🤪', 'Selam! Bugün neşeliyim! 😄', 'Hey! Fıkra anlatayım mı? 🤣'],
      responses: {
        'merhaba': ['Merhaba! 🤪', 'Selam! Nasılsın? 😄', 'Hey! Hoş geldin! 🎉'],
        'selam': ['Selam! 🤣', 'Merhaba! 😄', 'Hey hey! 🤪'],
        'nasılsın': ['Süper! Bir fıkra anlatayım mı? 🤣', 'Harikayım! 😄 Sen?', 'Çok iyiyim! 🤪'],
        'ne yapıyorsun': ['Komik şeyler düşünüyorum 🤣', 'Fıkra uyduruyorum! 😄', 'Gülüyorum! 🤪'],
        'oyun': ['Oyun mu? Eğlenceli olanından! 🤣', 'Komik oyunlar! 😄', 'Gülmek için oyun! 🤪'],
        'coin': ['Coin mi? Şaka yapıyorum! 🤣', 'Para ağacı yok! 😄', 'Coin = eğlence! 🤪'],
        'yardım': ['Yardım mı? Komik bir şey anlatayım! 🤣', 'Tabii! Ama önce fıkra! 😄', 'Yardım + fıkra = mükemmel! 🤪'],
        'güle güle': ['Görüşürüz! Fıkra anlatmayı unutma! 🤣', 'Bye! 😄', 'Hoşça kal! 🤪'],
        'teşekkür': ['Rica ederim! 🤣', 'Ne demek! 😄', 'Şaka şaka, rica ederim! 🤪'],
        'bot': ['Bot mu? Ben komedyenim! 🤣', 'Bot ama komik! 😄', 'Stand-up yapan bot! 🤪']
      }
    },
    wise: {
      greetings: ['Merhaba genç dostum. 🧙', 'Hoş geldin. 🌟', 'Selamlar. ✨'],
      responses: {
        'merhaba': ['Merhaba genç dostum. 🧙', 'Hoş geldin. 🌟', 'Selamlar. ✨'],
        'selam': ['Selamlar. 🧙', 'Hoş geldin. ✨', 'Merhaba. 🌟'],
        'nasılsın': ['İyiyim, bilgelik yolundayım. 🧙 Sen nasılsın?', 'Harikayım. ✨ Sen?', 'İyi. 🌟'],
        'ne yapıyorsun': ['Düşünüyorum. 🧙', 'Bilgelik arıyorum. ✨', 'Evreni gözlemliyorum. 🌟'],
        'oyun': ['Oyunlar hayatın aynasıdır. 🧙', 'Her oyun bir derstir. ✨', 'Oyna ve öğren. 🌟'],
        'coin': ['Coin geçicidir, bilgi kalıcıdır. 🧙', 'Ama yine de topla. 😄', 'Denge önemli. ✨'],
        'yardım': ['Bilgelikle yardım ederim. 🧙', 'Sorunu anlat. ✨', 'Dinliyorum. 🌟'],
        'güle güle': ['Yolun açık olsun. 🧙', 'Hoşça kal. ✨', 'Görüşmek üzere. 🌟'],
        'teşekkür': ['Rica ederim. 🧙', 'Bilgelik paylaştıkça çoğalır. ✨', 'Ne demek. 🌟'],
        'bot': ['Bot mu? Ben dijital bir bilgeyim. 🧙', 'AI ama bilge. ✨', 'Dijital dünya, gerçek bilgelik. 🌟']
      }
    }
  },
  
  init(){
    // Sohbet kutusunu HTML'e ekle
    const chatBox = document.createElement('div');
    chatBox.id = 'chat-box';
    chatBox.innerHTML = `
      <div id="chat-messages"></div>
      <div id="chat-input-area">
        <input type="text" id="chat-input" placeholder="Mesaj yaz... (örn: merhaba Bot)" maxlength="100">
        <button id="chat-send">➤</button>
      </div>
    `;
    document.body.appendChild(chatBox);
    
    // Stillendirme
    const style = document.createElement('style');
    style.textContent = `
      #chat-box{
        position:fixed;
        left:10px;
        top:50%;
        transform:translateY(-50%);
        width:280px;
        max-height:300px;
        background:rgba(0,0,0,0.8);
        border-radius:12px;
        display:flex;
        flex-direction:column;
        z-index:100;
        font-family:var(--body);
      }
      #chat-messages{
        flex:1;
        overflow-y:auto;
        padding:10px;
        display:flex;
        flex-direction:column;
        gap:6px;
        max-height:200px;
      }
      .chat-msg{
        padding:6px 10px;
        border-radius:8px;
        font-size:13px;
        max-width:90%;
        word-wrap:break-word;
      }
      .chat-msg.player{
        background:#2f7df6;
        color:white;
        align-self:flex-end;
      }
      .chat-msg.bot{
        background:#3a3f4b;
        color:white;
        align-self:flex-start;
      }
      .chat-msg .sender{
        font-weight:bold;
        font-size:11px;
        opacity:0.8;
        display:block;
        margin-bottom:2px;
      }
      #chat-input-area{
        display:flex;
        padding:8px;
        gap:6px;
        border-top:1px solid rgba(255,255,255,0.2);
      }
      #chat-input{
        flex:1;
        padding:8px 12px;
        border:none;
        border-radius:8px;
        background:rgba(255,255,255,0.1);
        color:white;
        font-size:13px;
        outline:none;
      }
      #chat-input::placeholder{
        color:rgba(255,255,255,0.5);
      }
      #chat-send{
        padding:8px 14px;
        border:none;
        border-radius:8px;
        background:#3ecf5a;
        color:white;
        cursor:pointer;
        font-size:16px;
      }
      #chat-send:hover{
        background:#2eb84a;
      }
    `;
    document.head.appendChild(style);
    
    // Event listener'lar
    $('chat-send').addEventListener('click', ()=>this.sendMessage());
    $('chat-input').addEventListener('keypress', (e)=>{
      if(e.key==='Enter') this.sendMessage();
    });
    
    // İlk karşılama mesajı
    setTimeout(()=>{
      this.addMessage('system', 'Sistem', 'Sohbete hoş geldin! Botlarla konuşabilirsin. 😊');
    }, 2000);
  },
  
  sendMessage(){
    const input = $('chat-input');
    const msg = input.value.trim();
    if(!msg) return;
    
    this.addMessage('player', 'Sen', msg);
    input.value = '';
    
    // Bot cevap versin
    setTimeout(()=>{
      this.botReply(msg);
    }, 500 + Math.random()*1000);
  },
  
  botReply(playerMsg){
    // Rastgele bir bot seç
    const bots = Bots.all.filter(b=>!b.dead && b.grp && b.grp.parent);
    if(bots.length === 0){
      this.addMessage('bot', 'Sistem', 'Şu an etrafta bot yok. Bir oyuna gir! 🎮');
      return;
    }
    
    const bot = U.choice(bots);
    const botName = bot.name || 'Bot';
    
    // Bot kişiliğini seç (isim bazlı veya rastgele)
    const personalityKeys = Object.keys(this.personalities);
    let personality;
    
    // İsim bazlı kişilik atama
    if(botName.includes('Pro') || botName.includes('Speedy')){
      personality = this.personalities.cool;
    } else if(botName.includes('Tık') || botName.includes('Dev')){
      personality = this.personalities.funny;
    } else if(botName.includes('Kral') || botName.includes('Altın')){
      personality = this.personalities.wise;
    } else {
      personality = this.personalities[U.choice(personalityKeys)];
    }
    
    // Oyuncu mesajını analiz et ve cevap bul
    const lowerMsg = playerMsg.toLowerCase();
    let response = null;
    
    // Önce bot adını kontrol et (oyuncu belirli bir bota mı sesleniyor?)
    let targetBot = null;
    for(const b of bots){
      if(b.name && lowerMsg.includes(b.name.toLowerCase().split(' ')[0])){
        targetBot = b;
        break;
      }
    }
    
    // Anahtar kelime bazlı cevap
    for(const [keyword, responses] of Object.entries(personality.responses)){
      if(lowerMsg.includes(keyword)){
        response = U.choice(responses);
        break;
      }
    }
    
    // Cevap bulunamadıysa genel cevap
    if(!response){
      const generalResponses = [
        'İlginç! 🤔',
        'Hmm, anladım. 😊',
        'Güzel! 🌟',
        'Vay! 😮',
        'Öyle mi? 🤨',
        'Harika! 🎉',
        'Anladım! 👍',
        'Devam et! 👂'
      ];
      response = U.choice(generalResponses);
    }
    
    const finalBot = targetBot || bot;
    this.addMessage('bot', finalBot.name || 'Bot', response);
    
    // Bot konuşma balonu göster
    BotChat.showBubble(finalBot, response);
  },
  
  addMessage(type, sender, text){
    const container = $('chat-messages');
    const msgEl = document.createElement('div');
    msgEl.className = `chat-msg ${type}`;
    msgEl.innerHTML = `<span class="sender">${sender}</span>${text}`;
    container.appendChild(msgEl);
    container.scrollTop = container.scrollHeight;
    
    // Mesaj limitini kontrol et
    while(container.children.length > this.maxMessages){
      container.removeChild(container.firstChild);
    }
    
    this.messages.push({type, sender, text, time: Date.now()});
  },
  
  clear(){
    const container = $('chat-messages');
    if(container) container.innerHTML = '';
    this.messages = [];
  }
};

// Chat'i başlat (DOM yüklendiğinde)
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', ()=>Chat.init());
} else {
  Chat.init();
}
