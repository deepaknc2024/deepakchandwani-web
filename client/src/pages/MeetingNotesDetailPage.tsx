import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMeetingNotesApi, useBlobUrl, type NoteDetail } from '@/lib/meeting-notes-api';

const SUGGESTIONS = [
  'Summarize this meeting in 5 bullets',
  'List every action item with owner',
  'Draft a follow-up email',
  'What decisions were made?',
  'Extract key numbers and dates',
];

const TTS_LANGS: Array<{ code: string; label: string; group: string }> = [
  { code: 'en', label: 'English', group: 'International' },
  { code: 'hi', label: 'Hindi', group: 'Indian' },
  { code: 'pa', label: 'Punjabi', group: 'Indian' },
  { code: 'ta', label: 'Tamil', group: 'Indian' },
  { code: 'te', label: 'Telugu', group: 'Indian' },
  { code: 'kn', label: 'Kannada', group: 'Indian' },
  { code: 'ml', label: 'Malayalam', group: 'Indian' },
  { code: 'mr', label: 'Marathi', group: 'Indian' },
  { code: 'gu', label: 'Gujarati', group: 'Indian' },
  { code: 'bn', label: 'Bengali', group: 'Indian' },
  { code: 'es', label: 'Spanish', group: 'International' },
  { code: 'fr', label: 'French', group: 'International' },
  { code: 'de', label: 'German', group: 'International' },
  { code: 'it', label: 'Italian', group: 'International' },
  { code: 'pt', label: 'Portuguese', group: 'International' },
  { code: 'ja', label: 'Japanese', group: 'International' },
  { code: 'zh', label: 'Chinese (Mandarin)', group: 'International' },
  { code: 'ko', label: 'Korean', group: 'International' },
  { code: 'ar', label: 'Arabic', group: 'International' },
  { code: 'ru', label: 'Russian', group: 'International' },
];

