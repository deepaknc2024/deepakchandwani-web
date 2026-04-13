import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';

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
  { code: 'en-US', label: 'English', flag: 'EN' },
  { code: 'hi-IN', label: 'Hindi', flag: 'HI' },
  { code: 'pa-IN', label: 'Punjabi', flag: 'PA' },
  { code: 'ta-IN', label: 'Tamil', flag: 'TA' },
  { code: 'te-IN', label: 'Telugu', flag: 'TE' },
  { code: 'kn-IN', label: 'Kannada', flag: 'KN' },
  { code: 'ml-IN', label: 'Malayalam', flag: 'ML' },
  { code: 'bn-IN', label: 'Bengali', flag: 'BN' },
  { code: 'mr-IN', label: 'Marathi', flag: 'MR' },
  { code: 'gu-IN', label: 'Gujarati', flag: 'GU' },
  { code: 'es-ES', label: 'Spanish', flag: 'ES' },
  { code: 'fr-FR', label: 'French', flag: 'FR' },
  { code: 'de-DE', label: 'German', flag: 'DE' },
  { code: 'ja-JP', label: 'Japanese', flag: 'JA' },
  { code: 'zh-CN', label: 'Chinese', flag: 'ZH' },
  { code: 'ar-SA', label: 'Arabic', flag: 'AR' },
  { code: 'ur-PK', label: 'Urdu', flag: 'UR' },
];

const SUGGESTIONS = [
  'Show all users',
  'Who logged in today?',
  'Most visited pages',
  'User activity last 7 days',
  'How many Google sign-ins?',
  'Show recent contact form submissions',
  'Users who signed up this month',
  'Top 10 most active users',
];

