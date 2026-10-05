"use server";

import {revalidatePath} from "next/cache";
import {redirect, unstable_rethrow} from "next/navigation";
import {privateDalDriver} from "@/dal/private/private-dal-driver";
import {APP_PATHS} from "@/lib/app-paths";
import {
  problemOf,
  type Problem,
} from "@/features/dashboard/workload/lib/problem";
import {createVmPath} from "../api";
import {type CreateVmRequest} from "../types";

export type CreateVmState = {
  /** What went wrong the last time it was asked for, if it did. */
  problem?: Problem;
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

    return {problem: problemOf(error)};
  }

  revalidatePath(APP_PATHS.dashboard.vms.index);
  redirect(
    created?.uuid
      ? APP_PATHS.dashboard.vms.detail(created.uuid)
      : APP_PATHS.dashboard.vms.index,
  );
}
