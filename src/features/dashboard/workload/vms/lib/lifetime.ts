import {isGregorianStartDateTime} from "@/lib/date-and-time";
import {type Vm} from "../types";

/**
 * How long a VM is kept. A lifetime of 0 keeps it until it is deleted; any
 * other is how long after it was made the workload deletes it.
 */

export type LifetimeUnit = "hours" | "days";

export const LIFETIME_UNITS: Record<LifetimeUnit, number> = {
  hours: 60 * 60,
  days: 24 * 60 * 60,
};

/** A lifetime as the form holds it. */
export type Lifetime = {
  keep: boolean;

  /** How long, when it is not kept: what the form offers once switched. */
  amount: number;
  unit: LifetimeUnit;
};

export const KEEP: Lifetime = {keep: true, amount: 24, unit: "hours"};

/** What the API is sent: 0 to keep it, the seconds to keep it for otherwise. */
export function lifetimeSeconds(lifetime: Lifetime): number {
  if (lifetime.keep || !Number.isFinite(lifetime.amount)) {
    return 0;
  }

  return Math.max(
    0,
    Math.round(lifetime.amount * LIFETIME_UNITS[lifetime.unit]),
  );
}

/** The lifetime the API reports, as the form shows it: in days when it is. */
export function lifetimeFrom(seconds: number | null | undefined): Lifetime {
  if (!seconds || seconds <= 0) {
    return KEEP;
  }

  if (seconds % LIFETIME_UNITS.days === 0) {
    return {keep: false, amount: seconds / LIFETIME_UNITS.days, unit: "days"};
  }

  return {keep: false, amount: seconds / LIFETIME_UNITS.hours, unit: "hours"};
}

/** When the VM will be deleted, or null when it is kept. */
export function expiryOf(
  vm: Pick<Vm, "lifetime_seconds" | "expires_at">,
): Date | null {
  if (!vm.lifetime_seconds || !vm.expires_at) {
    return null;
  }

  if (isGregorianStartDateTime(vm.expires_at)) {
    return null;
  }

  const at = new Date(vm.expires_at);

  return Number.isNaN(at.getTime()) ? null : at;
}

/** The BCP 47 tag a dashboard locale formats in, as dates elsewhere do. */
export function intlLocale(locale: string): string {
  return locale === "fa" ? "fa-IR" : "en-US";
}

/** "in 3 hours", "2 days ago": how far off a moment is, in words. */
export function formatRelative(to: Date, now: Date, locale = "en"): string {
  const seconds = Math.round((to.getTime() - now.getTime()) / 1000);
  const format = new Intl.RelativeTimeFormat(intlLocale(locale), {
    numeric: "auto",
  });
  const distance = Math.abs(seconds);

  if (distance < 60) {
    return format.format(seconds, "second");
  }

  if (distance < 60 * 60) {
    return format.format(Math.round(seconds / 60), "minute");
  }

  if (distance < 24 * 60 * 60) {
    return format.format(Math.round(seconds / (60 * 60)), "hour");
  }

  return format.format(Math.round(seconds / (24 * 60 * 60)), "day");
}

/** "45 sec", "4 min": how long something has gone on, shortly. */
export function formatDuration(seconds: number, locale = "en"): string {
  const safe = Number.isFinite(seconds) ? Math.max(0, Math.round(seconds)) : 0;

  let value = safe;
  let unit = "second";
  if (safe >= 60 * 60) {
    value = Math.round(safe / (60 * 60));
    unit = "hour";
  } else if (safe >= 60) {
    value = Math.round(safe / 60);
    unit = "minute";
  }

  return new Intl.NumberFormat(intlLocale(locale), {
    style: "unit",
    unit,
    unitDisplay: "short",
  }).format(value);
}

/** A moment, with its time: an expiry is worth more than its day. */
export function formatDateTime(at: Date | string, locale = "en"): string {
  const date = typeof at === "string" ? new Date(at) : at;
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString(intlLocale(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
