import {DALDriverError} from "@/dal/dal-driver-error";

export type ValidationErrorMap = Record<string, string>;
export type FormValues = Record<string, string>;

export type ValidationFormState = {
  success: boolean;
  errors?: ValidationErrorMap;
  values?: FormValues;
};

const VALIDATION_STATUS_CODES: readonly number[] = [400, 422];

export function extractValidationErrors(
  err: unknown,
): ValidationErrorMap | null {
  if (!isValidationFailure(err)) return null;

  const raw = err.response?.data?.errors;
  if (!isPlainObject(raw)) return null;

  const out: ValidationErrorMap = {};
  for (const [key, value] of Object.entries(raw)) {
    const message = coerceMessage(value);
    if (message) out[key] = message;
  }
  return out;
}

export function nonFieldErrors(
  errors: ValidationErrorMap | undefined,
  knownFields: readonly string[],
): string[] {
  if (!errors) return [];
  const known = new Set(knownFields);
  return Object.entries(errors)
    .filter(([key, message]) => Boolean(message) && !known.has(key))
    .map(([, message]) => message);
}

// React 19 auto-resets <form action> on submit, so on failure we echo
// submitted values back and seed them as defaultValue to preserve input.
export function captureFormValues(
  formData: FormData,
  options?: {exclude?: readonly string[]},
): FormValues {
  const excluded = new Set(options?.exclude ?? []);
  const values: FormValues = {};
  formData.forEach((value, key) => {
    // Skip React's internal server-action fields ($ACTION_REF_*, $ACTION_KEY…).
    if (typeof value !== "string" || excluded.has(key) || key.startsWith("$")) {
      return;
    }
    values[key] = value;
  });
  return values;
}

function isValidationFailure(err: unknown): err is DALDriverError {
  return (
    err instanceof DALDriverError &&
    VALIDATION_STATUS_CODES.includes(err.statusCode)
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object";
}

function coerceMessage(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.filter(Boolean).join(" ");
  if (value == null) return "";
  return String(value);
}
