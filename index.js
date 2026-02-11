async function applyEffect(imageBuffer, effect) {
  let image = sharp(imageBuffer).rotate();
  
  // 1. Сначала обрабатываем фото (все эффекты)
  switch(effect) {
    case 'sticker':
      image = image.resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
      break;
      
    case 'vivid':
      image = image.modulate({ saturation: 1.5, brightness: 1.1 })
        .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
      break;
      
    case 'bw':
      image = image.greyscale()
        .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
      break;
      
    // Добавьте background: { alpha: 0 } ко ВСЕМ resize() !!!
    // Пример для всех эффектов:
    case 'old':
      image = image.modulate({ brightness: 1.1, saturation: 0.6 })
        .tint({ r: 150, g: 120, b: 80 })
        .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0,
