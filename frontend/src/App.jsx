import { useState, useEffect } from 'react';
import './App.css';
import socketService from './services/socket';
import WelcomeScreen from './components/WelcomeScreen';
import GameLobby from './components/GameLobby';
import GameRoom from './components/GameRoom';

function App() {
  const [screen, setScreen] = useState('welcome');
  const [playerData, setPlayerData] = useState(null);
  const [roomCode, setRoomCode] = useState('');

  useEffect(() => {
    const socket = socketService.connect();
    
    return () => {
      socketService.disconnect();
    };
  }, []);


  const handleCreateRoom = async (nickname, avatar) => {
    const playerId = `player_${Date.now()}`;
    setPlayerData({ id: playerId, name: nickname, avatar });
    
    try{
      const res = await fetch('http://localhost:8000/api/create-room', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          player_id: playerId,
          player_name: nickname,
          player_avatar: avatar
        })
      });
      const data = await res.json();
      setRoomCode(data.room_code);
      setScreen('lobby');
    } catch (err) {
      console.error('Failed to create room:', err);
    }
  };


  const handleJoinRoom = async (code, nickname, avatar) => {
      const playerId = `player_${Date.now()}`;
      setPlayerData({ id: playerId, name: nickname, avatar });
      
      try{
          const res = await fetch('http://localhost:8000/api/join-room', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              room_code: code,
              player_id: playerId,
              player_name: nickname,
              player_avatar: avatar
            })
          });
          
          if(res.ok){
            setRoomCode(code);
            setScreen('lobby');
          }
        }catch(err){
          console.error('Failed to join room:', err);
        }
  };

  return(
      <div className="min-h-screen web-pattern">
        {screen === 'welcome' && (
            <WelcomeScreen 
              onCreateRoom={handleCreateRoom}
              onJoinRoom={handleJoinRoom}
            />
        )}
        {screen === 'lobby' && (
            <GameLobby 
              roomCode={roomCode}
              playerData={playerData}
              onStartGame={() => setScreen('game')}
            />
        )}
        {screen === 'game' && (
            <GameRoom 
              roomCode={roomCode}
              playerData={playerData}
            />
        )}
      </div>
    );
}

export default App;