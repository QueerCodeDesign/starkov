import React, { useEffect } from 'react';
import { ShieldIndicator } from './shieldIndicator';

const AttackIndicator = ({ attackCooldown }) => {

  return (
    <div>
      <div className="HUD-attack-indicator">
        <span className="wpn-title">Phasers:</span>
        {attackCooldown > 0 ? (
          <span className="wpn on-cooldown">{attackCooldown}s</span>
        ) : (
          <span className="wpn off-cooldown">Ready</span>
        )}
      </div>
    </div>
  );
};

const PowerIndicator = ({ power, subsystemDamage }) => {

  return (
    <div className="HUD-subsystems-wrapper">
      <div className="HUD-subsystem-title">Subsystem Power</div>
      <div className="HUD-subsystems">
        <div className="subsystem-container-wrapper">
          <div className="subsystem-container">
            {subsystemDamage && (
              <div 
                className={`subsystem-dmg-indicator subsystem-dmg-weapons ${(subsystemDamage.weapons) < 4 ? 'ssdi-round' : 'ssdi-flat'}`}
                style={{ height: `${subsystemDamage.weapons}%` }}
              />
            )}
            <div 
              className={`subsystem-indicator subsystem-weapons ${(power.weapons / 3) > 96 ? 'ssi-round' : 'ssi-flat'}`}
              style={{ height: `${power.weapons / 3}%` }}
            />
          </div>
          Weapons
        </div>
        <div className="subsystem-container-wrapper">
          <div className="subsystem-container">
            {subsystemDamage && (
              <div 
                className={`subsystem-dmg-indicator subsystem-dmg-shields ${(subsystemDamage.shields) < 4 ? 'ssdi-round' : 'ssdi-flat'}`}
                style={{ height: `${subsystemDamage.shields}%` }}
              />
            )}
            <div 
              className={`subsystem-indicator subsystem-shields ${(power.shields / 3) > 96 ? 'ssi-round' : 'ssi-flat'}`}
              style={{ height: `${power.shields / 3}%` }}
            />
          </div>
          Shields
        </div>
        <div className="subsystem-container-wrapper">
          <div className="subsystem-container">
            {subsystemDamage && (
              <div 
                className={`subsystem-dmg-indicator subsystem-dmg-engines ${(subsystemDamage.engines) < 4 ? 'ssdi-round' : 'ssdi-flat'}`}
                style={{ height: `${subsystemDamage.engines}%` }}
              />
            )}
            <div 
              className={`subsystem-indicator subsystem-engines ${(power.engines / 3) > 96 ? 'ssi-round' : 'ssi-flat'}`}
              style={{ height: `${power.engines / 3}%` }}
            />
          </div>
          Engines
        </div>
      </div>
    </div>
  );
};

export const HUD = ({ player, attackCooldown, power, subsystemDamage }) => {
  
  return (
    <div className="local-HUD-wrapper">
      {player && player.shields && (
        <ShieldIndicator title={player.name || 'Player Shields'} shields={player.shields} />
      )}
      <AttackIndicator attackCooldown={attackCooldown} />
      <PowerIndicator power={power} subsystemDamage={subsystemDamage} />
    </div>
  );
};