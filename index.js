const express = require('express');
const { Telegraf } = require('telegraf');
const sharp = require('sharp');

const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new Telegraf(BOT_TOKEN);
const app = express();

// ========== ЭФФЕКТЫ ЧЕРЕЗ SHARP ==========

// 1. Сепия (старое фото)
async function applySepia(imageBuffer) {
  return await sharp(imageBuffer)
    .modulate({ brightness: 1.1, saturation: 0.8 })
    .tint({ r: 112, g: 66, b: 20 })
    .toBuffer();
}

// 2. Черно-белое
async function applyGrayscale(imageBuffer) {
  return await sharp(imageBuffer)
    .grayscale()
    .toBuffer();
}

// 3. Инверсия цветов
async function applyInvert(imageBuffer) {
  return await sharp(imageBuffer)
    .negate()
    .toBuffer();
}

// 4. Контраст
async function applyContrast(imageBuffer) {
  return await sharp(imageBuffer)
    .linear(1.5, -(0.5 * 128))
    .toBuffer();
}

// 5. Размытие
async function applyBlur(imageBuffer) {
  return await sharp(imageBuffer)
    .blur(5)
    .toBuffer();
}

// 6. Кадрирование в круг
async function applyCircle(imageBuffer) {
  const size = 512;
  const circle = Buffer.from(
    `<svg><circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="white"/></svg>`
  );
  
  return await sharp(imageBuffer)
    .resize(size, size)
    .composite([{ input: circle, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

// 7. Рамка
async function applyBorder(imageBuffer) {
  return await sharp(imageBuffer)
    .extend({
      top: 20,
      bottom: 20,
      left: 20,
      right: 20,
      background: { r: 255, g: 255, b: 255 }
    })
    .toBuffer();
}

// ========== КОМАНДЫ БОТА ==========
bot.start((ctx) => {
  ctx.reply(`🎨 Sticker Bot с эффектами!

Доступные эффекты:
/sepia - эффект старой фотографии
/gray - черно-белый фильтр
/invert - инверсия цветов
/contrast - усиление контраста
/blur - размытие
/circle - круглый стикер
/border - белая рамка
/sticker - обычный стикер

📤 Отправьте команду, затем изображение!`);
});

// Обработка команд
bot.command('sepia', (ctx) => {
  ctx.session = { effect: 'sepia' };
  ctx.reply('🎞️ Отправьте фото для эффекта "Старая фотография"...');
});

bot.command('gray', (ctx) => {
  ctx.session = { effect: 'gray' };
  ctx.reply('⚫ Отправьте фото для ч/б эффекта...');
});

bot.command('invert', (ctx) => {
  ctx.session = { effect: 'invert' };
  ctx.reply('🔄 Отправьте фото для инверсии цветов...');
});

bot.command('contrast', (ctx) => {
  ctx.session = { effect: 'contrast' };
  ctx.reply('🔆 Отправьте фото для усиления контраста...');
});

bot.command('blur', (ctx) => {
  ctx.session = { effect: 'blur' };
  ctx.reply('🌫️ Отправьте фото для размытия...');
});

bot.command('circle', (ctx) => {
  ctx.session = { effect: 'circle' };
  ctx.reply('⭕ Отправьте фото для круглого стикера...');
});

bot.command('border', (ctx) => {
  ctx.session = { effect: 'border' };
  ctx.reply('🖼️ Отправьте фото для стикера с рамкой...');
});

bot.command('sticker', (ctx) => {
  ctx.session = { effect: 'sticker' };
  ctx.reply('🎨 Отправьте фото для обычного стикера...');
});

// ========== ОБРАБОТКА ИЗОБРАЖЕНИЙ ==========
bot.on('photo', async (ctx) => {
  try {
    const effect = ctx.session?.effect || 'sticker';
    const msg = await ctx.reply('🔄 Обработка...');
    
    // Получаем фото
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    const file = await ctx.telegram.getFile(photo.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
    
    // Загружаем
    const response = await fetch(fileUrl);
    let imageBuffer = await response.arrayBuffer();
    
    // Применяем эффект
    let processedBuffer;
    switch(effect) {
      case 'sepia':
        processedBuffer = await applySepia(imageBuffer);
        break;
      case 'gray':
        processedBuffer = await applyGrayscale(imageBuffer);
        break;
      case 'invert':
        processedBuffer = await applyInvert(imageBuffer);
        break;
      case 'contrast':
        processedBuffer = await applyContrast(imageBuffer);
        break;
      case 'blur':
        processedBuffer = await applyBlur(imageBuffer);
        break;
      case 'circle':
        processedBuffer = await applyCircle(imageBuffer);
        break;
      case 'border':
        processedBuffer = await applyBorder(imageBuffer);
        break;
      default:
        processedBuffer = Buffer.from(imageBuffer);
    }
    
    // Создаем стикер
    const stickerBuffer = await sharp(processedBuffer)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();
    
    // Отправляем
    await ctx.replyWithSticker({ source: stickerBuffer });
    await ctx.deleteMessage(msg.message_id);
    
    // Сбрасываем
    ctx.session = {};
    
  } catch (error) {
    console.error('Ошибка:', error);
    ctx.reply('❌ Ошибка обработки. Попробуйте снова.');
  }
});

// ========== VERCEL НАСТРОЙКА ==========
app.use(express.json());

app.post('/api/webhook', async (req, res) => {
  await bot.handleUpdate(req.body);
  res.status(200).send('OK');
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    bot: '@MyStickerMarket_bot',
    effects: ['sepia', 'gray', 'invert', 'contrast', 'blur', 'circle', 'border']
  });
});

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>🎨 Sticker Bot</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
          padding: 50px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.1);
          padding: 30px;
          border-radius: 20px;
          backdrop-filter: blur(10px);
        }
        h1 { font-size: 2.5em; }
        a {
          display: inline-block;
          background: #0088cc;
          color: white;
          padding: 15px 30px;
          border-radius: 25px;
          text-decoration: none;
          font-weight: bold;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎨 Sticker Bot</h1>
        <p>Telegram бот для создания стикеров с эффектами</p>
        <p><strong>@MyStickerMarket_bot</strong></p>
        <p>Доступные эффекты: сепия, ч/б, инверсия, контраст, размытие</p>
        <a href="https://t.me/MyStickerMarket_bot" target="_blank">
          🚀 Открыть в Telegram
        </a>
      </div>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🤖 Бот запущен на порту ${PORT}`);
  console.log(`✨ Sharp версия: ${sharp.versions.sharp}`);
});

module.exports = app;
