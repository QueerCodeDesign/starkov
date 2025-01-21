import { useState, useEffect } from 'react';

export const useShieldUpdate = (currentValue, targetValue, speed = 0.1) => {
  const [displayValue, setDisplayValue] = useState(currentValue);

  useEffect(() => {
    if (displayValue !== targetValue) {
      const difference = targetValue - displayValue;
      const step = difference * speed;
      
      const timeout = setTimeout(() => {
        setDisplayValue(prev => Math.abs(difference) < 0.1 
          ? targetValue 
          : prev + step);
      }, 16);

      return () => clearTimeout(timeout);
    }
  }, [displayValue, targetValue, speed]);

  return displayValue;
};