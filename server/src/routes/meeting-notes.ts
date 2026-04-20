import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';
import { config } from '../config.js';
import { query } from '../db.js';
import { authenticateSession } from './auth.js';

const router = Router();

const UPLOADS_ROOT = path.resolve(
  process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads'),
  'meeting-notes',
);
fs.mkdirSync(UPLOADS_ROOT, { recursive: true });

function noteDir(noteId: number) {
  return path.join(UPLOADS_ROOT, String(noteId));
}

function randName(ext: string) {
  return `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`;
}

// Use memory storage — we need the note id first to place files in the right folder
export const MN_FILE_SIZE_LIMIT = 200 * 1024 * 1024; // 200 MB per file
export const MN_TOTAL_SIZE_LIMIT = 450 * 1024 * 1024; // 450 MB total per request (Nginx caps at 500M)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MN_FILE_SIZE_LIMIT },
});

async function ownsNote(noteId: number, userId: number): Promise<boolean> {
  const r = await query('SELECT 1 FROM meeting_notes WHERE id=$1 AND user_id=$2', [noteId, userId]);
  return (r.rowCount ?? 0) > 0;
}

// ── POST /meeting-notes — create ─────────────────────────────────────
router.post(
  '/meeting-notes',
  authenticateSession,
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'images', maxCount: 20 },
  ]),
  async (req: Request, res: Response) => {
    const user = (req as any).user;
    const files = req.files as { audio?: Express.Multer.File[]; images?: Express.Multer.File[] };
    const { title, transcript, sttProvider, durationSeconds } = req.body ?? {};

    try {
      const r = await query(
        `INSERT INTO meeting_notes (user_id, title, transcript, stt_provider, audio_duration_seconds)
         VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at`,
        [
          user.user_id,
          (title || 'Untitled Meeting').toString().slice(0, 255),
          (transcript || '').toString(),
          (sttProvider || 'browser').toString().slice(0, 50),
          durationSeconds ? parseInt(durationSeconds, 10) : null,
        ],
      );
      const noteId: number = r.rows[0].id;

      fs.mkdirSync(noteDir(noteId), { recursive: true });

      // Save audio
      let audioFilename: string | null = null;
      const audio = files.audio?.[0];
      if (audio && audio.buffer.length > 0) {
        const ext =
          audio.mimetype.includes('webm') ? '.webm' :
          audio.mimetype.includes('mp4') || audio.mimetype.includes('m4a') ? '.m4a' :
          audio.mimetype.includes('ogg') ? '.ogg' :
          audio.mimetype.includes('wav') ? '.wav' : '.webm';
        audioFilename = `audio${ext}`;
        fs.writeFileSync(path.join(noteDir(noteId), audioFilename), audio.buffer);
        await query('UPDATE meeting_notes SET audio_filename=$1 WHERE id=$2', [audioFilename, noteId]);
      }

      // Save images
      const images = files.images || [];
      const imageRows: Array<{ id: number; filename: string; mime_type: string }> = [];
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const ext =
          img.mimetype.includes('jpeg') || img.mimetype.includes('jpg') ? '.jpg' :
          img.mimetype.includes('png') ? '.png' :
          img.mimetype.includes('webp') ? '.webp' : '.jpg';
        const filename = `img-${randName(ext)}`;
        fs.writeFileSync(path.join(noteDir(noteId), filename), img.buffer);
        const ir = await query(
          `INSERT INTO meeting_note_images (note_id, filename, mime_type, sort_order)
           VALUES ($1, $2, $3, $4) RETURNING id, filename, mime_type`,
          [noteId, filename, img.mimetype, i],
        );
        imageRows.push(ir.rows[0]);
      }

      res.status(201).json({
        ok: true,
        note: {
          id: noteId,
          title: (title || 'Untitled Meeting').toString(),
          createdAt: r.rows[0].created_at,
          audio: !!audioFilename,
          images: imageRows.map((im) => ({ id: im.id, mimeType: im.mime_type })),
        },
      });
    } catch (err) {
      console.error('[meeting-notes] create error:', err);
      res.status(500).json({ ok: false, error: 'Failed to save meeting note' });
    }
  },
);

