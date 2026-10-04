import {localeFromLanguageCode, type Locale} from "@/i18n/config";
import {type PortBinding} from "./types";

export const KiB = 1024;
export const MiB = 1024 * KiB;
export const GiB = 1024 * MiB;

// numbers read in the same language as the words around them, as dates do.
const NUMBER_LOCALES: Record<Locale, string> = {
  fa: "fa-IR",
  en: "en-US",
};

function numberLocale(locale?: string | null): string {
  return NUMBER_LOCALES[localeFromLanguageCode(locale)];
}

export function formatNumber(
  value: number,
  locale?: string | null,
  fractionDigits = 0,
): string {
  return new Intl.NumberFormat(numberLocale(locale), {
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

const UNITS = ["B", "KiB", "MiB", "GiB", "TiB"];

/** A size in the largest unit it has at least one of: 1.5 GiB, 512 MiB. */
export function formatBytes(bytes: number, locale?: string | null): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return `${formatNumber(0, locale)} B`;
  }

  let unit = 0;
  let value = bytes;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit++;
  }

  return `${formatNumber(value, locale, value < 10 && unit > 0 ? 1 : 0)} ${UNITS[unit]}`;
}

export function formatPercent(value: number, locale?: string | null): string {
  return `${formatNumber(value, locale, value < 10 ? 1 : 0)}%`;
}

/** When something happened, to the minute. */
export function formatDateTime(at: string | undefined, locale?: string | null) {
  if (!at) {
    return "";
  }

  const date = new Date(at);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString(numberLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** The time of day something happened, to the second. */
export function formatTime(at: string | undefined, locale?: string | null) {
  if (!at) {
    return "";
  }

  const date = new Date(at);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString(numberLocale(locale), {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * A published port the way docker writes one: host → container / protocol. A
 * port that is exposed but not published has no host side to write.
 */
export function formatPortBinding(port: PortBinding): string {
  if (!port.host_port) {
    return `${port.container_port}/${port.protocol}`;
  }

  return `${port.host_port}→${port.container_port}/${port.protocol}`;
}

/** The part of a docker id anybody reads: twelve characters, no digest name. */
export function shortId(id: string): string {
  return id.replace(/^sha256:/, "").slice(0, 12);
}

export type ParsedWords = {words: string[]; unterminated: boolean};

/**
 * Splits a command into its arguments the way a shell would: on spaces, unless
 * they are quoted or escaped. A command is handed to docker as its arguments,
 * so `sh -c "echo hi"` has to arrive as three of them, not four.
 *
 * Nothing is expanded: there are no variables, globs or substitutions here,
 * only quoting.
 */
export function shellWords(input: string): ParsedWords {
  const words: string[] = [];
  let current = "";
  let started = false;
  let quote: "'" | '"' | null = null;

  for (let index = 0; index < input.length; index++) {
    const char = input[index];

    if (quote === "'") {
      if (char === "'") {
        quote = null;
      } else {
        current += char;
      }

      continue;
    }

    if (quote === '"') {
      if (char === '"') {
        quote = null;
      } else if (
        char === "\\" &&
        index + 1 < input.length &&
        '"\\$`'.includes(input[index + 1])
      ) {
        current += input[++index];
      } else {
        current += char;
      }

      continue;
    }

    if (char === "'" || char === '"') {
      quote = char;
      started = true;

      continue;
    }

    if (char === "\\" && index + 1 < input.length) {
      current += input[++index];
      started = true;

      continue;
    }

    if (/\s/.test(char)) {
      if (started) {
        words.push(current);
        current = "";
        started = false;
      }

      continue;
    }

    current += char;
    started = true;
  }

  if (started) {
    words.push(current);
  }

  return {words, unterminated: quote !== null};
}

/** A port number someone typed, or nothing when it is not one. */
export function portNumber(value: string | number | undefined): number | null {
  const number = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(number) || number < 1 || number > 65535) {
    return null;
  }

  return number;
}
