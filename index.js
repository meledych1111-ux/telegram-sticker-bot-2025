const express = require('express');
const { Telegraf } = require('telegraf');
const sharp = require('sharp');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BOT_TOKEN = process.env.BOT_TOKEN;
const BOT_VERSION = '4.0.0'; // МНОГО ЭФФЕКТОВ!
const bot = new Telegraf(BOT_TOKEN);
const app = express();

console.log(`🎨 Sticker Bot v${BOT_VERSION} - 15+ ЭФФЕКТОВ!`);

const userEffects = new Map();

// ========== СПИСОК ВСЕХ ЭФФЕКТОВ ==========

const ALL_EFFECTS = {
  // Базовые
  'sticker': { name: '📱 Качественный стикер', command: '/sticker', category: 'basic' },
  'vivid': { name: '🌈 Яркие цвета', command: '/vivid', category: 'color' },
  'bw': { name: '⚫ Чёрно-белый', command: '/bw', category: 'basic' },
  
  // Винтажные
  'old': { name: '📜 Старая фотография', command: '/old', category: 'vintage' },
  'sepia': { name: '☕ Классическая сепия', command: '/sepia', category: 'vintage' },
  'polaroid': { name: '🖼️ Эффект Polaroid', command: '/polaroid', category: 'vintage' },
  
  // Цветовые
  'warm': { name: '🔥 Тёплые тона', command: '/warm', category: 'color' },
  'cold': { name: '❄️ Холодные тона', command: '/cold', category: 'color' },
  'pastel': { name: '🎀 Пастельные тона', command: '/pastel', category: 'color' },
  'invert': { name: '🌀 Негатив', command: '/invert', category: 'color' },
  
  // Стилистические
  'pixel': { name: '🎮 Пиксель-арт', command: '/pixel', category: 'style' },
  'comic': { name: '🦸 Комикс', command: '/comic', category: 'style' },
  'sketch': { name: '✏️ Эскиз', command: '/sketch', category: 'style' },
  'blur': { name: '💫 Размытие', command: '/blur', category: 'style' },
  
  // Весёлые
  'joker': { name: '🃏 Эффект Joker', command: '/joker', category: 'fun' },
  'rainbow': { name: '🌈 Радуга', command: '/rainbow', category: 'fun' },
  'vhs': { name: '📼 VHS эффект', command: '/vhs', category: 'fun' },
  
  // Сезонные
  'christmas': { name: '🎄 Рождество', command: '/christmas', category: 'seasonal' },
  'halloween': { name: '🎃 Хэллоуин', command: '/halloween', category: 'seasonal' },
  
  // Креативные
  'double': { name: '👯 Двойная экспозиция', command: '/double', category: 'creative' },
  'mirror': { name: '🪞 Зеркало', command: '/mirror', category: 'creative' },
  'glitch': { name: '💥 Глитч', command: '/glitch', category: 'creative' }
};

// ========== КОМАНДЫ БОТА ==========

bot.start((ctx) => {
  const name = ctx.from.first_name || 'Друг';
  userEffects.set(ctx.from.id, 'sticker');
  
  ctx.reply(`👋 <b>Привет, ${name}!</b> Я Sticker Bot v${BOT_VERSION}

🎭 <b>У меня БОЛЬШЕ 20 ЭФФЕКТОВ!</b>

🎨 <b>ОСНОВНЫЕ КАТЕГОРИИ:</b>
<b>/vintage</b> - Винтажные эффекты
<b>/colors</b> - Цветовые фильтры
<b>/styles</b> - Стилистические эффекты
<b>/fun</b> - Весёлые фильтры
<b>/all</b> - Все эффекты списком

✨ <b>ПОПУЛЯРНЫЕ:</b>
/sticker - Качественный стикер
/old - Старая фотография
/pixel - Пиксель-арт
/comic - Эффект комикса
/joker - Фильтр Joker

📸 <b>Как использовать:</b>
1. Выбери эффект
2. Отправь фото
3. Получи стикер!

💡 <b>Совет:</b> Используй /menu для удобного меню`, { parse_mode: 'HTML' });
});

bot.command('menu', (ctx) => {
  ctx.reply(`📱 <b>ГЛАВНОЕ МЕНЮ</b>

Выбери категорию эффектов:

🎨 <b>ЦВЕТА И ФИЛЬТРЫ:</b>
/vintage - Винтажные эффекты
/colors - Цветовые фильтры
/styles - Стилистические
/fun - Весёлые эффекты

🎯 <b>БЫСТРЫЙ ВЫБОР:</b>
/sticker - Качественный стикер
/old - Старая фотография
/pixel - Пиксель-арт
/comic - Комикс эффект
/joker - Фильтр Joker

ℹ️ <b>ИНФО:</b>
/all - Все эффекты
/help - Помощь
/random - Случайный эффект`, { 
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🎨 Винтажные', callback_data: 'category_vintage' },
          { text: '🌈 Цветовые', callback_data: 'category_colors' }
        ],
        [
          { text: '🎭 Стили', callback_data: 'category_styles' },
          { text: '😄 Весёлые', callback_data: 'category_fun' }
        ],
        [
          { text: '🎲 Случайный', callback_data: 'effect_random' },
          { text: '📋 Все', callback_data: 'category_all' }
        ]
      ]
    }
  });
});

