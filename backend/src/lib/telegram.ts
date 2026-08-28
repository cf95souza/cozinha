// Default credentials based on previous scripts, overridable by .env
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8261444082:AAE8hXDWocLrcO6pzLEIq2PA9EE8MwgbqHI';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '1045658856';

export const sendTelegramAlert = async (message: string): Promise<void> => {
  try {
    if (!BOT_TOKEN || !CHAT_ID) {
      console.warn('Telegram credentials not configured. Skipping alert.');
      return;
    }

    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      }),
    });
    
    if (!response.ok) {
        console.error('Failed to send Telegram alert:', await response.text());
        return;
    }
    console.log('Telegram alert sent successfully.');
  } catch (error) {
    console.error('Failed to send Telegram alert:', error);
  }
};
