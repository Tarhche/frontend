"use client";

import {type ReactNode, useState} from "react";
import {TagsInput} from "@mantine/core";
import {useI18n} from "@/i18n/provider";
import {MAX_PORTS, readPorts} from "../../lib/form";
import {formatNumber} from "../../lib/units";

type Props = {
  value: number[];
  onChange: (ports: number[]) => void;

  /** What the ports are for, where that is worth more than how to type them. */
  description?: ReactNode;
  error?: ReactNode;
  disabled?: boolean;
};

/**
 * The guest ports a VM exposes, typed one at a time or as a list. What is not
 * a port is not kept, and is said to be not one.
 */
export function PortsInput({
  value,
  onChange,
  description,
  error,
  disabled,
}: Props) {
  const {t, locale} = useI18n();
  const [rejected, setRejected] = useState<string[]>([]);

  return (
    <TagsInput
      label={t("vms.form.ports")}
      description={
        description ??
        t("vms.form.portsHelp", {max: formatNumber(MAX_PORTS, locale)})
      }
      placeholder={t("vms.form.portsPlaceholder")}
      value={value.map(String)}
      onChange={(entries) => {
        const read = readPorts(entries);

        setRejected(read.rejected);
        onChange(read.ports);
      }}
      splitChars={[",", " "]}
      maxTags={MAX_PORTS}
      clearable
      disabled={disabled}
      error={
        rejected.length > 0
          ? t("vms.form.errors.port", {value: rejected.join(", ")})
          : error
      }
    />
  );
}
