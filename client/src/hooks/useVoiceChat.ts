import { useState, useRef, useCallback, useEffect } from "react";

export type VoiceChatStatus =
  | "idle"
  | "connecting"
  | "listening"
  | "speaking"
  | "hearing"
  | "processing"
  | "muted"
  | "error"
  | "disconnected";

export interface ChatMessage {
  id: string;
  text: string;
  type: "bot" | "user" | "system";
}

interface UseVoiceChatReturn {
  status: VoiceChatStatus;
  messages: ChatMessage[];
  isConnected: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  connect: () => void;
  disconnect: () => void;
  toggleMute: () => void;
}

let msgIdCounter = 0;

export function useVoiceChat(): UseVoiceChatReturn {
  const [status, setStatus] = useState<VoiceChatStatus>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const isRecordingRef = useRef(false);
  const isBotSpeakingRef = useRef(false);
  const currentBotMsgIdRef = useRef<string | null>(null);
  const nextPlayTimeRef = useRef(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const panelOpenRef = useRef(false);

  const addMessage = useCallback(
    (text: string, type: "bot" | "user" | "system") => {
      const id = `msg-${++msgIdCounter}`;
      setMessages((prev) => [...prev, { id, text, type }]);
      return id;
    },
    [],
  );

  const updateMessage = useCallback((id: string, appendText: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, text: m.text + appendText } : m)),
    );
  }, []);

  const flushAudio = useCallback(() => {
    activeSourcesRef.current.forEach((s) => {
      try {
        s.stop();
      } catch {}
    });
    activeSourcesRef.current = [];
    nextPlayTimeRef.current = 0;
  }, []);

  const playAudioChunk = useCallback((base64: string) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext({ sampleRate: 24000 });
    }
    const ctx = audioCtxRef.current;

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768;
    }

    const buffer = ctx.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const now = ctx.currentTime;
    if (nextPlayTimeRef.current < now) nextPlayTimeRef.current = now;
    source.start(nextPlayTimeRef.current);
    nextPlayTimeRef.current += buffer.duration;

    activeSourcesRef.current.push(source);
    source.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter(
        (s) => s !== source,
      );
    };
  }, []);

  const stopMic = useCallback(() => {
    isRecordingRef.current = false;
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
  }, []);

  const startMic = useCallback(async () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext({ sampleRate: 24000 });
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") await ctx.resume();

      micStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const source = ctx.createMediaStreamSource(micStreamRef.current);
      processorRef.current = ctx.createScriptProcessor(4096, 1, 1);

      processorRef.current.onaudioprocess = (e) => {
        if (
          !isRecordingRef.current ||
          !wsRef.current ||
          wsRef.current.readyState !== 1
        )
          return;
        const float32 = e.inputBuffer.getChannelData(0);
        const int16 = new Int16Array(float32.length);
        for (let i = 0; i < float32.length; i++) {
          const s = Math.max(-1, Math.min(1, float32[i]));
          int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        const base64 = btoa(
          String.fromCharCode(...new Uint8Array(int16.buffer)),
        );
        wsRef.current.send(
          JSON.stringify({ type: "input_audio_buffer.append", audio: base64 }),
        );
      };

      source.connect(processorRef.current);
      processorRef.current.connect(ctx.destination);

      isRecordingRef.current = true;
      setIsMuted(false);
      setStatus("listening");
    } catch {
      setStatus("error");
      addMessage("Please allow microphone access to use voice chat.", "system");
    }
  }, [addMessage]);

  const connectWS = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState <= 1) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${window.location.host}/ws/voice`;

    setStatus("connecting");
    setMessages([]);

    try {
      wsRef.current = new WebSocket(url);
    } catch {
      setStatus("error");
      return;
    }

    wsRef.current.onopen = () => {
      setIsConnected(true);
      setStatus("connecting");
      addMessage("Connecting to voice assistant...", "system");
      startMic();
    };

    wsRef.current.onmessage = (evt) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(evt.data);
      } catch {
        return;
      }

      switch (msg.type) {
        case "session.created":
          setStatus("listening");
          break;

        case "response.audio.delta":
          if (!isBotSpeakingRef.current) {
            isBotSpeakingRef.current = true;
            setIsSpeaking(true);
            setStatus("speaking");
          }
          playAudioChunk(msg.delta as string);
          break;

        case "response.audio.done":
          setTimeout(() => {
            isBotSpeakingRef.current = false;
            setIsSpeaking(false);
            setStatus("listening");
          }, 400);
          break;

        case "response.audio_transcript.delta":
          if (!currentBotMsgIdRef.current) {
            currentBotMsgIdRef.current = addMessage("", "bot");
          }
          updateMessage(
            currentBotMsgIdRef.current,
            msg.delta as string,
          );
          break;

        case "response.audio_transcript.done":
          currentBotMsgIdRef.current = null;
          break;

        case "conversation.item.input_audio_transcription.completed": {
          const transcript = msg.transcript as string | undefined;
          if (transcript?.trim()) {
            addMessage(transcript.trim(), "user");
          }
          break;
        }

        case "input_audio_buffer.speech_started":
          if (isBotSpeakingRef.current) {
            flushAudio();
            isBotSpeakingRef.current = false;
            setIsSpeaking(false);
          }
          setStatus("hearing");
          break;

        case "input_audio_buffer.speech_stopped":
          setStatus("processing");
          break;

        case "error":
          setStatus("error");
          addMessage("Error occurred. Please try again.", "system");
          break;
      }
    };

    wsRef.current.onerror = () => {
      setStatus("error");
    };

    wsRef.current.onclose = () => {
      setIsConnected(false);
      setStatus("disconnected");
      if (panelOpenRef.current) {
        setTimeout(() => {
          if (panelOpenRef.current) {
            addMessage("Reconnecting...", "system");
            connectWS();
          }
        }, 3000);
      }
    };
  }, [addMessage, updateMessage, startMic, playAudioChunk, flushAudio]);

  const connect = useCallback(() => {
    panelOpenRef.current = true;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext({ sampleRate: 24000 });
    }
    if (audioCtxRef.current.state === "suspended")
      audioCtxRef.current.resume();
    connectWS();
  }, [connectWS]);

  const disconnect = useCallback(() => {
    panelOpenRef.current = false;
    stopMic();
    flushAudio();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsSpeaking(false);
    isBotSpeakingRef.current = false;
    currentBotMsgIdRef.current = null;
    nextPlayTimeRef.current = 0;
    setStatus("idle");
  }, [stopMic, flushAudio]);

  const toggleMute = useCallback(() => {
    if (isRecordingRef.current) {
      stopMic();
      setIsMuted(true);
      setStatus("muted");
    } else {
      startMic();
    }
  }, [stopMic, startMic]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      panelOpenRef.current = false;
      stopMic();
      flushAudio();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [stopMic, flushAudio]);

  return {
    status,
    messages,
    isConnected,
    isSpeaking,
    isMuted,
    connect,
    disconnect,
    toggleMute,
  };
}
