import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMeetingNotesApi } from '@/lib/meeting-notes-api';

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
const FILE_LIMIT_MB = 200;
const TOTAL_LIMIT_MB = 450;

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function defaultTitle(): string {
  const d = new Date();
  const date = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `Meeting \u2014 ${date} ${time}`;
}

function pickAudioMimeType(): string {
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
  const [audioBytes, setAudioBytes] = useState(0);

  // Camera state — INLINE (not modal)
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraReady, setCameraReady] = useState(false);
  const [flash, setFlash] = useState(false);
  const [hasMultiCam, setHasMultiCam] = useState(false);

  // Audio recording refs
  const audioStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const currentCycleChunksRef = useRef<BlobPart[]>([]);
  const allCycleBlobsRef = useRef<Blob[]>([]);
  const recordingActiveRef = useRef(false);
  const cycleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioMimeRef = useRef<string>('audio/webm');
  const stopResolveRef = useRef<(() => void) | null>(null);

  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Camera refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // ── Cleanup ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      if (cycleTimerRef.current) clearTimeout(cycleTimerRef.current);
      audioStreamRef.current?.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
      images.forEach((i) => URL.revokeObjectURL(i.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Transcription ────────────────────────────────────────────────
  const transcribeChunk = useCallback(
    async (blob: Blob) => {
      if (blob.size < 1500) return;
      setChunksInFlight((n) => n + 1);
      try {
        const { transcript: text } = await api.transcribeViaServer(blob, lang);
        if (text && text.trim()) {
          setTranscript((prev) => (prev ? `${prev} ${text.trim()}` : text.trim()));
        }
      } catch (err) {
        console.error('[stt]', err);
        setError(`Transcription failed: ${(err as Error).message}. Audio is still being recorded.`);
      } finally {
        setChunksInFlight((n) => Math.max(0, n - 1));
      }
    },
    [api, lang],
  );

  // ── Recording: one recorder at a time, 20s cycles ────────────────
  const startCycle = useCallback(() => {
    const stream = audioStreamRef.current;
    if (!stream || !recordingActiveRef.current) {
      // Final cycle done — resolve any waiting stop promise
      if (stopResolveRef.current) {
        stopResolveRef.current();
        stopResolveRef.current = null;
      }
      return;
    }

    const mime = audioMimeRef.current;
    const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    currentCycleChunksRef.current = [];

    rec.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) currentCycleChunksRef.current.push(e.data);
    };
    rec.onstop = () => {
      const blob = new Blob(currentCycleChunksRef.current, { type: mime || 'audio/webm' });
      currentCycleChunksRef.current = [];
      if (blob.size > 0) {
        allCycleBlobsRef.current.push(blob);
        setAudioBytes(allCycleBlobsRef.current.reduce((n, b) => n + b.size, 0));
        // Fire-and-forget transcription
        transcribeChunk(blob);
      }
      // Start next cycle (or resolve stop if user stopped)
      startCycle();
    };
    rec.onerror = (e) => {
      console.error('[recorder error]', e);
      setError('Recorder error — try stopping and starting again.');
    };

    try {
      rec.start();
      recorderRef.current = rec;

      cycleTimerRef.current = setTimeout(() => {
        if (rec.state === 'recording') {
          try { rec.stop(); } catch { /* ignore */ }
        }
      }, CHUNK_MS);
    } catch (err) {
      console.error('[recorder start]', err);
      setError(`Recorder failed: ${(err as Error).message}`);
      recordingActiveRef.current = false;
      setRecording(false);
    }
  }, [transcribeChunk]);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      audioMimeRef.current = pickAudioMimeType() || 'audio/webm';
      // NOTE: do NOT reset allCycleBlobsRef or transcript — resuming should append

      recordingActiveRef.current = true;
      setRecording(true);

      // Accumulate duration across resume cycles
      const accumulated = duration;
      startTimeRef.current = Date.now();
      durationTimerRef.current = setInterval(() => {
        setDuration(accumulated + Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      startCycle();
    } catch (err) {
      console.error('[mic permission]', err);
      setError(`Microphone access failed: ${(err as Error).message}`);
      recordingActiveRef.current = false;
      setRecording(false);
    }
  }, [startCycle, duration]);

  const stopRecording = useCallback(async () => {
    recordingActiveRef.current = false;
    setRecording(false);

    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    if (cycleTimerRef.current) {
      clearTimeout(cycleTimerRef.current);
      cycleTimerRef.current = null;
    }

    // Wait for the current cycle to stop cleanly
    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') {
      await new Promise<void>((resolve) => {
        stopResolveRef.current = resolve;
        try { rec.stop(); } catch { resolve(); }
        setTimeout(() => {
          if (stopResolveRef.current) {
            stopResolveRef.current();
            stopResolveRef.current = null;
          }
        }, 3000);
      });
    }
    recorderRef.current = null;

    audioStreamRef.current?.getTracks().forEach((t) => t.stop());
    audioStreamRef.current = null;
  }, []);

  const getFullAudioBlob = (): Blob | null => {
    const blobs = allCycleBlobsRef.current;
    if (!blobs.length) return null;
    return new Blob(blobs, { type: audioMimeRef.current || 'audio/webm' });
  };

  // ── Inline camera ────────────────────────────────────────────────
  // Attach stream to video element once it's mounted
  useEffect(() => {
    const video = videoRef.current;
    const stream = cameraStreamRef.current;
    if (cameraOn && video && stream && video.srcObject !== stream) {
      video.srcObject = stream;
      video.onloadedmetadata = () => setCameraReady(true);
      video.play().catch(() => { /* autoplay may need a user gesture; user can tap again */ });
      // Fallback: if metadata event never fires (some mobile browsers), mark ready after 1.5s
      const fallback = setTimeout(() => setCameraReady(true), 1500);
      return () => clearTimeout(fallback);
    }
  }, [cameraOn]);

  const openCamera = useCallback(async () => {
    setCameraError(null);
    setCameraReady(false);
    try {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoIns = devices.filter((d) => d.kind === 'videoinput');
        setHasMultiCam(videoIns.length > 1);
      } catch { /* ignore */ }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: cameraFacing }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      cameraStreamRef.current = stream;
      // Set cameraOn first so the <video> element renders — we attach the stream in a useEffect
      setCameraOn(true);
    } catch (err) {
      const msg = (err as Error).name === 'NotAllowedError'
        ? 'Camera permission denied. Allow access in browser settings.'
        : (err as Error).message || 'Failed to open camera';
      setCameraError(msg);
    }
  }, [cameraFacing]);

  const closeCamera = useCallback(() => {
    cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    cameraStreamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
    setCameraReady(false);
  }, []);

  const switchCamera = useCallback(async () => {
    const next = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(next);
    closeCamera();
    // Restart with new facing
    setTimeout(() => openCamera(), 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraFacing, closeCamera, openCamera]);

  const snapPhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video || !cameraReady) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    setFlash(true);
    setTimeout(() => setFlash(false), 150);

    canvas.toBlob(
      (blob) => {
        if (blob) addImages([blob]);
      },
      'image/jpeg',
      0.92,
    );
  }, [cameraReady]);

  // ── Image management ─────────────────────────────────────────────
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

  const imagesBytes = images.reduce((n, i) => n + i.blob.size, 0);
  const totalBytes = audioBytes + imagesBytes;
  const totalLimitBytes = TOTAL_LIMIT_MB * 1024 * 1024;
  const pct = Math.min(100, Math.round((totalBytes / totalLimitBytes) * 100));
  const overLimit = totalBytes > totalLimitBytes || audioBytes > FILE_LIMIT_MB * 1024 * 1024;

  // ── Save ─────────────────────────────────────────────────────────
  const save = async () => {
    if (recording) await stopRecording();
    if (cameraOn) closeCamera();

    const audioBlob = getFullAudioBlob();
    if (!transcript.trim() && !audioBlob && images.length === 0) {
      setError('Record something or add an image before saving');
      return;
    }
    if (chunksInFlight > 0) {
      setError('Waiting for transcription to finish — try again in a moment.');
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
        audio: audioBlob,
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
        <p className="text-sm text-muted mb-4">Record, transcribe with Sarvam AI, capture photos, save.</p>

        {/* Size usage */}
        <div className="rounded-xl border border-bdl bg-white px-4 py-3 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted">Upload size</p>
            <p className={`text-xs font-mono font-semibold ${overLimit ? 'text-red' : 'text-ink'}`}>
              {formatBytes(totalBytes)} <span className="text-muted">/ {TOTAL_LIMIT_MB} MB</span>
            </p>
          </div>
          <div className="h-1.5 rounded-full bg-light-2 overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all ${
                pct > 90 ? 'bg-red' : pct > 70 ? 'bg-orange' : 'bg-cyan-2'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted">
            <span>
              <span className="text-cyan-2 font-semibold">&#9679;</span> Audio {formatBytes(audioBytes)}
              <span className="text-muted/60"> (max {FILE_LIMIT_MB} MB)</span>
            </span>
            <span>
              <span className="text-indigo font-semibold">&#9679;</span> Images {formatBytes(imagesBytes)}
              <span className="text-muted/60"> ({images.length})</span>
            </span>
          </div>
          {overLimit && (
            <p className="mt-2 text-[11px] text-red">
              Over limit — remove some images or split this into two meetings.
            </p>
          )}
        </div>

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
              onClick={() => (cameraOn ? closeCamera() : openCamera())}
              disabled={saving}
              className={`flex items-center justify-center gap-2 rounded-xl py-3 transition-all disabled:opacity-50 cursor-pointer font-medium ${
                cameraOn
                  ? 'bg-cyan-2/10 border border-cyan-2 text-cyan-2'
                  : 'bg-white border border-bdl text-ink hover:border-cyan-2 hover:text-cyan-2'
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              {cameraOn ? 'Close Camera' : 'Camera'}
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
                  Transcribing {chunksInFlight}...
                </span>
              )}
            </div>
            {transcript ? (
              <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">{transcript}</p>
            ) : (
              <p className="text-sm text-muted italic">
                {recording
                  ? 'Speech will appear here after each 20-second segment is transcribed.'
                  : 'Press Record to start. Speak in any supported language.'}
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

        {/* INLINE camera preview */}
        {(cameraOn || cameraError) && (
          <div className="rounded-2xl border border-cyan-2/40 bg-black p-0 shadow-sm mb-4 overflow-hidden relative">
            <div className="flex items-center justify-between px-4 py-2 bg-black/90">
              <p className="text-[11px] font-bold uppercase tracking-widest text-white">Camera</p>
              <div className="flex gap-2">
                {hasMultiCam && (
                  <button
                    onClick={switchCamera}
                    className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center border-none cursor-pointer"
                    title="Switch camera"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="1 4 1 10 7 10" />
                      <polyline points="23 20 23 14 17 14" />
                      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={closeCamera}
                  className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center border-none cursor-pointer text-base"
                  title="Close camera"
                >
                  &times;
                </button>
              </div>
            </div>
            <div className="relative bg-black aspect-video flex items-center justify-center">
              {cameraError ? (
                <p className="text-red text-sm px-6 text-center py-10">{cameraError}</p>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="max-w-full max-h-full w-full h-full object-contain"
                  />
                  {flash && <div className="absolute inset-0 bg-white opacity-70 pointer-events-none" />}
                  {!cameraReady && (
                    <div className="absolute inset-0 flex items-center justify-center text-white/70 text-sm">
                      Starting camera...
                    </div>
                  )}
                </>
              )}
            </div>
            {!cameraError && (
              <div className="flex items-center justify-center py-4 bg-black">
                <button
                  onClick={snapPhoto}
                  disabled={!cameraReady}
                  className="w-14 h-14 rounded-full bg-white border-4 border-white/50 shadow-lg disabled:opacity-40 cursor-pointer active:scale-95 transition-transform"
                  aria-label="Capture photo"
                />
              </div>
            )}
          </div>
        )}

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
          <div className="rounded-xl bg-red/5 border border-red/20 px-4 py-2.5 text-sm text-red mb-4 whitespace-pre-wrap">
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
            disabled={saving || recording || chunksInFlight > 0 || overLimit}
            className="flex-1 rounded-xl bg-cyan-2 text-white py-3 font-bold hover:bg-cyan transition-all disabled:opacity-50 cursor-pointer border-none shadow-sm"
          >
            {saving ? 'Saving...' : chunksInFlight > 0 ? 'Transcribing...' : 'Save Meeting'}
          </button>
        </div>
      </div>
    </div>
  );
}
