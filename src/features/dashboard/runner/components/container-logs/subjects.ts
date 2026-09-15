/**
 * The subjects a task's log is followed on: everybody's tasks, or one's own.
 * They are served under different permissions, so which one a reader may open
 * is which of these they ask on.
 */
export const FOLLOW_LOGS_SUBJECT = "runnerTaskLogs";
export const FOLLOW_MY_LOGS_SUBJECT = "runnerUserTaskLogs";

/** The subject a log of the given scope is followed on. */
export function followLogsSubject(own: boolean): string {
  return own ? FOLLOW_MY_LOGS_SUBJECT : FOLLOW_LOGS_SUBJECT;
}
