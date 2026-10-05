import {stateLabel} from "./state-label";

/** What a code runner's task's state is called in the reader's language. */
export function taskStateLabel(
  t: (key: string) => string,
  state: string,
): string {
  return stateLabel(t, "tasks.states", state);
}
