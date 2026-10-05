"use client";

import {useState} from "react";
import {appendSample} from "../lib/usage";

/**
 * The samples of something's use seen while the page has been open, oldest
 * first: one for each moment it was sampled at, however often it is read.
 *
 * Nothing keeps a history of them anywhere else: each read carries the last
 * sample taken, and this is those, one each.
 */
export function useSamples<T>(
  sample: T | null | undefined,
  atOf: (sample: T) => string,
): T[] {
  const [kept, setKept] = useState<{at?: string; samples: T[]}>(() =>
    sample ? {at: atOf(sample), samples: [sample]} : {samples: []},
  );

  // a new sample is kept as it is rendered, rather than an effect later, so
  // nothing is ever drawn without it.
  if (sample && atOf(sample) !== kept.at) {
    const next = {
      at: atOf(sample),
      samples: appendSample(kept.samples, sample, atOf),
    };
    setKept(next);

    return next.samples;
  }

  return kept.samples;
}
