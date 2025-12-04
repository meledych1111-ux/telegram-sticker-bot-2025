const express = require('express');
const { Telegraf } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new Telegraf(BOT_TOKEN);
const app = express();

// Проверка токена
if (!BOT_TOKEN) {
  console.error('❌ ОШИБКА: BOT_TOKEN не найден!');
  process.exit(1);
}

console.log('🚀 Бот запускается...');
console.log('🔑 Токен есть:', BOT_TOKEN ? '✅' : '❌');

// Простая команда start
bot.start((ctx) => {
  console.log('👋 Пользователь запустил бота:', ctx.from.id);
  ctx.reply('🎨 Привет! Я Sticker Bot. Просто отправь мне фото!');
});

// Обработка фото
bot.on('photo', (ctx) => {
  console.log('📸 Получено фото от:', ctx.from.id);
  ctx.reply('✅ Фото получено! Но пока без обработки. Добавлю эффекты позже.');
});

// Обработка текста
bot.on('text', (ctx) => {
  console.log('📝 Текст от:', ctx.from.id, ':', ctx.message.text);
  ctx.reply('📤 Отправьте мне фото для создания стикера!');
});

// Ошибки
bot.catch((err, ctx) => {
  console.error('🔥 ОШИБКА БОТА:', err);
  ctx.reply('❌ Ошибка. Попробуйте позже.');
});

// ========== VERCEL ==========
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    bot: '@MyStickerMarket_bot',
    timestamp: new Date().toISOString()
  });
});

// Webhook для Telegram
app.post('/api/webhook', async (req, res) => {
  console.log('📨 Webhook получен');
  try {
    await bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).send('Error');
  }
});

// Главная страница
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>Sticker Bot</title></head>
    <body style="text-align: center; padding: 50px;">
      <h1>🤖 Sticker Bot</h1>
      <p>Бот: @MyStickerMarket_bot</p>
      <p>Статус: ✅ Работает</p>
      <a href="https://t.me/MyStickerMarket_bot">Открыть в Telegram</a>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
});

module.exports = app;
