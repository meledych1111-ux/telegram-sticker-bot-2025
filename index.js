const express = require('express');
const { Telegraf } = require('telegraf');
const sharp = require('sharp');

const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new Telegraf(BOT_TOKEN);
const app = express();

// Хранилище выбранных эффектов
const userEffects = {};

// ========== ЭФФЕКТЫ ==========

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

// 6. Яркость
async function applyBrightness(imageBuffer) {
  return await sharp(imageBuffer)
    .modulate({ brightness: 1.3 })
    .toBuffer();
}

// 7. Насыщенность
async function applySaturation(imageBuffer) {
  return await sharp(imageBuffer)
    .modulate({ saturation: 1.5 })
    .toBuffer();
}

// ========== КОМАНДЫ ==========

bot.start((ctx) => {
  ctx.reply(`🎨 Sticker Bot с эффектами!

Выберите эффект:
/sepia - эффект старой фотографии
/gray - черно-белый фильтр
/invert - инверсия цветов
/contrast - усиление контраста
/blur - мягкое размытие
/bright - увеличение яркости
/saturate - повышение насыщенности
/sticker - обычный стикер

📤 Как использовать:
1. Выберите эффект (например /sepia)
2. Отправьте фото
3. Получите стикер с эффектом!`);
});

// Команды эффектов
bot.command('sepia', (ctx) => {
  userEffects[ctx.from.id] = 'sepia';
  ctx.reply('📸 Отправьте фото для эффекта "Старая фотография"...');
});

bot.command('gray', (ctx) => {
  userEffects[ctx.from.id] = 'gray';
  ctx.reply('⚫ Отправьте фото для черно-белого эффекта...');
});

bot.command('invert', (ctx) => {
  userEffects[ctx.from.id] = 'invert';
  ctx.reply('🔄 Отправьте фото для инверсии цветов...');
});

bot.command('contrast', (ctx) => {
  userEffects[ctx.from.id] = 'contrast';
  ctx.reply('🔆 Отправьте фото для усиления контраста...');
});

bot.command('blur', (ctx) => {
  userEffects[ctx.from.id] = 'blur';
  ctx.reply('🌫️ Отправьте фото для размытия...');
});

bot.command('bright', (ctx) => {
  userEffects[ctx.from.id] = 'bright';
  ctx.reply('💡 Отправьте фото для увеличения яркости...');
});

bot.command('saturate', (ctx) => {
  userEffects[ctx.from.id] = 'saturate';
  ctx.reply('🌈 Отправьте фото для повышения насыщенности...');
});

bot.command('sticker', (ctx) => {
  userEffects[ctx.from.id] = 'sticker';
  ctx.reply('🎨 Отправьте фото для обычного стикера...');
});

// ========== ОБРАБОТКА ФОТО ==========

bot.on('photo', async (ctx) => {
  try {
    const userId = ctx.from.id;
    const effect = userEffects[userId] || 'sticker';
    
    const msg = await ctx.reply('🔄 Загружаю фото...');
    
    // Получаем фото
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    const file = await ctx.telegram.getFile(photo.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
    
    // Скачиваем (Node.js 20 имеет встроенный fetch)
    const response = await fetch(fileUrl);
    const imageBuffer = await response.arrayBuffer();
    
    // Применяем выбранный эффект
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
      case 'bright':
        processedBuffer = await applyBrightness(imageBuffer);
        break;
      case 'saturate':
        processedBuffer = await applySaturation(imageBuffer);
        break;
      default:
        processedBuffer = Buffer.from(imageBuffer);
    }
    
    // Удаляем эффект из памяти
    delete userEffects[userId];
    
    // Создаем стикер
    const stickerBuffer = await sharp(processedBuffer)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();
    
    // Отправляем стикер
    await ctx.replyWithSticker({ source: stickerBuffer });
    await ctx.deleteMessage(msg.message_id);
    
    // Информация об эффекте
    const effectNames = {
      sepia: 'Сепия',
      gray: 'Черно-белый',
      invert: 'Инверсия',
      contrast: 'Контраст',
      blur: 'Размытие',
      bright: 'Яркость',
      saturate: 'Насыщенность',
      sticker: 'Обычный'
    };
    
    ctx.reply(`✅ Стикер с эффектом "${effectNames[effect]}" готов!`);
    
  } catch (error) {
    console.error('Ошибка:', error);
    ctx.reply('❌ Ошибка обработки. Попробуйте другое фото.');
    
    // Очищаем эффект при ошибке
    delete userEffects[ctx.from.id];
  }
});

// ========== VERCEL НАСТРОЙКА ==========

app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    bot: '@MyStickerMarket_bot',
    effects: ['sepia', 'gray', 'invert', 'contrast', 'blur', 'bright', 'saturate'],
    node: process.version,
    sharp: sharp.versions.sharp
  });
});

// Webhook
app.post('/api/webhook', async (req, res) => {
  try {
    await bot.handleUpdate(req.body);
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ status: 'error' });
  }
});

// Главная страница
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
          max-width: 800px;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.1);
          padding: 40px;
          border-radius: 20px;
          backdrop-filter: blur(10px);
        }
        h1 {
          font-size: 2.5em;
          margin-bottom: 20px;
        }
        .effects {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin: 30px 0;
        }
        .effect {
          background: rgba(255, 255, 255, 0.1);
          padding: 15px;
          border-radius: 10px;
        }
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
        <h1>🎨 Sticker Bot с 7 эффектами!</h1>
        <p>Node.js ${process.version} | Sharp ${sharp.versions.sharp}</p>
        
        <div class="effects">
          <div class="effect">📸 Сепия</div>
          <div class="effect">⚫ Ч/Б</div>
          <div class="effect">🔄 Инверсия</div>
          <div class="effect">🔆 Контраст</div>
          <div class="effect">🌫️ Размытие</div>
          <div class="effect">💡 Яркость</div>
          <div class="effect">🌈 Насыщенность</div>
          <div class="effect">🎨 Обычный</div>
        </div>
        
        <p>Отправьте команду /start в боте для начала</p>
        
        <a href="https://t.me/MyStickerMarket_bot" target="_blank">
          🚀 Открыть @MyStickerMarket_bot
        </a>
      </div>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Бот запущен на Node.js ${process.version}`);
  console.log(`🎨 Доступно 7 эффектов`);
  console.log(`🤖 Бот: @MyStickerMarket_bot`);
});

module.exports = app;
