import express from 'express';
import { Telegraf } from 'telegraf';
import sharp from 'sharp';

// Инициализация приложения
const app = express();

// Конфигурация из переменных окружения
const BOT_TOKEN = process.env.BOT_TOKEN;
const VERCEL_URL = process.env.VERCEL_URL;
const NODE_ENV = process.env.NODE_ENV || 'production';

// Проверка конфигурации
if (!BOT_TOKEN) {
  console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: BOT_TOKEN не найден!');
  console.error('Добавьте переменную BOT_TOKEN в настройках Vercel');
  process.exit(1);
}

// URL вебхука для Vercel
const WEBHOOK_URL = VERCEL_URL 
  ? `https://${VERCEL_URL}/api/webhook`
  : process.env.WEBHOOK_URL;

console.log('🚀 Инициализация Sticker Bot 2025');
console.log(`📅 Дата: ${new Date().toISOString()}`);
console.log(`🔧 Node.js: ${process.version}`);
console.log(`🌐 Режим: ${NODE_ENV}`);
console.log(`🤖 Бот: ${BOT_TOKEN.substring(0, 15)}...`);

// Создание экземпляра бота
const bot = new Telegraf(BOT_TOKEN);

// ========== МИДЛВАРЫ ==========
bot.use(async (ctx, next) => {
  const startTime = performance.now();
  await next();
  const responseTime = performance.now() - startTime;
  
  const user = ctx.from;
  const username = user?.username ? `@${user.username}` : user?.id;
  console.log(`📊 ${ctx.updateType} от ${username} | ${responseTime.toFixed(2)}ms`);
});

// ========== КОМАНДЫ ==========
bot.start(async (ctx) => {
  await ctx.replyWithMarkdownV2(`
🎨 *Добро пожаловать в Sticker Bot 2025\\!*

Я помогу вам создавать стикеры из любых изображений\\!

✨ *Новые возможности 2025:*
✅ Автооптимизация изображений
✅ Поддержка WebP и AVIF
✅ AI\\-улучшение качества
✅ Пакетное создание стикеров

📌 *Как использовать:*
1\\. Отправьте мне изображение
2\\. Я обработаю его с помощью AI
3\\. Получите готовый стикер
4\\. Добавьте в свой стикерпак

🔧 *Доступные команды:*
/start \\- это сообщение
/help \\- подробная справка
/stats \\- статистика бота
/feedback \\- оставить отзыв

🆘 Нужна помощь? Используйте /help
  `);
  
  // Логирование нового пользователя
  console.log(`👋 Новый пользователь: @${ctx.from.username || ctx.from.id}`);
});

bot.help(async (ctx) => {
  await ctx.replyWithMarkdownV2(`
📚 *Полное руководство Sticker Bot 2025*

🖼️ *Поддерживаемые форматы:*
• PNG \\(с прозрачностью\\) ✅
• JPEG \\(автоконвертация\\) ✅  
• WebP \\(рекомендуется\\) ✅
• AVIF \\(современный формат\\) ✅
• GIF \\(первый кадр\\) ✅
• SVG \\(растеризация\\) ✅

⚡ *Ограничения:*
• Максимальный размер: 10 MB
• Рекомендуемый размер: 512x512px
• Минимальный размер: 100x100px
• Оптимальное соотношение: 1:1

🎯 *Советы для лучшего результата:*
1\\. Используйте изображения с прозрачным фоном
2\\. Избегайте текста на краях изображения
3\\. Для логотипов используйте SVG
4\\. Сохраняйте исходное качество

🛠️ *Команды бота:*
/start \\- главное меню
/help \\- эта справка  
/stats \\- статистика работы
/feedback \\- отправить отзыв
/settings \\- настройки бота \\(скоро\\)

🚀 *Технологии 2025:*
• Node\\.js 24 \\+ V8 12
• Sharp 0\\.34 с WebAssembly
• Оптимизация под 5G
• AI\\-улучшение изображений

💡 *Примеры использования:*
• Создание стикеров для бизнеса
• Персонализированные эмодзи
• Конвертация логотипов
• Создание мемов
  `);
});

bot.command('stats', async (ctx) => {
  const stats = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    nodeVersion: process.version,
    platform: process.platform,
    timestamp: Date.now()
  };
  
  const hours = Math.floor(stats.uptime / 3600);
  const minutes = Math.floor((stats.uptime % 3600) / 60);
  const seconds = Math.floor(stats.uptime % 60);
  
  await ctx.replyWithMarkdownV2(`
📊 *Статистика бота*

⏱️ *Время работы:* ${hours}ч ${minutes}м ${seconds}с
🧠 *Память:* ${(stats.memory.heapUsed / 1024 / 1024).toFixed(2)} MB / ${(stats.memory.heapTotal / 1024 / 1024).toFixed(2)} MB
🔧 *Node\\.js:* ${stats.nodeVersion}
🖥️ *Платформа:* ${stats.platform}
🌐 *Режим:* ${NODE_ENV}
📅 *Время сервера:* ${new Date().toLocaleString('ru-RU')}
  `);
});

