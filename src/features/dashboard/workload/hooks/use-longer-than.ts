"use client";

import {useEffect, useState} from "react";

/**
 * Whether something going on has gone on for longer than a moment: false
 * until it has gone on for `after` milliseconds, and false again as soon as
 * it stops, so whatever says it is going on is not drawn for something that
 * is over before anybody could read it.
 */
export function useLongerThan(going: boolean, after: number): boolean {
  const [long, setLong] = useState(false);

  // it stopping is seen as it is rendered, so the next time it goes on is
  // timed afresh.
  const [wasGoing, setWasGoing] = useState(going);
  if (going !== wasGoing) {
    setWasGoing(going);
    if (!going) {
      setLong(false);
    }
  }

  useEffect(() => {
    if (!going) {
      return;
    }

    const timer = setTimeout(() => setLong(true), after);

    return () => clearTimeout(timer);
  }, [going, after]);

  return going && long;
}
