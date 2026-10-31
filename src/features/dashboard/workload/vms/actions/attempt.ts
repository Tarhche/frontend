import {revalidatePath} from "next/cache";
import {unstable_rethrow} from "next/navigation";
import {
  problemOf,
  type Problem,
} from "@/features/dashboard/workload/lib/problem";
import {type ActionResult} from "../types";

/**
 * Asks the API for something on somebody's behalf, and says how it went.
 *
 * What went wrong comes back as it is read wherever the dashboard asks the
 * workload for something: what was refused field by field, for a form to say
 * beside each field, and anything else for it to say where it was asked. The
 * pages showing what changed are rendered again once it has.
 */
export async function attempt(
  request: () => Promise<unknown>,
  revalidate: readonly string[],
): Promise<ActionResult> {
  try {
    await request();
  } catch (error) {
    // a redirect or a "not found" travels as a throw, and is not a failure
    // of ours to report.
    unstable_rethrow(error);

    return {ok: false, problem: problemOf(error)};
  }

  for (const path of revalidate) {
    revalidatePath(path);
  }

  return {ok: true};
}

/** What is answered for a request that could not have been asked at all. */
export const NOT_ASKED: {ok: false; problem: Problem} = {
  ok: false,
  problem: {fields: {}, unanswered: false},
};
