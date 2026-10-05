"use client";

import {useState} from "react";
import {
  Fieldset,
  NumberInput,
  SimpleGrid,
  Stack,
  Switch,
  TagsInput,
  TextInput,
} from "@mantine/core";
import {useTranslations} from "@/i18n/provider";
import {portsFrom, type NewDockerVm} from "./choice";

type Props = {
  value: NewDockerVm;
  onChange: (vm: NewDockerVm) => void;

  /** what the server refused about the new VM, by field. */
  errors?: Record<string, string>;
  disabled?: boolean;
};

// what a number input hands over, as a size: a number, or nothing typed.
function sizeOf(value: number | string): number | "" {
  if (typeof value === "number") {
    return value;
  }

  const number = Number(value);

  return value.trim() === "" || !Number.isFinite(number) ? "" : number;
}

/**
 * The Docker VM that is created along with what is being created, with the
 * platform's defaults filled in for somebody to change before it is.
 */
export function NewDockerVmFields({
  value,
  onChange,
  errors = {},
  disabled,
}: Props) {
  const t = useTranslations();

  // what was typed into the ports that is not a port, said until it is gone.
  const [rejected, setRejected] = useState<string[]>([]);

  const set = <K extends keyof NewDockerVm>(key: K, next: NewDockerVm[K]) =>
    onChange({...value, [key]: next});

  return (
    <Fieldset legend={t("dockerVms.new.legend")} disabled={disabled}>
      <Stack gap="sm">
        <TextInput
          label={t("dockerVms.new.name")}
          description={t("dockerVms.new.nameHelp")}
          value={value.name}
          onChange={(event) => set("name", event.currentTarget.value)}
          error={errors["vm.name"]}
          autoComplete="off"
        />
        <SimpleGrid cols={{base: 1, sm: 3}}>
          <NumberInput
            label={t("dockerVms.new.cpus")}
            value={value.cpus}
            onChange={(next) => set("cpus", sizeOf(next))}
            min={1}
            step={1}
            allowDecimal={false}
            allowNegative={false}
            error={errors["vm.resources.cpus"]}
          />
          <NumberInput
            label={t("dockerVms.new.memory")}
            value={value.memoryGiB}
            onChange={(next) => set("memoryGiB", sizeOf(next))}
            suffix=" GiB"
            min={0.5}
            step={0.5}
            decimalScale={1}
            allowNegative={false}
            error={errors["vm.resources.memory"]}
          />
          <NumberInput
            label={t("dockerVms.new.disk")}
            value={value.diskGiB}
            onChange={(next) => set("diskGiB", sizeOf(next))}
            suffix=" GiB"
            min={4}
            step={1}
            allowDecimal={false}
            allowNegative={false}
            error={errors["vm.resources.disk"]}
          />
        </SimpleGrid>
        <TagsInput
          label={t("dockerVms.new.ports")}
          description={t("dockerVms.new.portsHelp")}
          value={value.ports.map(String)}
          onChange={(values) => {
            const {ports, rejected: notPorts} = portsFrom(values);
            setRejected(notPorts);
            set("ports", ports);
          }}
          splitChars={[",", " "]}
          maxTags={16}
          clearable
          error={
            rejected.length > 0
              ? t("dockerVms.new.notPorts", {values: rejected.join(", ")})
              : errors["vm.ports"]
          }
        />
        <Switch
          label={t("dockerVms.new.ingress")}
          description={t("dockerVms.new.ingressHelp")}
          checked={value.ingress}
          onChange={(event) => set("ingress", event.currentTarget.checked)}
          error={errors["vm.network.ingress"]}
        />
        <Switch
          label={t("dockerVms.new.egress")}
          description={t("dockerVms.new.egressHelp")}
          checked={value.egress}
          onChange={(event) => set("egress", event.currentTarget.checked)}
          error={errors["vm.network.egress"]}
        />
      </Stack>
    </Fieldset>
  );
}
