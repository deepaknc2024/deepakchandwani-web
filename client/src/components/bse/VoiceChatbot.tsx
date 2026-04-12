import { useState, useRef, useEffect } from "react";
import { useVoiceChat, type VoiceChatStatus } from "@/hooks/useVoiceChat";

function statusLabel(status: VoiceChatStatus): string {
  switch (status) {
    case "idle":
      return "Click to start";
    case "connecting":
      return "Connecting...";
    case "listening":
      return "Listening - just speak";
    case "speaking":
      return "AI Speaking...";
    case "hearing":
      return "Hearing you...";
    case "processing":
      return "Processing...";
    case "muted":
      return "Muted - tap to unmute";
    case "error":
      return "Error occurred";
    case "disconnected":
      return "Reconnecting...";
    default:
      return "";
  }
}

function statusDotClass(status: VoiceChatStatus): string {
  switch (status) {
    case "listening":
    case "hearing":
      return "bg-green animate-pulse";
    case "speaking":
      return "bg-amber animate-pulse";
    case "error":
      return "bg-red";
    case "connecting":
    case "processing":
      return "bg-green";
    default:
      return "bg-slate-400";
  }
}

function micLabel(status: VoiceChatStatus): string {
  switch (status) {
    case "listening":
      return "Listening...";
    case "speaking":
      return "AI speaking...";
    case "hearing":
      return "Hearing you...";
    case "processing":
      return "Processing...";
    case "muted":
      return "Muted - tap to unmute";
    case "connecting":
      return "Starting...";
    case "disconnected":
      return "Reconnecting...";
    default:
      return "Starting...";
  }
}

