import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Stage, Container, Graphics } from '@pixi/react';
import "@pixi/events";
import { StarLayer, generateStars } from './components/StarField';
import { Ship } from './components/Ship';
import { Debris } from './components/Debris';
import { HUD } from './components/HUD';
import { TargetHUD } from './components/TargetHUD';
import './assets/game.css';
import { DestroyedOverlay } from './components/DestroyedOverlay';
import { ParticleExplosion } from './components/ParticleExplosion';

const Game = ({ socket }) => {
  const [playersPosition, setPlayersPosition] = useState(new Map());
  const [playersShields, setPlayersShields] = useState(new Map());
  const [debrisField, setDebrisField] = useState(new Map());
  const [localPlayerId, setLocalPlayerId] = useState();
  const [targetedPlayers, setTargetedPlayers] = useState(new Map());
  const [localTarget, setLocalTarget] = useState(null);
  const [attackCooldown, setAttackCooldown] = useState(0);
  const [activeAttacks, setActiveAttacks] = useState([]);
  const [explosions, setExplosions] = useState(new Map());
  const [isDestroyed, setIsDestroyed] = useState(false);

  const [powerLevels, setPowerLevels] = useState({
    weapons: 100,
    shields: 100,
    engines: 100
  });

  const worldBounds = {
    width: 1000,
    height: 1000
  };

  // Default range
  const range = 300;
  
  // Base movement configuration
  const physics = {
    rotationSpeed: 0.005,
    acceleration: 0.02,
    reverseAcceleration: 0.02,
    maxSpeed: .5,         
    friction: 0.99
  };

  // Generate Star Layers
  const [starLayers] = useState(() => [
    generateStars(800, worldBounds),
    generateStars(600, worldBounds),
    generateStars(400, worldBounds)
  ]);

  // Initialize Required References
  const localPlayerIdRef = useRef(localPlayerId)
  const playersPositionRef = useRef(new Map());
  const playersShieldsRef = useRef(new Map());
  const keysPressed = useRef(new Set());
  const requestRef = useRef();
  const socketRef = useRef(socket);
  const localTargetRef = useRef(localTarget);
  const attackTimer = useRef(null);
  const attackCooldownRef = useRef(attackCooldown);
  const powerLevelsRef = useRef(powerLevels);
  const isDestroyedRef = useRef(isDestroyed);
  const debrisFieldRef = useRef(debrisField);
  
  // Create required reference updates
  useEffect(() => {
    localTargetRef.current = localTarget;
  }, [localTarget]);

  useEffect(() => {
    playersPositionRef.current = playersPosition;
  }, [playersPosition]);

  useEffect(() => {
    attackCooldownRef.current = attackCooldown;
  }, [attackCooldown]);

  useEffect(() => {
    localPlayerIdRef.current = localPlayerId;
  }, [localPlayerId]);

  useEffect(() => {
    powerLevelsRef.current = powerLevels;
  }, [powerLevels]);

  useEffect(() => {
    playersShieldsRef.current = playersShields;
  }, [playersShields]);

  useEffect(() => {
    isDestroyedRef.current = isDestroyed;
  }, [isDestroyed]);

  useEffect(() => {
    debrisFieldRef.current = debrisField;
  }, [debrisField]);

  /*
  / Socket connection and calls
  */
  useEffect(() => {

    if (!socket) {
      console.log('No socket connection available');
      return;
    }

    setLocalPlayerId(socket.id);

    socket.emit('requestGameState');

    // wait for server assignment
    socket.on('connect', () => {
      setLocalPlayerId(socket.id);
    });

    // Listen for other players' positions
    socket.on('currentPlayers', (playersList) => {

      const playersMap = new Map(playersList.map(player => [player.id, player]));

      // If local player isn't in the list, initialize them
      if (!playersMap.has(socket.id)) {
        playersMap.set(socket.id, {
          id: socket.id,
          x: Math.random() * worldBounds.width,
          y: Math.random() * worldBounds.height,
          rotation: 0,
          velocityX: 0,
          velocityY: 0
        });
      }

      setPlayersPosition(playersMap);
    });

    // Listen for other players' shields
    socket.on('currentShields', (shieldsList) => {
      const newShieldsMap = new Map();
      shieldsList.forEach(shield => {
        newShieldsMap.set(shield.id, {
          segments: {...shield.segments},
          total: shield.total,
          hull: shield.hull,
          damage: shield.damage
        });
      });
      setPlayersShields(newShieldsMap);
    });

    // Listen for players joining
    socket.on('playerJoined', (player) => {
      if (player.id !== localPlayerId) {  // Don't override local player
        setPlayersPosition(prev => new Map(prev).set(player.id, player));
        setPlayersShields(prev => new Map(prev).set(player.id, {
          segments: {
            front: 25,
            right: 25,
            back: 25,
            left: 25
          },
          total: 100,
          hull: 100,
          damage: {
            weapons: 0,
            shields: 0,
            engines: 0
          }
        }));
      }
    });

    // Listen for player movement
    socket.on('playerMoved', (playerData) => {
      if (playerData.id !== localPlayerId) {  // Don't override local player
        setPlayersPosition(prev => {
          const updated = new Map(prev);
          const existingPlayer = updated.get(playerData.id);
          updated.set(playerData.id, {...existingPlayer, ...playerData});
          return updated;
        });
      }
    });

    // Listen for player shield updates
    socket.on('playerShieldUpdate', (shieldData) => {

      if (shieldData.id !== localPlayerId) {
        setPlayersShields(prev => {
          const updated = new Map(prev);
          const existingPlayer = updated.get(shieldData.id);
          updated.set(shieldData.id, {...existingPlayer, ...shieldData});
          return updated;
        });
      }
    });

    // remove position and shield data when a player leaves
    socket.on('playerLeft', (playerId) => {
      setPlayersPosition(prev => {
        const updated = new Map(prev);
        if (playerId !== localPlayerId) {  
          updated.delete(playerId);// Don't remove local player
        }
        return updated;
      });
      setPlayersShields(prev => {
        const updated = new Map(prev);
        if (playerId !== localPlayerId) {
          updated.delete(playerId);
        }
        return updated;
      })
    });

    // Listen for player targeting actions
    socket.on('playerTargeted', ({targeterId, targetId}) => {
      if (targeterId !== targetId) {
        setTargetedPlayers(prev => {
          const updated = new Map(prev);
          const targetersList = updated.get(targetId) || new Set();
          targetersList.add(targeterId);
          updated.set(targetId, targetersList);
          return updated;
        });
      }
    });

    // Listen for player untargeting actions
    socket.on('playerUntargeted', ({ targeterId, targetId }) => {      
      setTargetedPlayers(prev => {
        const updated = new Map(prev);

        if (targeterId !== targetId) {
          // Handle specific untargeting event, removing specific
          // targeterId from targetId's targeter List
          const targetersList = updated.get(targetId);
          if (targetersList) {
            targetersList.delete(targeterId);
            if (targetersList.size === 0) {
              updated.delete(targetId);
            } else {
              updated.set(targetId, targetersList);
            }
          }
        } else {
          // When the IDs match, remove all instances of targeterId and
          // targetId where the ID appears as either targeter or target
          if (targeterId === localTargetRef.current && targetId === localTargetRef.current) {
            setLocalTarget(null);
          }
          // Remove any entries with this ID
          updated.delete(targeterId);

          // Remove this ID from all targeter lists
          for (const [targetId, targetersList] of updated) {
            targetersList.delete(targeterId);
            if (targetersList.size === 0) {
              updated.delete(targetId);
            } else {
              updated.set(targetId, targetersList);
            }
          }
        }

        return updated;
      });
    });

    // Listen for player attacked actions
    socket.on('playerAttacked', ({ attackerId, targetId, segment, damage }) => {
      const attackId = Date.now();

      // Create attack line animation
      setActiveAttacks(prev => {
        // remove any existing attack with the same ID to prevent duplicates
        const cleaned = prev.filter(attack => attack.id !== attack.id);
        return [...cleaned, {
          id: attackId,
          from: attackerId,
          to: targetId
        }];
      });

      setTimeout(() => {
        setActiveAttacks(prev => {
          const filtered = prev.filter(attack => attack.id !== attackId);
          return filtered;
        });
      }, 200);
  
      // If we're the target, update our shields
      if (targetId === localPlayerIdRef.current) {
        handleShieldDamage(segment, damage);
      }
    });

    // Listen for player destroyed actions
    socket.on('playerDestroyed', (data) => {

      setExplosions(prev => {
        const updated = new Map(prev);
        updated.set(data.playerId, {
          x: data.finalPosition.x,
          y: data.finalPosition.y,
        });

        return updated;
      });
      
      setDebrisField(prev => {
        const updated = new Map(prev);
        updated.set(data.playerId, {
          id: data.playerId,
          name: `Wreck of the ${data.playerName}`,
          type: 'wreckage',
          x: data.finalPosition.x,
          y: data.finalPosition.y,
          rotation: data.finalPosition.rotation
        });

        return updated;
      });

      if (data.playerId === localPlayerIdRef.current) {
        setIsDestroyed(true);
        setLocalTarget(null);
      } else if (data.playerId === localTargetRef.current) {
        setLocalTarget(null);
      }

      setPlayersPosition(prev => {
        const updated = new Map(prev);
        const destroyedPlayer = updated.get(data.playerId);
        if (destroyedPlayer) {
          updated.delete(data.playerId);
        }

        return updated;
      });
    });

    return () => {
      socket?.removeAllListeners();
    };
  }, []);

  const handleTargetClick = (targetId, type) => {
    console.log('targetId', targetId);
    console.log('type', type);

    switch (type) {
      case 'ship':
        if (targetId !== localPlayerId) {
          setLocalTarget(targetId);
          socketRef.current?.emit('targetPlayer', {
            targeterId: localPlayerId,
            targetId: targetId
          });
        };
        break;
      case 'debris':
        setLocalTarget(targetId);
    }
  };
  
  const emitLock = useRef(false);
  const handleShieldDamage = (segment, damage) => {
    const keys = ['weapons', 'shields', 'engines'];
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    setPlayersShields(prev => {
      const playerShields = prev.get(localPlayerIdRef.current);
      const currentShieldValue = playerShields.segments[segment];
      
      // Calculate if damage exceeds shields
      const damageToDeal = (currentShieldValue === 0 || powerLevelsRef.current.shields === 0) ?
        damage :
        (damage / (powerLevelsRef.current.shields / 100));
      const hullDamage = Math.max(0, damageToDeal - currentShieldValue);
      
      const newShields = {
        ...playerShields,
        segments: {
            ...playerShields.segments,
            [segment]: Math.max(0, playerShields.segments[segment] - damageToDeal)
        },
        hull: Math.max(0, playerShields.hull - hullDamage),
        damage: {
          ...playerShields.damage,
          [randomKey]: Math.min(100, playerShields.damage[randomKey] + hullDamage)
        }
      };

      newShields.total = Object.values(newShields.segments).reduce((a, b) => a + b, 0);
      
      const updated = new Map(prev);
      updated.set(localPlayerIdRef.current, newShields);
      
      if (!emitLock.current) {
        emitLock.current = true;
        // use setTimeout to move the emitShieldUpdate to after the
        // setPlayersShield callback finishes executing
        setTimeout(() => {
          socketRef.current?.emit('shieldUpdate', newShields);
          emitLock.current = false;
        }, 0);
      }

      return updated;
    });
  };

  const calculateShieldSegment = (attackerX, attackerY, targetX, targetY, targetRotation) => {   
    // Calculate the angle between ships
    const dx = targetX - attackerX;
    const dy = targetY - attackerY;
    let angle = Math.atan2(dy, dx);

    // Convert to degrees and normalize to 0-360
    let degrees = ((angle * 180 / Math.PI) + 360) % 360;

    // Adjust for target's rotation
    let relativeAngle = (degrees - (targetRotation * 180 / Math.PI) + 360) % 360;

    // Determine which shield segment was hit
    if (relativeAngle >= 315 || relativeAngle < 45) {
      return 'left';
    } else if (relativeAngle >= 45 && relativeAngle < 135) {
      return 'front';
    } else if (relativeAngle >= 135 && relativeAngle < 225) {
      return 'right';
    } else {
      return 'back'
    }
  };

  const AttackLine = React.memo(({ fromId, toId, playersPosition }) => {
    const fromShip = playersPosition.get(fromId);
    const toShip = playersPosition.get(toId);

    if (!fromShip || !toShip) return null;

    return (
      <Container>
        <Graphics
          draw={g => {
            g.clear();
            g.lineStyle(2, 0xff0000, 0,8);
  
            const startX = fromShip.x + Math.sin(fromShip.rotation) * 29;
            const startY = fromShip.y - Math.cos(fromShip.rotation) * 29;
          
            g.moveTo(startX, startY);
            g.lineTo(toShip.x, toShip.y);  
            
            // add large dots at both ends
            g.beginFill(0xff0000);
            g.drawCircle(startX, startY, 2);
            g.drawCircle(toShip.x, toShip.y, 2);
            g.endFill();
  
            // Add a white core to the line
            g.lineStyle(1, 0xff0000, 0.8);
            g.moveTo(startX, startY);
            g.lineTo(toShip.x, toShip.y);
          }}
        />
      </Container>
    );
  });

  const isInRange = (attacker, target, range) => {

    if (attacker && target) {
      const dx = attacker.x - target.x;
      const dy = attacker.y - target.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      return distance < range;
    } else {
      return false;
    }
  };

  const handleAttack = useCallback(() => {
    if (!localPlayerIdRef.current) {
      // console.log('Attack attempted but no local player ID yet');
      return;
    };

    if (attackCooldownRef.current > 0 || !localTargetRef.current) {
      // console.log('Attack blocked: ',
      //   attackCooldownRef > 0 ? 'on cooldown' : 'no target'
      // );
      return;
    };    

    const attacker = playersPositionRef.current.get(localPlayerIdRef.current);
    const target = playersPositionRef.current.get(localTargetRef.current);
    
    const inRange = isInRange(attacker, target, range);

    if (!attacker || !target || !inRange) {
      // console.log('Attack failed: ', {
      //   hasAttacker: !!attacker,
      //   hasTarget: !!target,
      //   inRange
      // });
      return;
    };

    const hitSegment = calculateShieldSegment(
      attacker.x,
      attacker.y,
      target.x,
      target.y,
      target.rotation
    );

    // Add attack line animation
    const attackId = Date.now();
    setActiveAttacks(prev => [...prev, {
      id: attackId,
      from: localPlayerIdRef.current,
      to: localTargetRef.current
    }]);

    // Remove attack line after animation
    setTimeout(() => {
      setActiveAttacks(prev => prev.filter(attack => attack.id !== attackId));
    }, 200);

    // Emit attack event to server
    socketRef.current?.emit('attackPlayer', {
      attackerId: localPlayerIdRef.current,
      targetId: localTargetRef.current,
      segment: hitSegment,
      damage: (2.5 * (powerLevelsRef.current.weapons / 100))
    });

    setAttackCooldown(1);

    // Start countdown timer
    if (attackTimer.current) {
      clearInterval(attackTimer.current);
    };
    attackTimer.current = setInterval(() => {
      setAttackCooldown(prev => {
        if (prev <= 0) {
          clearInterval(attackTimer.current);
          return 0;
        };
        return prev - 1;
      });
    }, 1000);
  }, [localPlayerId, playersPosition, attackCooldown, socketRef, powerLevelsRef]);

  // Add cleanup for attackTimer
  useEffect(() => {
    return () => {
      if (attackTimer.current) {
        clearInterval(attackTimer.current);
      }
    };
  }, [])

  const handlePowerDelegation = (subsystem, subsystemDamage) => {
    setPowerLevels(prev => {
      let updated = { ...prev };
      const BOOST_AMOUNT = 40;
      const DRAIN_AMOUNT = BOOST_AMOUNT / 2; // 10 from each system

      // Calculate max subsystem availability based on damage
      const maxWeapons = 300 * (1 - (subsystemDamage.weapons / 100));
      const maxShields = 300 * (1 - (subsystemDamage.shields / 100));
      const maxEngines = 300 * (1 - (subsystemDamage.engines / 100));
  
      switch(subsystem) {
        case 'weapons':
          if (updated.weapons < maxWeapons && (updated.shields >= 1 || updated.engines >= 1)) {
            // Calculate available drain from each system
            const shieldDrain = Math.min(DRAIN_AMOUNT, updated.shields);
            const engineDrain = Math.min(DRAIN_AMOUNT, updated.engines);
            const totalBoost = shieldDrain + engineDrain;
  
            // Calculate how much boost is available based on maximum
            const availableBoost = maxWeapons - updated.weapons;
            const actualBoost = Math.min(totalBoost, availableBoost);

            if (actualBoost > 0) {
              updated.weapons += actualBoost;
              // Scale drains proportionally if unable to use full boost
              const drainRatio = actualBoost / totalBoost;
              updated.shields -= shieldDrain * drainRatio;
              updated.engines -= engineDrain * drainRatio;
            }
          }
          break;
  
          case 'shields':
            if (updated.shields < maxShields && (updated.weapons >= 1 || updated.engines >= 1)) {
              const weaponDrain = Math.min(DRAIN_AMOUNT, updated.weapons);
              const engineDrain = Math.min(DRAIN_AMOUNT, updated.engines);
              const totalBoost = weaponDrain + engineDrain;
  
              const availableBoost = maxShields - updated.shields;
              const actualBoost = Math.min(totalBoost, availableBoost);
  
              if (actualBoost > 0) {
                updated.shields += actualBoost;
                const drainRatio = actualBoost / totalBoost;
                updated.weapons -= weaponDrain * drainRatio;
                updated.engines -= engineDrain * drainRatio;
              }
            }
            break;
  
            case 'engines':
              if (updated.engines < maxEngines && (updated.weapons >= 1 || updated.shields >= 1)) {
                const weaponDrain = Math.min(DRAIN_AMOUNT, updated.weapons);
                const shieldDrain = Math.min(DRAIN_AMOUNT, updated.shields);
                const totalBoost = weaponDrain + shieldDrain;
    
                const availableBoost = maxEngines - updated.engines;
                const actualBoost = Math.min(totalBoost, availableBoost);
    
                if (actualBoost > 0) {
                  updated.engines += actualBoost;
                  const drainRatio = actualBoost / totalBoost;
                  updated.weapons -= weaponDrain * drainRatio;
                  updated.shields -= shieldDrain * drainRatio;
                }
              }
              break;

        case 'balance':
          const targetBalance = 100;

          let balancedPower = {
            weapons: Math.min(targetBalance, maxWeapons),
            shields: Math.min(targetBalance, maxShields),
            engines: Math.min(targetBalance, maxEngines),
          };

          // Calculate excess power from systems that couldn't take full balancce amount
          const totalExcess = (targetBalance * 3) - (balancedPower.weapons + balancedPower.shields + balancedPower.engines);

          if (totalExcess > 0) {
            // Find systems that can take more power
            const availableSystems = Object.entries(maxValues)
              .filter(([SystemManager, maxVal]) => maxVal > balancedPower[system])
              .map(([system]) => system);

            if (availableSystems.length > 0) {
              // Distribute excess evenly among available systems
              const powerPerSystem = totalExcess / availableSystems.length;
              availableSystems.forEach(system => {
                const roomForMore = maxValues[system] - balancedPower[system];
                balancedPower[system] += Math.min(powerPerSystem, roomForMore);
              });
            }
          }

          updated = balancedPower;
          break;
      }     

      return updated;
    });
  };

  /*
  / Key Bindings
  */
  useEffect(() => {
    const handleKeyDown = (e) => keysPressed.current.add(e.key);
    const handleKeyUp = (e) => keysPressed.current.delete(e.key);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const gameLoop = () => {
      if (localPlayerId) {
        setPlayersPosition(currentPlayers => {
          const player = currentPlayers.get(localPlayerId);
          if (!player) return currentPlayers;

          const updated = new Map(currentPlayers);
  
          let moved = false;

          if (!isDestroyedRef.current) {
            // Rotation with reduced speed
            if (
              keysPressed.current.has('ArrowLeft') ||
              keysPressed.current.has('a') ||
              keysPressed.current.has('A'))
            {
              player.rotation -= (physics.rotationSpeed * (powerLevelsRef.current.engines / 200));
              moved = true;
            }
            if (
              keysPressed.current.has('ArrowRight') ||
              keysPressed.current.has('d') ||
              keysPressed.current.has('D'))
            {
              player.rotation += (physics.rotationSpeed * (powerLevelsRef.current.engines / 200));
              moved = true;
            }

            // Apply thrust with acceleration and max speed
            if (
              keysPressed.current.has('ArrowUp') ||
              keysPressed.current.has('w') ||
              keysPressed.current.has('W'))
            {
              const accelerationX = Math.sin(player.rotation) * (physics.acceleration * (powerLevelsRef.current.engines / 200));
              const accelerationY = -Math.cos(player.rotation) * (physics.acceleration * (powerLevelsRef.current.engines / 200));
              
              player.velocityX += accelerationX;
              player.velocityY += accelerationY;
              
              moved = true;
            }

            if (
              keysPressed.current.has('ArrowDown') ||
              keysPressed.current.has('s') ||
              keysPressed.current.has('S'))
            {
              // Apply reverse thrust and acceleration
              const accelerationX = -Math.sin(player.rotation) * (physics.acceleration * (powerLevelsRef.current.engines / 200));
              const accelerationY = Math.cos(player.rotation) * (physics.acceleration * (powerLevelsRef.current.engines / 200));
  
              player.velocityX += accelerationX;
              player.velocityY += accelerationY;
  
              moved = true
            }
  
            // Apply friction and update position
            player.velocityX *= physics.friction;
            player.velocityY *= physics.friction;
  
            // Limit speed
            const currentSpeed = Math.sqrt(player.velocityX ** 2 + player.velocityY ** 2);
            if (currentSpeed > (physics.maxSpeed * (powerLevelsRef.current.engines / 200))) {
              const scale = (physics.maxSpeed * (powerLevelsRef.current.engines / 200)) / currentSpeed;
              player.velocityX *= scale;
              player.velocityY *= scale;
            }
  
            // Update position
            if (Math.abs(player.velocityX) > 0.01 || Math.abs(player.velocityY) > 0.01) {
              player.x += player.velocityX;
              player.y += player.velocityY;
              moved = true;
            }
  
            // World bounds wrapping
            player.x = ((player.x + worldBounds.width) % worldBounds.width);
            player.y = ((player.y + worldBounds.height) % worldBounds.height);
  
            if (moved) {
              socketRef.current?.emit('playerUpdate', {
                x: player.x,
                y: player.y,
                rotation: player.rotation
              });
            }

          }
    
          return updated;
        });
  
        // Attack
        if (keysPressed.current.has('e') || keysPressed.current.has('E')) {          
          handleAttack();
          keysPressed.current.delete('e');
          keysPressed.current.delete('E');
        }

        /*
        / Power Delegation
        */
       // Weapons
        if (keysPressed.current.has('z') || keysPressed.current.delete('Z')) {
          handlePowerDelegation('weapons', playersShieldsRef.current.get(localPlayerIdRef.current).damage);
          keysPressed.current.delete('z');
          keysPressed.current.delete('Z');
        }
        // Shields
        if (keysPressed.current.has('x') || keysPressed.current.delete('X')) {
          handlePowerDelegation('shields', playersShieldsRef.current.get(localPlayerIdRef.current).damage);
          keysPressed.current.delete('x');
          keysPressed.current.delete('X');
        }
        // Engines
        if (keysPressed.current.has('c') || keysPressed.current.delete('C')) {
          handlePowerDelegation('engines', playersShieldsRef.current.get(localPlayerIdRef.current).damage);
          keysPressed.current.delete('c');
          keysPressed.current.delete('C');
        }
        // Balance
        if (keysPressed.current.has('v') || keysPressed.current.delete('V')) {
          handlePowerDelegation('balance', playersShieldsRef.current.get(localPlayerIdRef.current).damage);
          keysPressed.current.delete('v');
          keysPressed.current.delete('V');
        }
      }
  
      requestRef.current = requestAnimationFrame(gameLoop);
    };

    requestRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(requestRef.current);
    };
  }, [localPlayerId]);

  const localPlayer = localPlayerId ? playersPosition.get(localPlayerId) : null;
  const localShields = localPlayerId ? playersShields.get(localPlayerId) : null;

  const cameraX = localPlayer ? localPlayer.x - 400 : 0;
  const cameraY = localPlayer ? localPlayer.y - 300 : 0;

  return (
    <div className="w-full h-full">
      <div className="relative w-[800px] h-[600px] canvas-wrapper">
        <Stage 
          width={800} 
          height={600}
          options={{
            backgroundColor: 0x000000,
            eventMode: 'static',
            eventFeatures: {
              move: true,
              globalMove: true,
              click: true,
              wheel: true
            }
          }}
        >
          <Container>
            <StarLayer stars={starLayers[0]} parallaxFactor={0.2} cameraX={cameraX} cameraY={cameraY} />
            <StarLayer stars={starLayers[1]} parallaxFactor={0.5} cameraX={cameraX} cameraY={cameraY} />
            <StarLayer stars={starLayers[2]} parallaxFactor={0.8} cameraX={cameraX} cameraY={cameraY} />
            
            <Container x={-cameraX} y={-cameraY}>  
              {Array.from(playersPositionRef.current.values()).map((player) => {

                return (
                  <Container
                    key={`player-${player.id}`}
                    x={player.x}
                    y={player.y}
                  >
                    {!player.isDestroyed && (
                      <Ship
                        id={player.id}
                        rotation={player.rotation}
                        isLocal={player.id === localPlayerId}
                        onTargetClick={handleTargetClick}
                      />
                    )}
                  </Container>
                )}
              )}

              {Array.from(debrisFieldRef.current.values()).map((debris) => {
                // console.log('debris', debris);
                return (
                  <Container
                    key={`debris-${debris.id}`}
                    x={debris.x}
                    y={debris.y}
                  >
                    <Debris
                      id={debris.id}
                      rotation={debris.rotation}
                      onTargetClick={handleTargetClick}
                    />
                  </Container>
                )}
              )}
            </Container>

            <Container x={-cameraX} y={-cameraY}>
              {activeAttacks.map(attack => {
                return (
                  <AttackLine
                    key={attack.id}
                    fromId={attack.from}
                    toId={attack.to}
                    playersPosition={playersPositionRef.current}
                  />
                )
              })}
              {Array.from(explosions).map(([playerId, pos]) => (
                <ParticleExplosion
                  key={playerId}
                  x={pos.x}
                  y={pos.y}
                  onComplete={() => {
                    setExplosions(prev => {
                      const updated = new Map(prev);
                      updated.delete(playerId);
                      return updated;
                    });
                  }}
                />
              ))}
            </Container>
          </Container>
        </Stage>
      
        {isDestroyed && <DestroyedOverlay />}

        <div className="HUD">
          {localPlayer && localShields && (
            <div className="HUD-wrapper-left">
              <HUD
                player={{
                  ...localPlayer,
                  shields: localShields || {
                    segments: {
                      front: 25,
                      right: 25,
                      left: 25,
                      back: 25
                    },
                    total: 100,
                    hull: 100,
                    damage: {
                      weapons: 0,
                      shields: 0,
                      engines: 0,
                    }
                  }
                }}
                attackCooldown={attackCooldown}
                power={powerLevels}
                subsystemDamage={playersShieldsRef.current.get(localPlayerIdRef.current)?.damage || {
                  weapons: 0,
                  shields: 0,
                  engines: 0
                }}
              />
            </div>
          )}
          {localTargetRef.current && playersPositionRef.current.has(localTargetRef.current) ? (
            <div className="HUD-wrapper-right">
              <TargetHUD
                target={{
                  ...playersPosition.get(localTargetRef.current),
                  shields: playersShields.get(localTargetRef.current) || {
                    segments: {
                      front: 25,
                      right: 25,
                      back: 25,
                      left: 25
                    },
                    total: 100,
                    hull: 100,
                    damage: {
                      weapons: 0,
                      shields: 0,
                      engines: 0
                    }
                  }
                }} 
                isInRange={isInRange(playersPosition.get(localPlayerIdRef.current), playersPosition.get(localTargetRef.current), range)}
              />
            </div>
          ) : localTargetRef.current && debrisFieldRef.current.has(localTargetRef.current) ? (
            <div className="HUD-wrapper-right">
              <TargetHUD
                target={{
                  ...debrisFieldRef.current.get(localTargetRef.current)
                }}
                isInRange={isInRange(debrisFieldRef.current.get(localPlayerIdRef.current), debrisFieldRef.current.get(localTargetRef.current), range)}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Game;