// ── POST /meeting-notes/:id/append — add images and/or another recording ─
router.post(
  '/meeting-notes/:id/append',
  authenticateSession,
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'images', maxCount: 20 },
  ]),
  async (req: Request, res: Response) => {
    const user = (req as any).user;
    const noteId = parseInt(String(req.params.id), 10);
    const files = req.files as { audio?: Express.Multer.File[]; images?: Express.Multer.File[] };
    const { appendTranscript, durationSeconds } = req.body ?? {};

    if (!noteId) return res.status(400).json({ ok: false, error: 'Invalid id' });

    try {
      const own = await query(
        'SELECT id, transcript, audio_filename, audio_duration_seconds FROM meeting_notes WHERE id=$1 AND user_id=$2',
        [noteId, user.user_id],
      );
      if (own.rowCount === 0) return res.status(404).json({ ok: false, error: 'Not found' });
      const existing = own.rows[0];

      fs.mkdirSync(noteDir(noteId), { recursive: true });

      // ── Append audio: binary-concat the new WebM onto the existing file ──
      let updatedAudioFilename: string | null = existing.audio_filename;
      const audio = files.audio?.[0];
      if (audio && audio.buffer.length > 0) {
        const ext =
          audio.mimetype.includes('webm') ? '.webm' :
          audio.mimetype.includes('mp4') || audio.mimetype.includes('m4a') ? '.m4a' :
          audio.mimetype.includes('ogg') ? '.ogg' :
          audio.mimetype.includes('wav') ? '.wav' : '.webm';

        if (existing.audio_filename) {
          // Append to existing file
          const target = path.join(noteDir(noteId), existing.audio_filename);
          fs.appendFileSync(target, audio.buffer);
        } else {
          // First audio for this note
          updatedAudioFilename = `audio${ext}`;
          fs.writeFileSync(path.join(noteDir(noteId), updatedAudioFilename), audio.buffer);
        }
      }

      // ── Append images ──
      const images = files.images || [];
      const existingCount = await query(
        'SELECT COUNT(*)::int AS c FROM meeting_note_images WHERE note_id=$1',
        [noteId],
      );
      const startOrder = Number(existingCount.rows[0]?.c || 0);
      const imageRows: Array<{ id: number; mime_type: string }> = [];
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const ext =
          img.mimetype.includes('jpeg') || img.mimetype.includes('jpg') ? '.jpg' :
          img.mimetype.includes('png') ? '.png' :
          img.mimetype.includes('webp') ? '.webp' : '.jpg';
        const filename = `img-${randName(ext)}`;
        fs.writeFileSync(path.join(noteDir(noteId), filename), img.buffer);
        const ir = await query(
          `INSERT INTO meeting_note_images (note_id, filename, mime_type, sort_order)
           VALUES ($1, $2, $3, $4) RETURNING id, mime_type`,
          [noteId, filename, img.mimetype, startOrder + i],
        );
        imageRows.push(ir.rows[0]);
      }

      // ── Append transcript + update audio metadata ──
      const addText = (appendTranscript || '').toString().trim();
      const extraSeconds = durationSeconds ? parseInt(durationSeconds, 10) : 0;
      const newTranscript = addText
        ? (existing.transcript ? `${existing.transcript}\n\n${addText}` : addText)
        : existing.transcript;
      const newDuration = (existing.audio_duration_seconds || 0) + (isNaN(extraSeconds) ? 0 : extraSeconds);

      await query(
        `UPDATE meeting_notes
           SET transcript = $1,
               audio_filename = $2,
               audio_duration_seconds = $3,
               updated_at = NOW()
         WHERE id = $4`,
        [newTranscript, updatedAudioFilename, newDuration || null, noteId],
      );

      res.json({
        ok: true,
        imagesAdded: imageRows.length,
        audioAppended: !!(audio && audio.buffer.length > 0),
        transcriptAppended: !!addText,
        newDurationSeconds: newDuration,
      });
    } catch (err) {
      console.error('[meeting-notes] append error:', err);
      res.status(500).json({ ok: false, error: 'Failed to append' });
    }
  },
);

