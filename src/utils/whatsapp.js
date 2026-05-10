const { Client, RemoteAuth } = require('whatsapp-web.js');
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');
const qrcode = require('qrcode-terminal');

mongoose.connection.once('open', () => {
    const store = new MongoStore({ mongoose: mongoose });
    
    const client = new Client({
        authStrategy: new RemoteAuth({
            store: store,
            backupSyncIntervalMs: 300000
        }),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--single-process', // RAM bachane ke liye
                '--no-zygote'
            ],
            // Render par chrome ka path automatically mil jata hai npx command ke baad
        }
    });

    client.on('qr', (qr) => {
        // Render ke "Logs" me QR code print hoga
        qrcode.generate(qr, { small: true });
        console.log("📲 SCAN THIS QR FROM RENDER LOGS SECTION!");
    });

    client.on('ready', () => {
        console.log('✅ WhatsApp Bot is Ready on Render!');
    });

    client.initialize();
});