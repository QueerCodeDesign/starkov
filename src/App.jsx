import React, { useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import Game from './Game';
import Lobby from './Lobby';

const App = () => {
  const [inGame, setInGame] = useState(false);
  const [socketInitialized, setSocketInitialized] = useState(false);
  const socketRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io('http://localhost:3001', {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });
    }
    
    socketRef.current.on('connect', () => {
      setSocketInitialized(true);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const handleJoinGame = () => {
    if (socketRef.current && socketRef.current.connected) {
      setInGame(true);
    }
  };

  if (!socketInitialized) {
    return <div>Connecting to server...</div>;
  };

  return (
    <div className="app-wrapper">
      {!inGame ? (
        <Lobby
          socket={socketRef.current}
          onJoinGame={handleJoinGame}
        />
      ) : (
        <Game
          socket={socketRef.current}
        />
      )}
    </div>
  );
};

export default App;