const express = require('express');
const { Telegraf } = require('telegraf');
const sharp = require('sharp');

// ========== КОНФИГУРАЦИЯ ==========
const BOT_TOKEN = process.env.BOT_TOKEN;
const BOT_USERNAME = 'MyStickerMarket_bot';
const NODE_ENV = process.env.NODE_ENV || 'production';
const VERCEL_URL = process.env.VERCEL_URL;

// Проверка токена
if (!BOT_TOKEN) {
  console.error('❌ ОШИБКА: BOT_TOKEN не найден в переменных окружения!');
  console.error('Добавьте BOT_TOKEN в настройках Vercel:');
  console.error('Project Settings → Environment Variables');
  process.exit(1);
}

// Webhook URL
const WEBHOOK_URL = VERCEL_URL 
  ? `https://${VERCEL_URL}/api/webhook`
  : process.env.WEBHOOK_URL;

// Лог запуска
console.log(`
╔══════════════════════════════════╗
║     🏪 MyStickerMarketBot25     ║
║     👤 @${BOT_USERNAME}         ║
║     🔧 Node.js ${process.version}   ║
║     🚀 ${new Date().toLocaleString()} ║
╚══════════════════════════════════╝
`);

const bot = new Telegraf(BOT_TOKEN);
const app = express();

// ========== КОМАНДЫ БОТА ==========
bot.start((ctx) => {
  ctx.replyWithMarkdownV2(`
🏪 *Добро пожаловать в MyStickerMarketBot25\\!*

Я создаю стикеры из изображений за секунды\\!

📤 *Как использовать:*
1\\. Отправьте мне изображение
2\\. Я оптимизирую его для стикера
3\\. Получите готовый стикер
4\\. Добавьте в свой стикерпак

✅ *Поддерживаемые форматы:*
• PNG \\(рекомендуется\\)
• JPEG/JPG
• WebP
• GIF \\(первый кадр\\)

💡 *Совет:* Используйте PNG с прозрачным фоном для лучшего результата\\!

🔧 *Команды:*
/start \\- главное меню
/help \\- справка
/stats \\- статистика
/formats \\- форматы
/support \\- поддержка
  `);
});

bot.help((ctx) => {
  ctx.replyWithMarkdownV2(`
📚 *Справка MyStickerMarketBot25*

Я превращаю ваши изображения в Telegram стикеры\\!

✨ *Просто отправьте мне:*
• Фотографию из галереи
• Файл изображения
• Любое изображение

📁 *Поддерживаемые форматы:*
• PNG \\(лучший выбор\\)
• JPEG/JPG \\(фотографии\\)
• WebP \\(современный формат\\)
• GIF \\(анимации, первый кадр\\)

⚡ *Ограничения:*
• Максимальный размер: 10 MB
• Оптимальный размер: 512×512px
• Соотношение: лучше 1:1

🎯 *Советы:*
1\\. Используйте изображения с прозрачным фоном
2\\. Избегайте мелкого текста
3\\. Яркие цвета обрабатываются лучше

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
🖥️ *Платформа:* ${process.platform}
🧠 *Память:* ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
👤 *Пользователь:* ${ctx.from.first_name}
🤖 *Бот:* @${BOT_USERNAME}
📅 *Серверное время:* ${new Date().toLocaleString('ru-RU')}
  `);
});

bot.command('formats', (ctx) => {
  ctx.replyWithMarkdownV2(`
📁 *Поддерживаемые форматы*

✅ *Основные форматы:*
• \`PNG\` \\- лучший выбор, поддерживает прозрачность
• \`JPEG/JPG\` \\- фотографии
• \`WebP\` \\- современный формат
• \`GIF\` \\- анимации \\(первый кадр\\)

✅ *Дополнительные:*
• \`BMP\` \\- растровые изображения
• \`TIFF\` \\- профессиональные фото

❌ *Не поддерживается:*
• Видеофайлы \\(MP4, AVI, MOV\\)
• Документы \\(PDF, DOC, XLS\\)
• Архивы \\(ZIP, RAR\\)
• Аудиофайлы

💡 *Рекомендации:*
1\\. Для логотипов \\- PNG с прозрачным фоном
2\\. Для фотографий \\- JPEG высокого качества
3\\. Для векторной графики \\- конвертируйте в PNG
4\\. Оптимальный размер: 512×512px

⚡ *Максимальный размер:* 10 MB
  `);
});

