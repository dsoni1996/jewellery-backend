const { Client, RemoteAuth } = require('whatsapp-web.js');
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');

let client;

const initWhatsApp = async () => {
    const store = new MongoStore({ mongoose: mongoose });

    client = new Client({
        authStrategy: new RemoteAuth({
            store: store,
            backupSyncIntervalMs: 600000,
            clientId: 'manas-jewellery'
        }),
        // RAM BACHANE KE LIYE SABSE ZAROORI SETTINGS 👇
        webVersionCache: {
            type: 'remote',
            remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
        },
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--single-process', // RAM bachane ka asli jadoo
                '--no-zygote',
                '--disable-gpu',
                '--disable-extensions'
            ],
        }
    });

    client.on('qr', (qr) => {
        console.log('👇 COPY THIS STRING & SCAN QUICKLY 👇');
        console.log(qr);
    });

    client.on('ready', () => {
        console.log('✅ WhatsApp Bot is Ready & Light-Weight!');
    });

    // Jab bot disconnect ho toh automatic restart ho jaye
    client.on('disconnected', (reason) => {
        console.log('❌ WhatsApp Disconnected!', reason);
        client.initialize();
    });

    global.whatsappClient = client;
    await client.initialize();
};

initWhatsApp();
module.exports = client;