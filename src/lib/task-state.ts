/**
 * What a task's state is called in the reader's own language.
 *
 * The workload names its states in English, since that is what they are inside
 * it. What is shown of them is translated, and a state nobody has named yet
 * falls back to what the workload called it rather than to nothing.
 */
export function taskStateLabel(
  t: (key: string) => string,
  state: string,
): string {
  const key = `tasks.states.${state}`;
  const translated = t(key);

  return translated && translated !== key ? translated : state;
}

// a code, as the workload writes one: lower case words joined by underscores.
const REASON_CODE = /^[a-z][a-z0-9_]*$/;

/**
 * Why a task failed, in the reader's own language.
 *
 * The workload says why in words of its own -- what the node's runtime said,
 * say -- or, for what it knows to look out for, with a code. A code is
 * translated, and words are shown as they were written. A task that is tried
 * again has the attempt it was on put in front of the reason, and that stays
 * as it is.
 */
export function taskReasonLabel(
  t: (key: string) => string,
  reason: string,
): string {
  const at = reason.lastIndexOf(": ");
  const attempt = at < 0 ? "" : reason.slice(0, at + 2);
  const code = at < 0 ? reason : reason.slice(at + 2);

  if (!REASON_CODE.test(code)) {
    return reason;
  }

  const key = `tasks.reasons.${code}`;
  const translated = t(key);

  return translated && translated !== key ? attempt + translated : reason;
}
