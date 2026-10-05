import {isAxiosError} from "axios";
import {type TFunction} from "@/i18n/dictionary";

/**
 * What went wrong with a request, read off whatever the server answered.
 *
 * A Docker request goes through the dashboard API, the control plane and the
 * node holding the VM, and any of them may be the one that says no: the
 * dashboard with validation errors by field, the node with a code and what
 * dockerd said, a gateway with nothing but a status. This keeps whichever of
 * those there is.
 */
export type Problem = {
  status?: number;

  /** the node's word for it, such as not_running or docker_unavailable. */
  code?: string;

  /** what was said about it, as it was said: a Docker message, say. */
  detail?: string;

  /** what was refused, by field, in the reader's language. */
  fields: Record<string, string>;

  /** the output a compose command left, when one ran and failed. */
  output?: string;

  /**
   * Nothing came back in time, so whatever was asked for may still be under
   * way: a pull carries on after whoever asked for it has stopped waiting.
   */
  unanswered: boolean;
};

// the codes the platform answers with, each said in the reader's language.
const KNOWN_CODES = [
  "not_found",
  "not_running",
  "not_docker",
  "docker_unavailable",
  "invalid",
  "timeout",
  "internal",
  "vm_required",
  "vm_not_running",
  "no_capacity",
  "quota_exceeded",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown): string | undefined {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  if (Array.isArray(value)) {
    const joined = value.filter((part) => typeof part === "string").join(" ");

    return joined.length > 0 ? joined : undefined;
  }

  return undefined;
}

function fieldsOf(errors: unknown): Record<string, string> {
  if (!isRecord(errors)) {
    return {};
  }

  const fields: Record<string, string> = {};
  for (const [field, message] of Object.entries(errors)) {
    const said = text(message);
    if (said) {
      fields[field] = said;
    }
  }

  return fields;
}

/** Reads what went wrong out of whatever was thrown. */
export function problemOf(error: unknown): Problem {
  if (!isAxiosError(error)) {
    return {fields: {}, unanswered: false};
  }

  const status = error.response?.status;
  const data: unknown = error.response?.data;

  const problem: Problem = {
    status,
    fields: {},
    unanswered:
      !error.response ||
      error.code === "ECONNABORTED" ||
      error.code === "ETIMEDOUT" ||
      status === 502 ||
      status === 504,
  };

  if (!isRecord(data)) {
    return problem;
  }

  problem.fields = fieldsOf(data.errors);
  problem.output = text(data.output);

  // the node's answer, {code, message}, whether passed through as it is or
  // under an `error` of its own.
  const answer = isRecord(data.error) ? data.error : data;
  problem.code = text(answer.code);
  problem.detail = text(answer.message) ?? text(data.error);

  if (problem.code === "timeout") {
    problem.unanswered = true;
  }

  return problem;
}

/** Whether what went wrong is a refusal of what was sent rather than a failure. */
export function isRefusal(problem: Problem): boolean {
  return Object.keys(problem.fields).length > 0;
}

function statusMessage(t: TFunction, status: number | undefined): string {
  switch (status) {
    case 400:
      return t("errors.http.badRequest");
    case 401:
      return t("errors.http.unauthorized");
    case 403:
      return t("errors.http.forbidden");
    case 404:
      return t("errors.http.notFound");
    case 409:
      return t("errors.http.conflict");
    case 500:
      return t("errors.http.serverError");
    default:
      return t("errors.http.generic");
  }
}

/**
 * What went wrong, in a sentence for the reader. The platform's own codes are
 * said in their language; whatever dockerd added is kept after it, since that
 * is the part that says what to fix.
 */
export function problemMessage(problem: Problem, t: TFunction): string {
  if (problem.unanswered) {
    return t("docker.errors.unanswered");
  }

  const known = (KNOWN_CODES as readonly string[]).includes(problem.code ?? "");

  if (known) {
    const said = t(`docker.errors.${problem.code}`);

    return problem.detail ? `${said} ${problem.detail}` : said;
  }

  const fields = Object.values(problem.fields);
  if (fields.length > 0) {
    return fields.join(" ");
  }

  return problem.detail ?? statusMessage(t, problem.status);
}

/**
 * What was refused, keyed by where it is in what was sent, as JSON paths are
 * written: `ports.0.host_port`. A key written with brackets is read the same
 * way, and one under the name the request was sent as (`container.ports.0`)
 * without it, so a form finds each refusal beside the field it is about.
 */
export function fieldPaths(
  fields: Record<string, string>,
  prefix?: string,
): Record<string, string> {
  const paths: Record<string, string> = {};

  for (const [field, message] of Object.entries(fields)) {
    let path = field.replace(/\[(\d+)\]/g, ".$1");
    if (prefix && path.startsWith(`${prefix}.`)) {
      path = path.slice(prefix.length + 1);
    }

    paths[path] = message;
  }

  return paths;
}