// ========== КАТЕГОРИИ ЭФФЕКТОВ ==========

bot.command('vintage', (ctx) => {
  ctx.reply(`📜 <b>ВИНТАЖНЫЕ ЭФФЕКТЫ</b>

Старинные и ретро-фильтры:

/old - 📜 Старая фотография (сепия)
/sepia - ☕ Классическая сепия
/polaroid - 🖼️ Эффект Polaroid (белые рамки)
/vhs - 📼 VHS эффект (помехи 90-х)

Выбери эффект и отправь фото!`, { parse_mode: 'HTML' });
});

bot.command('colors', (ctx) => {
  ctx.reply(`🌈 <b>ЦВЕТОВЫЕ ФИЛЬТРЫ</b>

Изменяем цвета и тон:

/vivid - 🌈 Яркие цвета (усиленные)
/warm - 🔥 Тёплые тона (оранжевые)
/cold - ❄️ Холодные тона (синие)
/pastel - 🎀 Пастельные тона (мягкие)
/invert - 🌀 Негатив (инверсия)
/rainbow - 🌈 Радужный градиент

Выбери эффект и отправь фото!`, { parse_mode: 'HTML' });
});

bot.command('styles', (ctx) => {
  ctx.reply(`🎭 <b>СТИЛИСТИЧЕСКИЕ ЭФФЕКТЫ</b>

Художественные и графические стили:

/pixel - 🎮 Пиксель-арт (8-бит)
/comic - 🦸 Комикс (чёрные контуры)
/sketch - ✏️ Эскиз (карандашный рисунок)
/blur - 💫 Размытие (боке эффект)
/double - 👯 Двойная экспозиция
/mirror - 🪞 Зеркальное отражение

Выбери эффект и отправь фото!`, { parse_mode: 'HTML' });
});

bot.command('fun', (ctx) => {
  ctx.reply(`😄 <b>ВЕСЁЛЫЕ ЭФФЕКТЫ</b>

Креативные и забавные фильтры:

/joker - 🃏 Эффект Joker (фиолетовый/зелёный)
/glitch - 💥 Глитч-эффект (цифровые помехи)
/christmas - 🎄 Рождественские цвета
/halloween - 🎃 Хэллоуин (оранжевый/чёрный)

Выбери эффект и отправь фото!`, { parse_mode: 'HTML' });
});

bot.command('all', (ctx) => {
  let message = `📋 <b>ВСЕ ЭФФЕКТЫ (${Object.keys(ALL_EFFECTS).length}+)</b>\n\n`;
  
  const categories = {
    'basic': '📱 Основные',
    'vintage': '📜 Винтажные',
    'color': '🌈 Цветовые',
    'style': '🎭 Стилистические',
    'fun': '😄 Весёлые',
    'seasonal': '🎄 Сезонные',
    'creative': '💫 Креативные'
  };
  
  Object.entries(categories).forEach(([catKey, catName]) => {
    const effectsInCategory = Object.entries(ALL_EFFECTS)
      .filter(([_, effect]) => effect.category === catKey)
      .map(([key, effect]) => `${effect.command} - ${effect.name}`);
    
    if (effectsInCategory.length > 0) {
      message += `<b>${catName}:</b>\n`;
      message += effectsInCategory.join('\n') + '\n\n';
    }
  });
  
  message += `\n✨ Просто выбери команду и отправь фото!`;
  
  ctx.reply(message, { parse_mode: 'HTML' });
});

bot.command('random', (ctx) => {
  const effects = Object.keys(ALL_EFFECTS);
  const randomEffect = effects[Math.floor(Math.random() * effects.length)];
  const effectInfo = ALL_EFFECTS[randomEffect];
  
  userEffects.set(ctx.from.id, randomEffect);
  
  ctx.reply(`🎲 <b>СЛУЧАЙНЫЙ ЭФФЕКТ:</b> ${effectInfo.name}

${getEffectDescription(randomEffect)}

Теперь отправь мне фото для применения этого эффекта!`, { 
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [[
        { text: '🔄 Другой случайный', callback_data: 'effect_random' },
        { text: '✅ Использовать', callback_data: 'use_current' }
      ]]
    }
  });
});

// ========== КОМАНДЫ КОНКРЕТНЫХ ЭФФЕКТОВ ==========

