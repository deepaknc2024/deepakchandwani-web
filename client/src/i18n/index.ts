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

export const translations: Record<Lang, Translations> = {
  en, hi, mr, ta, te, bn, kn, gu, ml, pa, od, sd, ur,
  es, fr, de, pt, ar, ja, zh, ko,
};

export type { Translations };
