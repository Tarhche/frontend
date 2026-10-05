import {isAxiosError} from "axios";
import {DALDriverError} from "@/dal/dal-driver-error";
import {type TFunction} from "@/i18n/dictionary";

/**
 * What went wrong with a request, read off whatever the server answered.
 *
 * A workload request goes through the dashboard API, the control plane and the
 * node holding the VM, and any of them may be the one that says no. What was
 * refused comes back field by field, in the reader's language, a node's
 * refusals among them under the field they are about; what could not be done
 * at all comes back as a code, with what the node said about it; a gateway
 * says nothing but its status. This keeps whichever of those there is, read in
 * the browser or by a server action, and it is the same plain object either
 * way, so it can be handed from one to the other.
 */
export type Problem = {
  status?: number;

  /** the workload's word for it: not_found, timeout, internal. */
  code?: string;

  /** what was said about it, as it was said: a node's message, say. */
  detail?: string;

  /** what was refused, by the JSON path of what it is about. */
  fields: Record<string, string>;

  /** the output a compose command left, when one ran and failed. */
  output?: string;

  /**
   * Nothing came back in time, so whatever was asked for may still be under
   * way: a pull carries on after whoever asked for it has stopped waiting.
   */
  unanswered: boolean;
};

/**
 * What was refused about a request as a whole rather than one of its fields:
 * the VM it was about -- not running, without Docker, its dockerd not up, no
 * room for it, a quota -- what dockerd itself turned down, in its own words,
 * the snapshot a VM was to be made or restored from, and a body that was not
 * JSON at all. These are the node's refusals, which the API reports under
 * what they are about; they are said where the request was made, prominently,
 * whatever is said beside the fields.
 */
export const WHOLE_REQUEST = ["vm", "docker", "snapshot_uuid", "body"] as const;

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

// what answered, if anything did: in the browser an axios error, on the
// server the error the server's driver turns one into.
function answerOf(
  error: unknown,
): {status?: number; data: unknown; lost: boolean} | null {
  if (error instanceof DALDriverError) {
    return {status: error.statusCode, data: error.response?.data, lost: false};
  }

  if (isAxiosError(error)) {
    return {
      status: error.response?.status,
      data: error.response?.data,
      lost:
        !error.response ||
        error.code === "ECONNABORTED" ||
        error.code === "ETIMEDOUT",
    };
  }

  return null;
}

/** Reads what went wrong out of whatever was thrown. */
export function problemOf(error: unknown): Problem {
  const answer = answerOf(error);
  if (answer === null) {
    return {fields: {}, unanswered: false};
  }

  const {status, data} = answer;
  const problem: Problem = {
    status,
    fields: {},
    unanswered: answer.lost || status === 502 || status === 504,
  };

  if (!isRecord(data)) {
    return problem;
  }

  problem.fields = fieldsOf(data.errors);
  problem.output = text(data.output);

  // the workload's answer, {code, message}, whether passed through as it is
  // or under an `error` of its own.
  const said = isRecord(data.error) ? data.error : data;
  problem.code = text(said.code);
  problem.detail = text(said.message) ?? text(data.error);

  if (problem.code === "timeout") {
    problem.unanswered = true;
  }

  return problem;
}

/** Whether what went wrong is a refusal of what was sent rather than a failure. */
export function isRefusal(problem: Problem): boolean {
  return Object.keys(problem.fields).length > 0;
}

/** Whether a refusal is about the request as a whole (see WHOLE_REQUEST). */
export function isAboutTheWhole(path: string): boolean {
  return (WHOLE_REQUEST as readonly string[]).includes(path);
}

/**
 * What was refused that is not already said beside a field: everything a form
 * does not show inline, the request as a whole first, since that is usually
 * what has to be put right before anything else.
 */
export function unshownRefusals(
  problem: Problem,
  shown: (path: string) => boolean = () => false,
): Array<[string, string]> {
  return Object.entries(problem.fields)
    .filter(([path]) => isAboutTheWhole(path) || !shown(path))
    .sort(
      ([a], [b]) => Number(isAboutTheWhole(b)) - Number(isAboutTheWhole(a)),
    );
}

/**
 * Whether there is anything to say about a problem where it happened, beyond
 * what a form already says beside its fields.
 */
export function hasMoreToSay(
  problem: Problem,
  shown?: (path: string) => boolean,
): boolean {
  return (
    problem.unanswered ||
    !isRefusal(problem) ||
    unshownRefusals(problem, shown).length > 0
  );
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
 * said in their language; whatever the node added is kept after it, since that
 * is the part that says what to fix. What was refused is said as the API said
 * it, which is already in the reader's language, leaving out what a form says
 * beside its fields.
 */
export function problemMessage(
  problem: Problem,
  t: TFunction,
  shown?: (path: string) => boolean,
): string {
  if (problem.unanswered) {
    return t("workload.errors.unanswered");
  }

  const known = (KNOWN_CODES as readonly string[]).includes(problem.code ?? "");

  if (known) {
    const said = t(`workload.errors.${problem.code}`);

    return problem.detail ? `${said} ${problem.detail}` : said;
  }

  const refusals = unshownRefusals(problem, shown);
  if (refusals.length > 0) {
    return refusals.map(([, message]) => message).join(" ");
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
