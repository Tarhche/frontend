"use server";

import {revalidatePath} from "next/cache";
import {redirect, unstable_rethrow} from "next/navigation";
import {APP_PATHS} from "@/lib/app-paths";
import {privateDalDriver} from "@/dal/private/private-dal-driver";
import {extractValidationErrors} from "@/lib/api/validation-errors";

export type RunStackState = {
  errors?: Record<string, string>;
  values?: Record<string, string>;
};

/**
 * Runs a set of services together from the services block of a compose file,
 * as it was written. They share a private network and reach each other by
 * service name.
 *
 * A stack is run as one class, since its services share a network and a
 * network belongs to one class. The one chosen goes alongside the services
 * rather than into them: the workload gives it to every service that names
 * none, and refuses a stack whose services would end up with more than one.
 * With none chosen, it is the workload's default.
 */
export async function runStack(
  prevState: RunStackState,
  formData: FormData,
): Promise<RunStackState> {
  const name = formData.get("name")?.toString() ?? "";
  const services = formData.get("services")?.toString() ?? "";
  const runtime = formData.get("runtime")?.toString() || undefined;

  const values = {name, services};

  let parsed: unknown;
  try {
    parsed = JSON.parse(services);
  } catch {
    return {errors: {services: "invalid_json"}, values};
  }

  try {
    await privateDalDriver.post("/dashboard/workload/stacks", {
      name,
      runtime,
      services: parsed,
    });
  } catch (error) {
    unstable_rethrow(error);

    const errors = extractValidationErrors(error);
    if (errors) {
      return {errors, values};
    }

    throw error;
  }

  revalidatePath(APP_PATHS.dashboard.stacks.index);
  redirect(APP_PATHS.dashboard.stacks.index);
}
