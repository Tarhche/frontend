import {localeFromLanguageCode, type Locale} from "@/i18n/config";

// BCP 47 tags used to format dates. Persian dates render in the Jalali calendar
// with Persian digits, English ones in the Gregorian calendar — so a date always
// reads in the same language as the content around it.
const DATE_LOCALES: Record<Locale, string> = {
  fa: "fa-IR",
  en: "en-US",
};

export function isGregorianStartDateTime(date: Date | string) {
  const targetDate = new Date(date);

  return (
    targetDate.getUTCFullYear() === 1 &&
    targetDate.getUTCMonth() === 0 &&
    targetDate.getUTCDay() === 1 &&
    targetDate.getUTCHours() === 0 &&
    targetDate.getUTCMinutes() === 0 &&
    targetDate.getUTCSeconds() === 0
  );
}

export function formatDate(dateString: string, languageCode?: string | null) {
  if (!dateString) {
    return "";
  }

  return new Date(dateString).toLocaleDateString(
    DATE_LOCALES[localeFromLanguageCode(languageCode)],
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );
}
