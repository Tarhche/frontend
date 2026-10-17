"use client";

import {useState} from "react";
import {NumberInput, type NumberInputProps} from "@mantine/core";

type Props = Omit<NumberInputProps, "value" | "onChange"> & {
  value: number;
  onChange: (value: number) => void;
};

function parse(draft: string | number): number {
  return typeof draft === "number" ? draft : Number.parseFloat(draft) || 0;
}

/**
 * A number field that holds a number, and lets somebody type their way to it:
 * "" and "1." are on the way to 1.5, and are shown as typed rather than put
 * back to 0 under their cursor.
 */
export function AmountInput({value, onChange, ...props}: Props) {
  const [draft, setDraft] = useState<string | number>(value > 0 ? value : "");

  // set from elsewhere -- another kind, a snapshot, a unit: shown as it is now.
  if (parse(draft) !== value) {
    setDraft(value > 0 ? value : "");
  }

  return (
    <NumberInput
      {...props}
      value={draft}
      onChange={(next) => {
        setDraft(next);
        onChange(parse(next));
      }}
    />
  );
}
