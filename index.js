import express from 'express';
import { Telegraf } from 'telegraf';
import sharp from 'sharp';

// ========== КОНФИГУРАЦИЯ ==========
const BOT_TOKEN = process.env.BOT_TOKEN;
const BOT_USERNAME = 'MyStickerMarket_bot';
const NODE_ENV = process.env.NODE_ENV || 'production';
const VERCEL_URL = process.env.VERCEL_URL;

// Проверка токена
if (!BOT_TOKEN) {
  console.error('❌ ОШИБКА: BOT_TOKEN не найден!');
  console.error('Добавьте переменную BOT_TOKEN в настройках Vercel');
  console.error('Project Settings → Environment Variables');
  process.exit(1);
}

// Webhook URL
const WEBHOOK_URL = VERCEL_URL 
  ? `https://${VERCEL_URL}/api/webhook`
  : process.env.WEBHOOK_URL;

// Лог запуска
console.log(`
🚀 Запуск MyStickerMarketBot25
🤖 Бот: @${BOT_USERNAME}
🔧 Node.js: ${process.version}
📡 Режим: ${NODE_ENV}
`);

// Инициализация
const bot = new Telegraf(BOT_TOKEN);
const app = express();

// ========== КОМАНДЫ БОТА ==========
bot.start((ctx) => {
  ctx.replyWithMarkdownV2(`
🏪 *Добро пожаловать в MyStickerMarketBot25\\!*

Я создаю стикеры из изображений\\!

📤 *Как использовать:*
1\\. Отправьте мне изображение \\(фото или файл\\)
2\\. Я обработаю его
3\\. Получите готовый стикер
4\\. Добавьте в свой стикерпак

✅ *Поддерживаемые форматы:*
• PNG \\(рекомендуется\\)
• JPEG/JPG
• WebP
• GIF \\(первый кадр\\)

💡 *Совет:* Используйте PNG с прозрачным фоном для лучшего результата\\!

🔧 *Команды:*
/start \\- это меню
/help \\- справка
/stats \\- статистика
  `);
});

bot.help((ctx) => {
  ctx.replyWithMarkdownV2(`
📚 *Справка MyStickerMarketBot25*

Просто отправьте мне изображение, и я создам из него стикер\\!

📁 *Форматы:* PNG, JPEG, WebP, GIF
📏 *Размер:* до 10MB
🎨 *Качество:* 512×512px

🚀 *Начните прямо сейчас \\- отправьте изображение\\!*
  `);
});

bot.command('stats', (ctx) => {
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  
  ctx.replyWithMarkdownV2(`
📊 *Статистика бота*

⏱️ *Время работы:* ${hours}ч ${minutes}м ${seconds}с
🔧 *Node\\.js:* ${process.version}
👤 *Пользователь:* ${ctx.from.first_name}
🤖 *Бот:* @${BOT_USERNAME}
  `);
});

// ========== ОБРАБОТКА ИЗОБРАЖЕНИЙ ==========
bot.on('photo', async (ctx) => {
  try {
    const msg = await ctx.reply('🔄 Обрабатываю изображение...');
    
    // Получаем лучшее качество
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    const file = await ctx.telegram.getFile(photo.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
    
    // Загружаем изображение
    const response = await fetch(fileUrl);
    const imageBuffer = await response.arrayBuffer();
    
    // Обрабатываем с Sharp
    const stickerBuffer = await sharp(Buffer.from(imageBuffer))
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();
    
    // Отправляем стикер
    await ctx.replyWithSticker({ source: stickerBuffer });
    await ctx.telegram.deleteMessage(ctx.chat.id, msg.message_id);
    
    ctx.reply('✅ Стикер успешно создан! Добавьте его в свой стикерпак.');
    
  } catch (error) {
    console.error('Ошибка:', error);
    ctx.reply('❌ Не удалось создать стикер. Попробуйте другое изображение.');
  }
});

// Обработчик документов
bot.on('document', async (ctx) => {
  const doc = ctx.message.document;
  const mimeType = doc.mime_type;
  
  if (mimeType && mimeType.startsWith('image/')) {
    // Преобразуем документ в фото
    ctx.message.photo = [{
      file_id: doc.file_id,
      file_size: doc.file_size,
      width: 0,
      height: 0
    }];
    await bot.handleUpdate(ctx.update);
  } else {
    ctx.reply('📄 Пожалуйста, отправьте изображение (PNG, JPEG, WebP).');
  }
});

// Обработчик текста
bot.on('text', (ctx) => {
  if (!ctx.message.text.startsWith('/')) {
    ctx.reply('🏪 Отправьте мне изображение для создания стикера! Используйте /help для справки.');
  }
});

// Обработчик ошибок
bot.catch((err, ctx) => {
  console.error('Ошибка бота:', err);
  ctx.reply('⚠️ Произошла ошибка. Попробуйте еще раз.');
});

// ========== НАСТРОЙКА VERCEL ==========
if (NODE_ENV === 'production' || VERCEL_URL) {
  app.use(express.json());
  
  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      bot: `@${BOT_USERNAME}`,
      node: process.version,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });
  
  // Webhook endpoint
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
      <html>
      <head>
        <title>🏪 MyStickerMarketBot25</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            padding: 40px;
            border-radius: 20px;
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
          a {
            display: inline-block;
            background: #0088cc;
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            text-decoration: none;
            font-weight: bold;
            margin-top: 20px;
          }
          a:hover {
            background: #0077bb;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🏪 MyStickerMarketBot25</h1>
          <div class="status">✅ Бот активен и работает</div>
          <p>Telegram бот для создания стикеров из изображений.</p>
          <p>Username: <strong>@${BOT_USERNAME}</strong></p>
          <p>Node.js: ${process.version}</p>
          <p>Запущен: ${new Date().toLocaleString()}</p>
          <a href="https://t.me/${BOT_USERNAME}" target="_blank">
            🚀 Открыть в Telegram
          </a>
        </div>
      </body>
      </html>
    `);
  });
  
  // Установка вебхука
  if (WEBHOOK_URL) {
    bot.telegram.setWebhook(WEBHOOK_URL)
      .then(() => console.log(`✅ Webhook установлен: ${WEBHOOK_URL}`))
      .catch(err => console.error('❌ Ошибка webhook:', err));
  }
  
  // Запуск сервера
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`🌐 Бот: https://t.me/${BOT_USERNAME}`);
    console.log(`📊 Health: http://localhost:${PORT}/api/health`);
  });
  
  // Экспорт для Vercel
  export default app;
  
} else {
  // Локальная разработка
  console.log('🔧 Локальная разработка...');
  
  bot.launch()
    .then(() => console.log('🤖 Бот запущен'))
    .catch(err => console.error('❌ Ошибка:', err));
  
  // Graceful shutdown
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}
