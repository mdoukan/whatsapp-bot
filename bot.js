const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs-extra');

const state = new Map();
const ORDERS_FILE = './orders.json';

// Siparişleri dosyadan yükle
let orders = [];
if(fs.existsSync(ORDERS_FILE)){
    orders = fs.readJsonSync(ORDERS_FILE);
}

const client = new Client({
    authStrategy: new LocalAuth({ clientId: "render-bot" }),
    puppeteer: { headless: true }
});

client.on('qr', qr => {
    // Orta boy QR kod (Render ve telefon terminali için ideal)
    qrcode.generate(qr, { small: true }); 
    console.log("\n📱 QR kodu tarayın ve botu bağlayın!\n");
});


client.on('ready', () => {
    console.log('WhatsApp bot hazır ve 7/24 çalışabilir!');
});

client.on('message', async msg => {
    const from = msg.from;
    const text = msg.body.trim().toLowerCase();
    const s = state.get(from) || { stage: 'start' };

    if(s.stage === 'start'){
        client.sendMessage(from, 
`👋 Merhaba! Menümüz:
1️⃣ Tavuk Döner
2️⃣ Köfte Menü
3️⃣ Vejetaryen Pizza
Lütfen sadece numara gönderin.`);
        state.set(from, {stage:'awaiting_choice'});

    } else if(s.stage === 'awaiting_choice'){
        if(['1','2','3'].includes(text)){
            state.set(from, {stage:'awaiting_address', choice:text});
            client.sendMessage(from,"🏠 Lütfen teslimat adresinizi yazın:");
        } else {
            client.sendMessage(from,"Lütfen 1, 2 veya 3 yazın.");
        }

    } else if(s.stage === 'awaiting_address'){
        const choice = s.choice;
        const order = { from, choice, address:text, timestamp: new Date().toISOString() };
        orders.push(order);

        // JSON dosyasına kaydet
        await fs.writeJson(ORDERS_FILE, orders, { spaces: 2 });

        client.sendMessage(from,"✅ Siparişiniz alındı! Teşekkürler.");
        state.set(from,{stage:'done'});

        console.log("Sipariş kaydedildi:", order);

    } else {
        client.sendMessage(from,"Tekrar merhaba! Menü için 'merhaba' yazın.");
        state.set(from,{stage:'awaiting_choice'});
    }
});

client.initialize();
