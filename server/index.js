const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: "http://localhost:5173", // Vite's default port
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 3001;

// Store connected players positions and shields
const lobbyPlayers = new Map();
const players = new Map();
const shields = new Map();
const destroyedPlayers = new Map();

const handlePlayerDestruction = (playerId) => {

  const player = players.get(playerId);

  if (player) {
    // Update the player object in the players Map
    players.set(playerId, {
      ... player,
      isDestroyed: true
    });

    // Broadcast destruction event to all clients
    io.emit('playerDestroyed', {
      playerId: playerId,
      finalPosition: {
        x: player.x,
        y: player.y,
        velocityX: player.velocityX,
        velocityY: player.velocityY
      },
      isDestroyed: true
    });
  }
};

io.on('connection', (socket) => {
  
  socket.on('lobby:join', (playerName) => {
    console.log(`Player ${playerName} joined the lobby`);
    lobbyPlayers.set(socket.id, {
      id: socket.id,
      name: playerName,
      ready: false
    });

    io.emit('lobby:players', Array.from(lobbyPlayers.values()));
  });

  socket.on('lobby:ready', (isReady) => {
    const player = lobbyPlayers.get(socket.id);
    if (player) {
      player.ready = isReady;
      io.emit('lobby:players', Array.from(lobbyPlayers.values()));

      const allPlayers = Array.from(lobbyPlayers.values());
      const allReady = allPlayers.every(p => p.ready);

      if (allReady && lobbyPlayers.size >= 2) {
        
        allPlayers.forEach(player => {
          // Initialize player with random position
          const newPlayer = {
            id: player.id,
            x: Math.random() * 1000,
            y: Math.random() * 1000,
            rotation: 0,
            velocityX: 0,
            velocityY: 0,
            isDestroyed: false
          };

          // Initialize new player's shields
          const newShields = {
            id: player.id,
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
          };
          
          // Set player stats into game
          players.set(player.id, newPlayer);
          shields.set(player.id, newShields);

          // Remove player from lobby
          lobbyPlayers.delete(player.id);
        });

        
        // Send initial game state to all players
        io.emit('currentPlayers', Array.from(players.values()));
        io.emit('currentShields', Array.from(shields.values()));
        io.emit('game:start');
      }
    }
  });

  socket.on('requestGameState', () => {
    socket.emit('currentPlayers', Array.from(players.values()));
    socket.emit('currentShields', Array.from(shields.values()));
  });

  // Lobby Chat
  socket.on('lobby:message', (message) => {
    io.emit('lobby:message', message);
  });

  // Handle player movement updates
  socket.on('playerUpdate', (playerData) => {
    if (players.has(socket.id)) {
      players.set(socket.id, {...players.get(socket.id), ...playerData});
      socket.broadcast.emit('playerMoved', {
        id: socket.id,
        ...playerData
      });
    }
  });

  // Handle player shield updates
  socket.on('shieldUpdate', (shieldData) => {
    if (shields.has(socket.id)) {
      if(shieldData.hull <= 0 && !destroyedPlayers.has(socket.id)) {
        handlePlayerDestruction(socket.id);
      }
      if (players.has(socket.id)) {
        shields.set(socket.id, {...shields.get(socket.id), ...shieldData});
        io.emit('playerShieldUpdate', {
          id: socket.id,
          ...shieldData
        });
      }
    }
  });

  socket.on('targetPlayer', ({ targeterId, targetId }) => {
    socket.broadcast.emit('playerTargeted', { targeterId, targetId })
  });

  socket.on('attackPlayer', ({ attackerId, targetId, segment, damage }) => {   
    io.emit('playerAttacked', {
      attackerId,
      targetId,
      segment,
      damage
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Player disconnected', socket.id);
    lobbyPlayers.delete(socket.id);
    players.delete(socket.id);
    shields.delete(socket.id);
    destroyedPlayers.delete(socket.id);
    io.emit('lobby:players', Array.from(lobbyPlayers.values()));
    io.emit('playerLeft', socket.id);
    io.emit('playerUntargeted', {
      targeterId: socket.id,
      targetId: socket.id
    });
  });
});

http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});