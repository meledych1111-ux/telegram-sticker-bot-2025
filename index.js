const express = require('express');
const { Telegraf } = require('telegraf');
const sharp = require('sharp');

const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new Telegraf(BOT_TOKEN);
const app = express();

// Глобальная переменная для хранения эффектов пользователей
const userEffects = {};

// ========== ФУНКЦИИ ЭФФЕКТОВ ==========

// 1. Сепия эффект
async function applySepia(imageBuffer) {
  return await sharp(imageBuffer)
    .modulate({ brightness: 1.1, saturation: 0.8 })
    .tint({ r: 112, g: 66, b: 20 })
    .toBuffer();
}

// 2. Черно-белый
async function applyGrayscale(imageBuffer) {
  return await sharp(imageBuffer)
    .grayscale()
    .toBuffer();
}

// 3. Инверсия
async function applyInvert(imageBuffer) {
  return await sharp(imageBuffer)
    .negate()
    .toBuffer();
}

// ========== КОМАНДЫ БОТА ==========

bot.start((ctx) => {
  ctx.reply(`🎨 MyStickerMarketBot25 с эффектами!

Доступные команды:
/sepia - эффект старой фотографии
/gray - черно-белый фильтр
/invert - инверсия цветов
/sticker - обычный стикер

📤 Как использовать:
1. Отправьте команду (например /sepia)
2. Отправьте изображение
3. Получите стикер с эффектом!

💡 Совет: Для лучшего качества используйте PNG изображения.`);
});

// Команда сепия
bot.command('sepia', (ctx) => {
  userEffects[ctx.from.id] = 'sepia';
  ctx.reply('📸 Отправьте фото для эффекта "Старая фотография"...');
});

// Команда черно-белый
bot.command('gray', (ctx) => {
  userEffects[ctx.from.id] = 'gray';
  ctx.reply('⚫ Отправьте фото для черно-белого эффекта...');
});

// Команда инверсия
bot.command('invert', (ctx) => {
  userEffects[ctx.from.id] = 'invert';
  ctx.reply('🔄 Отправьте фото для инверсии цветов...');
});

// Команда обычный стикер
bot.command('sticker', (ctx) => {
  userEffects[ctx.from.id] = 'sticker';
  ctx.reply('🎨 Отправьте фото для обычного стикера...');
});

// ========== ОБРАБОТКА ИЗОБРАЖЕНИЙ ==========

bot.on('photo', async (ctx) => {
  try {
    const userId = ctx.from.id;
    const effect = userEffects[userId] || 'sticker';
    
    const msg = await ctx.reply('🔄 Загружаю изображение...');
    
    // Получаем фото (самое лучшее качество)
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    const file = await ctx.telegram.getFile(photo.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
    
    // Загружаем изображение (используем встроенный fetch в Node 20)
    const response = await fetch(fileUrl);
    const imageBuffer = await response.arrayBuffer();
    
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
      default:
        processedBuffer = Buffer.from(imageBuffer);
    }
    
    // Удаляем эффект из памяти
    delete userEffects[userId];
    
    // Создаем стикер 512x512
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
    
    // Сообщение об успехе
    if (effect !== 'sticker') {
      ctx.reply(`✅ Стикер с эффектом "${effect}" создан!`);
    }
    
  } catch (error) {
    console.error('Ошибка обработки:', error);
    ctx.reply('❌ Не удалось создать стикер. Попробуйте другое изображение.');
    
    // Очищаем эффект при ошибке
    delete userEffects[ctx.from.id];
  }
});

// Обработчик документов (файлы изображений)
bot.on('document', async (ctx) => {
  const doc = ctx.message.document;
  const mimeType = doc.mime_type;
  
  if (mimeType && mimeType.startsWith('image/')) {
    // Преобразуем документ в фото для обработки
    ctx.message.photo = [{
      file_id: doc.file_id,
      file_size: doc.file_size
    }];
    await bot.handleUpdate(ctx.update);
  } else {
    ctx.reply('📄 Пожалуйста, отправьте изображение (PNG, JPEG, WebP).');
  }
});

// Обработчик текста
bot.on('text', (ctx) => {
  if (!ctx.message.text.startsWith('/')) {
    ctx.reply('🎨 Отправьте мне изображение для создания стикера!\n\nИспользуйте /start для просмотра команд.');
  }
});

// Обработчик ошибок
bot.catch((err, ctx) => {
  console.error('Ошибка бота:', err);
  ctx.reply('⚠️ Произошла ошибка. Попробуйте команду /start');
});

// ========== VERCEL НАСТРОЙКА ==========

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'MyStickerMarketBot25',
    version: '2025.1.0',
    bot: '@MyStickerMarket_bot',
    node: process.version,
    sharp: sharp.versions.sharp,
    effects: ['sepia', 'gray', 'invert', 'sticker']
  });
});

// Webhook endpoint для Telegram
app.post('/api/webhook', async (req, res) => {
  try {
    await bot.handleUpdate(req.body);
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ status: 'error', error: error.message });
  }
});

// Главная страница
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🎨 MyStickerMarketBot25</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                margin: 0;
                padding: 0;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .container {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                padding: 40px;
                max-width: 600px;
                text-align: center;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            h1 {
                font-size: 2.5em;
                margin-bottom: 20px;
            }
            .status {
                background: rgba(0, 255, 0, 0.2);
                padding: 10px;
                border-radius: 10px;
                margin: 20px 0;
            }
            .btn {
                display: inline-block;
                background: #0088cc;
                color: white;
                padding: 12px 24px;
                border-radius: 25px;
                text-decoration: none;
                font-weight: bold;
                margin-top: 20px;
                transition: transform 0.3s;
            }
            .btn:hover {
                transform: scale(1.05);
                background: #0077bb;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎨 MyStickerMarketBot25</h1>
            <div class="status">✅ Бот активен и работает</div>
            <p>Telegram бот для создания стикеров с эффектами</p>
            <p><strong>Username:</strong> @MyStickerMarket_bot</p>
            <p><strong>Node.js:</strong> ${process.version}</p>
            <p><strong>Доступные эффекты:</strong> сепия, ч/б, инверсия</p>
            <a href="https://t.me/MyStickerMarket_bot" class="btn" target="_blank">
                🚀 Открыть в Telegram
            </a>
            <p style="margin-top: 20px; font-size: 0.9em; opacity: 0.8;">
                Просто отправьте боту изображение и получите стикер!
            </p>
        </div>
    </body>
    </html>
  `);
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`🤖 Бот: @MyStickerMarket_bot`);
  console.log(`🔧 Node.js: ${process.version}`);
  console.log(`🎨 Sharp: ${sharp.versions.sharp}`);
});

module.exports = app;