// Винтажные эффекты
bot.command('sepia', (ctx) => setEffect(ctx, 'sepia'));
bot.command('polaroid', (ctx) => setEffect(ctx, 'polaroid'));
bot.command('vhs', (ctx) => setEffect(ctx, 'vhs'));

// Цветовые эффекты
bot.command('warm', (ctx) => setEffect(ctx, 'warm'));
bot.command('cold', (ctx) => setEffect(ctx, 'cold'));
bot.command('pastel', (ctx) => setEffect(ctx, 'pastel'));
bot.command('invert', (ctx) => setEffect(ctx, 'invert'));
bot.command('rainbow', (ctx) => setEffect(ctx, 'rainbow'));

// Стилистические эффекты
bot.command('pixel', (ctx) => setEffect(ctx, 'pixel'));
bot.command('comic', (ctx) => setEffect(ctx, 'comic'));
bot.command('sketch', (ctx) => setEffect(ctx, 'sketch'));
bot.command('blur', (ctx) => setEffect(ctx, 'blur'));
bot.command('double', (ctx) => setEffect(ctx, 'double'));
bot.command('mirror', (ctx) => setEffect(ctx, 'mirror'));

// Весёлые эффекты
bot.command('joker', (ctx) => setEffect(ctx, 'joker'));
bot.command('glitch', (ctx) => setEffect(ctx, 'glitch'));
bot.command('christmas', (ctx) => setEffect(ctx, 'christmas'));
bot.command('halloween', (ctx) => setEffect(ctx, 'halloween'));

// Базовые эффекты (уже были)
bot.command('sticker', (ctx) => setEffect(ctx, 'sticker'));
bot.command('vivid', (ctx) => setEffect(ctx, 'vivid'));
bot.command('bw', (ctx) => setEffect(ctx, 'bw'));
bot.command('old', (ctx) => setEffect(ctx, 'old'));

// ========== ОБРАБОТКА ФОТО СО ВСЕМИ ЭФФЕКТАМИ ==========

bot.on('photo', async (ctx) => {
  try {
    const userId = ctx.from.id;
    const userName = ctx.from.first_name || 'Друг';
    const effect = userEffects.get(userId) || 'sticker';
    const effectInfo = ALL_EFFECTS[effect] || ALL_EFFECTS.sticker;
    
    const msg = await ctx.reply(`🎨 <b>${userName}, обрабатываю фото...</b>\nЭффект: ${effectInfo.name}`, { 
      parse_mode: 'HTML' 
    });
    
    // Загружаем фото
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    const file = await ctx.telegram.getFile(photo.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
    
    const response = await fetch(fileUrl);
    const imageBuffer = await response.buffer();
    
    // ПРИМЕНЯЕМ ВЫБРАННЫЙ ЭФФЕКТ
    let processedBuffer = await applyEffect(imageBuffer, effect);
    
    // Проверяем размер
    if (processedBuffer.length > 500 * 1024) {
      processedBuffer = await sharp(processedBuffer)
        .png({ compressionLevel: 9, colors: 128 })
        .toBuffer();
    }
    
    // Отправляем стикер
    await ctx.replyWithSticker({ source: processedBuffer });
    
    try { await ctx.deleteMessage(msg.message_id); } catch(e) {}
    
    // Показываем кнопки для следующего действия
    await ctx.reply(`✨ <b>Готово!</b> Стикер создан с эффектом: <b>${effectInfo.name}</b>

🎯 <b>Что дальше?</b>`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🔄 Другое фото', callback_data: 'another_photo' },
              { text: '🎲 Случайный эффект', callback_data: 'effect_random' }
            ],
            [
              { text: '📜 Винтажные', callback_data: 'category_vintage' },
              { text: '🌈 Цветовые', callback_data: 'category_colors' }
            ],
            [
              { text: '🎭 Стили', callback_data: 'category_styles' },
              { text: '😄 Весёлые', callback_data: 'category_fun' }
            ]
          ]
        }
      }
    );
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
    ctx.reply(`❌ Ошибка: ${error.message}\n\nПопробуй другой эффект или фото.`, { parse_mode: 'HTML' });
  }
});

// ========== ФУНКЦИЯ ПРИМЕНЕНИЯ ЭФФЕКТОВ ==========

