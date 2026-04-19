import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMeetingNotesApi } from '@/lib/meeting-notes-api';
import CameraCaptureModal from '@/components/meeting-notes/CameraCaptureModal';

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
  { code: 'od-IN', label: 'Odia' },
];

const CHUNK_MS = 20_000; // Sarvam sync limit is 30s; 20s leaves headroom

function defaultTitle(): string {
  const d = new Date();
  const date = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `Meeting \u2014 ${date} ${time}`;
}

export default function MeetingNotesNewPage() {
  const api = useMeetingNotesApi();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [transcript, setTranscript] = useState('');
  const [recording, setRecording] = useState(false);
  const [lang, setLang] = useState('unknown');
  const [images, setImages] = useState<Array<{ blob: Blob; preview: string; id: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [chunksInFlight, setChunksInFlight] = useState(0);
  const [cameraOpen, setCameraOpen] = useState(false);

  // Recorders
  const streamRef = useRef<MediaStream | null>(null);
  const fullRecorderRef = useRef<MediaRecorder | null>(null);
  const fullChunksRef = useRef<BlobPart[]>([]);
  const audioBlobRef = useRef<Blob | null>(null);
  const fullMimeRef = useRef<string>('audio/webm');

  const chunkRecorderRef = useRef<MediaRecorder | null>(null);
  const chunkBufferRef = useRef<BlobPart[]>([]);
  const chunkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingRef = useRef(false);

  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      if (chunkTimerRef.current) clearTimeout(chunkTimerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      images.forEach((i) => URL.revokeObjectURL(i.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickMimeType = (): string => {
    const prefs = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4;codecs=mp4a.40.2',
      'audio/mp4',
      'audio/ogg;codecs=opus',
    ];
    for (const p of prefs) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(p)) return p;
    }
    return '';
  };

  const transcribeChunk = useCallback(
    async (blob: Blob) => {
      if (blob.size < 1200) return;
      setChunksInFlight((n) => n + 1);
      try {
        const { transcript: text } = await api.transcribeViaServer(blob, lang);
        if (text && text.trim()) {
          setTranscript((prev) => (prev ? `${prev} ${text.trim()}` : text.trim()));
        }
      } catch (err) {
        console.error('[transcribe chunk]', err);
        setError(`Transcription failed: ${(err as Error).message}`);
      } finally {
        setChunksInFlight((n) => Math.max(0, n - 1));
      }
    },
    [api, lang],
  );

  const startChunkRecorder = useCallback(() => {
    const stream = streamRef.current;
    if (!stream || !recordingRef.current) return;

    const mimeType = pickMimeType();
    const chunker = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    chunkBufferRef.current = [];

    chunker.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunkBufferRef.current.push(e.data);
    };
    chunker.onstop = () => {
      const blob = new Blob(chunkBufferRef.current, { type: mimeType || 'audio/webm' });
      chunkBufferRef.current = [];
      transcribeChunk(blob);
      if (recordingRef.current) {
        // Small gap to avoid dropping the next syllable — restart immediately
        startChunkRecorder();
      }
    };
    chunker.start();
    chunkRecorderRef.current = chunker;

    chunkTimerRef.current = setTimeout(() => {
      if (chunker.state === 'recording') {
        try { chunker.stop(); } catch { /* ignore */ }
      }
    }, CHUNK_MS);
  }, [transcribeChunk]);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = pickMimeType();
      fullMimeRef.current = mimeType || 'audio/webm';

      const full = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      fullChunksRef.current = [];
      full.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) fullChunksRef.current.push(e.data);
      };
      full.onstop = () => {
        audioBlobRef.current = new Blob(fullChunksRef.current, { type: mimeType || 'audio/webm' });
      };
      full.start();
      fullRecorderRef.current = full;

      recordingRef.current = true;
      setRecording(true);

      startTimeRef.current = Date.now();
      setDuration(0);
      durationTimerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      startChunkRecorder();
    } catch (err) {
      setError((err as Error).message || 'Failed to start recording');
      recordingRef.current = false;
      setRecording(false);
    }
  }, [startChunkRecorder]);

  const stopRecording = useCallback(async () => {
    recordingRef.current = false;
    setRecording(false);

    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    if (chunkTimerRef.current) {
      clearTimeout(chunkTimerRef.current);
      chunkTimerRef.current = null;
    }

    // Stop the chunk recorder so the final segment is sent to Sarvam
    const chunker = chunkRecorderRef.current;
    if (chunker && chunker.state !== 'inactive') {
      try { chunker.stop(); } catch { /* ignore */ }
    }
    chunkRecorderRef.current = null;

    // Stop the continuous recorder for storage
    const full = fullRecorderRef.current;
    if (full && full.state !== 'inactive') {
      await new Promise<void>((resolve) => {
        const orig = full.onstop;
        full.onstop = (ev) => {
          if (typeof orig === 'function') orig.call(full, ev);
          resolve();
        };
        try { full.stop(); } catch { resolve(); }
      });
    }
    fullRecorderRef.current = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const handleUploadFiles = (files: FileList | null) => {
    if (!files) return;
    addImages(Array.from(files));
  };

  const addImages = (blobs: Blob[]) => {
    const added = blobs.map((b) => ({
      blob: b,
      preview: URL.createObjectURL(b),
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    }));
    setImages((prev) => [...prev, ...added]);
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((i) => i.id !== id);
    });
  };

  const save = async () => {
    if (recording) await stopRecording();
    if (!transcript.trim() && !audioBlobRef.current && images.length === 0) {
      setError('Record something or add an image before saving');
      return;
    }
    if (chunksInFlight > 0) {
      setError('Waiting for transcription to finish...');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { id } = await api.create({
        title: title.trim() || defaultTitle(),
        transcript: transcript.trim(),
        sttProvider: 'sarvam',
        durationSeconds: duration || null,
        audio: audioBlobRef.current,
        images: images.map((i) => i.blob),
      });
      navigate(`/meeting-notes/${id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  return (
    <div className="min-h-[calc(100vh-58px)] bg-gradient-to-b from-light via-white to-light-2 pt-[58px]">
      <div className="mx-auto max-w-3xl px-4 py-6 md:py-10">
        <div className="mb-4 flex items-center justify-between">
          <Link to="/meeting-notes" className="text-xs text-muted hover:text-cyan-2 no-underline">
            &larr; All meeting notes
          </Link>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white bg-cyan-2 px-2 py-0.5 rounded-full">
            New
          </span>
        </div>

        <h1 className="font-space text-2xl md:text-3xl font-extrabold text-ink mb-1">Meeting Notes</h1>
        <p className="text-sm text-muted mb-6">Record, transcribe with Sarvam AI, capture photos, save.</p>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={defaultTitle()}
          disabled={saving}
          className="w-full rounded-xl border border-bdl bg-white px-4 py-3 text-base text-ink placeholder-muted/60 focus:border-cyan-2 focus:outline-none focus:ring-1 focus:ring-cyan-2 transition-colors mb-4"
        />

        {/* Recorder card */}
        <div className="rounded-2xl border border-bdl bg-white p-5 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted">Recording</p>
              <p className="font-mono text-2xl font-bold text-ink flex items-center gap-2">
                {formatDuration(duration)}
                {recording && <span className="inline-block w-2.5 h-2.5 rounded-full bg-red animate-pulse" />}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <label className="text-[10px] text-muted uppercase tracking-widest font-semibold">Language</label>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                disabled={recording}
                className="rounded-lg border border-bdl bg-light-2 px-2 py-1.5 text-xs text-ink disabled:opacity-50 cursor-pointer"
              >
                {LANGS.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
            {!recording ? (
              <button
                onClick={startRecording}
                disabled={saving}
                className="sm:col-span-1 flex items-center justify-center gap-2 rounded-xl bg-cyan-2 text-white py-3 font-semibold hover:bg-cyan transition-all disabled:opacity-50 cursor-pointer border-none shadow-sm"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="6" />
                </svg>
                Record
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="sm:col-span-1 flex items-center justify-center gap-2 rounded-xl bg-red text-white py-3 font-semibold hover:opacity-90 transition-all cursor-pointer border-none shadow-sm"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="1.5" />
                </svg>
                Stop
              </button>
            )}

            <button
              type="button"
              onClick={() => setCameraOpen(true)}
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-xl bg-white border border-bdl text-ink py-3 hover:border-cyan-2 hover:text-cyan-2 transition-all disabled:opacity-50 cursor-pointer font-medium"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Camera
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-xl bg-white border border-bdl text-ink py-3 hover:border-cyan-2 hover:text-cyan-2 transition-all disabled:opacity-50 cursor-pointer font-medium"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleUploadFiles(e.target.files)}
            className="hidden"
          />

          <div className="rounded-xl bg-light-2 border border-bdl p-3 min-h-[120px] max-h-[300px] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted">
                Transcript <span className="text-cyan-2 normal-case font-normal">via Sarvam AI</span>
              </p>
              {chunksInFlight > 0 && (
                <span className="flex items-center gap-1.5 text-[10px] text-cyan-2 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-2 animate-pulse" />
                  Transcribing...
                </span>
              )}
            </div>
            {transcript ? (
              <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">{transcript}</p>
            ) : (
              <p className="text-sm text-muted italic">
                {recording
                  ? 'Speech will appear here after each 20-second segment is transcribed.'
                  : 'Press Record to start. Speak in any of the supported languages.'}
              </p>
            )}
          </div>

          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Edit or add notes..."
            disabled={recording}
            className="w-full mt-3 rounded-xl border border-bdl bg-white px-3 py-2 text-sm text-ink placeholder-muted/50 focus:border-cyan-2 focus:outline-none resize-y min-h-[80px]"
          />
        </div>

        {/* Images grid */}
        {images.length > 0 && (
          <div className="rounded-2xl border border-bdl bg-white p-4 shadow-sm mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted">
                Images ({images.length})
              </p>
              <button
                onClick={() => {
                  images.forEach((i) => URL.revokeObjectURL(i.preview));
                  setImages([]);
                }}
                disabled={saving}
                className="text-[11px] text-muted hover:text-red bg-transparent border-none cursor-pointer disabled:opacity-40"
              >
                Clear all
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {images.map((img) => (
                <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden bg-light-2 border border-bdl">
                  <img src={img.preview} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(img.id)}
                    disabled={saving}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center cursor-pointer border-none text-base leading-none shadow-md hover:bg-red"
                    title="Remove"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red/5 border border-red/20 px-4 py-2.5 text-sm text-red mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-2 sticky bottom-0 pb-2 bg-gradient-to-t from-light to-transparent pt-2">
          <Link
            to="/meeting-notes"
            className="flex-1 text-center rounded-xl border border-bdl bg-white text-ink py-3 font-medium hover:bg-light-2 transition-colors no-underline"
          >
            Cancel
          </Link>
          <button
            onClick={save}
            disabled={saving || recording || chunksInFlight > 0}
            className="flex-1 rounded-xl bg-cyan-2 text-white py-3 font-bold hover:bg-cyan transition-all disabled:opacity-50 cursor-pointer border-none shadow-sm"
          >
            {saving ? 'Saving...' : chunksInFlight > 0 ? 'Transcribing...' : 'Save Meeting'}
          </button>
        </div>
      </div>

      <CameraCaptureModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(blob) => addImages([blob])}
      />
    </div>
  );
}
