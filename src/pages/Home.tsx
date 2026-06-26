import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');

  const createNewRoom = (e: React.MouseEvent) => {
    e.preventDefault();
    const id = uuidv4();
    setRoomId(id);
    toast.success('New room created');
  };

  const joinRoom = () => {
    if (!roomId || !username) {
      toast.error('Room ID and username are required');
      return;
    }
    navigate(`/editor/${roomId}`, { state: { username } });
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') joinRoom();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md bg-surface-raised border border-surface-border rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-accent/20 text-accent text-2xl font-bold mb-4">
            {'</>'}
          </div>
          <h1 className="text-2xl font-bold text-zinc-100">CodeCollab</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Real-time editor with AI code review
          </p>
        </div>

        <div className="space-y-3">
          <input
            className="w-full px-4 py-3 rounded-lg bg-surface border border-surface-border text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-accent transition-colors"
            type="text"
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            onKeyUp={handleKeyUp}
          />
          <input
            className="w-full px-4 py-3 rounded-lg bg-surface border border-surface-border text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-accent transition-colors"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyUp={handleKeyUp}
          />
          <button
            className="w-full py-3 rounded-lg bg-accent hover:bg-accent-hover text-white font-medium transition-colors"
            onClick={joinRoom}
          >
            Join Room
          </button>
          <p className="text-center text-sm text-zinc-500">
            No invite?{' '}
            <button
              onClick={createNewRoom}
              className="text-accent hover:text-accent-hover underline underline-offset-2"
            >
              Create a new room
            </button>
          </p>
        </div>
      </div>

      <footer className="mt-8 text-sm text-zinc-600">
        Built by{' '}
        <a
          href="https://github.com/Aakash2512git"
          target="_blank"
          rel="noreferrer"
          className="text-accent hover:text-accent-hover"
        >
          Aakash
        </a>
      </footer>
    </div>
  );
};

export default Home;