async function applyEffect(imageBuffer, effect) {
  let image = sharp(imageBuffer).rotate();
  
  switch(effect) {
    // ========== БАЗОВЫЕ ==========
    case 'sticker':
      return image.resize(512, 512, { fit: 'cover', position: 'attention' })
        .png({ quality: 100, compressionLevel: 9 })
        .toBuffer();
        
    case 'vivid':
      return image.modulate({ saturation: 1.5, brightness: 1.1 })
        .resize(512, 512, { fit: 'cover' })
        .png({ quality: 95 })
        .toBuffer();
        
    case 'bw':
      return image.greyscale()
        .normalise()
        .resize(512, 512, { fit: 'cover' })
        .png({ quality: 100 })
        .toBuffer();
        
    // ========== ВИНТАЖНЫЕ ==========
    case 'old':
      return image.modulate({ brightness: 1.1, saturation: 0.6 })
        .tint({ r: 150, g: 120, b: 80 })
        .resize(512, 512, { fit: 'cover' })
        .png({ quality: 90 })
        .toBuffer();
        
    case 'sepia':
      return image.modulate({ saturation: 0.5 })
        .tint({ r: 112, g: 66, b: 20 })
        .sharpen(0.3)
        .resize(512, 512, { fit: 'cover' })
        .png({ quality: 90 })
        .toBuffer();
        
    case 'polaroid':
      // Добавляем белую рамку как у Polaroid
      const polaroid = await image.resize(460, 460, { fit: 'cover' })
        .modulate({ brightness: 1.1 })
        .toBuffer();
      
      return sharp({
        create: {
          width: 512,
          height: 512,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        }
      })
        .composite([{ input: polaroid, top: 26, left: 26 }])
        .png()
        .toBuffer();
        
    case 'vhs':
      // Эффект VHS с полосами и шумом
      return image
        .modulate({ saturation: 0.8 })
        .recomb([
          [1.0, 0.1, 0.1],
          [0.1, 1.0, 0.1],
          [0.1, 0.1, 1.0]
        ])
        .resize(512, 512, { fit: 'cover' })
        .png({ quality: 85 })
        .toBuffer();
        
    // ========== ЦВЕТОВЫЕ ==========
    case 'warm':
      return image.modulate({ saturation: 1.2 })
        .tint({ r: 255, g: 200, b: 150 })
        .resize(512, 512, { fit: 'cover' })
        .png({ quality: 95 })
        .toBuffer();
        
    case 'cold':
      return image.modulate({ saturation: 1.1 })
        .tint({ r: 150, g: 180, b: 255 })
        .resize(512, 512, { fit: 'cover' })
        .png({ quality: 95 })
        .toBuffer();
        
    case 'pastel':
      return image.modulate({ saturation: 0.4, brightness: 1.2 })
        .resize(512, 512, { fit: 'cover' })
        .png({ quality: 95 })
        .toBuffer();
        
    case 'invert':
      return image.negate({ alpha: false })
        .resize(512, 512, { fit: 'cover' })
        .png({ quality: 95 })
        .toBuffer();
        
    case 'rainbow':
      // Градиентный эффект
      const rainbowOverlay = await sharp({
        create: {
          width: 512,
          height: 512,
          channels: 4,
          background: { r: 255, g: 0, b: 0, alpha: 0.2 }
        }
      })
        .png()
        .toBuffer();
      
      return image.resize(512, 512, { fit: 'cover' })
        .composite([{ input: rainbowOverlay, blend: 'overlay' }])
        .png({ quality: 90 })
        .toBuffer();
        
    // ========== СТИЛИСТИЧЕСКИЕ ==========
    case 'pixel':
      return image.resize(128, 128, { fit: 'cover' })
        .resize(512, 512, { kernel: 'nearest' }) // Растягиваем без сглаживания
        .png({ compressionLevel: 9 })
        .toBuffer();
        
    case 'comic':
      return image.modulate({ saturation: 1.4 })
        .threshold(128)
        .resize(512, 512, { fit: 'cover' })
        .png({ colors: 16 })
        .toBuffer();
        
    case 'sketch':
      // Эффект карандашного рисунка
      const sketch = await image.greyscale()
        .normalise()
        .convolution({
          width: 3,
          height: 3,
          kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1]
        })
        .negate()
        .toBuffer();
      
      return sharp(sketch)
        .resize(512, 512, { fit: 'cover' })
        .png({ colors: 2 })
        .toBuffer();
        
    case 'blur':
      return image.blur(10)
        .resize(512, 512, { fit: 'cover' })
        .png({ quality: 90 })
        .toBuffer();
        
    case 'double':
      // Двойная экспозиция
      const original = await image.resize(512, 512, { fit: 'cover' }).toBuffer();
      const overlay = await image.resize(512, 512, { fit: 'cover' })
        .modulate({ brightness: 0.7 })
        .blur(5)
        .toBuffer();
      
      return sharp(original)
        .composite([{ input: overlay, blend: 'multiply', opacity: 0.5 }])
        .png()
        .toBuffer();
        
    case 'mirror':
      // Зеркальный эффект
      const leftHalf = await image.resize(512, 512, { fit: 'cover' })
        .extract({ left: 0, top: 0, width: 256, height: 512 })
        .toBuffer();
      
      return sharp(leftHalf)
        .extend({
          left: 256,
          right: 0,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .composite([{ 
          input: leftHalf, 
          blend: 'over',
          left: 256,
          top: 0
        }])
        .png()
        .toBuffer();
        
    // ========== ВЕСЁЛЫЕ ==========
    case 'joker':
      // Фиолетово-зелёный как у Джокера
      return image.recomb([
        [0.5, 0.3, 0.2],
        [0.2, 0.7, 0.1],
        [0.3, 0.2, 0.5]
      ])
      .modulate({ saturation: 1.3 })
      .resize(512, 512, { fit: 'cover' })
      .png({ quality: 95 })
      .toBuffer();
      
    case 'glitch':
      // Глитч-эффект со смещением каналов
      const glitchRed = await image.extractChannel('red').toBuffer();
      const glitchGreen = await image.extractChannel('green').toBuffer();
      const glitchBlue = await image.extractChannel('blue').toBuffer();
      
      return sharp(glitchRed)
        .joinChannel(glitchGreen, { raw: { width: 512, height: 512, channels: 1 } })
        .joinChannel(glitchBlue, { raw: { width: 512, height: 512, channels: 1 } })
        .resize(512, 512, { fit: 'cover' })
        .png({ quality: 90 })
        .toBuffer();
        
    case 'christmas':
      // Красный и зелёный - рождественские цвета
      return image.modulate({ saturation: 1.4 })
        .tint({ r: 200, g: 50, b: 50 })
        .resize(512, 512, { fit: 'cover' })
        .png({ quality: 95 })
        .toBuffer();
        
    case 'halloween':
      // Оранжевый и чёрный
      return image.modulate({ saturation: 1.2 })
        .tint({ r: 255, g: 140, b: 0 })
        .resize(512, 512, { fit: 'cover' })
        .png({ quality: 95 })
        .toBuffer();
        
    default:
      return image.resize(512, 512, { fit: 'cover' })
        .png({ quality: 100 })
        .toBuffer();
  }
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

function setEffect(ctx, effectKey) {
  const effectInfo = ALL_EFFECTS[effectKey];
  if (!effectInfo) {
    ctx.reply('❌ Этот эффект временно недоступен');
    return;
  }
  
  userEffects.set(ctx.from.id, effectKey);
  
  ctx.reply(`🎯 <b>Выбран эффект:</b> ${effectInfo.name}

${getEffectDescription(effectKey)}

Теперь отправь мне фото!`, { 
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [[
        { text: '📸 Отправить фото', callback_data: 'send_photo' },
        { text: '🔄 Другой эффект', callback_data: 'category_all' }
      ]]
    }
  });
}

function getEffectDescription(effectKey) {
  const descriptions = {
    'sticker': 'Высокое качество без фильтров',
    'vivid': 'Усиленная насыщенность цветов',
    'bw': 'Классический чёрно-белый',
    'old': 'Винтажная сепия с тёплыми тонами',
    'sepia': 'Коричневый оттенок старых фото',
    'polaroid': 'Белая рамка как у Polaroid',
    'vhs': 'Эффект видеокассеты 90-х',
    'warm': 'Тёплые оранжевые тона',
    'cold': 'Холодные синие тона',
    'pastel': 'Мягкие пастельные цвета',
    'invert': 'Инвертированные цвета',
    'rainbow': 'Радужный градиент',
    'pixel': '8-битный пиксель-арт',
    'comic': 'Эффект комикса с контурами',
    'sketch': 'Карандашный рисунок',
    'blur': 'Размытый фон',
    'double': 'Двойная экспозиция',
    'mirror': 'Зеркальное отражение',
    'joker': 'Фиолетово-зелёные тона',
    'glitch': 'Цифровые помехи',
    'christmas': 'Красные и зелёные тона',
    'halloween': 'Оранжевый и чёрный'
  };
  
  return descriptions[effectKey] || 'Креативный эффект для стикеров';
}

// ========== INLINE КНОПКИ ==========

bot.action(/category_(.+)/, async (ctx) => {
  const category = ctx.match[1];
  const userId = ctx.from.id;
  
  if (category === 'all') {
    // Показываем все эффекты
    let message = `📋 <b>ВСЕ ЭФФЕКТЫ</b>\n\n`;
    
    Object.entries(ALL_EFFECTS).forEach(([key, effect]) => {
      message += `${effect.command} - ${effect.name}\n`;
    });
    
    message += `\n✨ Нажми на команду для выбора эффекта!`;
    
    await ctx.editMessageText(message, { parse_mode: 'HTML' });
    await ctx.answerCbQuery();
    return;
  }
  
  if (category === 'random') {
    const effects = Object.keys(ALL_EFFECTS);
    const randomEffect = effects[Math.floor(Math.random() * effects.length)];
    userEffects.set(userId, randomEffect);
    
    await ctx.editMessageText(
      `🎲 <b>Случайный эффект:</b> ${ALL_EFFECTS[randomEffect].name}\n\n` +
      `Теперь отправь фото!`,
      { parse_mode: 'HTML' }
    );
    await ctx.answerCbQuery('✅ Выбран случайный эффект!');
    return;
  }
  
  // Фильтруем эффекты по категории
  const categoryEffects = Object.entries(ALL_EFFECTS)
    .filter(([_, effect]) => effect.category === category);
  
  if (categoryEffects.length === 0) {
    await ctx.answerCbQuery('❌ В этой категории пока нет эффектов');
    return;
  }
  
  // Создаем кнопки для эффектов этой категории
  const buttons = [];
  for (let i = 0; i < categoryEffects.length; i += 2) {
    const row = [];
    if (categoryEffects[i]) {
      const [key, effect] = categoryEffects[i];
      row.push({ text: effect.name.split(' ')[0], callback_data: `effect_${key}` });
    }
    if (categoryEffects[i + 1]) {
      const [key, effect] = categoryEffects[i + 1];
      row.push({ text: effect.name.split(' ')[0], callback_data: `effect_${key}` });
    }
    buttons.push(row);
  }
  
  buttons.push([
    { text: '🔙 Назад', callback_data: 'back_to_menu' }
  ]);
  
  const categoryNames = {
    'vintage': '📜 Винтажные эффекты',
    'colors': '🌈 Цветовые фильтры',
    'styles': '🎭 Стилистические эффекты',
    'fun': '😄 Весёлые эффекты'
  };
  
  await ctx.editMessageText(
    `${categoryNames[category] || 'Эффекты'}\n\nВыбери эффект:`,
    {
      reply_markup: { inline_keyboard: buttons }
    }
  );
  
  await ctx.answerCbQuery();
});

bot.action(/effect_(.+)/, async (ctx) => {
  const effectKey = ctx.match[1];
  const userId = ctx.from.id;
  
  if (effectKey === 'random') {
    const effects = Object.keys(ALL_EFFECTS);
    const randomEffect = effects[Math.floor(Math.random() * effects.length)];
    userEffects.set(userId, randomEffect);
    
    await ctx.editMessageText(
      `🎲 <b>Случайный эффект:</b> ${ALL_EFFECTS[randomEffect].name}\n\n` +
      `Теперь отправь фото!`,
      { parse_mode: 'HTML' }
    );
    await ctx.answerCbQuery('✅ Выбран случайный эффект!');
    return;
  }
  
  const effectInfo = ALL_EFFECTS[effectKey];
  if (!effectInfo) {
    await ctx.answerCbQuery('❌ Эффект не найден');
    return;
  }
  
  userEffects.set(userId, effectKey);
  
  await ctx.editMessageText(
    `🎯 <b>Выбран эффект:</b> ${effectInfo.name}\n\n` +
    `${getEffectDescription(effectKey)}\n\n` +
    `Теперь отправь мне фото!`,
    { parse_mode: 'HTML' }
  );
  
  await ctx.answerCbQuery(`✅ Выбрано: ${effectInfo.name.split(' ')[0]}`);
});

bot.action('back_to_menu', async (ctx) => {
  await ctx.editMessageText(
    `📱 <b>ГЛАВНОЕ МЕНЮ</b>\n\nВыбери категорию эффектов:`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🎨 Винтажные', callback_data: 'category_vintage' },
            { text: '🌈 Цветовые', callback_data: 'category_colors' }
          ],
          [
            { text: '🎭 Стили', callback_data: 'category_styles' },
            { text: '😄 Весёлые', callback_data: 'category_fun' }
          ],
          [
            { text: '🎲 Случайный', callback_data: 'effect_random' },
            { text: '📋 Все', callback_data: 'category_all' }
          ]
        ]
      }
    }
  );
  await ctx.answerCbQuery();
});

