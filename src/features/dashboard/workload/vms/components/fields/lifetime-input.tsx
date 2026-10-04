"use client";

import {type ReactNode} from "react";
import {
  Group,
  InputWrapper,
  NumberInput,
  SegmentedControl,
  Select,
  Stack,
} from "@mantine/core";
import {useTranslations} from "@/i18n/provider";
import {type Lifetime, type LifetimeUnit} from "../../lib/lifetime";

type Props = {
  value: Lifetime;
  onChange: (lifetime: Lifetime) => void;
  description?: ReactNode;
  error?: ReactNode;
  disabled?: boolean;
};

/** Whether a VM is kept until it is deleted, or for how long it is kept. */
export function LifetimeInput({
  value,
  onChange,
  description,
  error,
  disabled,
}: Props) {
  const t = useTranslations();

  return (
    <InputWrapper
      label={t("vms.form.lifetime")}
      description={description ?? t("vms.form.lifetimeHelp")}
      error={error}
    >
      <Stack gap="xs" mt={6}>
        <SegmentedControl
          value={value.keep ? "keep" : "for"}
          onChange={(mode) => onChange({...value, keep: mode === "keep"})}
          disabled={disabled}
          data={[
            {value: "keep", label: t("vms.form.lifetimeKeep")},
            {value: "for", label: t("vms.form.lifetimeFor")},
          ]}
        />
        {!value.keep && (
          <Group grow align="flex-start">
            <NumberInput
              aria-label={t("vms.form.lifetimeAmount")}
              value={value.amount > 0 ? value.amount : ""}
              onChange={(amount) =>
                onChange({
                  ...value,
                  amount: typeof amount === "number" ? amount : 0,
                })
              }
              min={0}
              allowNegative={false}
              decimalScale={1}
              disabled={disabled}
            />
            <Select
              aria-label={t("vms.form.lifetimeUnit")}
              value={value.unit}
              allowDeselect={false}
              disabled={disabled}
              onChange={(unit) =>
                unit && onChange({...value, unit: unit as LifetimeUnit})
              }
              data={[
                {value: "hours", label: t("vms.form.hours")},
                {value: "days", label: t("vms.form.days")},
              ]}
            />
          </Group>
        )}
      </Stack>
    </InputWrapper>
  );
}