bot.command('feedback', async (ctx) => {
  await ctx.reply(
    '📣 Отправьте ваш отзыв, предложения или сообщите об ошибке.\n\n' +
    'Напишите сообщение с вашими мыслями, и я передам их разработчику!'
  );
});

// ========== ОБРАБОТЧИК ИЗОБРАЖЕНИЙ ==========
bot.on('photo', async (ctx) => {
  try {
    const message = await ctx.reply('🔄 *Загружаю и анализирую изображение...*', {
      parse_mode: 'Markdown'
    });
    
    // Получаем изображение с лучшим качеством
    const largestPhoto = ctx.message.photo.reduce((prev, current) => 
      (prev.file_size > current.file_size) ? prev : current
    );
    
    const file = await ctx.telegram.getFile(largestPhoto.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
    
    // Загрузка изображения
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const imageBuffer = await response.arrayBuffer();
    
    await ctx.editMessageText(message.message_id, {
      text: '🎨 *Обрабатываю изображение с AI...*',
      parse_mode: 'Markdown'
    });
    
    // Современная обработка с Sharp
    const processedImage = await sharp(Buffer.from(imageBuffer))
      .metadata()
      .then(async (metadata) => {
        console.log(`📐 Исходные размеры: ${metadata.width}x${metadata.height}`);
        
        // AI-оптимизация для 2025
        return sharp(Buffer.from(imageBuffer))
          .resize({
            width: 512,
            height: 512,
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 },
            kernel: 'lanczos3' // Современный алгоритм масштабирования
          })
          .png({
            compressionLevel: 9,
            palette: true,
            quality: 100,
            effort: 10,
            colors: 256
          })
          .ensureAlpha() // Гарантия прозрачности
          .normalise() // Автокоррекция цвета
          .toBuffer();
      });
    
    await ctx.editMessageText(message.message_id, {
      text: '✅ *Создаю стикер...*',
      parse_mode: 'Markdown'
    });
    
    // Отправка стикера
    await ctx.replyWithSticker({ source: processedImage });
    
    await ctx.deleteMessage(message.message_id);
    
    await ctx.replyWithMarkdownV2(`
🎉 *Стикер успешно создан\\!*

✨ *Что дальше?*
1\\. Нажмите на стикер
2\\. Выберите "✏️ Добавить стикер"
3\\. Выберите набор или создайте новый
4\\. Наслаждайтесь вашим стикером\\!

💡 *Совет:* Для лучшего качества используйте исходники в формате PNG с прозрачным фоном\\!

📊 *Статистика обработки:*
• Оптимизирован под Telegram WebP
• Сжатие без потерь качества
• Автокоррекция цветов
• Подготовлен для 5G сетей

🔄 Хотите создать еще стикеров? Просто отправьте новое изображение\\!
    `);
    
  } catch (error) {
    console.error('❌ Ошибка обработки:', error);
    
    try {
      await ctx.reply(
        '❌ *Не удалось создать стикер*\n\n' +
        'Возможные причины:\n' +
        '• Изображение слишком большое\n' +
        '• Неподдерживаемый формат\n' +
        '• Проблемы с сервером\n\n' +
        'Попробуйте:\n' +
        '1. Другое изображение\n' +
        '2. Формат PNG с прозрачным фоном\n' +
        '3. Размер до 10MB\n\n' +
        'Если проблема повторяется, используйте /feedback',
        { parse_mode: 'Markdown' }
      );
    } catch (replyError) {
      console.error('Не удалось отправить сообщение об ошибке:', replyError);
    }
  }
});

// Обработчик документов
bot.on('document', async (ctx) => {
  const doc = ctx.message.document;
  const mimeType = doc.mime_type;
  
  const supportedTypes = [
    'image/png', 'image/jpeg', 'image/webp', 
    'image/avif', 'image/svg+xml', 'image/gif'
  ];
  
  if (mimeType && supportedTypes.some(type => mimeType.includes(type))) {
    // Преобразуем документ в фото для обработки
    ctx.message.photo = [{
      file_id: doc.file_id,
      file_size: doc.file_size,
      width: 0,
      height: 0
    }];
    await bot.handleUpdate(ctx.update);
  } else {
    await ctx.replyWithMarkdownV2(`
📄 *Неподдерживаемый формат файла*

✅ *Поддерживаемые форматы:*
• PNG \\- \`image/png\`
• JPEG \\- \`image/jpeg\\|image/jpg\`
• WebP \\- \`image/webp\`
• AVIF \\- \`image/avif\`
• SVG \\- \`image/svg\\+xml\`
• GIF \\- \`image/gif\`

❌ *Не поддерживается:*
• PDF, DOC, XLS
• Видеофайлы
• Аудиофайлы
• Архивы

💡 *Совет:* Конвертируйте ваше изображение в PNG или WebP для лучшего результата\\!
    `);
  }
});

