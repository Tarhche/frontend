"use client";

import {type ReactNode} from "react";
import {NativeSelect, NumberInput, rem} from "@mantine/core";
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

// wide enough for "MiB" and the select's own chevron.
const UNIT_WIDTH = 84;

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
      // the unit is a select of its own, sitting in the input's end: it has
      // to take clicks, and to draw its value rather than only its chevron.
      rightSectionWidth={UNIT_WIDTH}
      rightSectionPointerEvents="all"
      rightSection={
        <NativeSelect
          aria-label={typeof label === "string" ? label : undefined}
          data={UNITS}
          value={value.unit}
          disabled={disabled}
          onChange={(event) =>
            onChange({...value, unit: event.currentTarget.value as SizeUnit})
          }
          rightSectionWidth={24}
          styles={{
            input: {
              width: rem(UNIT_WIDTH),
              fontWeight: 500,
              borderStartStartRadius: 0,
              borderEndStartRadius: 0,
              marginInlineEnd: rem(-1),
            },
          }}
        />
      }
    />
  );
}
