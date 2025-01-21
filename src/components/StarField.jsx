import React from 'react';
import { Graphics } from '@pixi/react';

// Helper function to generate stars
export const generateStars = (count, bounds) => {
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * bounds.width,
      y: Math.random() * bounds.height,
      size: Math.random() * 2 + 1,
      color: [0xFFFFFF, 0xFFA500, 0x00FFFF][Math.floor(Math.random() * 3)],
    });
  }
  return stars;
};

// StarLayer component
export const StarLayer = React.memo(({ stars, parallaxFactor, cameraX, cameraY }) => {
  return (
    <Graphics
      draw={(g) => {
        g.clear();
        stars.forEach(star => {
          const parallaxX = -cameraX * parallaxFactor;
          const parallaxY = -cameraY * parallaxFactor;
          
          const wrappedX = ((star.x + parallaxX) % 4000 + 4000) % 4000;
          const wrappedY = ((star.y + parallaxY) % 4000 + 4000) % 4000;
          
          g.beginFill(star.color);
          g.drawCircle(wrappedX, wrappedY, star.size);
          g.endFill();
        });
      }}
    />
  );
});