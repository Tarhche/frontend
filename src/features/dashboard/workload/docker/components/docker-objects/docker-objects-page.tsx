"use client";

import {Stack} from "@mantine/core";
import {type DockerMay} from "../../permissions";
import {type Scope, type VmSource} from "../../types";
import {vmReadiness} from "../../vm-state";
import {DockerVmSelect, useDockerVmChoice} from "../docker-vm-select";
import {ImagesTable} from "./images-table";
import {NetworksTable} from "./networks-table";
import {VmNotRunning} from "./vm-not-running";
import {VolumesTable} from "./volumes-table";

export type DockerObjects = "images" | "networks" | "volumes";

/**
 * Keeps the address saying which VM is shown, so that a reload or a link
 * shows the same one. Only the query changes, so nothing is navigated.
 */
function remember(vm: string | null) {
  const params = new URLSearchParams(window.location.search);

  if (vm) {
    params.set("vm", vm);
  } else {
    params.delete("vm");
  }

  const query = params.toString();
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${query ? `?${query}` : ""}`,
  );
}

type Props = {
  objects: DockerObjects;
  scope: Scope;
  may: DockerMay;
  vmSource: VmSource | null;

  /** the VM the address names, shown first when there is such a VM. */
  initialVm?: string | null;
};

/**
 * What one Docker VM holds of one kind of thing: its images, its networks or
 * its volumes. The VM is picked at the top; one that is not running has
 * nothing to ask, which is said in place of what it holds.
 */
export function DockerObjectsPage({
  objects,
  scope,
  may,
  vmSource,
  initialVm,
}: Props) {
  const state = useDockerVmChoice(vmSource, {
    allowNew: false,
    initial: initialVm,
  });

  const vm = state.choice.kind === "existing" ? state.choice.vm : null;
  const running = vm !== null && vmReadiness(vm.state) === "running";

  return (
    <Stack>
      <DockerVmSelect state={state} onPick={remember} withReadiness={false} />

      {vm && !running && <VmNotRunning vm={vm} />}

      {vm && running && objects === "images" && (
        <ImagesTable key={vm.uuid} scope={scope} vm={vm} may={may} />
      )}
      {vm && running && objects === "networks" && (
        <NetworksTable key={vm.uuid} scope={scope} vm={vm} may={may} />
      )}
      {vm && running && objects === "volumes" && (
        <VolumesTable key={vm.uuid} scope={scope} vm={vm} may={may} />
      )}
    </Stack>
  );
}
