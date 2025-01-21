import React, { useState, useEffect } from 'react';
import './assets/lobby.css';

const Lobby = ({ socket, onJoinGame }) => {
    const [players, setPlayers] = useState([]);
    const [playerName, setPlayerName] = useState('');
    const [isReady, setIsReady] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [hasJoinedLobby, setHasJoinedLobby] = useState(false);

    // Initialize lobby socket and calls
    useEffect(() => {
        if (!socket) return;

        socket.on('lobby:players', (updatedPlayers) => {
            setPlayers(updatedPlayers);
        });

        socket.on('lobby:message', (message) => {
            setChatMessages(prev => [...prev, message]);
        });

        socket.on('game:start', () => {
            onJoinGame();
        });

        return () => {
            socket.off('lobby:players');
            socket.off('lobby:message');
            socket.off('game:start');
        };
    }, [socket, onJoinGame]);

    const handleReadyToggle = () => {
        setIsReady(!isReady);
        socket.emit('lobby:ready', !isReady);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!messageInput.trim()) return;

        socket.emit('lobby:message', {
            player:playerName,
            content: messageInput
        });
        setMessageInput('');
    };

    const handleNameSubmit = (e) => {
        e.preventDefault();
        if (!playerName.trim()) return;
        socket.emit('lobby:join', playerName);
        setHasJoinedLobby(true);
    };

    const handleNameChange = (e) => {
      setPlayerName(e.target.value);
    };

    return (
        <div className="lobby-container">
          {/* Player List Section */}
          {hasJoinedLobby ? (
            <div className="player-list">
              <div className="section-header">
                <h2>Players ({players.length}/8)</h2>
              </div>
              <div className="players">
                {players.map((player) => (
                  <div key={player.id} className="player-item">
                    <span className={`player-status ${player.ready ? 'ready' : ''}`}>●</span>
                    <span className="player-name">{player.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
    
          {/* Chat and Controls Section */}
          <div className="lobby-controls">
            {!hasJoinedLobby ? (
              <div className="name-entry">
                <form onSubmit={handleNameSubmit}>
                  <input
                    type="text"
                    placeholder="Enter the name of your ship"
                    value={playerName}
                    onChange={handleNameChange}
                    className="name-input"
                  />
                  <button type="submit" className="join-button">
                    Join Lobby
                  </button>
                </form>
              </div>
            ) : (
              <>
                <div className="chat-container">
                  <div className="chat-messages">
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className="chat-message">
                        <span className="message-sender">{msg.player}: </span>
                        <span className="message-content">{msg.content}</span>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleSendMessage} className="chat-input-form">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      className="chat-input"
                    />
                    <button type="submit" className="send-button">
                      Send
                    </button>
                  </form>
                </div>
                <button 
                  onClick={handleReadyToggle}
                  className={`ready-button ${isReady ? 'ready' : ''}`}
                >
                  {isReady ? 'Ready!' : 'Ready Up'}
                </button>
              </>
            )}
          </div>
        </div>
    );
}

export default Lobby;