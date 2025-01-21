// First, create a new component ParticleExplosion.jsx
import React, { useState, useEffect } from 'react';
import { Graphics, Container } from '@pixi/react';

export const ParticleExplosion = React.memo(({ x, y, onComplete }) => {
  const [particles, setParticles] = useState([]);
  const [frame, setFrame] = useState(0);

  // Initialize particles
  useEffect(() => {
    const numParticles = 20;
    const initialParticles = Array(numParticles).fill(null).map(() => ({
      x: 0,
      y: 0,
      vx: (Math.random() - 0.5) * 10, // Random velocity
      vy: (Math.random() - 0.5) * 10,
      alpha: 1,
      size: Math.random() * 4 + 2,    // Random size
      color: [0xFF4444, 0xFF8844, 0xFFFF44][Math.floor(Math.random() * 3)] // Random fire colors
    }));
    setParticles(initialParticles);
  }, []);

  // Animation loop
  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => {
      if (frame < 60) { // 1 second at 60fps
        setParticles(prevParticles => 
          prevParticles.map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            alpha: p.alpha - 0.02,
            vx: p.vx * 0.95, // Slow down
            vy: p.vy * 0.95
          }))
        );
        setFrame(f => f + 1);
      } else if (onComplete) {
        onComplete();
      }
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [frame, onComplete]);

  return (
    <Container x={x} y={y}>
      {particles.map((particle, i) => (
        <Graphics
          key={i}
          draw={g => {
            g.clear();
            g.beginFill(particle.color, particle.alpha);
            g.drawCircle(particle.x, particle.y, particle.size);
            g.endFill();
          }}
        />
      ))}
    </Container>
  );
});