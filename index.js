const express = require('express');
const { Telegraf } = require('telegraf');
const sharp = require('sharp');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BOT_TOKEN = process.env.BOT_TOKEN;
const BOT_VERSION = '3.0.2';
const bot = new Telegraf(BOT_TOKEN);
const app = express();

console.log(`🚀 Sticker Bot v${BOT_VERSION} запускается на Node ${process.version}...`);

// Проверка переменных окружения
if (!BOT_TOKEN) {
  console.error('❌ Ошибка: BOT_TOKEN не установлен!');
  process.exit(1);
}

// ========== ХРАНЕНИЕ ВЫБРАННОГО ЭФФЕКТА ==========
const userEffects = new Map();
const userStates = new Map();

// ========== КОМАНДЫ ЭФФЕКТОВ ==========

bot.start((ctx) => {
  const userName = ctx.from.first_name || 'пользователь';
  ctx.reply(`🎨 Привет, ${userName}! MyStickerMarketBot v${BOT_VERSION}

Я создам для тебя стикер из любой фотографии с эффектами!

📋 Доступные команды:
/effects - показать все эффекты
/sepia - эффект старой фотографии
/gray - черно-белый стиль
/invert - негатив изображения
/sticker - обычный стикер

Выбери эффект командой, а затем отправь мне фото!`);
});

bot.command('effects', (ctx) => {
  ctx.reply(`🎭 Доступные эффекты:

1. 🎨 Сепия (/sepia) - эффект старой фотографии
2. ⚫ Чёрно-белый (/gray) - классический стиль
3. 🔄 Инверсия (/invert) - негативное изображение
4. ✅ Обычный (/sticker) - без эффектов

⚡ Просто выбери эффект и отправь фото!`);
});

// Команды для выбора эффектов
bot.command('sepia', (ctx) => {
  userEffects.set(ctx.from.id, 'sepia');
  userStates.set(ctx.from.id, { lastCommand: 'sepia', timestamp: Date.now() });
  ctx.reply('🎨 Выбран эффект "Сепия" (старая фотография). Теперь отправь мне фото!');
});

bot.command('gray', (ctx) => {
  userEffects.set(ctx.from.id, 'gray');
  userStates.set(ctx.from.id, { lastCommand: 'gray', timestamp: Date.now() });
  ctx.reply('⚫ Выбран эффект "Черно-белый". Теперь отправь мне фото!');
});

bot.command('invert', (ctx) => {
  userEffects.set(ctx.from.id, 'invert');
  userStates.set(ctx.from.id, { lastCommand: 'invert', timestamp: Date.now() });
  ctx.reply('🔄 Выбран эффект "Инверсия" (негатив). Теперь отправь мне фото!');
});

bot.command('sticker', (ctx) => {
  userEffects.set(ctx.from.id, 'normal');
  userStates.set(ctx.from.id, { lastCommand: 'normal', timestamp: Date.now() });
  ctx.reply('✅ Выбран обычный стикер без эффектов. Отправь фото!');
});

bot.command('stats', (ctx) => {
  const now = Date.now();
  const activeUsers = Array.from(userStates.entries())
    .filter(([_, state]) => now - state.timestamp < 3600000)
    .length;
  
  ctx.reply(`📊 Статистика бота v${BOT_VERSION}:
👥 Всего пользователей: ${userStates.size}
⚡ Активных (час): ${activeUsers}
🎨 Выбранных эффектов: ${userEffects.size}

💾 Память: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB
⏰ Аптайм: ${Math.round(process.uptime() / 60)} минут`);
});

bot.command('help', (ctx) => {
  ctx.reply(`🤖 Помощь по боту v${BOT_VERSION}

📸 Как использовать:
1. Выбери эффект: /sepia, /gray, /invert или /sticker
2. Отправь фото (не документ)
3. Получи готовый стикер!

⚡ Эффекты:
• /sepia - коричневый оттенок
• /gray - черно-белый
• /invert - цвета наоборот
• /sticker - без эффектов

📊 /stats - статистика
🔄 /effects - список эффектов`);
});

