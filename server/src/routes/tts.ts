import { Router } from 'express';
import { config } from '../config.js';

const router = Router();

router.post('/tts', async (req, res) => {
  const { text, language } = req.body as { text?: string; language?: string };

  if (!text || text.length < 2) {
    return res.status(400).json({ ok: false, error: 'Text is required' });
  }

  if (!config.sarvamApiKey) {
    return res.status(500).json({ ok: false, error: 'TTS service not configured' });
  }

  // Truncate to ~3000 chars per request (Sarvam limit)
  const truncated = text.length > 3000 ? text.substring(0, 3000) : text;

  // Map common language codes to Sarvam's format
  const langMap: Record<string, string> = {
    en: 'en-IN',
    hi: 'hi-IN',
    pa: 'pa-IN',
    ta: 'ta-IN',
    te: 'te-IN',
    kn: 'kn-IN',
    ml: 'ml-IN',
    bn: 'bn-IN',
    mr: 'mr-IN',
    gu: 'gu-IN',
  };
  const targetLang = langMap[language || 'en'] || 'en-IN';

  try {
    const response = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': config.sarvamApiKey,
      },
      body: JSON.stringify({
        inputs: [truncated],
        target_language_code: targetLang,
        speaker: 'meera',
        model: 'bulbul:v2',
        pitch: 0,
        pace: 1.1,
        loudness: 1.5,
        enable_preprocessing: true,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[tts] Sarvam error:', response.status, err.substring(0, 300));
      return res.status(502).json({ ok: false, error: 'TTS generation failed' });
    }

    const data = await response.json() as { audios?: string[] };
    if (!data.audios || !data.audios[0]) {
      return res.status(502).json({ ok: false, error: 'No audio generated' });
    }

    // Return base64 audio
    res.json({
      ok: true,
      audio: data.audios[0],
      format: 'wav',
      language: targetLang,
    });
  } catch (err) {
    console.error('[tts] Error:', err);
    res.status(500).json({ ok: false, error: 'TTS generation failed' });
  }
});

export default router;
