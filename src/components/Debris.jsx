import React from 'react';
import { Sprite } from '@pixi/react';

// Debris component
export const Debris = React.memo(({ rotation, onTargetClick, id }) => {

  return (
    <Sprite
      image="/sprites/starship_01_debris.png"
      anchor={0.5}
      rotation={rotation}
      width={48}
      height={64}
      eventMode='static'
      interactive={true}
      cursor="pointer"
      pointerdown={() => {
        onTargetClick(id, 'debris');
      }}
    />
  );
});