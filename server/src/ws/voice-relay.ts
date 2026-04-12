import type http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { config } from '../config.js';

const OPENAI_REALTIME_URL =
  'wss://api.openai.com/v1/realtime?model=gpt-4o-mini-realtime-preview-2024-12-17';

const SYSTEM_PROMPT = `You are a friendly and knowledgeable voice assistant for the Bharat Skills Exchange initiative. Your job is to help visitors understand the founders' meeting notes from 29 March 2026.

BEHAVIOR:
- When a user first connects, greet them warmly and say: 'Hello! Welcome to Bharat Skills Exchange. I'm your voice assistant. May I know your name?'
- After they give their name, say: 'Nice to meet you, [name]! I'm here to help you learn about our founders' meeting from March 29th, 2026. Feel free to ask me anything about our mission, platform, technology, or next steps.'
- Keep responses concise and conversational — this is voice, not text.
- Only answer based on the meeting notes below. If asked about something not covered, say so politely.

MEETING NOTES:
- Bharat Skills Exchange — 4 founders meeting, 29 March 2026
- Mission: Fill the unskilled workforce gap in India through technology, trust, direct impact
- Platform: 3 actors — Learner (subscribes, can't afford training), Supporter/Giver (contributes financially), Trainer/Institute (provides training, receives fees directly)
- AI agents match givers with learners. No middleman commission. Escrow accounts. Progress reports.
- Technology: AI agent-driven, multi-lingual, voice & chat bots, customizable
- Launch: No rush. Quality first. Soft launch after website ready.
- Sustainability: 3 of 4 founders self-sufficient. Subscription model, no commission.
- Advisory: Deepak on tech advisory board (US-based AI credibility)
- Key decisions: Agent-driven not employee-driven. Trust & transparency non-negotiable. Direct fund flow.
- Next steps: Workshops, document repo (Nextcloud), advisory formalization in 2-3 weeks`;

export function setupVoiceRelay(server: http.Server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    if (req.url === '/ws/voice') {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on('connection', (clientWs) => {
    console.log('[voice-relay] Client connected');

    if (!config.openaiApiKey) {
      clientWs.send(JSON.stringify({ type: 'error', message: 'OpenAI API key not configured' }));
      clientWs.close();
      return;
    }

    const upstream = new WebSocket(OPENAI_REALTIME_URL, {
      headers: {
        Authorization: `Bearer ${config.openaiApiKey}`,
        'OpenAI-Beta': 'realtime=v1',
      },
    });

    let keepaliveInterval: ReturnType<typeof setInterval> | null = null;

    upstream.on('open', () => {
      console.log('[voice-relay] Connected to OpenAI Realtime');

      // Send session configuration
      upstream.send(
        JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            voice: 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: { model: 'whisper-1' },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.35,
              prefix_padding_ms: 200,
              silence_duration_ms: 500,
            },
            instructions: SYSTEM_PROMPT,
          },
        }),
      );

      // Trigger greeting after a short delay
      setTimeout(() => {
        if (upstream.readyState === WebSocket.OPEN) {
          upstream.send(JSON.stringify({ type: 'response.create' }));
        }
      }, 500);

      // Keepalive pings every 20 seconds
      keepaliveInterval = setInterval(() => {
        if (upstream.readyState === WebSocket.OPEN) {
          upstream.ping();
        }
      }, 20_000);
    });

    // Relay: upstream -> client
    upstream.on('message', (data) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(data);
      }
    });

    // Relay: client -> upstream
    clientWs.on('message', (data) => {
      if (upstream.readyState === WebSocket.OPEN) {
        upstream.send(data);
      }
    });

    // Cleanup on upstream close
    upstream.on('close', (code, reason) => {
      console.log(`[voice-relay] OpenAI connection closed: code=${code} reason=${reason?.toString()}`);
      cleanup();
    });

    upstream.on('error', (err) => {
      console.error('[voice-relay] OpenAI error:', (err as Error).message || err);
      cleanup();
    });

    upstream.on('unexpected-response', (_req, res) => {
      let body = '';
      res.on('data', (chunk: Buffer) => { body += chunk.toString(); });
      res.on('end', () => {
        console.error(`[voice-relay] OpenAI rejected: HTTP ${res.statusCode} - ${body}`);
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({ type: 'error', message: `OpenAI error: ${res.statusCode}` }));
          clientWs.close();
        }
      });
    });

    // Cleanup on client close
    clientWs.on('close', () => {
      console.log('[voice-relay] Client disconnected');
      cleanup();
    });

    clientWs.on('error', (err) => {
      console.error('[voice-relay] Client error:', err);
      cleanup();
    });

    function cleanup() {
      if (keepaliveInterval) {
        clearInterval(keepaliveInterval);
        keepaliveInterval = null;
      }
      if (upstream.readyState === WebSocket.OPEN || upstream.readyState === WebSocket.CONNECTING) {
        upstream.close();
      }
      if (clientWs.readyState === WebSocket.OPEN || clientWs.readyState === WebSocket.CONNECTING) {
        clientWs.close();
      }
    }
  });
}
