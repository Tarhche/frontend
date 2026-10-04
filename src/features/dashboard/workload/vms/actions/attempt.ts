import {revalidatePath} from "next/cache";
import {unstable_rethrow} from "next/navigation";
import {extractValidationErrors} from "@/lib/api/validation-errors";
import {type ActionResult} from "../types";

/**
 * Asks the API for something on somebody's behalf, and says how it went.
 *
 * What the API refused as invalid comes back field by field, for the form that
 * asked to show beside each field; anything else is only a failure. The pages
 * showing what changed are rendered again once it has.
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

    const errors = extractValidationErrors(error);

    return errors ? {ok: false, errors} : {ok: false};
  }

  for (const path of revalidate) {
    revalidatePath(path);
  }

  return {ok: true};
}
