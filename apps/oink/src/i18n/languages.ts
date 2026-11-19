/** Interface languages, in the order the language menus list them. */
export const LANGUAGES = [
  { id: 'zh-Hans', autonym: '简体中文' },
  { id: 'zh-Hant', autonym: '繁體中文' },
  { id: 'en', autonym: 'English' },
  { id: 'ja', autonym: '日本語' },
  { id: 'ko', autonym: '한국어' },
] as const;
export type Language = typeof LANGUAGES[number]['id'];
/** The persisted preference: a language, or `auto` to follow the system. */
export type LanguageChoice = Language | 'auto';

const isLanguage = (value: string): value is Language => LANGUAGES.some(l => l.id === value);

/**
 * Map the preference and the system's first preferred language to a UI language.
 *
 * `auto` uses ja for any Japanese tag, ko for any Korean tag, Simplified
 * Chinese for zh, zh-Hans, zh-CN and zh-SG, and Traditional Chinese for
 * zh-Hant, zh-TW, zh-HK and zh-MO. Every other language uses English.
 */
export function resolveLanguage(choice: string, system: string | readonly string[]): Language {
  if (choice !== 'auto') return isLanguage(choice) ? choice : 'en';
  const [base, qualifier] = (typeof system === 'string' ? system : system[0] ?? '').toLowerCase().split(/[-_]/);
  if (base === 'ja' || base === 'ko') return base;
  if (base !== 'zh') return 'en';
  if (qualifier === undefined || ['hans', 'cn', 'sg'].includes(qualifier)) return 'zh-Hans';
  return ['hant', 'tw', 'hk', 'mo'].includes(qualifier) ? 'zh-Hant' : 'en';
}
