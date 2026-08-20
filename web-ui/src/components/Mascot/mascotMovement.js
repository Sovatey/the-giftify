import { LOCAL_STORAGE_KEY } from './mascotTypes';

export const getViewportBounds = (mascotWidth = 110, mascotHeight = 110) => {
  const padding = 15;
  return {
    minX: padding,
    maxX: Math.max(padding, window.innerWidth - mascotWidth - padding),
    minY: padding,
    maxY: Math.max(padding, window.innerHeight - mascotHeight - padding)
  };
};

export const clampPosition = (x, y, bounds) => {
  return {
    x: Math.min(Math.max(x, bounds.minX), bounds.maxX),
    y: Math.min(Math.max(y, bounds.minY), bounds.maxY)
  };
};

export const loadMascotPosition = (defaultPos = 'bottom-right', mascotWidth = 110, mascotHeight = 110) => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const bounds = getViewportBounds(mascotWidth, mascotHeight);
      return clampPosition(parsed.x, parsed.y, bounds);
    }
  } catch (e) {
    console.error('Failed to load mascot position:', e);
  }

  // Default fallback calculation based on initialPosition
  const bounds = getViewportBounds(mascotWidth, mascotHeight);
  if (defaultPos === 'bottom-right') {
    return {
      x: bounds.maxX - 20,
      y: bounds.maxY - 20
    };
  } else if (defaultPos === 'bottom-left') {
    return {
      x: bounds.minX + 20,
      y: bounds.maxY - 20
    };
  }

  return {
    x: bounds.maxX - 20,
    y: bounds.maxY - 20
  };
};

export const saveMascotPosition = (x, y) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ x: Math.round(x), y: Math.round(y) }));
  } catch (e) {
    console.error('Failed to save mascot position:', e);
  }
};

export const getRandomDestination = (currentX, currentY, mascotWidth = 110, mascotHeight = 110) => {
  const bounds = getViewportBounds(mascotWidth, mascotHeight);
  
  // Choose a destination within a reasonable radius (150px - 400px)
  const angle = Math.random() * Math.PI * 2;
  const distance = 150 + Math.random() * 250;

  let targetX = currentX + Math.cos(angle) * distance;
  let targetY = currentY + Math.sin(angle) * distance;

  return clampPosition(targetX, targetY, bounds);
};