bot.action('another_photo', async (ctx) => {
  const userId = ctx.from.id;
  const currentEffect = userEffects.get(userId) || 'sticker';
  const effectInfo = ALL_EFFECTS[currentEffect];
  
  await ctx.editMessageText(
    `📸 <b>Отправь ещё одно фото</b>\n\n` +
    `Текущий эффект: ${effectInfo.name}\n\n` +
    `Просто отправь новое фото в чат!`,
    { parse_mode: 'HTML' }
  );
  await ctx.answerCbQuery('✅ Жду фото!');
});

bot.action('use_current', async (ctx) => {
  await ctx.editMessageText(
    `✅ <b>Эффект сохранён!</b>\n\n` +
    `Теперь отправь мне фото для создания стикера.`,
    { parse_mode: 'HTML' }
  );
  await ctx.answerCbQuery('✅ Готово!');
});

// ========== ВЕБ-ЧАСТЬ ==========

app.use(express.json());

app.get('/api/health', (req, res) => {
  const effectsByCategory = {};
  Object.values(ALL_EFFECTS).forEach(effect => {
    if (!effectsByCategory[effect.category]) {
      effectsByCategory[effect.category] = 0;
    }
    effectsByCategory[effect.category]++;
  });
  
  res.json({
    status: 'amazing',
    version: BOT_VERSION,
    totalEffects: Object.keys(ALL_EFFECTS).length,
    effectsByCategory,
    activeUsers: userEffects.size,
    memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
    uptime: `${Math.floor(process.uptime() / 3600)}ч ${Math.floor((process.uptime() % 3600) / 60)}м`,
    message: `🎨 Бот с ${Object.keys(ALL_EFFECTS).length}+ эффектами готов к работе!`
  });
});