export function VoiceChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    status,
    messages,
    isSpeaking: _isSpeaking,
    isMuted: _isMuted,
    connect,
    disconnect,
    toggleMute,
  } = useVoiceChat();

  const openPanel = () => {
    setIsOpen(true);
    connect();
  };

  const closePanel = () => {
    setIsOpen(false);
    disconnect();
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const avatarAnim =
    status === "speaking"
      ? "animate-[vb-speak_1s_ease-in-out_infinite]"
      : status === "listening" || status === "hearing"
        ? "animate-[vb-listen_2s_ease-in-out_infinite]"
        : "animate-[vb-breathe_4s_ease-in-out_infinite]";

  const isRecording =
    status === "listening" || status === "hearing" || status === "processing";

  return (
    <>
      {/* Custom keyframes */}
      <style>{`
        @keyframes vb-breathe { 0%,100% { transform: scale(1) } 50% { transform: scale(1.03) } }
        @keyframes vb-speak { 0%,100% { transform: scale(1) } 30% { transform: scale(1.06) } 60% { transform: scale(0.97) } }
        @keyframes vb-listen { 0%,100% { transform: scale(1); box-shadow: 0 4px 20px rgba(8,145,178,0.12) } 50% { transform: scale(1.02); box-shadow: 0 4px 24px rgba(5,150,105,0.2) } }
        @keyframes vb-wave { 0% { transform: scale(1); opacity: 0.6 } 100% { transform: scale(1.4); opacity: 0 } }
        @keyframes vb-talk { 0% { ry: 2; cy: 34 } 100% { ry: 4.5; cy: 35 } }
        @keyframes vb-pulse { 0%,100% { box-shadow: 0 6px 24px rgba(8,145,178,0.35) } 50% { box-shadow: 0 6px 32px rgba(8,145,178,0.55), 0 0 0 8px rgba(8,145,178,0.08) } }
        @keyframes vb-mic-pulse { 0%,100% { box-shadow: 0 4px 16px rgba(220,38,38,0.3) } 50% { box-shadow: 0 4px 24px rgba(220,38,38,0.5), 0 0 0 10px rgba(220,38,38,0.08) } }
        @keyframes vb-fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes vb-blink { 0%,100% { opacity: 1 } 50% { opacity: 0.3 } }
      `}</style>

      {/* FAB Button */}
      {!isOpen && (
        <button
          onClick={openPanel}
          className="fixed bottom-6 right-6 flex h-[52px] items-center justify-center gap-2 rounded-[26px] border-none bg-gradient-to-br from-cyan-2 to-indigo px-5 pl-4 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl max-sm:bottom-4 max-sm:right-4 max-sm:h-[54px] max-sm:w-[54px] max-sm:rounded-full max-sm:p-0"
          style={{
            zIndex: 800,
            animation: "vb-pulse 3s ease-in-out infinite",
          }}
          title="Chat with Voice Assistant"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6 flex-shrink-0 fill-white">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
            <circle cx="8" cy="10" r="1.2" />
            <circle cx="12" cy="10" r="1.2" />
            <circle cx="16" cy="10" r="1.2" />
          </svg>
          <span className="whitespace-nowrap font-dm text-sm font-semibold text-white max-sm:hidden">
            Click to Talk
          </span>
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div
          className="fixed flex flex-col overflow-hidden rounded-[20px] border border-bdl/30 bg-white/[0.97] shadow-2xl backdrop-blur-2xl max-sm:inset-0 max-sm:rounded-none"
          style={{
            zIndex: 800,
            width: 390,
            height: 540,
            bottom: 96,
            right: 24,
          }}
        >
          {/* Header */}
          <div className="flex flex-shrink-0 items-center justify-between bg-gradient-to-r from-cyan-2 to-indigo px-5 py-3.5 text-white">
            <div>
              <h3 className="font-space text-base font-bold">
                Voice Assistant
              </h3>
              <div className="mt-0.5 text-[0.7rem] opacity-80">
                Bharat Skills Exchange
              </div>
            </div>
            <button
              onClick={closePanel}
              className="border-none bg-transparent p-1 text-2xl text-white opacity-80 transition-opacity hover:opacity-100"
            >
              &times;
            </button>
          </div>

          {/* Avatar */}
          <div
            className="flex flex-shrink-0 flex-col items-center pb-2.5 pt-4"
            style={{
              background:
                "linear-gradient(180deg, rgba(8,145,178,0.04), transparent)",
            }}
          >
            <div
              className={`relative flex h-[72px] w-[72px] items-center justify-center rounded-full shadow-lg ${avatarAnim}`}
              style={{
                background: "linear-gradient(135deg, #e0f2fe, #ede9fe)",
                boxShadow: "0 4px 20px rgba(8,145,178,0.12)",
              }}
            >
              {/* Sound wave rings when speaking */}
              {status === "speaking" && (
                <>
                  <span
                    className="absolute inset-[-6px] rounded-full border-2 border-cyan-2/15"
                    style={{ animation: "vb-wave 1.5s ease-out infinite" }}
                  />
                  <span
                    className="absolute inset-[-14px] rounded-full border-2 border-indigo/10"
                    style={{
                      animation: "vb-wave 1.5s 0.3s ease-out infinite",
                    }}
                  />
                </>
              )}
              <svg viewBox="0 0 52 52" className="h-[52px] w-[52px]">
                <circle
                  cx="26"
                  cy="26"
                  r="24"
                  fill="#f8fafc"
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />
                <path
                  d="M8 22c0-12 8-18 18-18s18 6 18 18c0 2-1 3-2 3h-1c0-10-6-15-15-15S12 15 12 25h-1c-2 0-3-1-3-3z"
                  fill="#334155"
                />
                <ellipse cx="18" cy="24" rx="2.5" ry="3" fill="#1e293b" />
                <circle cx="17.5" cy="23.2" r=".9" fill="#fff" />
                <ellipse cx="34" cy="24" rx="2.5" ry="3" fill="#1e293b" />
                <circle cx="33.5" cy="23.2" r=".9" fill="#fff" />
                <path
                  d="M14 20c1.5-2 4-3 6-2"
                  stroke="#334155"
                  strokeWidth="1.2"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M32 18c2-1 4.5 0 6 2"
                  stroke="#334155"
                  strokeWidth="1.2"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M26 27v4c0 1-1 1.5-2 1.5"
                  stroke="#94a3b8"
                  strokeWidth=".8"
                  fill="none"
                  strokeLinecap="round"
                />
                <ellipse
                  cx="26"
                  cy="34"
                  rx="5"
                  ry="2"
                  fill="#f87171"
                  style={
                    status === "speaking"
                      ? { animation: "vb-talk 0.4s ease-in-out infinite alternate" }
                      : undefined
                  }
                />
                <path
                  d="M21 35c2 2 8 2 10 0"
                  stroke="#dc2626"
                  strokeWidth=".5"
                  fill="none"
                  opacity=".3"
                />
              </svg>
            </div>
            <div className="mt-2 text-xs font-semibold text-faint">
              AI Assistant
            </div>
          </div>

          {/* Status */}
          <div className="flex flex-shrink-0 items-center gap-2 border-b border-bdl/20 px-5 py-1.5 text-xs font-semibold text-muted">
            <span
              className={`h-2 w-2 flex-shrink-0 rounded-full ${statusDotClass(status)}`}
              style={
                status === "listening" || status === "speaking"
                  ? { animation: "vb-blink 1s infinite" }
                  : undefined
              }
            />
            <span>{statusLabel(status)}</span>
          </div>

          {/* Messages */}
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[85%] break-words rounded-[14px] px-4 py-2.5 text-sm leading-relaxed ${
                  msg.type === "bot"
                    ? "self-start rounded-bl bg-light-2/90 text-ink"
                    : msg.type === "user"
                      ? "self-end rounded-br bg-gradient-to-br from-cyan-2 to-indigo text-white"
                      : "self-center bg-transparent py-1 text-xs italic text-slate-400"
                }`}
                style={{ animation: "vb-fadeIn 0.3s ease" }}
              >
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Controls */}
          <div className="flex flex-shrink-0 items-center justify-center gap-4 border-t border-bdl/20 bg-light/80 px-5 py-3">
            <span className="min-w-[80px] text-center text-xs font-medium text-faint">
              {micLabel(status)}
            </span>
            <button
              onClick={toggleMute}
              className={`flex h-14 w-14 items-center justify-center rounded-full border-none transition-all duration-300 hover:scale-105 ${
                isRecording
                  ? "bg-gradient-to-br from-red to-pink-700 shadow-lg"
                  : "bg-gradient-to-br from-cyan-2 to-indigo shadow-lg"
              }`}
              style={
                isRecording
                  ? { animation: "vb-mic-pulse 1.5s infinite" }
                  : { boxShadow: "0 4px 16px rgba(8,145,178,0.25)" }
              }
            >
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6 fill-white"
              >
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </button>
            <span className="min-w-[80px]" />
          </div>
        </div>
      )}
    </>
  );
}