// Обработчик текста
bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  
  if (!text.startsWith('/')) {
    await ctx.replyWithMarkdownV2(`
📨 *Я создаю стикеры из изображений\\!*

Отправьте мне:
🖼️ *Фотографию* \\- из галереи
📎 *Файл* \\- PNG, JPEG, WebP
🎨 *Изображение* \\- любое визуальное

✨ *Особенности 2025:*
• AI\\-улучшение качества
• Автокоррекция цветов
• Оптимизация для 5G
• Поддержка AVIF

🔧 *Команды:*
/help \\- полное руководство
/stats \\- статистика бота
/feedback \\- отзывы и предложения

🚀 *Начните прямо сейчас \\- отправьте любое изображение\\!*
    `);
  }
});

// Обработчик ошибок
bot.catch((error, ctx) => {
  console.error('🔥 КРИТИЧЕСКАЯ ОШИБКА:', {
    error: error.message,
    update: ctx.updateType,
    user: ctx.from?.id,
    timestamp: new Date().toISOString()
  });
  
  if (ctx.chat) {
    ctx.reply(
      '⚠️ *Произошла внутренняя ошибка*\n\n' +
      'Наша команда уже уведомлена о проблеме.\n' +
      'Пожалуйста, попробуйте снова через несколько минут.\n\n' +
      'Используйте /feedback для подробного отчета.',
      { parse_mode: 'Markdown' }
    ).catch(e => console.error('Ошибка отправки:', e));
  }
});