// ========== ОБРАБОТКА ФОТО С ЭФФЕКТАМИ ==========

bot.on('photo', async (ctx) => {
  try {
    const userId = ctx.from.id;
    const userName = ctx.from.first_name || 'пользователь';
    const selectedEffect = userEffects.get(userId) || 'normal';
    
    const processingMsg = await ctx.reply(`⏳ ${userName}, обрабатываю твоё фото...\nЭффект: ${getEffectName(selectedEffect)}`);
    
    // Получаем фото (самое большое качество)
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    const file = await ctx.telegram.getFile(photo.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
    
    console.log(`📥 Загрузка фото от ${userName} (${userId}), эффект: ${selectedEffect}`);
    
    // Скачиваем изображение
    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      throw new Error(`Ошибка загрузки: ${response.status} ${response.statusText}`);
    }
    
    const imageBuffer = await response.buffer();
    
    // Обработка изображения
    let stickerBuffer;
    try {
      stickerBuffer = await processImage(imageBuffer, selectedEffect);
      console.log(`✅ Фото обработано, размер стикера: ${stickerBuffer.length} байт`);
    } catch (sharpError) {
      console.error('Sharp error:', sharpError);
      // Пробуем без эффектов
      stickerBuffer = await processImage(imageBuffer, 'normal');
    }
    
    // Проверяем размер стикера (максимум 512KB для Telegram)
    if (stickerBuffer.length > 512 * 1024) {
      console.log(`⚠️ Стикер слишком большой (${Math.round(stickerBuffer.length / 1024)}KB), оптимизируем...`);
      stickerBuffer = await sharp(stickerBuffer)
        .png({ compressionLevel: 9, colors: 128 })
        .toBuffer();
    }
    
    // Отправляем стикер
    await ctx.replyWithSticker({ source: stickerBuffer });
    await ctx.telegram.deleteMessage(ctx.chat.id, processingMsg.message_id);
    
    // Успешное сообщение
    await ctx.reply(`✅ Готово, ${userName}! Стикер создан с эффектом: ${getEffectName(selectedEffect)}\n\nХочешь другой эффект? Выбери команду:`);
    
  } catch (error) {
    console.error('❌ Ошибка обработки фото:', error);
    
    try {
      await ctx.reply(`❌ Извини, произошла ошибка: ${error.message}\n\nПопробуй отправить фото ещё раз или выбери другой эффект.`);
    } catch (replyError) {
      console.error('Не удалось отправить сообщение об ошибке:', replyError);
    }
  }
});

// ========== ФУНКЦИИ ==========

