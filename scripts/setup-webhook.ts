import 'dotenv/config';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.argv[2];

if (!BOT_TOKEN) {
    console.error('Error: TELEGRAM_BOT_TOKEN is not set in .env');
    process.exit(1);
}

if (!WEBHOOK_URL) {
    console.error('Usage: npx ts-node scripts/setup-webhook.ts <WEBHOOK_URL>');
    console.error('Example: npx ts-node scripts/setup-webhook.ts https://my-app.com/api/telegram/webhook');
    process.exit(1);
}

async function setupWebhook() {
    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: WEBHOOK_URL,
                allowed_updates: ['message'],
            }),
        });

        const data = await response.json();
        console.log('Webhook setup response:', data);
    } catch (error) {
        console.error('Failed to setup webhook:', error);
    }
}

setupWebhook();
