"use client";

import {
  IconArrowLeft,
  IconArrowRight,
  type IconProps,
} from "@tabler/icons-react";
import {useI18n} from "@/i18n/provider";

// Arrow pointing at the "forward" edge of the active reading direction — right
// in LTR, left in RTL. Use it for next/more affordances so they keep pointing
// the way the reader moves when the UI language changes.
export function IconArrowForward(props: IconProps) {
  const {direction} = useI18n();
  const Icon = direction === "rtl" ? IconArrowLeft : IconArrowRight;

  return <Icon {...props} />;
}

// Mirror of `IconArrowForward`: points back the way the reader came from.
export function IconArrowBackward(props: IconProps) {
  const {direction} = useI18n();
  const Icon = direction === "rtl" ? IconArrowRight : IconArrowLeft;

  return <Icon {...props} />;
}