// ── DELETE /meeting-note-images/:imageId — remove a single image ─────
router.delete('/meeting-note-images/:imageId', authenticateSession, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const imageId = parseInt(String(req.params.imageId), 10);
  if (!imageId) return res.status(400).json({ ok: false, error: 'Invalid id' });
  try {
    const r = await query(
      `SELECT i.id, i.note_id, i.filename FROM meeting_note_images i
       JOIN meeting_notes n ON n.id = i.note_id
       WHERE i.id=$1 AND n.user_id=$2`,
      [imageId, user.user_id],
    );
    if (r.rowCount === 0) return res.status(404).json({ ok: false, error: 'Not found' });
    const row = r.rows[0];
    await query('DELETE FROM meeting_note_images WHERE id=$1', [imageId]);
    try {
      fs.unlinkSync(path.join(noteDir(row.note_id), row.filename));
    } catch { /* ignore */ }
    res.json({ ok: true });
  } catch (err) {
    console.error('[meeting-notes] delete image error:', err);
    res.status(500).json({ ok: false, error: 'Failed to delete image' });
  }
});

// ── GET /meeting-notes — list (grouped client-side) ──────────────────
router.get('/meeting-notes', authenticateSession, async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const r = await query(
      `SELECT n.id, n.title, n.created_at, n.audio_duration_seconds,
              LEFT(n.transcript, 240) AS preview,
              (SELECT COUNT(*) FROM meeting_note_images i WHERE i.note_id = n.id)::int AS image_count,
              n.audio_filename IS NOT NULL AS has_audio
       FROM meeting_notes n
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT 500`,
      [user.user_id],
    );
    res.json({
      ok: true,
      notes: r.rows.map((row) => ({
        id: row.id,
        title: row.title,
        createdAt: row.created_at,
        durationSeconds: row.audio_duration_seconds,
        preview: row.preview,
        imageCount: row.image_count,
        hasAudio: row.has_audio,
      })),
    });
  } catch (err) {
    console.error('[meeting-notes] list error:', err);
    res.status(500).json({ ok: false, error: 'Failed to list notes' });
  }
});

