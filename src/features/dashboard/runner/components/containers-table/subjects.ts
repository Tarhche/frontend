/**
 * The subjects the tasks are watched on.
 *
 * Which one a watch is opened on is which tasks it is for: everybody's is
 * served under the runner's index permission, one's own under the self one, so
 * a person who may only see their own asks on the second and is refused on the
 * first.
 */
export const WATCH_TASKS_SUBJECT = "runnerTasksWatch";
export const WATCH_MY_TASKS_SUBJECT = "runnerUserTasksWatch";

/** The subject a listing of the given scope is watched on. */
export function watchTasksSubject(own: boolean): string {
  return own ? WATCH_MY_TASKS_SUBJECT : WATCH_TASKS_SUBJECT;
}
