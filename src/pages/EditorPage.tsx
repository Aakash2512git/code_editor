import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, Navigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import type { Socket } from 'socket.io-client';
import Client from '../components/Client';
import CodeEditor from '../components/CodeEditor';
import AISidePanel from '../components/AISidePanel';
import { initSocket } from '../socket';
import { ACTIONS, type ClientInfo } from '../actions';
import { DEFAULT_CODE } from '../constants';

interface LocationState {
  username: string;
}

const EditorPage = () => {
  const codeRef = useRef<string>(DEFAULT_CODE);
  const location = useLocation();
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  const [socket, setSocket] = useState<Socket | null>(null);
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [output, setOutput] = useState('');
  const [compiling, setCompiling] = useState(false);
  const [code, setCode] = useState(DEFAULT_CODE);
  const [showAI, setShowAI] = useState(true);

  const handleCodeChange = (newCode: string) => {
    codeRef.current = newCode;
    setCode(newCode);
  };

  const handleCompile = async () => {
    setCompiling(true);
    try {
      const response = await axios.post('/api/compile', {
        code: codeRef.current,
      });
      setOutput(
        typeof response.data === 'string'
          ? response.data
          : JSON.stringify(response.data, null, 2)
      );
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Compilation failed. Is the API server running? (npm run dev:api)';
      toast.error(message);
      setOutput(message);
    } finally {
      setCompiling(false);
    }
  };

  useEffect(() => {
    if (!roomId || !state?.username) return;

    const socketInstance = initSocket();

    const handleErrors = () => {
      toast.error('Socket connection failed. Is the collab server running?');
      navigate('/');
    };

    socketInstance.on('connect_error', handleErrors);
    socketInstance.on('connect_failed', handleErrors);

    const onConnect = () => {
      setSocket(socketInstance);
      socketInstance.emit(ACTIONS.JOIN, { roomId, username: state.username });
    };

    if (socketInstance.connected) {
      onConnect();
    } else {
      socketInstance.on('connect', onConnect);
    }

    socketInstance.on(ACTIONS.JOINED, ({ clients, username, socketId }) => {
      if (username !== state.username) {
        toast.success(`${username} joined the room`);
      }
      setClients(clients);
      socketInstance.emit(ACTIONS.SYNC_CODE, {
        code: codeRef.current,
        socketId,
      });
    });

    socketInstance.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
      toast.success(`${username} left the room`);
      setClients((prev) => prev.filter((c) => c.socketId !== socketId));
    });

    return () => {
      socketInstance.off('connect', onConnect);
      socketInstance.disconnect();
      socketInstance.off(ACTIONS.JOINED);
      socketInstance.off(ACTIONS.DISCONNECTED);
      setSocket(null);
    };
  }, [roomId, state?.username, navigate]);

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId!);
      toast.success('Room ID copied');
    } catch {
      toast.error('Could not copy room ID');
    }
  };

  if (!state) {
    return <Navigate to="/" />;
  }

  return (
    <div className="h-screen grid grid-cols-[240px_1fr_auto] overflow-hidden">
      {/* Left sidebar */}
      <aside className="flex flex-col bg-surface-raised border-r border-surface-border p-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-surface-border">
            <div className="w-8 h-8 rounded-lg bg-accent/20 text-accent flex items-center justify-center text-sm font-bold">
              {'</>'}
            </div>
            <span className="font-semibold text-sm text-zinc-200">CodeCollab</span>
          </div>

          <h3 className="text-xs text-zinc-500 uppercase tracking-wide mb-3">
            Connected ({clients.length})
          </h3>
          <div className="flex flex-wrap gap-4 mb-6">
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={copyRoomId}
            className="w-full py-2 rounded-lg border border-surface-border text-sm text-zinc-300 hover:border-accent transition-colors"
          >
            Copy Room ID
          </button>
          <button
            onClick={handleCompile}
            disabled={compiling}
            className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {compiling ? 'Running…' : 'Run Code'}
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full py-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-sm font-medium transition-colors"
          >
            Leave Room
          </button>
        </div>

        {output && (
          <div className="mt-4 p-3 rounded-lg bg-surface border border-surface-border max-h-40 overflow-auto">
            <h4 className="text-xs text-zinc-500 uppercase mb-2">Output</h4>
            <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono">{output}</pre>
          </div>
        )}
      </aside>

      {/* Editor */}
      <main className="relative flex flex-col min-w-0">
        <div className="flex items-center justify-between px-4 py-2 border-b border-surface-border bg-surface-raised">
          <span className="text-xs text-zinc-500 font-mono truncate">
            Room: {roomId}
          </span>
          <button
            onClick={() => setShowAI((v) => !v)}
            className="text-xs px-3 py-1.5 rounded-lg border border-surface-border hover:border-accent text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            {showAI ? 'Hide AI' : 'Show AI'}
          </button>
        </div>
        <div className="flex-1 min-h-0">
          {socket ? (
            <CodeEditor
              socket={socket}
              roomId={roomId!}
              onCodeChange={handleCodeChange}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
              Connecting to room…
            </div>
          )}
        </div>
      </main>

      {/* AI side panel */}
      {showAI && (
        <div className="w-80 min-w-[280px]">
          <AISidePanel code={code} language="cpp" />
        </div>
      )}
    </div>
  );
};

export default EditorPage;
