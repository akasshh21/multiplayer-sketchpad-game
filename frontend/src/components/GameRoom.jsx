import { useState, useEffect, useRef } from 'react';
import socketService from '../services/socket';
import DrawingCanvas from './DrawingCanvas';

function GameRoom({ roomCode, playerData }) {
  const [roster, setRoster] = useState([]);
  const [drawerId, setDrawerId] = useState(null);
  const [activeWord, setActiveWord] = useState('');
  const [cluePattern, setCluePattern] = useState('');
  const [candidateWords, setCandidateWords] = useState([]);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [chatLog, setChatLog] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [roundNo, setRoundNo] = useState(0);

  const canvasRef = useRef(null);

  const isDrawer = playerData.id === drawerId;

  useEffect(() => {
    const socket = socketService.getSocket();

    socket.on('player_list_update', (data) => {
      setRoster(data.players);
    });

    socket.on('game_started', (data) => {
      setDrawerId(data.drawer_id);
      setRoundNo(data.round);
      setSecondsRemaining(data.duration);
      setChatLog((prev) => [...prev, {
        type: 'system',
        message: `Round ${data.round} started.`
      }]);
    });


    socket.on('word_selection', (data) => {
      setCandidateWords(data.words);
      setActiveWord('');
      setCluePattern('');
    });


    socket.on('round_started', (data) => {
      setCluePattern(data.hint);
      setDrawerId(data.drawer_id);
      setSecondsRemaining(data.duration);
      setCandidateWords([]);
      setChatLog((prev) => [...prev, {
        type: 'system',
        message: `Prompt: ${data.hint}`
      }]);
    });

    socket.on('drawing_ready', (data) => {
      setActiveWord(data.word);
      setSecondsRemaining(data.duration);
      setChatLog((prev) => [...prev, {
        type: 'system',
        message: `You are drawing: ${data.word}`
      }]);
    });

    socket.on('draw_update', (data) => {
      if (canvasRef.current) {
        canvasRef.current.drawRemoteStroke(data.stroke);
      }
    });

    socket.on('canvas_cleared', () => {
      if (canvasRef.current) {
        canvasRef.current.clearCanvas();
      }
    });


    socket.on('chat_message', (data) => {
      setChatLog((prev) => [...prev, data]);
    });

    socket.on('correct_guess', (data) => {
      setChatLog((prev) => [...prev, {
        type: 'system',
        message: `${data.player_name} guessed the word (+${data.score})`
      }]);

      setRoster(prev =>
        prev.map(p =>
          p.id === data.player_id
            ? { ...p, score: data.total_score }
            : p
        )
      );
    });

    socket.on('close_guess', (data) => {
      setChatLog((prev) => [...prev, {
        type: 'hint',
        message: data.message
      }]);
    });

    socket.on('round_ended', (data) => {
      setActiveWord('');
      setCluePattern('');
      setCandidateWords([]);
      setSecondsRemaining(0);
      setChatLog((prev) => [...prev, {
        type: 'system',
        message: `Round ended. The word was: ${data.word}`
      }]);

      setRoster(prev =>
        prev.map(p => ({
          ...p,
          score: data.scores[p.id] || p.score
        }))
      );

      if (canvasRef.current) {
        canvasRef.current.clearCanvas();
      }
    });

    return () => {
      socket.off('player_list_update');
      socket.off('game_started');
      socket.off('word_selection');
      socket.off('round_started');
      socket.off('drawing_ready');
      socket.off('draw_update');
      socket.off('canvas_cleared');
      socket.off('chat_message');
      socket.off('correct_guess');
      socket.off('close_guess');
      socket.off('round_ended');
    };
  }, [playerData.id, drawerId]);




  useEffect(() => {
    if (secondsRemaining > 0 && (activeWord || cluePattern)) {
      const timer = setTimeout(() => setSecondsRemaining(secondsRemaining - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [secondsRemaining, activeWord, cluePattern]);


  const selectWord = (word) => {
    const socket = socketService.getSocket();
    socket.emit('word_chosen', {
      room_code: roomCode,
      word
    });
    setCandidateWords([]);
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;

    const socket = socketService.getSocket();
    socket.emit('chat_message', {
      room_code: roomCode,
      player_id: playerData.id,
      message: chatInput
    });
    setChatInput('');
  };

  const handleDraw = (strokeData) => {
    const socket = socketService.getSocket();
    socket.emit('draw_stroke', {
      room_code: roomCode,
      stroke: strokeData
    });
  };


  const handleClear = () => {
    const socket = socketService.getSocket();
    socket.emit('clear_canvas', { room_code: roomCode });
  };

  useEffect(() => {
    const sync = async () => {
      try{
        const res = await fetch(`http://localhost:8000/api/room/${roomCode}`);
        if(!res.ok) return;
        const room = await res.json();

        setRoster(Object.values(room.players || {}));
        setDrawerId(room.current_drawer_id || null);
        setRoundNo(room.current_round || 0);

        const iAmDrawer = playerData.id === room.current_drawer_id;
        const roundNotStarted = room.game_started && !room.secret_word;

        if(iAmDrawer && roundNotStarted) {
          const socket = socketService.getSocket();
          socket.emit('request_word_choices', { room_code: roomCode });
        }
      }catch(e){
        console.error('Failed to sync room state', e);
      }
    };
    sync();
  }, [roomCode, playerData.id]);

  return(
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-900 rounded-lg p-4 mb-4 border-2 border-red-600">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="text-white">
              <span className="text-xl font-bold">Room: {roomCode}</span>
              {roundNo > 0 && (
                <span className="ml-4 text-lg">Round: {roundNo}</span>
              )}
            </div>
            <div className="text-white text-2xl font-bold">
              {secondsRemaining}s
            </div>
          </div>

          {drawerId && (
            <div className="mt-2 text-center">
              {isDrawer ? (
                <div className="text-xl font-bold text-yellow-400 bg-yellow-900 bg-opacity-30 rounded p-2">
                  You are drawing
                </div>
              ) : (
                <div className="text-xl font-bold text-blue-400">
                  {roster.find(p => p.id === drawerId)?.name || 'Someone'} is drawing
                </div>
              )}
            </div>
          )}

          {cluePattern && !isDrawer && (
            <div className="text-center mt-2 text-2xl font-bold text-yellow-400 bg-yellow-900 bg-opacity-20 rounded p-3">
              Hint: {cluePattern}
            </div>
          )}

          {activeWord && isDrawer && (
            <div className="text-center mt-2 text-3xl font-bold text-green-400 bg-green-900 bg-opacity-30 rounded p-3">
              Draw: {activeWord}
            </div>
          )}
        </div>

        {candidateWords.length > 0 && isDrawer && (
          <div className="bg-gray-900 rounded-lg p-6 mb-4 border-2 border-yellow-500">
            <h3 className="text-white text-xl font-bold mb-3 text-center">
              Choose a word to draw:
            </h3>
            <div className="flex gap-4 justify-center flex-wrap">
              {candidateWords.map((word) => (
                <button
                  key={word}
                  onClick={() => selectWord(word)}
                  className="px-6 py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 text-lg transition"
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            <DrawingCanvas
              ref={canvasRef}
              isDrawer={isDrawer}
              onDraw={handleDraw}
              onClear={handleClear}
            />
          </div>

          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg p-4 border-2 border-purple-600">
              <h3 className="text-white font-bold mb-2">Players</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {roster.map((player) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-2 rounded ${
                      player.id === drawerId
                        ? 'bg-yellow-600'
                        : 'bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{player.avatar}</span>
                      <span className="text-white text-sm font-medium">
                        {player.name}
                      </span>
                    </div>
                    <span className="text-yellow-400 font-bold text-sm">
                      {player.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-4 border-2 border-blue-600">
              <h3 className="text-white font-bold mb-2">Chat</h3>
              <div className="bg-gray-800 rounded p-2 h-64 overflow-y-auto mb-2">
                {chatLog.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`text-sm mb-1 ${
                      msg.type === 'system'
                        ? 'text-yellow-400 font-bold'
                        : msg.type === 'hint'
                        ? 'text-purple-400 font-bold'
                        : 'text-white'
                    }`}
                  >
                    {msg.player_name && (
                      <span className="font-bold text-blue-400">
                        {msg.player_name}:{' '}
                      </span>
                    )}
                    {msg.message}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder={isDrawer ? "Chat..." : "Guess or chat..."}
                  disabled={isDrawer && activeWord}
                  className="flex-1 px-2 py-1 bg-gray-800 text-white rounded text-sm outline-none disabled:opacity-50"
                />
                <button
                  onClick={sendMessage}
                  disabled={isDrawer && activeWord}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export default GameRoom;