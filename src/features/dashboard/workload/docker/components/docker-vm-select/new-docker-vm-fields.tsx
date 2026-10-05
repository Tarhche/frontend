"use client";

import {Fieldset, Stack, TextInput} from "@mantine/core";
import {useTranslations} from "@/i18n/provider";
import {NetworkFields} from "@/features/dashboard/workload/vms/components/fields/network-fields";
import {PortsInput} from "@/features/dashboard/workload/vms/components/fields/ports-input";
import {ResourceFields} from "@/features/dashboard/workload/vms/components/fields/resource-fields";
import {type NewDockerVm} from "./choice";

type Props = {
  value: NewDockerVm;
  onChange: (vm: NewDockerVm) => void;

  /** what the server refused about the new VM, by JSON path. */
  errors?: Record<string, string>;
  disabled?: boolean;
};

// what was refused about one of the ports names the port by its place in the
// list (vm.ports.2); it is said under the ports as a whole.
function portsError(errors: Record<string, string>): string | undefined {
  return Object.entries(errors).find(
    ([path]) => path === "vm.ports" || path.startsWith("vm.ports."),
  )?.[1];
}

/**
 * The Docker VM that is created along with what is being created, with the
 * platform's defaults filled in for somebody to change before it is. Its
 * fields are the VM form's, which a Docker VM made on its own page has too.
 */
export function NewDockerVmFields({
  value,
  onChange,
  errors = {},
  disabled,
}: Props) {
  const t = useTranslations();

  const update = (patch: Partial<NewDockerVm>) =>
    onChange({...value, ...patch});

  return (
    <Fieldset legend={t("dockerVms.new.legend")} disabled={disabled}>
      <Stack gap="sm">
        <TextInput
          label={t("dockerVms.new.name")}
          description={t("dockerVms.new.nameHelp")}
          value={value.name}
          onChange={(event) => update({name: event.currentTarget.value})}
          error={errors["vm.name"]}
          autoComplete="off"
        />
        <ResourceFields
          cpus={value.cpus}
          memory={value.memory}
          disk={value.disk}
          onChange={update}
          errors={{
            cpus: errors["vm.resources.cpus"],
            memory: errors["vm.resources.memory"],
            disk: errors["vm.resources.disk"],
          }}
          disabled={disabled}
        />
        <PortsInput
          value={value.ports}
          onChange={(ports) => update({ports})}
          description={t("dockerVms.new.portsHelp")}
          error={portsError(errors)}
          disabled={disabled}
        />
        <NetworkFields
          kind="docker"
          ingress={value.ingress}
          egress={value.egress}
          onChange={update}
          errors={{
            ingress: errors["vm.network.ingress"],
            egress: errors["vm.network.egress"],
          }}
          disabled={disabled}
        />
      </Stack>
    </Fieldset>
  );
}
