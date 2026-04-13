import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sql?: string | null;
  columns?: string[];
  rows?: Record<string, unknown>[];
  rowCount?: number;
  error?: string;
  timestamp: number;
}

// Speech recognition types
interface SpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } }; length: number };
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

const LANGUAGES = [
  { code: 'en-US', label: 'English' },
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'pa-IN', label: 'Punjabi' },
  { code: 'ta-IN', label: 'Tamil' },
  { code: 'te-IN', label: 'Telugu' },
  { code: 'kn-IN', label: 'Kannada' },
  { code: 'ml-IN', label: 'Malayalam' },
  { code: 'bn-IN', label: 'Bengali' },
  { code: 'mr-IN', label: 'Marathi' },
  { code: 'gu-IN', label: 'Gujarati' },
  { code: 'es-ES', label: 'Spanish' },
  { code: 'fr-FR', label: 'French' },
  { code: 'de-DE', label: 'German' },
  { code: 'ja-JP', label: 'Japanese' },
  { code: 'zh-CN', label: 'Chinese' },
  { code: 'ar-SA', label: 'Arabic' },
  { code: 'ur-PK', label: 'Urdu' },
];

export default function AdminPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechLang, setSpeechLang] = useState('en-US');
  const [showLangPicker, setShowLangPicker] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const hasSpeech = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text.trim(), timestamp: Date.now() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const history = updated.map((m) => ({
        role: m.role,
        content: m.role === 'assistant'
          ? (m.content + (m.sql ? `\nSQL: ${m.sql}` : ''))
          : m.content,
      }));

      const res = await fetch('/api/admin/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), history: history.slice(0, -1) }),
      });

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.explanation || data.error || 'No response',
        sql: data.sql,
        columns: data.columns,
        rows: data.rows,
        rowCount: data.rowCount,
        error: data.error,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Failed to connect to server.', timestamp: Date.now() },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const toggleSpeech = () => {
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = speechLang;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript;
      if (transcript.trim()) {
        sendMessage(transcript);
      }
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const formatCellValue = (val: unknown): string => {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark via-dark-2 to-surf text-light font-dm">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-dark/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="font-syne text-2xl font-extrabold text-light no-underline">
              D<span className="text-cyan-2">C</span>
            </Link>
            <span className="text-xs font-medium uppercase tracking-wider text-cyan-2 bg-cyan-2/10 px-2 py-0.5 rounded-full">
              Admin
            </span>
          </div>
          <p className="text-xs text-faint">Analytics Chat</p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col" style={{ height: 'calc(100vh - 57px)' }}>
        {/* Chat area */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 opacity-60">
              <div className="text-6xl">&#128202;</div>
              <h2 className="font-space text-xl font-bold text-light">User Analytics Chat</h2>
              <p className="text-sm text-faint max-w-md">
                Ask questions about user activity in natural language. Try:
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  'Show all users',
                  'Who logged in today?',
                  'Most visited pages',
                  'User activity last 7 days',
                  'How many Google sign-ins?',
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-light/80 hover:bg-cyan-2/20 hover:border-cyan-2/40 transition-all cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-cyan-2 text-white rounded-br-sm'
                    : 'bg-white/8 border border-white/10 rounded-bl-sm'
                }`}
              >
                {/* Message text */}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                {/* SQL query display */}
                {msg.sql && (
                  <details className="mt-3" open={!msg.rows?.length}>
                    <summary className="text-xs text-cyan/70 cursor-pointer hover:text-cyan select-none">
                      SQL Query
                    </summary>
                    <pre className="mt-1 overflow-x-auto rounded-lg bg-black/30 p-3 text-xs text-green font-mono leading-relaxed">
                      {msg.sql}
                    </pre>
                  </details>
                )}

                {/* Results table */}
                {msg.rows && msg.rows.length > 0 && msg.columns && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-faint">
                        {msg.rowCount} row{msg.rowCount !== 1 ? 's' : ''} returned
                      </span>
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-white/10">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-white/5">
                            {msg.columns.map((col) => (
                              <th
                                key={col}
                                className="px-3 py-2 text-left font-semibold text-cyan-2 whitespace-nowrap border-b border-white/10"
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {msg.rows.map((row, ri) => (
                            <tr
                              key={ri}
                              className={`${ri % 2 === 0 ? 'bg-white/[0.02]' : ''} hover:bg-white/5 transition-colors`}
                            >
                              {msg.columns!.map((col) => (
                                <td
                                  key={col}
                                  className="px-3 py-1.5 text-light/80 whitespace-nowrap border-b border-white/5 max-w-[300px] truncate"
                                  title={formatCellValue(row[col])}
                                >
                                  {formatCellValue(row[col])}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Error display */}
                {msg.error && (
                  <p className="mt-2 text-xs text-red bg-red/10 rounded-lg px-3 py-1.5">
                    {msg.error}
                  </p>
                )}

                {/* Timestamp */}
                <p className={`mt-1 text-[10px] ${msg.role === 'user' ? 'text-white/50' : 'text-faint'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm bg-white/8 border border-white/10 px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-2 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-cyan-2 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-cyan-2 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        <div className="shrink-0 border-t border-white/10 pt-4">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            {/* Language picker */}
            {hasSpeech && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowLangPicker(!showLangPicker)}
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-faint hover:text-light hover:bg-white/10 transition-all cursor-pointer text-xs font-bold"
                  title={`Speech language: ${LANGUAGES.find((l) => l.code === speechLang)?.label}`}
                >
                  {speechLang.split('-')[0].toUpperCase()}
                </button>
                {showLangPicker && (
                  <div className="absolute bottom-12 left-0 z-30 w-44 max-h-60 overflow-y-auto rounded-xl bg-dark-2 border border-white/15 shadow-2xl p-1">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => { setSpeechLang(lang.code); setShowLangPicker(false); }}
                        className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer border-none ${
                          speechLang === lang.code
                            ? 'bg-cyan-2/20 text-cyan-2 font-semibold'
                            : 'text-light/70 hover:bg-white/5'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Mic button */}
            {hasSpeech && (
              <button
                type="button"
                onClick={toggleSpeech}
                className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-all cursor-pointer ${
                  listening
                    ? 'bg-red/20 border-red/40 text-red animate-pulse'
                    : 'bg-white/5 border-white/10 text-faint hover:text-light hover:bg-white/10'
                }`}
                title={listening ? 'Stop listening' : 'Speak your question'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              </button>
            )}

            {/* Text input */}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={listening ? 'Listening...' : 'Ask about user activity...'}
              disabled={loading || listening}
              autoFocus
              className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-light placeholder-faint/60 focus:border-cyan-2 focus:outline-none focus:ring-1 focus:ring-cyan-2 transition-colors disabled:opacity-50"
            />

            {/* Send button */}
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-2 text-white hover:bg-cyan transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>

          {listening && (
            <p className="mt-2 text-xs text-center text-red animate-pulse">
              Listening in {LANGUAGES.find((l) => l.code === speechLang)?.label}... speak now
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
