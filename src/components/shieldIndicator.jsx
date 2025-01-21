import React from "react";

export const ShieldIndicator = ({ title, shields }) => {
  // console.log('title', title);
  // console.log('shields', shields);
  
  if (shields.type === 'debris') {
    return (
      <div className="wreckage-wrapper">
        <div className="wreckage-title">{title}</div>
        <div>Debris</div>
      </div>
    )
  }

  if (!shields || !shields.segments) {
    return <div>Loading shields...</div>;
  }

  const getShieldColor = (value) => {
    if ((value * 4) >= 75) {
        return 'shield-bar-color-green';
    } else if ((value * 4) >= 50) {
        return 'shield-bar-color-yellow';
    } else if ((value * 4) >= 25) {
        return 'shield-bar-color-orange';
    } else if ((value * 4) > 0) {
        return 'shield-bar-color-red';
    } else {
        return 'shield-bar-depleted'
    }
  }

  return (
    <div>
      <div className="HUD-shields-title">{title}</div>
      <div className="HUD-shields">
        {/* Front Shield */}
        <div>
          <div className="HUD-segment">
            <span>Front</span>
            <span>{shields.segments.front.toFixed(1)}%</span>
          </div>
          <div 
            className={`HUD-shield-bar ${getShieldColor(shields.segments.front)}`}
            style={{ width: `${shields.segments.front * 4}%` }}
          >
            {(shields.segments.front * 4) === 0 ? 'C R I T I C A L' : null}
          </div>
        </div>
  
        {/* Right Shield */}
        <div>
          <div className="HUD-segment">
            <span>Right</span>
            <span>{shields.segments.right.toFixed(1)}%</span>
          </div>
          <div 
            className={`HUD-shield-bar ${getShieldColor(shields.segments.right)}`}
            style={{ width: `${shields.segments.right * 4}%` }}
          >
            {(shields.segments.right * 4) === 0 ? 'C R I T I C A L' : null}
          </div>
        </div>
  
        {/* Back Shield */}
        <div>
          <div className="HUD-segment">
            <span>Back</span>
            <span>{shields.segments.back.toFixed(1)}%</span>
          </div>
          <div 
            className={`HUD-shield-bar ${getShieldColor(shields.segments.back)}`}
            style={{ width: `${shields.segments.back * 4}%` }}
          >
            {(shields.segments.back * 4) === 0 ? 'C R I T I C A L' : null}
          </div>
        </div>
  
        {/* Left Shield */}
        <div>
          <div className="HUD-segment">
            <span>Left</span>
            <span>{shields.segments.left.toFixed(1)}%</span>
          </div>
          <div 
            className={`HUD-shield-bar ${getShieldColor(shields.segments.left)}`}
            style={{ width: `${shields.segments.left * 4}%` }}
          >
            {(shields.segments.left * 4) === 0 ? 'C R I T I C A L' : null}
          </div>
        </div>
  
        {/* Total Shields */}
        <div>
          <div className="HUD-segment">
            <span>Total</span>
            <span>{shields.total.toFixed(1)}%</span>
          </div>
          <div 
            className={`HUD-shield-bar ${getShieldColor(shields.total / 4)}`}
            style={{ width: `${shields.total}%` }}
          >
            {(shields.total) === 0 ? 'C R I T I C A L' : null}
          </div>
        </div>

        {/* Hull Strength */}
        <div>
          <div className="HUD-segment">
            <span>Hull Strength</span>
            <span>{shields.hull.toFixed(1)}%</span>
          </div>
          <div 
            className={`HUD-shield-bar ${getShieldColor(shields.hull / 4)}`}
            style={{ width: `${shields.hull}%` }}
          >
            {(shields.hull) === 0 ? 'D E S T R O Y E D' : null}
          </div>
        </div>
      </div>
    </div>
  );
};