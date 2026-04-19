import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMeetingNotesApi } from '@/lib/meeting-notes-api';

interface SRResult {
  [index: number]: { transcript: string };
  isFinal: boolean;
}
interface SREvent {
  results: { [index: number]: SRResult; length: number };
  resultIndex: number;
}
interface SRInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((ev: SREvent) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
}
/* eslint-disable @typescript-eslint/no-explicit-any */
const getSR = (): (new () => SRInstance) | undefined =>
  (typeof window !== 'undefined' ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : undefined);

const LANGS = [
  { code: 'en-IN', label: 'English (India)' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'pa-IN', label: 'Punjabi' },
  { code: 'ta-IN', label: 'Tamil' },
  { code: 'te-IN', label: 'Telugu' },
  { code: 'mr-IN', label: 'Marathi' },
  { code: 'gu-IN', label: 'Gujarati' },
  { code: 'bn-IN', label: 'Bengali' },
];

const SARVAM_LANG_MAP: Record<string, string> = {
  'en-IN': 'en-IN', 'en-US': 'en-IN', 'hi-IN': 'hi-IN', 'pa-IN': 'pa-IN',
  'ta-IN': 'ta-IN', 'te-IN': 'te-IN', 'mr-IN': 'mr-IN', 'gu-IN': 'gu-IN', 'bn-IN': 'bn-IN',
};

