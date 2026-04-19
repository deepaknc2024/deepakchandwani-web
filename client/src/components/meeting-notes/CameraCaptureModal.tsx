import { useEffect, useRef, useState } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  onCapture: (blob: Blob) => void;
}

export default function CameraCaptureModal({ open, onClose, onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setError(null);
    setReady(false);

    const start = async () => {
      try {
        // Check if more than one video input exists (for switch button)
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = devices.filter((d) => d.kind === 'videoinput');
          if (active) setHasMultipleCameras(videoInputs.length > 1);
        } catch {
          // ignore
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setReady(true);
        }
      } catch (err) {
        if (!active) return;
        setError(
          (err as Error).name === 'NotAllowedError'
            ? 'Camera access denied. Please allow access in your browser.'
            : (err as Error).message || 'Failed to open camera',
        );
      }
    };
    start();

    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [open, facing]);

  const snap = () => {
    const video = videoRef.current;
    if (!video || !ready) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    setFlashing(true);
    setTimeout(() => setFlashing(false), 150);

    canvas.toBlob(
      (blob) => {
        if (blob) onCapture(blob);
      },
      'image/jpeg',
      0.92,
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" role="dialog" aria-modal="true">
      {/* Top bar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-black/80 text-white">
        <button
          onClick={onClose}
          className="text-white bg-white/10 hover:bg-white/20 rounded-full w-10 h-10 flex items-center justify-center border-none cursor-pointer text-xl"
          title="Close"
        >
          &times;
        </button>
        <p className="text-sm font-medium">Camera</p>
        {hasMultipleCameras ? (
          <button
            onClick={() => setFacing((f) => (f === 'environment' ? 'user' : 'environment'))}
            className="text-white bg-white/10 hover:bg-white/20 rounded-full w-10 h-10 flex items-center justify-center border-none cursor-pointer"
            title="Switch camera"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <polyline points="23 20 23 14 17 14" />
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
            </svg>
          </button>
        ) : (
          <span className="w-10" />
        )}
      </div>

      {/* Video */}
      <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
        {error ? (
          <div className="text-center px-6">
            <p className="text-red text-sm mb-3">{error}</p>
            <button
              onClick={onClose}
              className="rounded-lg bg-white/10 text-white px-4 py-2 text-sm hover:bg-white/20 cursor-pointer border-none"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="max-w-full max-h-full object-contain"
            />
            {flashing && <div className="absolute inset-0 bg-white opacity-70 pointer-events-none" />}
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center text-white/70 text-sm">
                Starting camera...
              </div>
            )}
          </>
        )}
      </div>

      {/* Shutter */}
      <div className="shrink-0 flex items-center justify-center py-6 bg-black/80">
        <button
          onClick={snap}
          disabled={!ready || !!error}
          className="w-16 h-16 rounded-full bg-white border-4 border-white/60 shadow-lg disabled:opacity-40 cursor-pointer hover:scale-105 transition-transform active:scale-95"
          aria-label="Capture photo"
        />
      </div>
    </div>
  );
}
