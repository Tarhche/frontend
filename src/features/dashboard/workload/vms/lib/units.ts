/**
 * Sizes. The API speaks bytes end to end; people type MiB and GiB. These are
 * the conversions between the two, and how a size is read back.
 */

export const KiB = 1024;
export const MiB = 1024 * KiB;
export const GiB = 1024 * MiB;

export type SizeUnit = "MiB" | "GiB";

export const SIZE_UNITS: Record<SizeUnit, number> = {MiB, GiB};

/** A size as somebody typed it. */
export type Size = {
  amount: number;
  unit: SizeUnit;
};

/**
 * The bytes a size stands for, in whole MiB, which is what memory and disks
 * are sized in. Nothing that is not a positive amount is any size at all.
 */
export function toBytes({amount, unit}: Size): number {
  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }

  return Math.round((amount * SIZE_UNITS[unit]) / MiB) * MiB;
}

/**
 * A size as it would be typed: whole GiB when it is that, MiB otherwise.
 *
 * It reads back to the very same bytes, so a form that shows a VM's size and
 * is sent untouched does not ask for a different one.
 */
export function fromBytes(bytes: number): Size {
  if (bytes > 0 && bytes % GiB === 0) {
    return {amount: bytes / GiB, unit: "GiB"};
  }

  return {amount: Math.max(0, bytes) / MiB, unit: "MiB"};
}

const NAMES = ["B", "KiB", "MiB", "GiB", "TiB"];

/** "512 MiB", "1.5 GiB": a size to read rather than to type. */
export function formatBytes(bytes: number, locale = "en"): string {
  let value = Number.isFinite(bytes) ? Math.max(0, bytes) : 0;
  let index = 0;

  while (value >= 1024 && index < NAMES.length - 1) {
    value /= 1024;
    index++;
  }

  // a decimal is worth reading on a small number of a large unit only.
  const digits = index === 0 || value >= 100 ? 0 : 1;
  const number = new Intl.NumberFormat(locale, {
    maximumFractionDigits: digits,
  }).format(value);

  return `${number} ${NAMES[index]}`;
}
