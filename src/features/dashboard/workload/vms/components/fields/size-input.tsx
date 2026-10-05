"use client";

import {type ReactNode} from "react";
import {NativeSelect, rem} from "@mantine/core";
import {type Size, type SizeUnit} from "../../lib/units";
import {AmountInput} from "./amount-input";

type Props = {
  label: ReactNode;
  description?: ReactNode;

  /** what is shown while nothing is typed, when nothing is a size of its own. */
  placeholder?: string;
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
  placeholder,
  value,
  onChange,
  error,
  disabled,
}: Props) {
  return (
    <AmountInput
      label={label}
      description={description}
      placeholder={placeholder}
      error={error}
      disabled={disabled}
      value={value.amount}
      onChange={(amount) => onChange({...value, amount})}
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
