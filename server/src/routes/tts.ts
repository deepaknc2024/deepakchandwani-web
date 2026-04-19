import { Router } from 'express';
import { config } from '../config.js';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

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

const LANG_FULL_NAME: Record<string, string> = {
  en: 'English', hi: 'Hindi', pa: 'Punjabi', ta: 'Tamil', te: 'Telugu',
  kn: 'Kannada', ml: 'Malayalam', bn: 'Bengali', mr: 'Marathi', gu: 'Gujarati',
  es: 'Spanish', fr: 'French', de: 'German', ja: 'Japanese', zh: 'Chinese (Mandarin)',
  ar: 'Arabic', pt: 'Portuguese', it: 'Italian', ru: 'Russian', ko: 'Korean',
  ur: 'Urdu', od: 'Odia',
};

interface TranslateResult {
  text: string;
  translated: boolean;
  translationCostUsd: number;
  translationModel: string | null;
  inputTokens: number;
  outputTokens: number;
}

// Approximate per-token pricing (OpenRouter as of 2026)
const MODEL_PRICING: Record<string, { in: number; out: number }> = {
  'google/gemini-2.0-flash-001': { in: 0.10 / 1_000_000, out: 0.40 / 1_000_000 },
  'openai/gpt-oss-120b:free': { in: 0, out: 0 },
};

async function translateText(text: string, targetLang: string): Promise<TranslateResult> {
  const base: TranslateResult = { text, translated: false, translationCostUsd: 0, translationModel: null, inputTokens: 0, outputTokens: 0 };
  if (targetLang === 'en' || !config.openrouterApiKey) return base;
  const targetName = LANG_FULL_NAME[targetLang] || targetLang;

  const MODELS = [
    'google/gemini-2.0-flash-001',
    'openai/gpt-oss-120b:free',
  ];

  for (const model of MODELS) {
    try {
      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.openrouterApiKey}`,
          'HTTP-Referer': 'https://web.deepakchandwani.com',
          'X-Title': 'DC - Translation for TTS',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: `You are a translator. Translate the user's text into natural ${targetName}. Output ONLY the translation, no preamble, no quotes, no notes. Preserve paragraph breaks.`,
            },
            { role: 'user', content: text.slice(0, 4500) },
          ],
          max_tokens: 3000,
          temperature: 0.2,
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (!resp.ok) {
        console.log(`[tts-translate] ${model} failed ${resp.status}`);
        continue;
      }
      const data = (await resp.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
      const out = data.choices?.[0]?.message?.content?.trim();
      if (out) {
        const price = MODEL_PRICING[model] || { in: 0, out: 0 };
        const inTok = data.usage?.prompt_tokens || Math.ceil(text.length / 4);
        const outTok = data.usage?.completion_tokens || Math.ceil(out.length / 4);
        const cost = inTok * price.in + outTok * price.out;
        return {
          text: out,
          translated: true,
          translationCostUsd: cost,
          translationModel: model,
          inputTokens: inTok,
          outputTokens: outTok,
        };
      }
    } catch (err) {
      console.log(`[tts-translate] ${model} error: ${(err as Error).message}`);
    }
  }
  return base;
}

router.post('/tts', async (req, res) => {
  const { text, language, translate } = req.body as { text?: string; language?: string; translate?: boolean };

  if (!text || text.length < 2) {
    return res.status(400).json({ ok: false, error: 'Text is required' });
  }

  const lang = language || 'en';

  // Translate first if requested and target is non-English
  let speakText = text;
  let translated = false;
  let translationCostUsd = 0;
  let translationModel: string | null = null;
  let inputTokens = 0;
  let outputTokens = 0;
  if (translate && lang !== 'en') {
    try {
      const tr = await translateText(text, lang);
      if (tr.translated) {
        speakText = tr.text;
        translated = true;
        translationCostUsd = tr.translationCostUsd;
        translationModel = tr.translationModel;
        inputTokens = tr.inputTokens;
        outputTokens = tr.outputTokens;
        console.log(`[tts] translated ${text.length} -> ${tr.text.length} chars into ${lang} via ${translationModel}, cost=$${translationCostUsd.toFixed(6)}`);
      }
    } catch (err) {
      console.log(`[tts] translate failed, speaking original: ${(err as Error).message}`);
    }
  }

  // TTS cost estimate: Edge TTS is free. Sarvam ~ $3 per 1M characters.
  const SARVAM_COST_PER_CHAR = 3 / 1_000_000;

  // Method 1: Edge TTS (free, primary)
  try {
    const voice = EDGE_VOICES[lang] || EDGE_VOICES.en;
    console.log(`[tts] Using Edge TTS: voice=${voice}, text=${speakText.length} chars, translated=${translated}`);

    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

    const { audioStream } = tts.toStream(speakText.substring(0, 5000));
    const chunks: Buffer[] = [];

    await new Promise<void>((resolve, reject) => {
      audioStream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      audioStream.on('end', () => resolve());
      audioStream.on('error', (err: Error) => reject(err));
      setTimeout(() => reject(new Error('Edge TTS timeout')), 30000);
    });

    const audioBuffer = Buffer.concat(chunks);
    if (audioBuffer.length > 100) {
      return res.json({
        ok: true,
        audio: audioBuffer.toString('base64'),
        format: 'mp3',
        provider: translated ? `Microsoft Edge TTS + AI translation (${LANG_FULL_NAME[lang] || lang})` : 'Microsoft Edge TTS (Free)',
        language: voice,
        translated,
        translatedText: translated ? speakText : undefined,
        cost: {
          translationUsd: translationCostUsd,
          ttsUsd: 0,
          totalUsd: translationCostUsd,
          translationModel,
          ttsProvider: 'edge-tts-free',
          inputTokens,
          outputTokens,
          ttsChars: speakText.length,
        },
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
      const truncated = speakText.substring(0, 3000);

      const response = await fetch('https://api.sarvam.ai/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': config.sarvamApiKey,
        },
        body: JSON.stringify({
          inputs: [truncated],
          target_language_code: targetLang,
          speaker: 'anushka',
          model: 'bulbul:v2',
          // Note: speaker 'meera' was deprecated; 'anushka' is Sarvam's current female speaker
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
          const ttsUsd = speakText.length * SARVAM_COST_PER_CHAR;
          return res.json({
            ok: true,
            audio: data.audios[0],
            format: 'wav',
            provider: translated ? `Sarvam AI + translation (${LANG_FULL_NAME[lang] || lang})` : 'Sarvam AI',
            language: targetLang,
            translated,
            translatedText: translated ? speakText : undefined,
            cost: {
              translationUsd: translationCostUsd,
              ttsUsd,
              totalUsd: translationCostUsd + ttsUsd,
              translationModel,
              ttsProvider: 'sarvam-bulbul-v2',
              inputTokens,
              outputTokens,
              ttsChars: speakText.length,
            },
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
