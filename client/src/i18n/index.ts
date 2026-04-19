import en from './en';
import hi from './hi';
import mr from './mr';
import ta from './ta';
import te from './te';
import bn from './bn';
import kn from './kn';
import gu from './gu';
import ml from './ml';
import pa from './pa';
import od from './or';
import sd from './sd';
import ur from './ur';
import es from './es';
import fr from './fr';
import de from './de';
import pt from './pt';
import ar from './ar';
import ja from './ja';
import zh from './zh';
import ko from './ko';
import type { Translations } from './en';

export type Lang =
  | 'en' | 'hi' | 'mr' | 'ta' | 'te' | 'bn' | 'kn' | 'gu' | 'ml' | 'pa' | 'od' | 'sd' | 'ur'
  | 'es' | 'fr' | 'de' | 'pt' | 'ar' | 'ja' | 'zh' | 'ko';

export const languages: Record<Lang, { label: string; nativeLabel: string }> = {
  // International
  en: { label: 'English', nativeLabel: 'English' },
  es: { label: 'Spanish', nativeLabel: 'Español' },
  fr: { label: 'French', nativeLabel: 'Français' },
  de: { label: 'German', nativeLabel: 'Deutsch' },
  pt: { label: 'Portuguese', nativeLabel: 'Português' },
  ar: { label: 'Arabic', nativeLabel: 'العربية' },
  ja: { label: 'Japanese', nativeLabel: '日本語' },
  zh: { label: 'Chinese', nativeLabel: '中文' },
  ko: { label: 'Korean', nativeLabel: '한국어' },
  // Indian
  hi: { label: 'Hindi', nativeLabel: 'हिन्दी' },
  mr: { label: 'Marathi', nativeLabel: 'मराठी' },
  ta: { label: 'Tamil', nativeLabel: 'தமிழ்' },
  te: { label: 'Telugu', nativeLabel: 'తెలుగు' },
  bn: { label: 'Bengali', nativeLabel: 'বাংলা' },
  kn: { label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
  gu: { label: 'Gujarati', nativeLabel: 'ગુજરાતી' },
  ml: { label: 'Malayalam', nativeLabel: 'മലയാളം' },
  pa: { label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ' },
  od: { label: 'Odia', nativeLabel: 'ଓଡ଼ିଆ' },
  sd: { label: 'Sindhi', nativeLabel: 'سنڌي' },
  ur: { label: 'Urdu', nativeLabel: 'اردو' },
};

// Deep-merge a language over the English base so new keys in en.ts
// automatically fall back to English for languages that haven't translated them yet.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deepMerge(base: any, override: any): any {
  const result = { ...base };
  for (const key of Object.keys(override)) {
    if (override[key] && typeof override[key] === 'object' && !Array.isArray(override[key])) {
      result[key] = deepMerge(base[key] || {}, override[key]);
    } else {
      result[key] = override[key];
    }
  }
  return result;
}

export const translations: Record<Lang, Translations> = {
  en,
  hi: deepMerge(en, hi), mr: deepMerge(en, mr), ta: deepMerge(en, ta),
  te: deepMerge(en, te), bn: deepMerge(en, bn), kn: deepMerge(en, kn),
  gu: deepMerge(en, gu), ml: deepMerge(en, ml), pa: deepMerge(en, pa),
  od: deepMerge(en, od), sd: deepMerge(en, sd), ur: deepMerge(en, ur),
  es: deepMerge(en, es), fr: deepMerge(en, fr), de: deepMerge(en, de),
  pt: deepMerge(en, pt), ar: deepMerge(en, ar), ja: deepMerge(en, ja),
  zh: deepMerge(en, zh), ko: deepMerge(en, ko),
};

export type { Translations };
