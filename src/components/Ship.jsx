import React from 'react';
import { Sprite } from '@pixi/react';

// Shield damage calculation utility
export const damageShield = (shields, angle, amount) => {
    // Convert angle to local ship coordinates
    const normalizedAngle = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    
    // Determine which shield segment was hit
    let segment;
    if (normalizedAngle <= Math.PI/4 || normalizedAngle > 7*Math.PI/4) segment = 'front';
    else if (normalizedAngle <= 3*Math.PI/4) segment = 'right';
    else if (normalizedAngle <= 5*Math.PI/4) segment = 'back';
    else segment = 'left';
    
    // Apply damage to segment
    shields.segments[segment] = Math.max(0, shields.segments[segment] - amount);
    // Update total shield strength
    shields.total = Object.values(shields.segments).reduce((a, b) => a + b, 0);
    
    return shields;
};

// Ship component
export const Ship = React.memo(({ rotation, isLocal, onTargetClick, id }) => {

  return (
    <Sprite
      image="/sprites/starship_01.png"
      anchor={0.5}
      rotation={rotation}
      width={32}
      height={58}
      eventMode='static'
      interactive={true}
      cursor="pointer"
      pointerdown={() => {
        onTargetClick(id);
      }}
    />
  );
});