// ── GET /meeting-notes/:id — detail ──────────────────────────────────
router.get('/meeting-notes/:id', authenticateSession, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const noteId = parseInt(String(req.params.id), 10);
  if (!noteId) return res.status(400).json({ ok: false, error: 'Invalid id' });

  try {
    const n = await query(
      `SELECT id, title, transcript, audio_filename, audio_duration_seconds, stt_provider, created_at
       FROM meeting_notes WHERE id=$1 AND user_id=$2`,
      [noteId, user.user_id],
    );
    if (n.rowCount === 0) return res.status(404).json({ ok: false, error: 'Not found' });

    const imgs = await query(
      `SELECT id, mime_type, caption, sort_order FROM meeting_note_images
       WHERE note_id=$1 ORDER BY sort_order`,
      [noteId],
    );
    const prompts = await query(
      `SELECT id, prompt, response, model_used, created_at FROM meeting_note_prompts
       WHERE note_id=$1 ORDER BY created_at DESC LIMIT 50`,
      [noteId],
    );
    const plays = await query(
      `SELECT id, prompt_id, lang_code, lang_label, cost_total_usd, cost_translation_usd, cost_tts_usd,
              translation_model, tts_provider, input_tokens, output_tokens, tts_chars, created_at
       FROM meeting_note_tts_plays
       WHERE note_id=$1 ORDER BY created_at`,
      [noteId],
    );
    const playsByPrompt = new Map<number, Array<Record<string, unknown>>>();
    for (const row of plays.rows) {
      if (row.prompt_id == null) continue;
      const list = playsByPrompt.get(row.prompt_id) || [];
      list.push({
        id: row.id,
        langCode: row.lang_code,
        langLabel: row.lang_label,
        cost: {
          totalUsd: Number(row.cost_total_usd),
          translationUsd: Number(row.cost_translation_usd),
          ttsUsd: Number(row.cost_tts_usd),
          translationModel: row.translation_model,
          ttsProvider: row.tts_provider,
          inputTokens: row.input_tokens,
          outputTokens: row.output_tokens,
          ttsChars: row.tts_chars,
        },
        createdAt: row.created_at,
      });
      playsByPrompt.set(row.prompt_id, list);
    }

    const row = n.rows[0];
    res.json({
      ok: true,
      note: {
        id: row.id,
        title: row.title,
        transcript: row.transcript,
        hasAudio: !!row.audio_filename,
        durationSeconds: row.audio_duration_seconds,
        sttProvider: row.stt_provider,
        createdAt: row.created_at,
        images: imgs.rows.map((r) => ({
          id: r.id,
          mimeType: r.mime_type,
          caption: r.caption,
          sortOrder: r.sort_order,
        })),
        prompts: prompts.rows.map((p) => ({
          id: p.id,
          prompt: p.prompt,
          response: p.response,
          modelUsed: p.model_used,
          createdAt: p.created_at,
          ttsPlays: playsByPrompt.get(p.id) || [],
        })),
      },
    });
  } catch (err) {
    console.error('[meeting-notes] detail error:', err);
    res.status(500).json({ ok: false, error: 'Failed to fetch note' });
  }
});

// ── DELETE /meeting-notes/:id ────────────────────────────────────────
router.delete('/meeting-notes/:id', authenticateSession, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const noteId = parseInt(String(req.params.id), 10);
  if (!noteId) return res.status(400).json({ ok: false, error: 'Invalid id' });

  try {
    if (!(await ownsNote(noteId, user.user_id))) {
      return res.status(404).json({ ok: false, error: 'Not found' });
    }
    await query('DELETE FROM meeting_notes WHERE id=$1', [noteId]);
    try {
      fs.rmSync(noteDir(noteId), { recursive: true, force: true });
    } catch {
      // ignore filesystem errors
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('[meeting-notes] delete error:', err);
    res.status(500).json({ ok: false, error: 'Failed to delete' });
  }
});

// ── GET /meeting-notes/:id/audio ─────────────────────────────────────
router.get('/meeting-notes/:id/audio', authenticateSession, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const noteId = parseInt(String(req.params.id), 10);
  if (!noteId) return res.status(400).end();
  try {
    const r = await query(
      'SELECT audio_filename FROM meeting_notes WHERE id=$1 AND user_id=$2',
      [noteId, user.user_id],
    );
    if (r.rowCount === 0 || !r.rows[0].audio_filename) {
      return res.status(404).end();
    }
    const file = path.join(noteDir(noteId), r.rows[0].audio_filename);
    if (!fs.existsSync(file)) return res.status(404).end();
    const ext = path.extname(file).toLowerCase();
    const mime =
      ext === '.webm' ? 'audio/webm' :
      ext === '.m4a' ? 'audio/mp4' :
      ext === '.ogg' ? 'audio/ogg' :
      ext === '.wav' ? 'audio/wav' : 'application/octet-stream';
    res.setHeader('Content-Type', mime);
    fs.createReadStream(file).pipe(res);
  } catch (err) {
    console.error('[meeting-notes] audio error:', err);
    res.status(500).end();
  }
});

