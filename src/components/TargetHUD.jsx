// src/components/TargetHUD.jsx
import React, { useState, useMemo } from 'react';
import { ShieldIndicator } from './shieldIndicator';

export const TargetHUD = ({ target, isInRange }) => {

  return (
    <div className={`target-HUD-wrapper ${isInRange ? 'in-range' : 'out-of-range'}`}>
      <ShieldIndicator isInRange={isInRange} title={'Target Shields'} shields={target.shields} />
    </div>
  );
};