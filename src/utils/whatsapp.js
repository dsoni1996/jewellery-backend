const { Client, RemoteAuth } = require('whatsapp-web.js');
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');
const qrcode = require('qrcode-terminal');

// 1. Store aur Client ko 'mongoose.connection' block ke BAHAR banao
const store = new MongoStore({ mongoose: mongoose });

const client = new Client({
    authStrategy: new RemoteAuth({
        store: store,
        backupSyncIntervalMs: 300000
    }),
    puppeteer: {
        headless: true, // ✅ Render ke liye TRUE zaroori hai
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--single-process', // ✅ Render ka RAM bachane ke liye
            '--no-zygote'
        ]
    }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log("📲 SCAN THIS QR FROM RENDER LOGS SECTION!");
    client.on('qr', (qr) => {
        console.log("======================================================");
        console.log("👇 COPY THE LONG TEXT STRING BELOW 👇");
        console.log(qr);
        console.log("======================================================");
        console.log("Go to: https://www.the-qrcode-generator.com/");
        console.log("Select 'Text' option and paste this string there to scan.");
    });
});

client.on('ready', () => {
    console.log('✅ WhatsApp Bot is Ready & Connected to MongoDB!');
});

// 2. DB connect hone ke baad sirf start (initialize) karo
mongoose.connection.once('open', () => {
    console.log('MongoDB is open, initializing WhatsApp Client...');
    client.initialize();
});

// 3. Sabse zaroori: Export bahar hona chahiye!
module.exports = client;