// ── GET /meeting-note-images/:imageId ────────────────────────────────
router.get('/meeting-note-images/:imageId', authenticateSession, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const imageId = parseInt(String(req.params.imageId), 10);
  if (!imageId) return res.status(400).end();
  try {
    const r = await query(
      `SELECT i.filename, i.mime_type, i.note_id
       FROM meeting_note_images i JOIN meeting_notes n ON n.id = i.note_id
       WHERE i.id=$1 AND n.user_id=$2`,
      [imageId, user.user_id],
    );
    if (r.rowCount === 0) return res.status(404).end();
    const row = r.rows[0];
    const file = path.join(noteDir(row.note_id), row.filename);
    if (!fs.existsSync(file)) return res.status(404).end();
    res.setHeader('Content-Type', row.mime_type);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    fs.createReadStream(file).pipe(res);
  } catch (err) {
    console.error('[meeting-notes] image error:', err);
    res.status(500).end();
  }
});

// ── POST /meeting-notes/transcribe — Sarvam STT fallback ─────────────
// Called from browser when Web Speech API isn't available. Receives an audio blob.
router.post(
  '/meeting-notes/transcribe',
  authenticateSession,
  upload.single('audio'),
  async (req: Request, res: Response) => {
    const audio = req.file;
    const languageCode = (req.body?.languageCode as string) || 'unknown';

    if (!audio || audio.buffer.length < 500) {
      return res.status(400).json({ ok: false, error: 'Audio is required' });
    }
    if (!config.sarvamApiKey) {
      return res.status(503).json({ ok: false, error: 'Server-side STT not configured' });
    }

    console.log(`[mn-stt] incoming ${audio.buffer.length} bytes, mime=${audio.mimetype}, lang=${languageCode}`);

    try {
      const form = new FormData();
      // Strip codec suffix — Sarvam wants plain mime like "audio/webm"
      const baseMime = (audio.mimetype || 'audio/webm').split(';')[0].trim();
      const blob = new Blob([new Uint8Array(audio.buffer)], { type: baseMime });
      const ext =
        baseMime.includes('webm') ? 'webm' :
        baseMime.includes('mp4') ? 'm4a' :
        baseMime.includes('wav') ? 'wav' :
        baseMime.includes('ogg') ? 'ogg' : 'webm';
      form.append('file', blob, `recording.${ext}`);
      form.append('model', 'saarika:v2.5');
      form.append('language_code', languageCode);
      form.append('with_timestamps', 'false');

      const resp = await fetch('https://api.sarvam.ai/speech-to-text', {
        method: 'POST',
        headers: { 'api-subscription-key': config.sarvamApiKey },
        body: form,
        signal: AbortSignal.timeout(60000),
      });

      if (!resp.ok) {
        const err = await resp.text();
        console.log(`[mn-stt] Sarvam ${resp.status}: ${err.substring(0, 400)}`);
        return res.status(502).json({
          ok: false,
          error: `Sarvam ${resp.status}: ${err.substring(0, 200)}`,
        });
      }

      const data = (await resp.json()) as { transcript?: string; language_code?: string };
      res.json({
        ok: true,
        transcript: data.transcript || '',
        languageCode: data.language_code || languageCode,
        provider: 'Sarvam AI (saarika:v2)',
      });
    } catch (err) {
      console.error('[meeting-notes] transcribe error:', err);
      res.status(500).json({ ok: false, error: 'Transcription failed' });
    }
  },
);

