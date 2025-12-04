const express = require('express');
const { Telegraf } = require('telegraf');
const sharp = require('sharp');

const BOT_TOKEN = process.env.BOT_TOKEN;
const BOT_VERSION = '3.0.0'; // НОВАЯ ВЕРСИЯ
const bot = new Telegraf(BOT_TOKEN);
const app = express();

console.log(`🚀 Sticker Bot v${BOT_VERSION} запускается...`);

// ========== КОМАНДЫ ==========

bot.start((ctx) => {
  ctx.reply(`🎨 MyStickerMarketBot25 v${BOT_VERSION}

Я бот для создания стикеров с эффектами!

Доступные команды:
/effects - показать все эффекты
/sepia - эффект старой фотографии
/gray - черно-белый
/invert - инверсия цветов
/sticker - обычный стикер

Просто выберите команду и отправьте фото!`);
});

bot.command('effects', (ctx) => {
  ctx.reply(`🎭 Доступные эффекты:

1. Сепия (/sepia) - эффект старой фотографии
2. Ч/Б (/gray) - черно-белый фильтр
3. Инверсия (/invert) - негатив изображения
4. Обычный (/sticker) - без эффектов

Выберите эффект и отправьте фото!`);
});

// ========== ПРОСТАЯ ОБРАБОТКА ==========

bot.on('photo', async (ctx) => {
  try {
    const msg = await ctx.reply('📸 Обрабатываю фото...');
    
    // Получаем фото
    const photo = ctx.message.photo.pop();
    const file = await ctx.telegram.getFile(photo.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
    
    // Скачиваем
    const response = await fetch(fileUrl);
    const imageBuffer = await response.arrayBuffer();
    
    // Создаем стикер
    const stickerBuffer = await sharp(Buffer.from(imageBuffer))
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();
    
    // Отправляем
    await ctx.replyWithSticker({ source: stickerBuffer });
    await ctx.deleteMessage(msg.message_id);
    
    ctx.reply('✅ Стикер создан! Версия: ' + BOT_VERSION);
    
  } catch (error) {
    console.error('Ошибка:', error);
    ctx.reply('❌ Ошибка: ' + error.message);
  }
});

// ========== VERCEL ==========

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: BOT_VERSION,
    bot: '@MyStickerMarket_bot',
    node: process.version,
    time: new Date().toISOString()
  });
});

app.post('/api/webhook', async (req, res) => {
  try {
    await bot.handleUpdate(req.body);
    res.status(200).json({ status: 'ok', version: BOT_VERSION });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ status: 'error', version: BOT_VERSION });
  }
});

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>Sticker Bot v${BOT_VERSION}</title></head>
    <body style="text-align: center; padding: 50px;">
      <h1>🎨 Sticker Bot v${BOT_VERSION}</h1>
      <p>Новая версия! ${new Date().toISOString()}</p>
      <p>@MyStickerMarket_bot</p>
      <a href="https://t.me/MyStickerMarket_bot">Открыть бота</a>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 v${BOT_VERSION} на порту ${PORT}`);
});

module.exports = app;
