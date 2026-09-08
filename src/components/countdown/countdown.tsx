"use client";

import {useEffect, useState} from "react";

/** How much of a deadline is left, as a clock reads it. */
function remaining(to: number): string {
  const seconds = Math.max(0, Math.round((to - Date.now()) / 1000));
  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
  }

  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}:${String(
    seconds % 60,
  ).padStart(2, "0")}`;
}

type Props = {
  /** When the thing being counted down runs out, as the server said it. */
  to: string;
  className?: string;
};

/**
 * What is left of a container's time, ticking down.
 *
 * A container that may only run for so long says when it will be stopped;
 * this is that, read as a clock, so nobody has to work out what a timestamp
 * means. It stops at zero, since the runner is what actually stops it.
 */
export function Countdown({to, className}: Props) {
  const deadline = new Date(to).getTime();
  const [left, setLeft] = useState(() => remaining(deadline));

  useEffect(() => {
    setLeft(remaining(deadline));

    const timer = setInterval(() => setLeft(remaining(deadline)), 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  if (Number.isNaN(deadline)) {
    return null;
  }

  return (
    <time className={className} dateTime={to}>
      {left}
    </time>
  );
}
