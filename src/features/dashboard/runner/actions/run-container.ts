"use server";

import {revalidatePath} from "next/cache";
import {redirect, unstable_rethrow} from "next/navigation";
import {APP_PATHS} from "@/lib/app-paths";
import {privateDalDriver} from "@/dal/private/private-dal-driver";
import {extractValidationErrors} from "@/lib/api/validation-errors";

export type RunContainerState = {
  errors?: Record<string, string>;
};

/**
 * Runs one container from what the form describes, in the shape a docker
 * compose service has. There is no update: to change a container, run another
 * and delete this one.
 */
export async function runContainer(
  prevState: RunContainerState,
  formData: FormData,
): Promise<RunContainerState> {
  const body = {
    name: formData.get("name")?.toString() ?? "",
    image: formData.get("image")?.toString() ?? "",
    command: lines(formData.get("command")),
    entrypoint: lines(formData.get("entrypoint")),
    working_dir: formData.get("working_dir")?.toString() || undefined,
    environment: lines(formData.get("environment")),
    ports: lines(formData.get("ports")),
    network_mode: formData.get("network_mode")?.toString() || "isolated",
    read_only: formData.get("read_only") === "on",
    restart: formData.get("restart")?.toString() || "unless-stopped",
    deploy: {
      resources: {
        limits: {
          cpus: formData.get("cpus")?.toString() || undefined,
          memory: formData.get("memory")?.toString() || undefined,
        },
      },
    },
  };

  try {
    await privateDalDriver.post("/dashboard/runner/containers", body);
  } catch (error) {
    unstable_rethrow(error);

    const errors = extractValidationErrors(error);
    if (errors) {
      return {errors};
    }

    throw error;
  }

  revalidatePath(APP_PATHS.dashboard.containers.index);
  redirect(APP_PATHS.dashboard.containers.index);
}

/**
 * lines splits a textarea into the list the API expects, dropping the blank
 * ones somebody left behind.
 */
function lines(value: FormDataEntryValue | null): string[] {
  return (value?.toString() ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}