export default function AdminPage() {
  const { user } = useAuthContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechLang, setSpeechLang] = useState('en-US');
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const hasSpeech = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Recent user questions (last 10)
  const recentQuestions = messages
    .filter((m) => m.role === 'user')
    .slice(-10)
    .reverse();

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
    } catch {
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

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const formatCellValue = (val: unknown): string => {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  const userName = user?.firstName || user?.email?.split('@')[0] || 'Admin';

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-light via-white to-light-2 font-dm overflow-hidden">
      {/* ── Top Header ─────────────────────────────────────── */}
      <header className="shrink-0 border-b border-bdl bg-white/80 backdrop-blur-md z-20">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-light-2 transition-colors cursor-pointer border-none bg-transparent text-muted"
              title="Toggle sidebar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <Link to="/" className="font-syne text-xl font-extrabold text-ink no-underline">
              D<span className="text-cyan-2">C</span>
            </Link>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white bg-cyan-2 px-2 py-0.5 rounded-full">
              Admin
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-ink">{userName}</p>
              <p className="text-[10px] text-muted">{user?.email}</p>
            </div>
            <div className="flex items-center gap-2 bg-light-2 rounded-xl px-3 py-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-2">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="text-xs font-mono font-semibold text-ink">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-2 to-indigo flex items-center justify-center text-white text-xs font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Area ──────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Sidebar: Recent Questions ──────────────── */}
        {sidebarOpen && (
          <aside className="shrink-0 w-64 border-r border-bdl bg-white overflow-y-auto hidden md:block">
            <div className="p-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted mb-3">Recent Questions</h3>
              {recentQuestions.length === 0 ? (
                <p className="text-xs text-muted/60 italic">No questions yet</p>
              ) : (
                <div className="space-y-1">
                  {recentQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q.content)}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-body hover:bg-light-2 transition-colors cursor-pointer border-none bg-transparent truncate block"
                      title={q.content}
                    >
                      <span className="text-cyan-2 mr-1.5">&#8250;</span>
                      {q.content}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-bdl/50 p-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted mb-3">Quick Queries</h3>
              <div className="space-y-1">
                {SUGGESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-muted hover:text-ink hover:bg-light-2 transition-colors cursor-pointer border-none bg-transparent"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        )}

        {/* ── Chat Column ────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Suggestions bar (always visible at top) */}
          <div className="shrink-0 border-b border-bdl/50 bg-light/50 px-4 py-2 overflow-x-auto">
            <div className="flex gap-2">
              {SUGGESTIONS.slice(0, 5).map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  disabled={loading}
                  className="shrink-0 rounded-full border border-bdl bg-white px-3 py-1 text-[11px] text-muted hover:text-cyan-2 hover:border-cyan-2/40 hover:bg-cyan-2/5 transition-all cursor-pointer disabled:opacity-40"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-2/10 to-indigo/10 flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyan-2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h2 className="font-space text-lg font-bold text-ink">Welcome, {userName}</h2>
                <p className="text-sm text-muted max-w-sm">
                  Ask questions about your users, activity, and site data in natural language.
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-cyan-2 text-white rounded-br-sm'
                      : 'bg-white border border-bdl rounded-bl-sm'
                  }`}
                >
                  <p className={`text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'assistant' ? 'text-body' : ''}`}>
                    {msg.content}
                  </p>

                  {msg.sql && (
                    <details className="mt-3">
                      <summary className={`text-xs cursor-pointer select-none ${msg.role === 'user' ? 'text-white/70' : 'text-cyan-2'}`}>
                        View SQL
                      </summary>
                      <pre className={`mt-1.5 overflow-x-auto rounded-lg p-3 text-xs font-mono leading-relaxed ${
                        msg.role === 'user' ? 'bg-black/20 text-white/90' : 'bg-light-2 text-ink'
                      }`}>
                        {msg.sql}
                      </pre>
                    </details>
                  )}

                  {msg.rows && msg.rows.length > 0 && msg.columns && (
                    <div className="mt-3">
                      <p className="text-[11px] text-muted mb-2">
                        {msg.rowCount} row{msg.rowCount !== 1 ? 's' : ''} returned
                      </p>
                      <div className="overflow-x-auto rounded-xl border border-bdl bg-white">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-light-2">
                              {msg.columns.map((col) => (
                                <th key={col} className="px-3 py-2 text-left font-semibold text-cyan-2 whitespace-nowrap border-b border-bdl">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {msg.rows.map((row, ri) => (
                              <tr key={ri} className={`${ri % 2 === 0 ? '' : 'bg-light/50'} hover:bg-cyan-2/5 transition-colors`}>
                                {msg.columns!.map((col) => (
                                  <td key={col} className="px-3 py-1.5 text-body whitespace-nowrap border-b border-bdl/30 max-w-[300px] truncate" title={formatCellValue(row[col])}>
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

                  {msg.error && (
                    <p className="mt-2 text-xs text-red bg-red/5 border border-red/20 rounded-lg px-3 py-1.5">
                      {msg.error}
                    </p>
                  )}

                  <p className={`mt-1.5 text-[10px] ${msg.role === 'user' ? 'text-white/50' : 'text-muted/50'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-white border border-bdl px-5 py-3 shadow-sm">
                  <div className="flex gap-1.5 items-center">
                    <span className="w-2 h-2 rounded-full bg-cyan-2 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-cyan-2 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-cyan-2 animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="text-xs text-muted ml-2">Analyzing...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* ── Fixed Bottom Input ──────────────────────── */}
          <div className="shrink-0 border-t border-bdl bg-white px-4 py-3">
            {listening && (
              <div className="flex items-center justify-center gap-2 mb-2 py-1.5 rounded-lg bg-red/5 border border-red/20">
                <span className="w-2 h-2 rounded-full bg-red animate-pulse" />
                <span className="text-xs text-red font-medium">
                  Listening in {LANGUAGES.find((l) => l.code === speechLang)?.label}...
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              {/* Language picker */}
              {hasSpeech && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowLangPicker(!showLangPicker)}
                    className="flex items-center justify-center w-9 h-9 rounded-lg bg-light-2 border border-bdl text-muted hover:text-ink hover:border-cyan-2/40 transition-all cursor-pointer text-[10px] font-bold"
                    title={`Speech: ${LANGUAGES.find((l) => l.code === speechLang)?.label}`}
                  >
                    {speechLang.split('-')[0].toUpperCase()}
                  </button>
                  {showLangPicker && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setShowLangPicker(false)} />
                      <div className="absolute bottom-11 left-0 z-30 w-44 max-h-60 overflow-y-auto rounded-xl bg-white border border-bdl shadow-xl p-1">
                        {LANGUAGES.map((lang) => (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => { setSpeechLang(lang.code); setShowLangPicker(false); }}
                            className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer border-none ${
                              speechLang === lang.code
                                ? 'bg-cyan-2/10 text-cyan-2 font-semibold'
                                : 'text-body hover:bg-light-2 bg-transparent'
                            }`}
                          >
                            <span className="font-mono text-[10px] mr-2 text-muted">{lang.flag}</span>
                            {lang.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Mic button */}
              {hasSpeech && (
                <button
                  type="button"
                  onClick={toggleSpeech}
                  className={`flex items-center justify-center w-9 h-9 rounded-lg border transition-all cursor-pointer ${
                    listening
                      ? 'bg-red/10 border-red/30 text-red'
                      : 'bg-light-2 border-bdl text-muted hover:text-cyan-2 hover:border-cyan-2/40'
                  }`}
                  title={listening ? 'Stop listening' : 'Speak your question'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                placeholder={listening ? 'Listening...' : 'Ask about user activity, logins, pages visited...'}
                disabled={loading || listening}
                autoFocus
                className="flex-1 rounded-xl border border-bdl bg-light px-4 py-2.5 text-sm text-ink placeholder-muted/50 focus:border-cyan-2 focus:outline-none focus:ring-1 focus:ring-cyan-2 transition-colors disabled:opacity-50"
              />

              {/* Send button */}
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-cyan-2 text-white hover:bg-cyan transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer border-none"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