bot.command('support', (ctx) => {
  ctx.replyWithMarkdownV2(`
🛟 *Техническая поддержка*

👨‍💼 *Бот:* @${BOT_USERNAME}
🕐 *Работа:* Круглосуточно 24/7

🔧 *Если возникли проблемы:*
1\\. Проверьте формат изображения
2\\. Убедитесь что размер ≤ 10MB
3\\. Попробуйте другое изображение
4\\. Перезапустите бота /start

🚨 *Частые проблемы:*
• *Не загружается* \\- проверьте интернет
• *Ошибка обработки* \\- используйте PNG
• *Плохое качество* \\- отправьте исходник от 512px
• *Бот не отвечает* \\- /start

📋 *Оптимальные настройки:*
• Формат: PNG
• Размер: 512×512px
• Фон: прозрачный
• Качество: максимальное

📬 *Обратная связь:* Напишите сообщение с вашим вопросом
  `);
});

// ========== ОБРАБОТКА ИЗОБРАЖЕНИЙ ==========
bot.on('photo', async (ctx) => {
  try {
    const msg = await ctx.reply('🔄 Загружаю и обрабатываю изображение...');
    
    // Получаем лучшее качество
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    const file = await ctx.telegram.getFile(photo.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
    
    console.log(`📸 Обработка фото от @${ctx.from.username || ctx.from.id}`);
    
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
    
    await ctx.replyWithMarkdownV2(`
🎉 *Стикер успешно создан\\!*

✨ *Что дальше?*
1\\. Нажмите на стикер
2\\. Выберите "✏️ Добавить стикер"
3\\. Выберите набор или создайте новый
4\\. Наслаждайтесь\\!

💡 *Совет:* Для будущих стикеров используйте PNG с прозрачным фоном\\!

🔄 *Хотите еще?* Просто отправьте новое изображение\\!
    `);
    
  } catch (error) {
    console.error('❌ Ошибка обработки:', error);
    await ctx.replyWithMarkdownV2(`
❌ *Не удалось создать стикер*

🔍 *Возможные причины:*
• Изображение повреждено
• Неподдерживаемый формат
• Слишком большой размер \\(>10MB\\)

🛠️ *Попробуйте:*
1\\. Другое изображение
2\\. Формат PNG с прозрачным фоном
3\\. Размер до 10MB

📞 *Если проблема повторяется:* /support
    `);
  }
});

// Обработчик документов
bot.on('document', async (ctx) => {
  const doc = ctx.message.document;
  const mimeType = doc.mime_type;
  
  const supportedTypes = [
    'image/png',
    'image/jpeg',
    'image/jpg', 
    'image/webp',
    'image/gif',
    'image/bmp',
    'image/tiff'
  ];
  
  if (mimeType && supportedTypes.some(type => mimeType.includes(type))) {
    // Преобразуем документ в фото
    ctx.message.photo = [{
      file_id: doc.file_id,
      file_size: doc.file_size,
      width: 0,
      height: 0
    }];
    await bot.handleUpdate(ctx.update);
  } else {
    ctx.replyWithMarkdownV2(`
📄 *Неподдерживаемый формат файла*

✅ *Принимаю только изображения:*
• \`PNG\` \\- \`image/png\`
• \`JPEG\` \\- \`image/jpeg\`
• \`WebP\` \\- \`image/webp\`
• \`GIF\` \\- \`image/gif\`

❌ *Не принимаю:*
• Видео \\(MP4, AVI, MOV\\)
• Документы \\(PDF, DOC, XLS\\)
• Архивы \\(ZIP, RAR\\)
• Аудио \\(MP3, WAV\\)

💡 *Конвертируйте изображение в PNG и попробуйте снова\\!*
    `);
  }
});

// Обработчик текста
bot.on('text', (ctx) => {
  if (!ctx.message.text.startsWith('/')) {
    ctx.replyWithMarkdownV2(`
🏪 *MyStickerMarketBot25*

Я создаю стикеры из изображений\\!

📤 *Отправьте мне:*
• Фотографию из галереи
• Файл изображения \\(PNG, JPEG, WebP\\)
• Любое визуальное изображение

✨ *Особенности:*
✅ Быстрая обработка
✅ Качество 512×512px
✅ Поддержка всех форматов
✅ Бесплатно

🔧 *Полезные команды:*
/help \\- полное руководство
/formats \\- поддерживаемые форматы
/stats \\- статистика бота
/support \\- техподдержка

🚀 *Попробуйте прямо сейчас \\- отправьте изображение\\!*
    `);
  }
});

// Обработчик ошибок
bot.catch((err, ctx) => {
  console.error('🔥 Ошибка бота:', err);
  if (ctx.chat) {
    ctx.reply('⚠️ Произошла внутренняя ошибка. Попробуйте еще раз или используйте /support.').catch(() => {});
  }
});

// ========== НАСТРОЙКА VERCEL ==========
if (NODE_ENV === 'production' || VERCEL_URL) {
  app.use(express.json());
  
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'MyStickerMarketBot25',
      version: '2025.1.0',
      bot: `@${BOT_USERNAME}`,
      node: process.version,
      platform: process.platform,
      memory: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`,
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      env: NODE_ENV
    });
  });
  
  // Webhook endpoint
  app.post('/api/webhook', async (req, res) => {
    try {
      console.log(`📨 Webhook получен: update_id=${req.body.update_id}`);
      await bot.handleUpdate(req.body);
      res.status(200).json({ 
        status: 'ok', 
        bot: BOT_USERNAME,
        timestamp: Date.now() 
      });
    } catch (error) {
      console.error('❌ Webhook error:', error);
      res.status(500).json({ 
        status: 'error', 
        error: error.message,
        bot: BOT_USERNAME 
      });
    }
  });
  
  // Главная страница
  app.get('/', (req, res) => {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    
    res.send(`
      <!DOCTYPE html>
      <html lang="ru">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>🏪 MyStickerMarketBot25</title>
          <style>
              :root {
                  --primary: #6366f1;
                  --secondary: #8b5cf6;
                  --accent: #10b981;
              }
              
              body {
                  font-family: 'Segoe UI', system-ui, sans-serif;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  min-height: 100vh;
                  color: white;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  padding: 20px;
                  margin: 0;
              }
              
              .container {
                  max-width: 800px;
                  background: rgba(255, 255, 255, 0.1);
                  backdrop-filter: blur(20px);
                  padding: 40px;
                  border-radius: 24px;
                  border: 1px solid rgba(255, 255, 255, 0.2);
                  text-align: center;
              }
              
              h1 {
                  font-size: 3em;
                  margin-bottom: 20px;
                  background: linear-gradient(45deg, var(--accent), var(--secondary));
                  -webkit-background-clip: text;
                  -webkit-text-fill-color: transparent;
                  background-clip: text;
              }
              
              .status {
                  background: rgba(16, 185, 129, 0.2);
                  padding: 12px;
                  border-radius: 12px;
                  margin: 24px 0;
                  border: 2px solid var(--accent);
              }
              
              .stats {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                  gap: 16px;
                  margin: 32px 0;
              }
              
              .stat {
                  background: rgba(255, 255, 255, 0.05);
                  padding: 16px;
                  border-radius: 12px;
              }
              
              .telegram-link {
                  display: inline-block;
                  background: var(--primary);
                  color: white;
                  padding: 16px 32px;
                  border-radius: 28px;
                  text-decoration: none;
                  font-weight: bold;
                  font-size: 1.1em;
                  margin-top: 24px;
                  transition: all 0.3s ease;
              }
              
              .telegram-link:hover {
                  background: var(--secondary);
                  transform: scale(1.05);
              }
              
              .footer {
                  margin-top: 32px;
                  opacity: 0.8;
                  font-size: 0.9em;
              }
              
              @media (max-width: 768px) {
                  .container {
                      padding: 24px;
                  }
                  
                  h1 {
                      font-size: 2em;
                  }
                  
                  .stats {
                      grid-template-columns: 1fr;
                  }
              }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>🏪 MyStickerMarketBot25</h1>
              <p>Telegram бот для создания стикеров из изображений</p>
              
              <div class="status">
                  ✅ Бот активен и готов к работе
              </div>
              
              <div class="stats">
                  <div class="stat">
                      <strong>🤖 Бот</strong>
                      <p>@${BOT_USERNAME}</p>
                  </div>
                  <div class="stat">
                      <strong>🔧 Node.js</strong>
                      <p>${process.version}</p>
                  </div>
                  <div class="stat">
                      <strong>⏱️ Аптайм</strong>
                      <p>${hours}ч ${minutes}м</p>
                  </div>
                  <div class="stat">
                      <strong>📅 Запущен</strong>
                      <p>${new Date().toLocaleString('ru-RU')}</p>
                  </div>
              </div>
              
              <p>Просто отправьте боту любое изображение, и он создаст из него стикер!</p>
              
              <a href="https://t.me/${BOT_USERNAME}" class="telegram-link" target="_blank">
                  🚀 Открыть в Telegram
              </a>
              
              <div class="footer">
                  <p>© 2025 MyStickerMarketBot25 | Node.js 20 | Vercel</p>
                  <p>Версия 2025.1.0 | Режим: ${NODE_ENV}</p>
              </div>
          </div>
          
          <script>
              async function updateStats() {
                  try {
                      const response = await fetch('/api/health');
                      if (response.ok) {
                          const data = await response.json();
                          const hours = Math.floor(data.uptime / 3600);
                          const minutes = Math.floor((data.uptime % 3600) / 60);
                          document.querySelector('.stat:nth-child(3) p').textContent = 
                              hours + 'ч ' + minutes + 'м';
                      }
                  } catch (error) {
                      console.log('Статистика обновлена');
                  }
              }
              
              setInterval(updateStats, 30000);
          </script>
      </body>
      </html>
    `);
  });
  
  // Установка вебхука
  if (WEBHOOK_URL) {
    console.log(`🔗 Устанавливаю Webhook: ${WEBHOOK_URL}`);
    
    bot.telegram.setWebhook(WEBHOOK_URL, {
      drop_pending_updates: true,
      allowed_updates: ['message', 'callback_query']
    })
    .then(() => {
      console.log('✅ Webhook успешно установлен!');
      console.log(`🌐 Бот: https://t.me/${BOT_USERNAME}`);
      console.log(`📊 Health Check: ${VERCEL_URL ? 'https://' + VERCEL_URL + '/api/health' : 'N/A'}`);
    })
    .catch(err => {
      console.error('❌ Ошибка установки webhook:', err);
    });
  }
  
  // Запуск сервера
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📡 Режим: ${NODE_ENV}`);
    console.log(`🤖 Username: @${BOT_USERNAME}`);
  });
  
} else {
  // Локальная разработка
  console.log('🔧 Локальная разработка (Long Polling)...');
  
  if (!BOT_TOKEN) {
    console.error('❌ Создайте файл .env с BOT_TOKEN=ваш_токен');
    process.exit(1);
  }
  
  bot.launch({
    dropPendingUpdates: true,
    allowedUpdates: ['message', 'callback_query']
  })
  .then(() => {
    console.log(`🤖 Бот запущен: @${bot.botInfo.username}`);
    console.log('📝 Для выхода: Ctrl+C');
  })
  .catch(err => {
    console.error('❌ Ошибка запуска:', err);
    process.exit(1);
  });
  
  // Graceful shutdown
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
  process.once('SIGQUIT', () => bot.stop('SIGQUIT'));
}

module.exports = app;