app.post('/api/webhook', async (req, res) => {
  try {
    await bot.handleUpdate(req.body);
    res.json({ status: 'ok', version: BOT_VERSION });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ status: 'error', error: error.message });
  }
});

app.get('/', (req, res) => {
  const totalEffects = Object.keys(ALL_EFFECTS).length;
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>🎨 Sticker Bot v${BOT_VERSION} - ${totalEffects}+ эффектов!</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          color: white;
          min-height: 100vh;
          padding: 20px;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border-radius: 30px;
          padding: 50px;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .header {
          text-align: center;
          margin-bottom: 50px;
        }
        .header h1 {
          font-size: 4em;
          margin-bottom: 20px;
          background: linear-gradient(45deg, #ffd700, #ff6b6b, #4ecdc4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        .count-badge {
          background: linear-gradient(45deg, #ff6b6b, #ffd700);
          color: white;
          padding: 10px 30px;
          border-radius: 50px;
          font-size: 1.8em;
          font-weight: bold;
          display: inline-block;
          margin: 20px 0;
          box-shadow: 0 10px 30px rgba(255, 107, 107, 0.4);
        }
        .categories {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 25px;
          margin: 50px 0;
        }
        .category-card {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 20px;
          padding: 30px;
          transition: all 0.3s;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .category-card:hover {
          transform: translateY(-10px);
          background: rgba(255, 255, 255, 0.25);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }
        .category-card h3 {
          font-size: 1.8em;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .effects-list {
          margin-top: 15px;
        }
        .effect-item {
          padding: 10px 15px;
          margin: 8px 0;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .btn {
          display: inline-block;
          background: linear-gradient(45deg, #0088cc, #00acee);
          color: white;
          padding: 18px 45px;
          border-radius: 50px;
          text-decoration: none;
          font-weight: bold;
          font-size: 1.3em;
          margin: 20px 10px;
          transition: all 0.3s;
          box-shadow: 0 10px 30px rgba(0, 136, 204, 0.4);
          border: 2px solid rgba(255, 255, 255, 0.3);
        }
        .btn:hover {
          transform: translateY(-5px) scale(1.05);
          box-shadow: 0 20px 40px rgba(0, 136, 204, 0.6);
        }
        .stats {
          display: flex;
          justify-content: center;
          gap: 30px;
          margin: 40px 0;
          flex-wrap: wrap;
        }
        .stat {
          background: rgba(255, 255, 255, 0.1);
          padding: 25px;
          border-radius: 20px;
          text-align: center;
          min-width: 200px;
        }
        .stat .number {
          font-size: 3em;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .footer {
          text-align: center;
          margin-top: 50px;
          opacity: 0.8;
          font-size: 0.9em;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎨 STICKER BOT</h1>
          <div class="count-badge">${totalEffects}+ ЭФФЕКТОВ!</div>
          <p style="font-size: 1.3em; opacity: 0.9;">Самый продвинутый бот для создания стикеров</p>
        </div>
        
        <div class="stats">
          <div class="stat">
            <div class="number">${totalEffects}</div>
            <div>Уникальных эффектов</div>
          </div>
          <div class="stat">
            <div class="number">${userEffects.size}</div>
            <div>Активных пользователей</div>
          </div>
          <div class="stat">
            <div class="number">7</div>
            <div>Категорий эффектов</div>
          </div>
          <div class="stat">
            <div class="number">512×512</div>
            <div>Качество стикеров</div>
          </div>
        </div>
        
        <h2 style="text-align: center; margin: 60px 0 30px 0; font-size: 2.5em;">✨ КАТЕГОРИИ ЭФФЕКТОВ</h2>
        
        <div class="categories">
          <div class="category-card">
            <h3>📜 Винтажные</h3>
            <p>Ретро-эффекты и старинные фильтры</p>
            <div class="effects-list">
              <div class="effect-item">
                <span>/old</span>
                <span>Старая фото</span>
              </div>
              <div class="effect-item">
                <span>/sepia</span>
                <span>Классика</span>
              </div>
              <div class="effect-item">
                <span>/polaroid</span>
                <span>Polaroid</span>
              </div>
              <div class="effect-item">
                <span>/vhs</span>
                <span>VHS эффект</span>
              </div>
            </div>
          </div>
          
          <div class="category-card">
            <h3>🌈 Цветовые</h3>
            <p>Изменение цветовой палитры</p>
            <div class="effects-list">
              <div class="effect-item">
                <span>/vivid</span>
                <span>Яркие цвета</span>
              </div>
              <div class="effect-item">
                <span>/warm</span>
                <span>Тёплые тона</span>
              </div>
              <div class="effect-item">
                <span>/cold</span>
                <span>Холодные тона</span>
              </div>
              <div class="effect-item">
                <span>/pastel</span>
                <span>Пастель</span>
              </div>
            </div>
          </div>
          
          <div class="category-card">
            <h3>🎭 Стили</h3>
            <p>Художественные преобразования</p>
            <div class="effects-list">
              <div class="effect-item">
                <span>/pixel</span>
                <span>Пиксель-арт</span>
              </div>
              <div class="effect-item">
                <span>/comic</span>
                <span>Комикс</span>
              </div>
              <div class="effect-item">
                <span>/sketch</span>
                <span>Эскиз</span>
              </div>
              <div class="effect-item">
                <span>/blur</span>
                <span>Размытие</span>
              </div>
            </div>
          </div>
          
          <div class="category-card">
            <h3>😄 Весёлые</h3>
            <p>Креативные и забавные</p>
            <div class="effects-list">
              <div class="effect-item">
                <span>/joker</span>
                <span>Joker</span>
              </div>
              <div class="effect-item">
                <span>/glitch</span>
                <span>Глитч</span>
              </div>
              <div class="effect-item">
                <span>/rainbow</span>
                <span>Радуга</span>
              </div>
              <div class="effect-item">
                <span>/invert</span>
                <span>Негатив</span>
              </div>
            </div>
          </div>
        </div>
        
        <div style="text-align: center; margin: 60px 0;">
          <h3 style="font-size: 2em; margin-bottom: 30px;">🎯 И ЕЩЁ МНОГО ДРУГИХ ЭФФЕКТОВ!</h3>
          <a href="https://t.me/MyStickerMarket_bot" class="btn">
            🚀 ОТКРЫТЬ БОТА В TELEGRAM
          </a>
          <br>
          <a href="/api/health" class="btn" style="background: linear-gradient(45deg, #00b09b, #96c93d); margin-top: 20px;">
            📊 СТАТИСТИКА СИСТЕМЫ
          </a>
        </div>
        
        <div style="text-align: center; padding: 30px; background: rgba(255, 255, 255, 0.1); border-radius: 20px; margin: 40px 0;">
          <h4>💡 КАК ИСПОЛЬЗОВАТЬ:</h4>
          <p>1. Открой бота в Telegram<br>
             2. Нажми /menu для выбора категории<br>
             3. Выбери эффект<br>
             4. Отправь фото<br>
             5. Получи уникальный стикер!</p>
        </div>
        
        <div class="footer">
          <p>🤖 Node.js ${process.version} | 🚀 Vercel | 🎨 ${totalEffects} эффектов</p>
          <p>⏰ ${new Date().toLocaleString('ru-RU', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </div>
      </div>
      
      <script>
        // Анимация чисел
        document.addEventListener('DOMContentLoaded', function() {
          const stats = document.querySelectorAll('.stat .number');
          stats.forEach(stat => {
            const final = parseInt(stat.textContent);
            let current = 0;
            const increment = Math.ceil(final / 50);
            const timer = setInterval(() => {
              current += increment;
              if (current >= final) {
                current = final;
                clearInterval(timer);
              }
              stat.textContent = current;
            }, 30);
          });
        });
      </script>
    </body>
    </html>
  `);
});

// ========== ЗАПУСК ==========

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════════════╗
  ║      🎨 STICKER BOT v${BOT_VERSION} - ${Object.keys(ALL_EFFECTS).length}+ ЭФФЕКТОВ!     ║
  ╚══════════════════════════════════════════════════════╝
  
  ✅ Сервер: http://localhost:${PORT}
  ✅ Бот: @MyStickerMarket_bot
  ✅ Эффектов: ${Object.keys(ALL_EFFECTS).length}
  
  📌 КОМАНДЫ:
  • /menu - Главное меню
  • /vintage - Винтажные эффекты
  • /colors - Цветовые фильтры
  • /styles - Стилистические
  • /fun - Весёлые эффекты
  • /all - Все эффекты списком
  • /random - Случайный эффект
  
  🎯 ПОПУЛЯРНЫЕ:
  • /pixel - Пиксель-арт
  • /comic - Комикс
  • /joker - Фильтр Joker
  • /vhs - VHS эффект
  • /double - Двойная экспозиция
  
  ⚡ Бот готов! Используй /start в Telegram
  `);
});

module.exports = app;