// ── POST /meeting-notes/:id/prompt — run a prompt over the note ──────
router.post('/meeting-notes/:id/prompt', authenticateSession, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const noteId = parseInt(String(req.params.id), 10);
  const { prompt } = req.body as { prompt?: string };

  if (!noteId) return res.status(400).json({ ok: false, error: 'Invalid id' });
  if (!prompt || prompt.trim().length < 2) {
    return res.status(400).json({ ok: false, error: 'Prompt is required' });
  }
  if (!config.openrouterApiKey) {
    return res.status(503).json({ ok: false, error: 'AI not configured' });
  }

  try {
    const n = await query(
      `SELECT id, title, transcript FROM meeting_notes WHERE id=$1 AND user_id=$2`,
      [noteId, user.user_id],
    );
    if (n.rowCount === 0) return res.status(404).json({ ok: false, error: 'Not found' });
    const note = n.rows[0];

    const imgs = await query(
      `SELECT id, filename, mime_type FROM meeting_note_images WHERE note_id=$1 ORDER BY sort_order`,
      [noteId],
    );

    const imageParts: Array<{ type: 'image_url'; image_url: { url: string } }> = [];
    for (const img of imgs.rows) {
      try {
        const buf = fs.readFileSync(path.join(noteDir(noteId), img.filename));
        const dataUrl = `data:${img.mime_type};base64,${buf.toString('base64')}`;
        imageParts.push({ type: 'image_url', image_url: { url: dataUrl } });
      } catch {
        // skip missing files
      }
    }

    const hasImages = imageParts.length > 0;

    const systemPrompt = `You are helping the user make sense of a meeting they just recorded.
They have provided:
- A transcript of what was said (may be rough — live speech recognition)
${hasImages ? '- One or more images captured during the meeting (whiteboards, slides, documents, scenes)\n' : ''}
Respond directly and concretely to their instruction. Use the transcript and images as the source of truth. If the transcript is noisy, interpret charitably. Do not invent facts. Use markdown for structure only when helpful.`;

    const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      {
        type: 'text',
        text: `Meeting: "${note.title}"

Transcript:
${note.transcript || '(empty transcript)'}

Instruction from user:
${prompt.trim()}`,
      },
      ...imageParts,
    ];

    // Text-only: try free gpt-oss first, then Gemini. With images: Gemini only.
    const MODELS = hasImages
      ? [{ id: 'google/gemini-2.0-flash-001', label: 'Gemini 2.0 Flash' }]
      : [
          { id: 'openai/gpt-oss-120b:free', label: 'OpenAI GPT-OSS 120B (Free)' },
          { id: 'google/gemini-2.0-flash-001', label: 'Gemini 2.0 Flash' },
        ];

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let response: globalThis.Response | null = null;
    let usedModel = MODELS[0];

    for (const model of MODELS) {
      const attempt = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.openrouterApiKey}`,
          'HTTP-Referer': 'https://web.deepakchandwani.com',
          'X-Title': 'DC - Meeting Notes',
        },
        body: JSON.stringify({
          model: model.id,
          stream: true,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: hasImages ? userContent : userContent[0].text },
          ],
          max_tokens: 4000,
          temperature: 0.3,
        }),
      });
      if (attempt.ok) {
        response = attempt;
        usedModel = model;
        res.write(`data: ${JSON.stringify({ model: model.label })}\n\n`);
        break;
      } else {
        const err = await attempt.text();
        console.log(`[mn-prompt] ${model.id} failed (${attempt.status}): ${err.substring(0, 200)}`);
      }
    }

    if (!response) {
      res.write(`data: ${JSON.stringify({ error: 'All AI models failed' })}\n\n`);
      res.end();
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      res.write(`data: ${JSON.stringify({ error: 'No stream' })}\n\n`);
      res.end();
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let full = '';

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
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            full += content;
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        } catch {
          // skip
        }
      }
    }

    // Save the prompt + response
    try {
      await query(
        `INSERT INTO meeting_note_prompts (note_id, prompt, response, model_used)
         VALUES ($1, $2, $3, $4)`,
        [noteId, prompt.trim(), full, usedModel.label],
      );
    } catch (err) {
      console.error('[mn-prompt] save error:', err);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('[meeting-notes] prompt error:', err);
    if (!res.headersSent) {
      res.status(500).json({ ok: false, error: 'Prompt failed' });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`);
      res.end();
    }
  }
});