// Strip markdown so TTS reads naturally
function stripMarkdown(s: string): string {
  return s
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/#+\s*/g, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

interface CostInfo {
  translationUsd: number;
  ttsUsd: number;
  totalUsd: number;
  translationModel: string | null;
  ttsProvider: string;
  inputTokens: number;
  outputTokens: number;
  ttsChars: number;
}

const USD_TO_INR = 84;

function fmtUsd(n: number): string {
  if (n === 0) return '$0';
  if (n < 0.0001) return `<$0.0001`;
  if (n < 0.01) return `$${n.toFixed(5)}`;
  if (n < 1) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(3)}`;
}
function fmtInr(n: number): string {
  const inr = n * USD_TO_INR;
  if (inr === 0) return '\u20B90';
  if (inr < 0.01) return `<\u20B90.01`;
  if (inr < 1) return `\u20B9${inr.toFixed(3)}`;
  return `\u20B9${inr.toFixed(2)}`;
}

function PlayButton({ text, getToken, onCost }: { text: string; getToken: () => Record<string, string>; onCost?: (c: CostInfo) => void }) {
  const [lang, setLang] = useState('en');
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [translatedText, setTranslatedText] = useState<string | null>(null);

  interface PlayEntry {
    langCode: string;
    langLabel: string;
    cost: CostInfo;
    provider: string | null;
    at: number;
  }
  const [history, setHistory] = useState<PlayEntry[]>([]);
  const buttonCostTotal = history.reduce((n, h) => n + h.cost.totalUsd, 0);

  const play = async () => {
    setErr(null);
    setLoading(true);
    setTranslatedText(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    try {
      const clean = stripMarkdown(text);
      const r = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getToken() },
        body: JSON.stringify({
          text: clean.slice(0, 4500),
          language: lang,
          translate: lang !== 'en',
        }),
      });
      const data = await r.json();
      if (!data.ok) throw new Error(data.error || 'TTS failed');
      const bin = atob(data.audio);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const mime = data.format === 'wav' ? 'audio/wav' : 'audio/mpeg';
      const blob = new Blob([bytes], { type: mime });
      setAudioUrl(URL.createObjectURL(blob));
      setProvider(data.provider || null);
      if (data.translatedText) setTranslatedText(data.translatedText);
      if (data.cost) {
        const langLabel = TTS_LANGS.find((l) => l.code === lang)?.label || lang;
        setHistory((prev) => [...prev, { langCode: lang, langLabel, cost: data.cost, provider: data.provider || null, at: Date.now() }]);
        onCost?.(data.cost);
      }
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-bdl/50">
      <div className="flex items-center gap-2 flex-wrap">
        <label className="text-[10px] font-semibold uppercase tracking-widest text-muted">Listen in</label>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          disabled={loading}
          className="rounded-lg border border-bdl bg-light-2 px-2 py-1 text-xs text-ink cursor-pointer disabled:opacity-50"
        >
          <optgroup label="Indian">
            {TTS_LANGS.filter((l) => l.group === 'Indian').map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </optgroup>
          <optgroup label="International">
            {TTS_LANGS.filter((l) => l.group === 'International').map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </optgroup>
        </select>
        <button
          onClick={play}
          disabled={loading || !text.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-2 text-white px-3 py-1 text-xs font-semibold hover:bg-cyan disabled:opacity-50 cursor-pointer border-none"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
          {loading ? 'Generating...' : audioUrl ? 'Regenerate' : 'Play'}
        </button>
        {provider && <span className="text-[10px] text-muted/70">{provider}</span>}
      </div>
      {audioUrl && <audio controls autoPlay src={audioUrl} className="w-full mt-2" />}
      {history.length > 0 && (
        <div className="mt-3 rounded-lg bg-light-2/60 border border-bdl px-3 py-2">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Cost per language</p>
            <span className="text-[10px] font-mono">
              Total: <span className="text-ink font-bold">{fmtUsd(buttonCostTotal)}</span>
              <span className="mx-1 text-muted/50">&bull;</span>
              <span className="text-ink font-bold">{fmtInr(buttonCostTotal)}</span>
            </span>
          </div>
          <div className="flex flex-col gap-1">
            {history.map((h, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <span className="text-ink font-medium">
                  {h.langLabel}
                  {h.cost.translationUsd > 0 && (
                    <span className="ml-2 text-muted text-[10px]" title={`${h.cost.inputTokens} + ${h.cost.outputTokens} tokens`}>
                      translate {fmtUsd(h.cost.translationUsd)}
                    </span>
                  )}
                  {h.cost.ttsUsd > 0 ? (
                    <span className="ml-2 text-muted text-[10px]" title={`${h.cost.ttsChars} chars`}>
                      TTS {fmtUsd(h.cost.ttsUsd)}
                    </span>
                  ) : (
                    <span className="ml-2 text-muted text-[10px]">TTS free</span>
                  )}
                </span>
                <span className="font-mono text-ink">
                  {fmtUsd(h.cost.totalUsd)}
                  <span className="mx-1 text-muted/50">&bull;</span>
                  {fmtInr(h.cost.totalUsd)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {translatedText && (
        <details className="mt-2">
          <summary className="text-[11px] text-cyan-2 cursor-pointer select-none">Show translation</summary>
          <p className="mt-1.5 text-xs text-body whitespace-pre-wrap bg-light-2 rounded-lg px-3 py-2 border border-bdl">
            {translatedText}
          </p>
        </details>
      )}
      {err && (
        <p className="mt-2 text-[11px] text-red bg-red/5 border border-red/20 rounded-lg px-2 py-1">{err}</p>
      )}
    </div>
  );
}

function ImageTile({ imageId }: { imageId: number }) {
  const url = useBlobUrl(`/api/meeting-note-images/${imageId}`);
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <button
        onClick={() => setExpanded(true)}
        className="block aspect-square rounded-lg overflow-hidden bg-light-2 border border-bdl cursor-pointer hover:border-cyan-2 hover:shadow-sm transition-all p-0"
      >
        {url ? (
          <img src={url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted text-xs">Loading...</div>
        )}
      </button>
      {expanded && url && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setExpanded(false)}
        >
          <img src={url} alt="" className="max-w-full max-h-full object-contain rounded-lg" />
          <button
            onClick={() => setExpanded(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border-none cursor-pointer text-xl"
          >
            &times;
          </button>
        </div>
      )}
    </>
  );
}

function AudioPlayer({ noteId }: { noteId: number }) {
  const url = useBlobUrl(`/api/meeting-notes/${noteId}/audio`);
  if (!url) return <div className="text-xs text-muted">Loading audio...</div>;
  return <audio controls src={url} className="w-full" />;
}

export default function MeetingNotesDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const api = useMeetingNotesApi();
  const noteId = parseInt(id || '0', 10);

  const [note, setNote] = useState<NoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [savingTitle, setSavingTitle] = useState(false);

  const [editingTranscript, setEditingTranscript] = useState(false);
  const [transcriptDraft, setTranscriptDraft] = useState('');
  const [savingTranscript, setSavingTranscript] = useState(false);

  const [prompt, setPrompt] = useState('');
  const [promptOutput, setPromptOutput] = useState('');
  const [promptRunning, setPromptRunning] = useState(false);
  const [promptModel, setPromptModel] = useState<string | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // Running total across all Play actions on this page
  const [playCountTotal, setPlayCountTotal] = useState(0);
  const [costTotalUsd, setCostTotalUsd] = useState(0);
  const handlePlayCost = (c: CostInfo) => {
    setPlayCountTotal((n) => n + 1);
    setCostTotalUsd((v) => v + c.totalUsd);
  };

  useEffect(() => {
    if (!noteId) return;
    let active = true;
    api.get(noteId)
      .then((n) => { if (active) setNote(n); })
      .catch((e) => { if (active) setError((e as Error).message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  useEffect(() => {
    outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [promptOutput]);

  const saveTitle = async () => {
    const newTitle = titleDraft.trim();
    if (!newTitle || !note || newTitle === note.title) {
      setEditingTitle(false);
      return;
    }
    setSavingTitle(true);
    try {
      await api.update(noteId, { title: newTitle });
      setNote({ ...note, title: newTitle });
      setEditingTitle(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSavingTitle(false);
    }
  };

  const saveTranscript = async () => {
    if (!note) return;
    setSavingTranscript(true);
    try {
      await api.update(noteId, { transcript: transcriptDraft });
      setNote({ ...note, transcript: transcriptDraft });
      setEditingTranscript(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSavingTranscript(false);
    }
  };

  const runPrompt = async (text: string) => {
    if (!text.trim() || promptRunning) return;
    setPromptRunning(true);
    setPromptOutput('');
    setPromptModel(null);
    setError(null);

    try {
      const res = await fetch(`/api/meeting-notes/${noteId}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...api.authHeader() },
        body: JSON.stringify({ prompt: text.trim() }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Request failed');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') continue;
          try {
            const parsed = JSON.parse(payload);
            if (parsed.model) setPromptModel(parsed.model);
            if (parsed.content) setPromptOutput((prev) => prev + parsed.content);
            if (parsed.error) setError(parsed.error);
          } catch {
            // skip
          }
        }
      }

      const fresh = await api.get(noteId);
      setNote(fresh);
      setPrompt('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPromptRunning(false);
    }
  };

  const deleteNote = async () => {
    if (!confirm('Delete this meeting permanently? This cannot be undone.')) return;
    try {
      await api.remove(noteId);
      navigate('/meeting-notes');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-58px)] pt-[80px] px-4 text-center text-muted">Loading...</div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-[calc(100vh-58px)] pt-[80px] px-4 text-center">
        <p className="text-muted mb-4">{error || 'Meeting not found'}</p>
        <Link to="/meeting-notes" className="text-cyan-2 no-underline">&larr; Back to meetings</Link>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-58px)] bg-gradient-to-b from-light via-white to-light-2 pt-[58px]">
      <div className="mx-auto max-w-3xl px-4 py-6 md:py-10">
        <Link to="/meeting-notes" className="text-xs text-muted hover:text-cyan-2 no-underline mb-4 inline-block">
          &larr; All meetings
        </Link>

        {/* Title — inline editable */}
        <div className="flex items-start justify-between gap-3 mb-2">
          {editingTitle ? (
            <div className="flex-1 flex gap-2 items-center">
              <input
                type="text"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
                autoFocus
                disabled={savingTitle}
                className="flex-1 rounded-lg border border-cyan-2 bg-white px-3 py-2 font-space text-xl md:text-2xl font-extrabold text-ink focus:outline-none focus:ring-2 focus:ring-cyan-2/40"
              />
              <button
                onClick={saveTitle}
                disabled={savingTitle}
                className="rounded-lg bg-cyan-2 text-white px-3 py-2 text-sm font-semibold hover:bg-cyan disabled:opacity-50 cursor-pointer border-none"
              >
                {savingTitle ? '...' : 'Save'}
              </button>
              <button
                onClick={() => setEditingTitle(false)}
                disabled={savingTitle}
                className="rounded-lg bg-transparent border border-bdl text-muted px-3 py-2 text-sm hover:text-ink cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              <h1 className="flex-1 font-space text-2xl md:text-3xl font-extrabold text-ink break-words">
                {note.title}
              </h1>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => { setTitleDraft(note.title); setEditingTitle(true); }}
                  className="p-1.5 rounded-lg text-muted hover:text-cyan-2 hover:bg-light-2 bg-transparent border-none cursor-pointer"
                  title="Rename"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  onClick={deleteNote}
                  className="p-1.5 rounded-lg text-muted hover:text-red hover:bg-red/5 bg-transparent border-none cursor-pointer"
                  title="Delete"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
        <p className="text-xs text-muted mb-6">
          {new Date(note.createdAt).toLocaleString()}
          {note.sttProvider && <span className="ml-2 text-muted/60">&bull; STT: {note.sttProvider}</span>}
          {note.durationSeconds != null && (
            <span className="ml-2 text-muted/60">
              &bull; {Math.floor(note.durationSeconds / 60)}m {note.durationSeconds % 60}s
            </span>
          )}
        </p>

        {note.hasAudio && (
          <div className="rounded-2xl border border-bdl bg-white p-4 shadow-sm mb-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted mb-2">Audio</p>
            <AudioPlayer noteId={note.id} />
          </div>
        )}

        {note.images.length > 0 && (
          <div className="rounded-2xl border border-bdl bg-white p-4 shadow-sm mb-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted mb-3">
              Images ({note.images.length})
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {note.images.map((img) => (
                <ImageTile key={img.id} imageId={img.id} />
              ))}
            </div>
          </div>
        )}

        {/* Transcript — inline editable */}
        <div className="rounded-2xl border border-bdl bg-white p-4 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted">Transcript</p>
            {!editingTranscript && (
              <button
                onClick={() => { setTranscriptDraft(note.transcript); setEditingTranscript(true); }}
                className="text-[11px] text-cyan-2 hover:underline bg-transparent border-none cursor-pointer"
              >
                Edit
              </button>
            )}
          </div>
          {editingTranscript ? (
            <>
              <textarea
                value={transcriptDraft}
                onChange={(e) => setTranscriptDraft(e.target.value)}
                disabled={savingTranscript}
                autoFocus
                className="w-full rounded-xl border border-bdl bg-white px-3 py-2 text-sm text-ink focus:border-cyan-2 focus:outline-none resize-y min-h-[160px]"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={saveTranscript}
                  disabled={savingTranscript}
                  className="rounded-lg bg-cyan-2 text-white px-4 py-1.5 text-sm font-semibold hover:bg-cyan disabled:opacity-50 cursor-pointer border-none"
                >
                  {savingTranscript ? 'Saving...' : 'Save transcript'}
                </button>
                <button
                  onClick={() => setEditingTranscript(false)}
                  disabled={savingTranscript}
                  className="rounded-lg bg-transparent border border-bdl text-muted px-4 py-1.5 text-sm hover:text-ink cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">
              {note.transcript || <span className="italic text-muted">No transcript.</span>}
            </p>
          )}
        </div>

        {/* Prompt section */}
        <div className="rounded-2xl border border-cyan-2/30 bg-gradient-to-br from-white to-cyan-2/5 p-5 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-2">Ask AI</p>
            {playCountTotal > 0 && (
              <div className="inline-flex items-center gap-2 text-[10px] rounded-full bg-white border border-cyan-2/30 px-3 py-1">
                <span className="text-muted font-semibold uppercase tracking-widest">Session total</span>
                <span className="font-mono text-ink font-semibold">{fmtUsd(costTotalUsd)}</span>
                <span className="text-muted/50">&bull;</span>
                <span className="font-mono text-ink font-semibold">{fmtInr(costTotalUsd)}</span>
                <span className="text-muted/70">({playCountTotal} play{playCountTotal > 1 ? 's' : ''})</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => { setPrompt(s); runPrompt(s); }}
                disabled={promptRunning}
                className="rounded-full border border-bdl bg-white px-3 py-1 text-[11px] text-muted hover:text-cyan-2 hover:border-cyan-2/40 transition-all cursor-pointer disabled:opacity-40"
              >
                {s}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); runPrompt(prompt); }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask anything about this meeting..."
              disabled={promptRunning}
              className="flex-1 rounded-xl border border-bdl bg-white px-4 py-2.5 text-sm text-ink placeholder-muted/50 focus:border-cyan-2 focus:outline-none"
            />
            <button
              type="submit"
              disabled={promptRunning || !prompt.trim()}
              className="rounded-xl bg-cyan-2 text-white px-5 py-2.5 font-semibold text-sm hover:bg-cyan transition-all disabled:opacity-40 cursor-pointer border-none"
            >
              {promptRunning ? '...' : 'Run'}
            </button>
          </form>

          {(promptOutput || promptRunning) && (
            <div className="mt-4 rounded-xl bg-white border border-bdl p-4">
              {promptModel && (
                <p className="text-[10px] font-semibold uppercase tracking-widest text-cyan-2 mb-2">
                  {promptModel}
                </p>
              )}
              <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">
                {promptOutput}
                {promptRunning && <span className="inline-block w-1.5 h-4 bg-cyan-2 align-middle ml-0.5 animate-pulse" />}
              </p>
              {!promptRunning && promptOutput.trim() && (
                <PlayButton text={promptOutput} getToken={api.authHeader} onCost={handlePlayCost} />
              )}
              <div ref={outputRef} />
            </div>
          )}

          {error && (
            <div className="mt-3 rounded-lg bg-red/5 border border-red/20 px-3 py-2 text-xs text-red">
              {error}
            </div>
          )}
        </div>

        {/* Past prompts */}
        {note.prompts.length > 0 && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted mb-2">
              History ({note.prompts.length})
            </p>
            <div className="space-y-3">
              {note.prompts.map((p) => (
                <details key={p.id} className="rounded-xl border border-bdl bg-white p-3">
                  <summary className="cursor-pointer text-sm font-medium text-ink">
                    {p.prompt}
                    <span className="ml-2 text-[10px] text-muted font-normal">
                      {new Date(p.createdAt).toLocaleString()}
                    </span>
                  </summary>
                  {p.modelUsed && (
                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-cyan-2">
                      {p.modelUsed}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-body whitespace-pre-wrap leading-relaxed">
                    {p.response}
                  </p>
                  <PlayButton text={p.response} getToken={api.authHeader} onCost={handlePlayCost} />
                </details>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
