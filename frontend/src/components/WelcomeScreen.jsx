import { useState } from 'react';

const avatars = [
  '🕷️', '🕸️', '🦸', '👨‍🦱', '👩‍🦱', '🦹‍♂️', '🦹‍♀️', '🎭'
];

function WelcomeScreen({ onCreateRoom, onJoinRoom }) {
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState(null);

  const handleSubmit = () => {
    if (!nickname.trim()) return;
    
    if (mode === 'create') {
      onCreateRoom(nickname, selectedAvatar);
    } else if (mode === 'join' && joinCode.trim()) {
      onJoinRoom(joinCode.toUpperCase(), nickname, selectedAvatar);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="bg-gray-900 rounded-lg p-8 max-w-md w-full shadow-2xl border-2 border-red-600">
        <h1 className="text-5xl font-bold text-center mb-2 glow-text" style={{ fontFamily: "'Bebas Neue', sans-serif", color: '#e23636' }}>
          WEB SLINGER'S
        </h1>
        <h2 className="text-3xl font-bold text-center mb-8 text-blue-400">
          SKETCHPAD
        </h2>

        {!mode ? (
          <div className="space-y-4">
            <button
              onClick={() => setMode('create')}
              className="w-full py-3 bg-red-600 text-white font-bold rounded hover:bg-red-700 transition"
            >
              CREATE NEW WEB
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 transition"
            >
              JOIN A WEB
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Web-Slinger Nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-red-500 outline-none"
              maxLength={20}
            />

            <div className="grid grid-cols-4 gap-2">
              {avatars.map((av) => (
                <button
                  key={av}
                  onClick={() => setSelectedAvatar(av)}
                  className={`text-3xl p-2 rounded transition ${
                    selectedAvatar === av ? 'bg-red-600' : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>

            {mode === 'join' && (
              <input
                type="text"
                placeholder="ROOM CODE"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500 outline-none uppercase"
                maxLength={5}
              />
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setMode(null)}
                className="flex-1 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
              >
                BACK
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-2 bg-green-600 text-white font-bold rounded hover:bg-green-700 transition"
              >
                GO
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default WelcomeScreen;