import {fetchMyRuntimes, fetchRuntimes} from "@/dal/private/workload";
import {type Runtime} from "./runtimes";

/**
 * The classes a form can offer to run a task as, or null when there is
 * nothing to offer: the form then offers no choice and sends none, and the
 * workload runs the task as its default.
 *
 * Asking can fail without anything being wrong with the form. The backend
 * answers 404 until it serves runtimes at all, and neither that nor a 403 or a
 * 5xx is a reason to keep somebody from running a task, so whatever goes
 * wrong is taken as having been told nothing.
 *
 * `own` asks as somebody trusted with only their own tasks.
 */
export async function loadRuntimes(own: boolean): Promise<Runtime[] | null> {
  let response: unknown;

  try {
    response = await (own ? fetchMyRuntimes : fetchRuntimes)();
  } catch {
    // the DAL turns a 404 into notFound() and a 403 into forbidden(), which
    // would otherwise take the whole page with them rather than one field.
    return null;
  }

  const items = (response as {items?: unknown} | null)?.items;
  if (!Array.isArray(items)) {
    return null;
  }

  const runtimes = items.filter(isRuntime);

  return runtimes.length > 0 ? runtimes : null;
}

function isRuntime(item: unknown): item is Runtime {
  const name = (item as {class?: unknown} | null)?.class;

  return typeof name === "string" && name.length > 0;
}