async function processImage(imageBuffer, effect) {
  let image = sharp(imageBuffer);
  
  // Автоматически поворачиваем согласно EXIF
  image = image.rotate();
  
  switch(effect) {
    case 'sepia':
      image = image
        .modulate({ brightness: 1.1, saturation: 0.8 })
        .tint({ r: 112, g: 66, b: 20 });
      break;
    case 'gray':
      image = image.grayscale();
      break;
    case 'invert':
      image = image.negate({ alpha: false });
      break;
    case 'normal':
    default:
      // Без эффектов
      break;
  }
  
  // Оптимизация для стикеров Telegram (512x512 PNG)
  return image
    .resize({
      width: 512,
      height: 512,
      fit: 'cover',
      position: 'center',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png({
      compressionLevel: 8,
      palette: true,
      colors: 256
    })
    .toBuffer();
}

function getEffectName(effectKey) {
  const effects = {
    'sepia': '🎨 Сепия',
    'gray': '⚫ Черно-белый',
    'invert': '🔄 Инверсия',
    'normal': '✅ Обычный'
  };
  return effects[effectKey] || 'Неизвестный';
}

// Очистка старых записей каждые 10 минут
setInterval(() => {
  const now = Date.now();
  const hourAgo = now - 3600000;
  
  let cleaned = 0;
  for (const [userId, state] of userStates.entries()) {
    if (state.timestamp < hourAgo) {
      userStates.delete(userId);
      userEffects.delete(userId);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 Очистка: удалено ${cleaned} неактивных пользователей, осталось ${userStates.size}`);
  }
}, 600000);

// ========== VERCEL КОНФИГУРАЦИЯ ==========

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  const memoryUsage = process.memoryUsage();
  
  res.json({
    status: 'ok',
    version: BOT_VERSION,
    bot: 'MyStickerMarket_bot',
    node: process.version,
    memory: {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
      rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB'
    },
    uptime: Math.round(process.uptime()) + 's',
    users: {
      total: userStates.size,
      withEffects: userEffects.size
    },
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Webhook endpoint для Vercel
app.post('/api/webhook', async (req, res) => {
  try {
    console.log('📩 Webhook получен:', req.body?.update_id || 'no update_id');
    await bot.handleUpdate(req.body);
    res.status(200).json({ 
      status: 'ok', 
      version: BOT_VERSION,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ 
      status: 'error', 
      version: BOT_VERSION,
      error: error.message,
      timestamp: new Date().toISOString()
    });
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
      <title>🎨 Sticker Bot v${BOT_VERSION}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          min-height: 100vh;
          padding: 20px;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .header h1 {
          font-size: 2.5em;
          margin-bottom: 10px;
        }
        .version {
          background: gold;
          color: black;
          padding: 3px 10px;
          border-radius: 15px;
          font-size: 0.7em;
          font-weight: bold;
        }
        .stats {
          background: rgba(255, 255, 255, 0.15);
          padding: 20px;
          border-radius: 15px;
          margin: 20px 0;
        }
        .btn {
          display: inline-block;
          background: white;
          color: #667eea;
          padding: 14px 30px;
          border-radius: 50px;
          text-decoration: none;
          font-weight: bold;
          margin: 10px;
          transition: all 0.3s;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        .btn-telegram {
          background: #0088cc;
          color: white;
        }
        .effects {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
          margin: 20px 0;
        }
        .effect {
          background: rgba(255, 255, 255, 0.2);
          padding: 10px 20px;
          border-radius: 20px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          opacity: 0.8;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎨 Sticker Bot <span class="version">v${BOT_VERSION}</span></h1>
          <p>Создавай стикеры с эффектами прямо в Telegram</p>
        </div>
        
        <div class="stats">
          <p><strong>Статистика:</strong></p>
          <p>👥 Активных пользователей: ${userStates.size}</p>
          <p>🎨 Выбранных эффектов: ${userEffects.size}</p>
          <p>⚡ Node.js: ${process.version}</p>
          <p>🕐 Время: ${new Date().toLocaleTimeString('ru-RU')}</p>
        </div>
        
        <div style="text-align: center; margin: 20px 0;">
          <h3>✨ Доступные эффекты:</h3>
          <div class="effects">
            <div class="effect">🎨 Сепия</div>
            <div class="effect">⚫ Ч/Б</div>
            <div class="effect">🔄 Инверсия</div>
            <div class="effect">✅ Обычный</div>
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://t.me/MyStickerMarket_bot" class="btn btn-telegram">
            📲 Открыть бота в Telegram
          </a>
          <br>
          <a href="/api/health" class="btn">
            ❤️‍🩹 Проверить здоровье бота
          </a>
        </div>
        
        <div class="footer">
          <p>💻 Powered by Node.js ${process.version} | 🚀 Deployed on Vercel</p>
          <p>📅 ${new Date().toLocaleDateString('ru-RU')} ${new Date().toLocaleTimeString('ru-RU')}</p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Обработка ошибок
process.on('uncaughtException', (error) => {
  console.error('❌ Непойманное исключение:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Необработанный промис:', reason);
});

// ========== ЗАПУСК СЕРВЕРА ==========

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
  console.log(`✅ Версия бота: ${BOT_VERSION}`);
  console.log(`✅ Node.js: ${process.version}`);
  console.log(`✅ Режим: ${process.env.NODE_ENV || 'production'}`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 Получен SIGTERM, завершаем работу...');
  server.close(() => {
    console.log('✅ Сервер остановлен');
    process.exit(0);
  });
});

module.exports = app;
