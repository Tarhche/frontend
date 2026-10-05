"use server";

import {revalidatePath} from "next/cache";
import {redirect, unstable_rethrow} from "next/navigation";
import {privateDalDriver} from "@/dal/private/private-dal-driver";
import {APP_PATHS} from "@/lib/app-paths";
import {extractValidationErrors} from "@/lib/api/validation-errors";
import {createVmPath} from "../api";
import {type CreateVmRequest} from "../types";

export type CreateVmState = {
  /** What the API refused, field by field. */
  errors?: Record<string, string>;

  /** Set when it failed for any other reason. */
  failed?: boolean;
};

/**
 * Creates a VM for whoever asks, and takes them to it. The workload starts it
 * in its own time; its page says how that is going.
 */
export async function createVm(
  _previous: CreateVmState,
  request: CreateVmRequest,
): Promise<CreateVmState> {
  let created: {uuid?: string} | undefined;

  try {
    const response = await privateDalDriver.post(createVmPath(), request);
    created = response.data;
  } catch (error) {
    unstable_rethrow(error);

    const errors = extractValidationErrors(error);

    return errors ? {errors} : {failed: true};
  }

  revalidatePath(APP_PATHS.dashboard.vms.index);
  redirect(
    created?.uuid
      ? APP_PATHS.dashboard.vms.detail(created.uuid)
      : APP_PATHS.dashboard.vms.index,
  );
}
