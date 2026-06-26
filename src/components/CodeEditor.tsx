import { useRef, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import type { OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { ACTIONS } from '../actions';
import { DEFAULT_CODE } from '../constants';
import type { Socket } from 'socket.io-client';

interface CodeEditorProps {
  socket: Socket;
  roomId: string;
  onCodeChange: (code: string) => void;
}

const CodeEditor = ({ socket, roomId, onCodeChange }: CodeEditorProps) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const isRemoteUpdate = useRef(false);
  const pendingRemoteCode = useRef<string | null>(null);

  const applyRemoteCode = useCallback(
    (code: string) => {
      const editorInstance = editorRef.current;
      if (!editorInstance) {
        pendingRemoteCode.current = code;
        return;
      }
      if (editorInstance.getValue() === code) return;

      isRemoteUpdate.current = true;
      editorInstance.setValue(code);
      onCodeChange(code);
      queueMicrotask(() => {
        isRemoteUpdate.current = false;
      });
    },
    [onCodeChange]
  );

  const handleMount: OnMount = (editorInstance) => {
    editorRef.current = editorInstance;
    onCodeChange(editorInstance.getValue());

    if (pendingRemoteCode.current != null) {
      applyRemoteCode(pendingRemoteCode.current);
      pendingRemoteCode.current = null;
    }

    editorInstance.onDidChangeModelContent(() => {
      if (isRemoteUpdate.current) return;
      const code = editorInstance.getValue();
      onCodeChange(code);
      socket.emit(ACTIONS.CODE_CHANGE, { roomId, code });
    });
  };

  useEffect(() => {
    const handler = ({ code }: { code: string }) => {
      if (code != null) applyRemoteCode(code);
    };

    socket.on(ACTIONS.CODE_CHANGE, handler);
    return () => {
      socket.off(ACTIONS.CODE_CHANGE, handler);
    };
  }, [socket, applyRemoteCode]);

  return (
    <Editor
      height="100%"
      defaultLanguage="cpp"
      theme="vs-dark"
      defaultValue={DEFAULT_CODE}
      onMount={handleMount}
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        padding: { top: 16 },
        automaticLayout: true,
      }}
    />
  );
};

export default CodeEditor;