export default function MeetingNotesNewPage() {
  const api = useMeetingNotesApi();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [recording, setRecording] = useState(false);
  const [lang, setLang] = useState('en-IN');
  const [images, setImages] = useState<Array<{ blob: Blob; preview: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sttProvider, setSttProvider] = useState<'browser' | 'sarvam-pending' | 'sarvam'>('browser');

  const recognitionRef = useRef<SRInstance | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const audioBlobRef = useRef<Blob | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptRef = useRef<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const hasWebSpeech = !!getSR();

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      images.forEach((i) => URL.revokeObjectURL(i.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';
      const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        audioBlobRef.current = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
      };
      mr.start();
      mediaRecorderRef.current = mr;

      // Web Speech API for live transcription
      const SR = getSR();
      if (SR) {
        const recognition = new SR();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = lang;

        recognition.onresult = (event: SREvent) => {
          let interimText = '';
          let finalText = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const res = event.results[i];
            if (res.isFinal) finalText += res[0].transcript;
            else interimText += res[0].transcript;
          }
          if (finalText) {
            setTranscript((prev) => (prev ? `${prev} ${finalText.trim()}` : finalText.trim()));
            setInterim('');
          } else {
            setInterim(interimText);
          }
        };
        recognition.onerror = () => {
          // If web speech fails, we'll fall back to server STT after stop
          setSttProvider('sarvam-pending');
        };
        recognition.onend = () => {
          // Auto-restart while still recording (browser STT pauses on silence)
          if (recording && recognitionRef.current === recognition) {
            try { recognition.start(); } catch { /* ignore */ }
          }
        };
        try {
          recognition.start();
          recognitionRef.current = recognition;
          setSttProvider('browser');
        } catch {
          setSttProvider('sarvam-pending');
        }
      } else {
        setSttProvider('sarvam-pending');
      }

      startTimeRef.current = Date.now();
      setDuration(0);
      durationTimerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      setRecording(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
    }
  }, [hasWebSpeech, lang, recording]);

  const stopRecording = useCallback(async () => {
    setRecording(false);
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    recognitionRef.current = null;

    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== 'inactive') {
      await new Promise<void>((resolve) => {
        const orig = mr.onstop;
        mr.onstop = (ev) => {
          if (typeof orig === 'function') orig.call(mr, ev);
          resolve();
        };
        mr.stop();
      });
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setInterim('');

    // Fallback: server-side Sarvam STT if browser STT didn't produce anything
    if (
      sttProvider !== 'browser' ||
      transcriptRef.current.trim().length < 5
    ) {
      const blob = audioBlobRef.current;
      if (blob && blob.size > 500) {
        try {
          const sarvamLang = SARVAM_LANG_MAP[lang] || 'unknown';
          const { transcript: text } = await api.transcribeViaServer(blob, sarvamLang);
          if (text) {
            setTranscript((prev) => (prev ? `${prev}\n${text}` : text));
            setSttProvider('sarvam');
          }
        } catch (err) {
          setError('Browser STT unavailable and Sarvam fallback failed: ' + (err as Error).message);
        }
      }
    }
  }, [api, lang, sttProvider]);

  const handleImageFiles = (files: FileList | null) => {
    if (!files) return;
    const added = Array.from(files).map((f) => ({ blob: f, preview: URL.createObjectURL(f) }));
    setImages((prev) => [...prev, ...added]);
  };

  const removeImage = (idx: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const save = async () => {
    if (recording) await stopRecording();
    if (!transcript.trim() && !audioBlobRef.current && images.length === 0) {
      setError('Record something or add an image before saving');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { id } = await api.create({
        title: title.trim() || `Meeting ${new Date().toLocaleString()}`,
        transcript: transcript.trim(),
        sttProvider: sttProvider === 'sarvam' ? 'sarvam' : 'browser',
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
        <p className="text-sm text-muted mb-6">Record, transcribe, capture photos, save.</p>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Meeting title (optional)"
          disabled={saving}
          className="w-full rounded-xl border border-bdl bg-white px-4 py-3 text-base text-ink placeholder-muted/50 focus:border-cyan-2 focus:outline-none focus:ring-1 focus:ring-cyan-2 transition-colors mb-4"
        />

        {/* Recorder card */}
        <div className="rounded-2xl border border-bdl bg-white p-5 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted">Recording</p>
              <p className="font-mono text-2xl font-bold text-ink">
                {formatDuration(duration)}
                {recording && <span className="ml-2 inline-block w-2.5 h-2.5 rounded-full bg-red animate-pulse align-middle" />}
              </p>
            </div>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              disabled={recording}
              className="rounded-lg border border-bdl bg-light-2 px-2 py-1.5 text-xs text-ink disabled:opacity-50"
            >
              {LANGS.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 mb-4">
            {!recording ? (
              <button
                onClick={startRecording}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-cyan-2 text-white py-3 font-semibold hover:bg-cyan transition-all disabled:opacity-50 cursor-pointer border-none"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
                </svg>
                Start Recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red text-white py-3 font-semibold hover:opacity-90 transition-all cursor-pointer border-none"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="1.5" />
                </svg>
                Stop
              </button>
            )}

            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-xl bg-white border border-bdl text-ink px-4 py-3 hover:border-cyan-2 hover:text-cyan-2 transition-all disabled:opacity-50 cursor-pointer"
              title="Take photo"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span className="hidden sm:inline">Photo</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-xl bg-white border border-bdl text-ink px-4 py-3 hover:border-cyan-2 hover:text-cyan-2 transition-all disabled:opacity-50 cursor-pointer"
              title="Upload images"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span className="hidden sm:inline">Upload</span>
            </button>
          </div>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleImageFiles(e.target.files)}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleImageFiles(e.target.files)}
            className="hidden"
          />

          <div className="rounded-xl bg-light-2 border border-bdl p-3 min-h-[120px] max-h-[300px] overflow-y-auto">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted mb-2">
              Transcript {sttProvider === 'sarvam' && <span className="text-cyan-2 normal-case font-normal">(via Sarvam AI)</span>}
              {sttProvider === 'browser' && <span className="text-muted normal-case font-normal">(live via browser)</span>}
            </p>
            {transcript || interim ? (
              <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">
                {transcript}
                {interim && <span className="text-muted italic"> {interim}</span>}
              </p>
            ) : (
              <p className="text-sm text-muted italic">
                {hasWebSpeech
                  ? 'Your speech will appear here as you record.'
                  : 'Your browser doesn\u2019t support live speech. Audio will be transcribed on save via Sarvam AI.'}
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
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted mb-3">
              Images ({images.length})
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-light-2 group">
                  <img src={img.preview} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    disabled={saving}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-none text-xs"
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

        <div className="flex gap-2">
          <Link
            to="/meeting-notes"
            className="flex-1 text-center rounded-xl border border-bdl bg-white text-ink py-3 font-medium hover:bg-light-2 transition-colors no-underline"
          >
            Cancel
          </Link>
          <button
            onClick={save}
            disabled={saving || recording}
            className="flex-1 rounded-xl bg-cyan-2 text-white py-3 font-bold hover:bg-cyan transition-all disabled:opacity-50 cursor-pointer border-none"
          >
            {saving ? 'Saving...' : 'Save Meeting'}
          </button>
        </div>
      </div>
    </div>
  );
}
