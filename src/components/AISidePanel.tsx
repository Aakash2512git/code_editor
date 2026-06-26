import { useState } from 'react';

export interface CodeIssue {
  severity: 'high' | 'medium' | 'low';
  line: number | null;
  message: string;
  suggestion: string;
}

export interface ReviewResult {
  score: number;
  summary: string;
  issues: CodeIssue[];
}

interface AISidePanelProps {
  code: string;
  language?: string;
}

const severityStyles: Record<CodeIssue['severity'], string> = {
  high: 'border-red-500/40 bg-red-500/10',
  medium: 'border-amber-500/40 bg-amber-500/10',
  low: 'border-blue-500/40 bg-blue-500/10',
};

const severityBadge: Record<CodeIssue['severity'], string> = {
  high: 'bg-red-500/20 text-red-400',
  medium: 'bg-amber-500/20 text-amber-400',
  low: 'bg-blue-500/20 text-blue-400',
};

const AISidePanel = ({ code, language = 'cpp' }: AISidePanelProps) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<
    { role: 'user' | 'assistant'; content: string }[]
  >([]);

  const analyzeCode = async () => {
    if (!code.trim()) {
      setError('Write some code before analyzing.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to analyze code');
      }

      const data: ReviewResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const askFollowUp = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          message: userMessage,
          history: chatMessages,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to get response');
      }

      const data = await res.json();
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chat failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="flex flex-col h-full bg-surface-raised border-l border-surface-border">
      <div className="p-4 border-b border-surface-border">
        <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
          <span className="text-accent">✦</span> AI Code Review
        </h2>
        <p className="text-xs text-zinc-500 mt-1">Powered by Groq</p>
      </div>

      <div className="p-4">
        <button
          onClick={analyzeCode}
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          {loading && !result ? 'Analyzing…' : 'Analyze Code'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {error && (
          <div className="p-3 rounded-lg border border-red-500/40 bg-red-500/10 text-red-400 text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-surface border border-surface-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-500 uppercase tracking-wide">Score</span>
                <span
                  className={`text-lg font-bold ${
                    result.score >= 7
                      ? 'text-green-400'
                      : result.score >= 4
                        ? 'text-amber-400'
                        : 'text-red-400'
                  }`}
                >
                  {result.score}/10
                </span>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">{result.summary}</p>
            </div>

            {result.issues.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs text-zinc-500 uppercase tracking-wide">
                  Issues ({result.issues.length})
                </h3>
                {result.issues.map((issue, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border ${severityStyles[issue.severity]}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded ${severityBadge[issue.severity]}`}
                      >
                        {issue.severity}
                      </span>
                      {issue.line != null && (
                        <span className="text-[10px] text-zinc-500">Line {issue.line}</span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-200">{issue.message}</p>
                    <p className="text-xs text-zinc-400 mt-1.5 italic">{issue.suggestion}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(result || chatMessages.length > 0) && (
          <div className="space-y-3 pt-2 border-t border-surface-border">
            <h3 className="text-xs text-zinc-500 uppercase tracking-wide">Ask AI</h3>
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`p-2.5 rounded-lg text-sm ${
                  msg.role === 'user'
                    ? 'bg-accent/20 text-zinc-200 ml-4'
                    : 'bg-surface border border-surface-border text-zinc-300 mr-4'
                }`}
              >
                {msg.content}
              </div>
            ))}
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && askFollowUp()}
                placeholder="Ask a follow-up…"
                className="flex-1 px-3 py-2 rounded-lg bg-surface border border-surface-border text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-accent"
              />
              <button
                onClick={askFollowUp}
                disabled={loading || !chatInput.trim()}
                className="px-3 py-2 rounded-lg bg-surface border border-surface-border hover:border-accent text-sm disabled:opacity-50 transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default AISidePanel;
