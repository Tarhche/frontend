"use client";

import {type ReactNode} from "react";
import {Group, NumberInput} from "@mantine/core";
import {useTranslations} from "@/i18n/provider";
import {type Size} from "../../lib/units";
import {SizeInput} from "./size-input";

type Props = {
  cpus: number;
  memory: Size;
  disk: Size;
  onChange: (resources: {cpus?: number; memory?: Size; disk?: Size}) => void;
  errors?: {cpus?: ReactNode; memory?: ReactNode; disk?: ReactNode};

  /** What is worth knowing about the disk: how large it must be, if it must. */
  diskDescription?: ReactNode;
  disabled?: boolean;
};

/** What a VM is given: whole vCPUs, memory and a disk. */
export function ResourceFields({
  cpus,
  memory,
  disk,
  onChange,
  errors,
  diskDescription,
  disabled,
}: Props) {
  const t = useTranslations();

  return (
    <Group grow align="flex-start" wrap="wrap">
      <NumberInput
        label={t("vms.form.cpus")}
        description={t("vms.form.cpusHelp")}
        value={cpus > 0 ? cpus : ""}
        onChange={(value) =>
          onChange({cpus: typeof value === "number" ? value : 0})
        }
        min={1}
        step={1}
        allowDecimal={false}
        allowNegative={false}
        disabled={disabled}
        error={errors?.cpus}
        miw={160}
      />
      <SizeInput
        label={t("vms.form.memory")}
        description={t("vms.form.memoryHelp")}
        value={memory}
        onChange={(size) => onChange({memory: size})}
        disabled={disabled}
        error={errors?.memory}
      />
      <SizeInput
        label={t("vms.form.disk")}
        description={diskDescription ?? t("vms.form.diskHelp")}
        value={disk}
        onChange={(size) => onChange({disk: size})}
        disabled={disabled}
        error={errors?.disk}
      />
    </Group>
  );
}
