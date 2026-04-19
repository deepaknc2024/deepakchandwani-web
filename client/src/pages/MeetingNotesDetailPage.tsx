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

function ImageTile({ imageId }: { imageId: number }) {
  const url = useBlobUrl(`/api/meeting-note-images/${imageId}`);
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <button
        onClick={() => setExpanded(true)}
        className="block aspect-square rounded-lg overflow-hidden bg-light-2 border border-bdl cursor-pointer hover:border-cyan-2 transition-all p-0"
      >
        {url ? (
          <img src={url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted text-xs">Loading...</div>
        )}
      </button>
      {expanded && url && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setExpanded(false)}
        >
          <img src={url} alt="" className="max-w-full max-h-full object-contain rounded-lg" />
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

  const [prompt, setPrompt] = useState('');
  const [promptOutput, setPromptOutput] = useState('');
  const [promptRunning, setPromptRunning] = useState(false);
  const [promptModel, setPromptModel] = useState<string | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

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

      // Refresh to include the saved prompt in history
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
    if (!confirm('Delete this meeting note permanently?')) return;
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

        <div className="flex items-start justify-between gap-3 mb-2">
          <h1 className="font-space text-2xl md:text-3xl font-extrabold text-ink">{note.title}</h1>
          <button
            onClick={deleteNote}
            className="text-xs text-muted hover:text-red bg-transparent border-none cursor-pointer shrink-0"
          >
            Delete
          </button>
        </div>
        <p className="text-xs text-muted mb-6">
          {new Date(note.createdAt).toLocaleString()}
          {note.sttProvider && <span className="ml-2 text-muted/60">&bull; STT: {note.sttProvider}</span>}
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

        <div className="rounded-2xl border border-bdl bg-white p-4 shadow-sm mb-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted mb-2">Transcript</p>
          <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">
            {note.transcript || <span className="italic text-muted">No transcript.</span>}
          </p>
        </div>

        {/* Prompt section */}
        <div className="rounded-2xl border border-cyan-2/30 bg-gradient-to-br from-white to-cyan-2/5 p-5 shadow-sm mb-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-2 mb-3">Ask AI</p>

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
                </details>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
