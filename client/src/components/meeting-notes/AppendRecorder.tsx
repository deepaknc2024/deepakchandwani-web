import { useState, useRef, useEffect, useCallback } from 'react';
import { useMeetingNotesApi } from '@/lib/meeting-notes-api';

const CHUNK_MS = 20_000;
const LANGS = [
  { code: 'unknown', label: 'Auto-detect' },
  { code: 'en-IN', label: 'English' },
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'pa-IN', label: 'Punjabi' },
  { code: 'ta-IN', label: 'Tamil' },
  { code: 'te-IN', label: 'Telugu' },
  { code: 'kn-IN', label: 'Kannada' },
  { code: 'ml-IN', label: 'Malayalam' },
  { code: 'mr-IN', label: 'Marathi' },
  { code: 'gu-IN', label: 'Gujarati' },
  { code: 'bn-IN', label: 'Bengali' },
];

function pickAudioMimeType(): string {
  const prefs = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
  for (const p of prefs) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(p)) return p;
  }
  return '';
}

interface Props {
  noteId: number;
  onSaved: () => void;
  onCancel: () => void;
}

export default function AppendRecorder({ noteId, onSaved, onCancel }: Props) {
  const api = useMeetingNotesApi();

  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const [chunksInFlight, setChunksInFlight] = useState(0);
  const [lang, setLang] = useState('unknown');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<Array<{ blob: Blob; preview: string; id: string }>>([]);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const cycleChunksRef = useRef<BlobPart[]>([]);
  const allBlobsRef = useRef<Blob[]>([]);
  const activeRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const mimeRef = useRef('audio/webm');
  const stopResolveRef = useRef<(() => void) | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
    images.forEach((i) => URL.revokeObjectURL(i.preview));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const transcribeChunk = useCallback(async (blob: Blob) => {
    if (blob.size < 1500) return;
    setChunksInFlight((n) => n + 1);
    try {
      const { transcript: text } = await api.transcribeViaServer(blob, lang);
      if (text && text.trim()) {
        setTranscript((prev) => (prev ? `${prev} ${text.trim()}` : text.trim()));
      }
    } catch (err) {
      setError(`Transcription: ${(err as Error).message}`);
    } finally {
      setChunksInFlight((n) => Math.max(0, n - 1));
    }
  }, [api, lang]);

  const startCycle = useCallback(() => {
    const stream = streamRef.current;
    if (!stream || !activeRef.current) {
      if (stopResolveRef.current) {
        stopResolveRef.current();
        stopResolveRef.current = null;
      }
      return;
    }
    const mime = mimeRef.current;
    const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    cycleChunksRef.current = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size > 0) cycleChunksRef.current.push(e.data); };
    rec.onstop = () => {
      const blob = new Blob(cycleChunksRef.current, { type: mime || 'audio/webm' });
      cycleChunksRef.current = [];
      if (blob.size > 0) {
        allBlobsRef.current.push(blob);
        transcribeChunk(blob);
      }
      startCycle();
    };
    try {
      rec.start();
      recorderRef.current = rec;
      timerRef.current = setTimeout(() => {
        if (rec.state === 'recording') {
          try { rec.stop(); } catch { /* ignore */ }
        }
      }, CHUNK_MS);
    } catch (err) {
      setError(`Recorder: ${(err as Error).message}`);
    }
  }, [transcribeChunk]);

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      mimeRef.current = pickAudioMimeType() || 'audio/webm';
      activeRef.current = true;
      setRecording(true);
      startTimeRef.current = Date.now();
      const base = duration;
      durationTimerRef.current = setInterval(() => {
        setDuration(base + Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
      startCycle();
    } catch (err) {
      setError(`Microphone: ${(err as Error).message}`);
    }
  };

  const stop = async () => {
    activeRef.current = false;
    setRecording(false);
    if (durationTimerRef.current) { clearInterval(durationTimerRef.current); durationTimerRef.current = null; }
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') {
      await new Promise<void>((resolve) => {
        stopResolveRef.current = resolve;
        try { rec.stop(); } catch { resolve(); }
        setTimeout(() => { if (stopResolveRef.current) { stopResolveRef.current(); stopResolveRef.current = null; } }, 3000);
      });
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const addImages = (blobs: Blob[]) => {
    const added = blobs.map((b) => ({ blob: b, preview: URL.createObjectURL(b), id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }));
    setImages((prev) => [...prev, ...added]);
  };

  const save = async () => {
    if (recording) await stop();
    if (chunksInFlight > 0) { setError('Wait for transcription to finish'); return; }
    const audioBlob = allBlobsRef.current.length
      ? new Blob(allBlobsRef.current, { type: mimeRef.current || 'audio/webm' })
      : null;
    if (!audioBlob && images.length === 0 && !transcript.trim()) {
      setError('Nothing to add');
      return;
    }
    setSaving(true);
    try {
      await api.appendToNote(noteId, {
        audio: audioBlob,
        images: images.map((i) => i.blob),
        appendTranscript: transcript.trim(),
        durationSeconds: duration || undefined,
      });
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  return (
    <div className="rounded-2xl border border-cyan-2/40 bg-gradient-to-br from-white to-cyan-2/5 p-4 shadow-sm mb-4">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-2">Add to this meeting</p>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold text-ink flex items-center gap-1.5">
            {fmt(duration)}
            {recording && <span className="inline-block w-2 h-2 rounded-full bg-red animate-pulse" />}
          </span>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            disabled={recording}
            className="rounded-lg border border-bdl bg-light-2 px-2 py-1 text-xs disabled:opacity-50 cursor-pointer"
          >
            {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
        {!recording ? (
          <button onClick={start} disabled={saving} className="flex items-center justify-center gap-2 rounded-xl bg-cyan-2 text-white py-2.5 text-sm font-semibold hover:bg-cyan disabled:opacity-50 cursor-pointer border-none">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6" /></svg>
            Record more
          </button>
        ) : (
          <button onClick={stop} className="flex items-center justify-center gap-2 rounded-xl bg-red text-white py-2.5 text-sm font-semibold hover:opacity-90 cursor-pointer border-none">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1.5" /></svg>
            Stop
          </button>
        )}
        <button onClick={() => fileInputRef.current?.click()} disabled={saving} className="flex items-center justify-center gap-2 rounded-xl bg-white border border-bdl text-ink py-2.5 text-sm font-medium hover:border-cyan-2 hover:text-cyan-2 disabled:opacity-50 cursor-pointer">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Add images
        </button>
        <button onClick={save} disabled={saving || recording || chunksInFlight > 0} className="flex items-center justify-center rounded-xl bg-ink text-white py-2.5 text-sm font-bold hover:opacity-90 disabled:opacity-50 cursor-pointer border-none">
          {saving ? 'Saving...' : chunksInFlight > 0 ? 'Transcribing...' : 'Save additions'}
        </button>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(e) => addImages(e.target.files ? Array.from(e.target.files) : [])} className="hidden" />

      {transcript && (
        <div className="rounded-lg bg-light-2 border border-bdl p-2 text-xs text-ink whitespace-pre-wrap leading-relaxed mb-3 max-h-[140px] overflow-y-auto">
          <span className="text-[10px] text-muted uppercase tracking-widest font-semibold">New transcript </span>
          {transcript}
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 mb-2">
          {images.map((img) => (
            <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden bg-light-2 border border-bdl">
              <img src={img.preview} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => { URL.revokeObjectURL(img.preview); setImages((p) => p.filter((i) => i.id !== img.id)); }}
                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center cursor-pointer border-none text-sm leading-none"
              >&times;</button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red/5 border border-red/20 px-3 py-1.5 text-xs text-red mb-2">{error}</div>
      )}

      <button onClick={onCancel} disabled={saving || recording} className="text-[11px] text-muted hover:text-ink bg-transparent border-none cursor-pointer disabled:opacity-40">
        Cancel
      </button>
    </div>
  );
}
