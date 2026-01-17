import { I18n } from 'i18n-js';
import { en } from './en';
import { zh } from './zh';

export type Translation = typeof en;

const i18n = new I18n({
  en,
  zh,
});

// Set the locale once at the beginning of your app.
i18n.locale = 'zh';
i18n.defaultLocale = 'zh';

export const setLocale = (locale: string) => {
  i18n.locale = locale;
};

export const getLocale = () => {
  return i18n.locale;
};

export const t = (key: string, options?: Record<string, string | number>) => {
  return i18n.t(key, options);
};

export default i18n;
