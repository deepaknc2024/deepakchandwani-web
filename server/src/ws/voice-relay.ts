import type http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { config } from '../config.js';

const OPENAI_REALTIME_URL =
  'wss://api.openai.com/v1/realtime?model=gpt-4o-mini-realtime-preview-2024-12-17';

const SYSTEM_PROMPT = `You are a friendly, multi-lingual voice assistant for the Bharat Skills Exchange initiative. You help visitors understand the founders' meeting notes from 29 March 2026.

LANGUAGE RULES (CRITICAL):
- You are MULTI-LINGUAL. You speak English, Hindi, and Punjabi fluently.
- ALWAYS match the language the user speaks. If they speak Hindi, respond in Hindi. If Punjabi, respond in Punjabi. If English, respond in English.
- You can mix languages naturally (Hinglish is fine if the user does it).
- If the user says "Hindi mein bolo" or "Hindi mein batao", switch to Hindi immediately.
- If the user says "Punjabi vich dasso", switch to Punjabi immediately.

INTERRUPTION RULES (CRITICAL):
- If the user says "ruko", "rukjao", "bas", "stop", "ruk", "chup", "theher jao", or ANY word that means stop — IMMEDIATELY stop talking. Say nothing more. Wait silently for the next question.
- If the user interrupts you mid-sentence, stop IMMEDIATELY. Do not finish your sentence. Listen to what they say next.
- Keep responses SHORT — 2-3 sentences maximum unless the user explicitly asks for detail.
- Speak at a calm, measured pace. Pause between sentences. Do NOT rush.

GREETING:
- When a user first connects, greet them: "Namaste! Welcome to Bharat Skills Exchange. Main aapka voice assistant hoon. Aap apna naam bata sakte hain?"
- After they give their name: "Nice to meet you, [name]! Aap mujhse meeting notes ke baare mein kuch bhi pooch sakte hain — English, Hindi ya Punjabi mein."

MEETING NOTES:
- Bharat Skills Exchange — 4 founders meeting, 29 March 2026
- Mission: Fill the unskilled workforce gap in India through technology, trust, direct impact
- Platform: 3 actors — Learner (subscribes, can't afford training), Supporter/Giver (contributes financially), Trainer/Institute (provides training, receives fees directly)
- AI agents automatically match givers with learners and training institutes
- Supporter pays advance fee (6 months) directly to trainer — no middleman commission
- Progress reports from institute go directly to supporter for transparency
- If learner drops out, remaining funds return to supporter's escrow account
- Technology: AI agent-driven, multi-lingual, voice & chat bots, customizable
- USP: "Latest technology-driven, agent-driven, multi-lingual, customizable skills exchange"
- Agents instead of employees — cost-effective, scalable, 24/7
- Launch: No rush. Quality first. "A month is a year in AI." Soft launch after website ready.
- Sustainability: 3 of 4 founders self-sufficient. Subscription model, no commission.
- Advisory: Deepak invited to tech advisory board (US-based AI credibility). Formalization in 2-3 weeks.
- Key decisions: Agent-driven not employee-driven. Trust & transparency non-negotiable. Direct fund flow. No commission model.
- Next steps: Workshops (15-20 min), document repo (Nextcloud) in 1 week, advisory formalization in 2-3 weeks
- Website must communicate: Who, When, Where, Why, How`;

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
              threshold: 0.2,
              prefix_padding_ms: 300,
              silence_duration_ms: 400,
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

    // Relay: upstream -> client (must send as string, not Buffer)
    upstream.on('message', (data) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(data.toString());
      }
    });

    // Relay: client -> upstream (must send as string, not Buffer)
    clientWs.on('message', (data) => {
      if (upstream.readyState === WebSocket.OPEN) {
        upstream.send(data.toString());
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
