/** The subjects the stacks are watched on: everybody's, or one's own. */
export const WATCH_STACKS_SUBJECT = "runnerStacksWatch";
export const WATCH_MY_STACKS_SUBJECT = "runnerUserStacksWatch";

/** The subject a listing of the given scope is watched on. */
export function watchStacksSubject(own: boolean): string {
  return own ? WATCH_MY_STACKS_SUBJECT : WATCH_STACKS_SUBJECT;
}
