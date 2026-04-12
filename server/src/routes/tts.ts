import { Router } from 'express';
import { config } from '../config.js';
import { tts as edgeTts } from 'edge-tts';

const router = Router();

// Edge TTS voice map — natural-sounding Microsoft neural voices (FREE)
const EDGE_VOICES: Record<string, string> = {
  en: 'en-US-AriaNeural',
  hi: 'hi-IN-SwaraNeural',
  pa: 'pa-IN-WaaniNeural',
  ta: 'ta-IN-PallaviNeural',
  te: 'te-IN-ShrutiNeural',
  kn: 'kn-IN-SapnaNeural',
  ml: 'ml-IN-SobhanaNeural',
  bn: 'bn-IN-TanishaaNeural',
  mr: 'mr-IN-AarohiNeural',
  gu: 'gu-IN-DhwaniNeural',
  es: 'es-ES-ElviraNeural',
  fr: 'fr-FR-DeniseNeural',
  de: 'de-DE-KatjaNeural',
  ja: 'ja-JP-NanamiNeural',
  zh: 'zh-CN-XiaoxiaoNeural',
  ar: 'ar-SA-ZariyahNeural',
};

// Sarvam voice map (Indian languages, paid fallback)
const SARVAM_LANGS: Record<string, string> = {
  en: 'en-IN', hi: 'hi-IN', pa: 'pa-IN', ta: 'ta-IN',
  te: 'te-IN', kn: 'kn-IN', ml: 'ml-IN', bn: 'bn-IN',
  mr: 'mr-IN', gu: 'gu-IN',
};

router.post('/tts', async (req, res) => {
  const { text, language } = req.body as { text?: string; language?: string };

  if (!text || text.length < 2) {
    return res.status(400).json({ ok: false, error: 'Text is required' });
  }

  const lang = language || 'en';

  // Method 1: Edge TTS (free, primary)
  try {
    const voice = EDGE_VOICES[lang] || EDGE_VOICES.en;
    console.log(`[tts] Using Edge TTS: voice=${voice}, text=${text.length} chars`);

    const audioBuffer = await edgeTts(text.substring(0, 5000), { voice, rate: '+5%', pitch: '+0Hz' });

    if (audioBuffer && audioBuffer.length > 100) {
      const base64 = audioBuffer.toString('base64');
      return res.json({
        ok: true,
        audio: base64,
        format: 'mp3',
        provider: 'Microsoft Edge TTS (Free)',
        language: voice,
      });
    }
    throw new Error('Empty audio buffer');
  } catch (err) {
    console.log(`[tts] Edge TTS failed: ${(err as Error).message}, trying Sarvam...`);
  }

  // Method 2: Sarvam AI (Indian languages, paid fallback)
  if (config.sarvamApiKey && SARVAM_LANGS[lang]) {
    try {
      const targetLang = SARVAM_LANGS[lang];
      const truncated = text.substring(0, 3000);

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

      if (response.ok) {
        const data = await response.json() as { audios?: string[] };
        if (data.audios?.[0]) {
          return res.json({
            ok: true,
            audio: data.audios[0],
            format: 'wav',
            provider: 'Sarvam AI',
            language: targetLang,
          });
        }
      } else {
        const err = await response.text();
        console.log(`[tts] Sarvam failed: ${response.status} ${err.substring(0, 200)}`);
      }
    } catch (err) {
      console.log(`[tts] Sarvam error: ${(err as Error).message}`);
    }
  }

  res.status(502).json({ ok: false, error: 'TTS generation failed on all providers' });
});

export default router;
