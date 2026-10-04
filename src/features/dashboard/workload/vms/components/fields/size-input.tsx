"use client";

import {type ReactNode} from "react";
import {NativeSelect, NumberInput} from "@mantine/core";
import {type Size, type SizeUnit} from "../../lib/units";

type Props = {
  label: ReactNode;
  description?: ReactNode;
  value: Size;
  onChange: (size: Size) => void;
  error?: ReactNode;
  disabled?: boolean;
};

const UNITS: SizeUnit[] = ["MiB", "GiB"];

/**
 * A size, typed in MiB or GiB. The unit says what the number is in: somebody
 * who types 512 and then picks MiB meant 512 MiB, so the number stays.
 */
export function SizeInput({
  label,
  description,
  value,
  onChange,
  error,
  disabled,
}: Props) {
  return (
    <NumberInput
      label={label}
      description={description}
      error={error}
      disabled={disabled}
      // empty rather than 0 while somebody is typing over it.
      value={value.amount > 0 ? value.amount : ""}
      onChange={(amount) =>
        onChange({...value, amount: typeof amount === "number" ? amount : 0})
      }
      min={0}
      allowNegative={false}
      decimalScale={value.unit === "GiB" ? 2 : 0}
      rightSectionWidth={80}
      rightSection={
        <NativeSelect
          aria-label={typeof label === "string" ? label : undefined}
          data={UNITS}
          value={value.unit}
          disabled={disabled}
          onChange={(event) =>
            onChange({...value, unit: event.currentTarget.value as SizeUnit})
          }
          variant="unstyled"
          size="sm"
        />
      }
    />
  );
}
