"use client";

import {useEffect, useState} from "react";

/**
 * The time, kept current to within a step: what "in 3 hours" is worked out
 * against, without reading the clock while rendering.
 */
export function useNow(step = 30_000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), step);

    return () => clearInterval(timer);
  }, [step]);

  return now;
}
