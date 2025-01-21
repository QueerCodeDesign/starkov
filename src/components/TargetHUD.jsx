// src/components/TargetHUD.jsx
import React, { useState, useMemo } from 'react';
import { ShieldIndicator } from './shieldIndicator';

export const TargetHUD = ({ target, isInRange }) => {
  // console.log('target', target);
  // console.log('isInRange', isInRange);

  return (
    <div className={`target-HUD-wrapper ${isInRange ? 'in-range' : 'out-of-range'}`}>
      <ShieldIndicator
        isInRange={isInRange}
        title={target.type === 'player' ? target.name || 'Target Shields' : target.name || 'Player Wreckage'}
        shields={target.type === 'player' ? target.shields : {type: 'debris'}}
      />
    </div>
  );
};