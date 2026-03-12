import { useState, useEffect } from 'react';
import socketService from '../services/socket';



function GameLobby({ roomCode, playerData, onStartGame }){
  const [players, setPlayers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');

  useEffect(() => {
    const socket = socketService.getSocket();
    
    socket.emit('join_room', {
      room_code: roomCode,
      player_id: playerData.id,
      player_name: playerData.name,
      player_avatar: playerData.avatar
    });

    socket.on('player_list_update', (data) => {
      setPlayers(data.players);
    });

    socket.on('chat_message', (data) => {
      setChatMessages((prev) => [...prev, data]);
    });

    socket.on('game_started', () => {
      onStartGame();
    });


    return () => {
      socket.off('player_list_update');
      socket.off('chat_message');
      socket.off('game_started');
    };
  }, [roomCode, playerData, onStartGame]);

  const sendMessage = () => {
    if(!messageInput.trim()) return;
    
    
    const socket = socketService.getSocket();
    socket.emit('chat_message', {
      room_code: roomCode,
      player_id: playerData.id,
      message: messageInput
    });
    setMessageInput('');
  };

  const startGame = () => {
    const socket = socketService.getSocket();
    socket.emit('start_game', { room_code: roomCode });
  };

  return(
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="bg-gray-900 rounded-lg p-6 max-w-4xl w-full shadow-2xl border-2 border-red-600">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-red-500 mb-2">LOBBY</h2>
          <p className="text-xl text-white">Room Code: <span className="font-bold text-blue-400">{roomCode}</span></p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gray-800 rounded p-4">
            <h3 className="text-xl font-bold text-white mb-3">PLAYERS ({players.length})</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {players.map((p) => (
                <div key={p.id} className="flex items-center gap-3 bg-gray-700 p-2 rounded">
                  <span className="text-2xl">{p.avatar}</span>
                  <span className="text-white font-medium">{p.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 rounded p-4 flex flex-col">
            <h3 className="text-xl font-bold text-white mb-3">CHAT</h3>
            <div className="flex-1 bg-gray-700 rounded p-2 mb-3 max-h-48 overflow-y-auto">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className="text-sm text-white mb-1">
                  <span className="font-bold text-blue-400">{msg.player_name}:</span> {msg.message}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type message..."
                className="flex-1 px-3 py-2 bg-gray-700 text-white rounded outline-none"
              />
              <button
                onClick={sendMessage}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                SEND
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={startGame}
          className="w-full mt-6 py-3 bg-green-600 text-white font-bold text-xl rounded hover:bg-green-700 transition"
        >
          START GAME
        </button>
      </div>
    </div>
  );
}




export default GameLobby;