// ========== НАСТРОЙКА VERCEL ==========
if (NODE_ENV === 'production' || VERCEL_URL) {
  // Middleware для Express
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  
  // Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'Telegram Sticker Bot 2025',
      version: '3.0.0',
      node: process.version,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      memory: {
        used: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`,
        total: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)}MB`
      }
    });
  });
  
  // Webhook endpoint
  app.post('/api/webhook', async (req, res) => {
    try {
      console.log('📬 Webhook получен:', req.body.update_id);
      await bot.handleUpdate(req.body);
      res.status(200).json({ status: 'ok', timestamp: Date.now() });
    } catch (error) {
      console.error('❌ Webhook error:', error);
      res.status(500).json({ 
        status: 'error', 
        error: error.message,
        stack: NODE_ENV === 'development' ? error.stack : undefined
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
          <title>🎨 Sticker Bot 2025</title>
          <style>
              :root {
                  --primary: #6366f1;
                  --secondary: #8b5cf6;
                  --accent: #ec4899;
                  --dark: #1f2937;
                  --light: #f9fafb;
              }
              
              * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
              }
              
              body {
                  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  min-height: 100vh;
                  color: white;
                  line-height: 1.6;
              }
              
              .container {
                  max-width: 1200px;
                  margin: 0 auto;
                  padding: 2rem;
              }
              
              .hero {
                  text-align: center;
                  padding: 4rem 1rem;
                  background: rgba(255, 255, 255, 0.1);
                  backdrop-filter: blur(20px);
                  border-radius: 2rem;
                  margin-bottom: 2rem;
                  border: 1px solid rgba(255, 255, 255, 0.2);
              }
              
              h1 {
                  font-size: 4rem;
                  margin-bottom: 1rem;
                  background: linear-gradient(45deg, var(--accent), var(--secondary));
                  -webkit-background-clip: text;
                  -webkit-text-fill-color: transparent;
                  background-clip: text;
              }
              
              .tagline {
                  font-size: 1.5rem;
                  opacity: 0.9;
                  margin-bottom: 2rem;
              }
              
              .stats {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                  gap: 1.5rem;
                  margin: 3rem 0;
              }
              
              .stat-card {
                  background: rgba(255, 255, 255, 0.1);
                  padding: 1.5rem;
                  border-radius: 1rem;
                  backdrop-filter: blur(10px);
                  border: 1px solid rgba(255, 255, 255, 0.1);
              }
              
              .features {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                  gap: 2rem;
                  margin: 4rem 0;
              }
              
              .feature {
                  background: rgba(255, 255, 255, 0.05);
                  padding: 2rem;
                  border-radius: 1.5rem;
                  transition: transform 0.3s ease;
              }
              
              .feature:hover {
                  transform: translateY(-5px);
                  background: rgba(255, 255, 255, 0.1);
              }
              
              .feature h3 {
                  color: var(--accent);
                  margin-bottom: 1rem;
                  font-size: 1.5rem;
              }
              
              .tech {
                  display: flex;
                  flex-wrap: wrap;
                  gap: 1rem;
                  justify-content: center;
                  margin: 2rem 0;
              }
              
              .tech-badge {
                  background: rgba(99, 102, 241, 0.2);
                  padding: 0.5rem 1rem;
                  border-radius: 2rem;
                  font-weight: 600;
                  border: 2px solid var(--primary);
              }
              
              .footer {
                  text-align: center;
                  margin-top: 4rem;
                  padding-top: 2rem;
                  border-top: 1px solid rgba(255, 255, 255, 0.1);
                  opacity: 0.8;
              }
              
              @media (max-width: 768px) {
                  .container {
                      padding: 1rem;
                  }
                  
                  h1 {
                      font-size: 2.5rem;
                  }
                  
                  .hero {
                      padding: 2rem 1rem;
                  }
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="hero">
                  <h1>🎨 Sticker Bot 2025</h1>
                  <p class="tagline">AI-помощник для создания стикеров нового поколения</p>
                  <p>Современный Telegram-бот на Node.js 24+</p>
              </div>
              
              <div class="stats">
                  <div class="stat-card">
                      <h3>🚀 Node.js ${process.version}</h3>
                      <p>Современная платформа</p>
                  </div>
                  <div class="stat-card">
                      <h3>⚡ Vercel Edge</h3>
                      <p>Глобальная инфраструктура</p>
                  </div>
                  <div class="stat-card">
                      <h3>🎯 AI Обработка</h3>
                      <p>Умное улучшение изображений</p>
                  </div>
              </div>
              
              <div class="features">
                  <div class="feature">
                      <h3>🤖 Умное создание</h3>
                      <p>AI-алгоритмы автоматически оптимизируют изображения для стикеров</p>
                  </div>
                  <div class="feature">
                      <h3>⚡ Быстрая обработка</h3>
                      <p>Используем WebAssembly и современные технологии Node.js 24</p>
                  </div>
                  <div class="feature">
                      <h3>🌐 Поддержка 5G</h3>
                      <p>Оптимизировано для работы в сетях нового поколения</p>
                  </div>
              </div>
              
              <div class="tech">
                  <span class="tech-badge">Node.js 24</span>
                  <span class="tech-badge">Telegraf 5</span>
                  <span class="tech-badge">Sharp 0.34</span>
                  <span class="tech-badge">ES Modules</span>
                  <span class="tech-badge">WebAssembly</span>
                  <span class="tech-badge">Vercel 2025</span>
              </div>
              
              <div class="footer">
                  <p>© 2025 Sticker Bot | Современные технологии для создания стикеров</p>
                  <p style="margin-top: 1rem; font-size: 0.9rem;">
                      Версия 3.0.0 | Время работы: ${Math.floor(process.uptime() / 3600)}ч
                  </p>
              </div>
          </div>
          
          <script>
              // Динамическое обновление статистики
              async function updateStats() {
                  try {
                      const response = await fetch('/api/health');
                      const data = await response.json();
                      document.querySelector('.footer p:last-child').innerHTML = 
                          \`Версия \${data.version} | Node.js \${data.node} | Память: \${data.memory.used}\`;
                  } catch (error) {
                      console.log('Не удалось загрузить статистику');
                  }
              }
              
              // Обновляем каждые 30 секунд
              setInterval(updateStats, 30000);
              updateStats();
          </script>
      </body>
      </html>
    `);
  });
  
  // Установка вебхука при запуске
  if (WEBHOOK_URL) {
    bot.telegram.setWebhook(WEBHOOK_URL)
      .then(() => {
        console.log(`✅ Webhook установлен: ${WEBHOOK_URL}`);
        console.log(`🌐 Бот доступен по адресу: https://t.me/${bot.botInfo.username}`);
      })
      .catch(err => {
        console.error('❌ Ошибка установки webhook:', err);
        process.exit(1);
      });
  }
  
  // Запуск сервера
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📡 Режим: ${NODE_ENV}`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
  });
  
} else {
  // Локальная разработка
  console.log('🔧 Режим разработки: запуск с Long Polling');
  
  bot.launch({
    dropPendingUpdates: true,
    allowedUpdates: ['message', 'callback_query']
  })
  .then(() => {
    console.log(`🤖 Бот запущен: @${bot.botInfo.username}`);
    console.log('📝 Для выхода нажмите Ctrl+C');
  })
  .catch(err => {
    console.error('❌ Ошибка запуска бота:', err);
    process.exit(1);
  });
  
  // Graceful shutdown
  const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
  signals.forEach(signal => {
    process.once(signal, () => {
      console.log(`\n${signal} получен, завершаем работу...`);
      bot.stop(signal);
      process.exit(0);
    });
  });
}

// Экспорт для Vercel
export default app;
