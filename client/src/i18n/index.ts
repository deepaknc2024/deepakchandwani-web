import en from './en';
import hi from './hi';
import mr from './mr';
import type { Translations } from './en';

export type Lang = 'en' | 'hi' | 'mr';

export const languages: Record<Lang, { label: string; nativeLabel: string }> = {
  en: { label: 'English', nativeLabel: 'English' },
  hi: { label: 'Hindi', nativeLabel: 'हिन्दी' },
  mr: { label: 'Marathi', nativeLabel: 'मराठी' },
};

export const translations: Record<Lang, Translations> = { en, hi, mr };

export type { Translations };
