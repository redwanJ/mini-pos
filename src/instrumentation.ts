export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

        if (BOT_TOKEN && APP_URL) {
            try {
                const webhookUrl = `${APP_URL}/api/telegram/webhook`;
                console.log(`Setting Telegram webhook to: ${webhookUrl}`);

                const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        url: webhookUrl,
                        allowed_updates: ['message'],
                    }),
                });

                const data = await response.json();
                console.log('Webhook setup response:', data);
            } catch (error) {
                console.error('Failed to setup webhook:', error);
            }
        } else {
            console.warn('Skipping webhook setup: TELEGRAM_BOT_TOKEN or NEXT_PUBLIC_APP_URL not set');
        }
    }
}