// ── PATCH /meeting-notes/:id — update title/transcript ───────────────
router.patch('/meeting-notes/:id', authenticateSession, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const noteId = parseInt(String(req.params.id), 10);
  const { title, transcript } = req.body ?? {};
  if (!noteId) return res.status(400).json({ ok: false, error: 'Invalid id' });
  try {
    if (!(await ownsNote(noteId, user.user_id))) {
      return res.status(404).json({ ok: false, error: 'Not found' });
    }
    await query(
      `UPDATE meeting_notes
         SET title = COALESCE($1, title),
             transcript = COALESCE($2, transcript),
             updated_at = NOW()
       WHERE id = $3`,
      [title ?? null, transcript ?? null, noteId],
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[meeting-notes] update error:', err);
    res.status(500).json({ ok: false, error: 'Failed to update' });
  }
});

// ── POST /meeting-note-prompts/:promptId/tts-plays — record a TTS play ───
router.post('/meeting-note-prompts/:promptId/tts-plays', authenticateSession, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const promptId = parseInt(String(req.params.promptId), 10);
  const body = req.body ?? {};
  if (!promptId) return res.status(400).json({ ok: false, error: 'Invalid id' });
  try {
    // Verify the prompt belongs to a note owned by this user
    const check = await query(
      `SELECT p.id, p.note_id FROM meeting_note_prompts p
       JOIN meeting_notes n ON n.id = p.note_id
       WHERE p.id = $1 AND n.user_id = $2`,
      [promptId, user.user_id],
    );
    if (check.rowCount === 0) return res.status(404).json({ ok: false, error: 'Not found' });
    const noteId = check.rows[0].note_id as number;

    const ins = await query(
      `INSERT INTO meeting_note_tts_plays
         (note_id, prompt_id, lang_code, lang_label, cost_total_usd, cost_translation_usd, cost_tts_usd,
          translation_model, tts_provider, input_tokens, output_tokens, tts_chars)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING id, created_at`,
      [
        noteId,
        promptId,
        String(body.langCode || '').slice(0, 20),
        String(body.langLabel || '').slice(0, 60),
        Number(body.costTotalUsd || 0),
        Number(body.costTranslationUsd || 0),
        Number(body.costTtsUsd || 0),
        body.translationModel ? String(body.translationModel).slice(0, 120) : null,
        body.ttsProvider ? String(body.ttsProvider).slice(0, 120) : null,
        parseInt(String(body.inputTokens || 0), 10) || 0,
        parseInt(String(body.outputTokens || 0), 10) || 0,
        parseInt(String(body.ttsChars || 0), 10) || 0,
      ],
    );
    res.json({ ok: true, id: ins.rows[0].id, createdAt: ins.rows[0].created_at });
  } catch (err) {
    console.error('[mn-tts-play] insert error:', err);
    res.status(500).json({ ok: false, error: 'Failed to save' });
  }
});

// ── DELETE /meeting-note-prompts/:promptId/tts-plays — clear history for one prompt ─
router.delete('/meeting-note-prompts/:promptId/tts-plays', authenticateSession, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const promptId = parseInt(String(req.params.promptId), 10);
  if (!promptId) return res.status(400).json({ ok: false, error: 'Invalid id' });
  try {
    const check = await query(
      `SELECT 1 FROM meeting_note_prompts p JOIN meeting_notes n ON n.id = p.note_id
       WHERE p.id = $1 AND n.user_id = $2`,
      [promptId, user.user_id],
    );
    if (check.rowCount === 0) return res.status(404).json({ ok: false, error: 'Not found' });
    await query('DELETE FROM meeting_note_tts_plays WHERE prompt_id = $1', [promptId]);
    res.json({ ok: true });
  } catch (err) {
    console.error('[mn-tts-play] delete error:', err);
    res.status(500).json({ ok: false, error: 'Failed to clear' });
  }
});

export default router;
