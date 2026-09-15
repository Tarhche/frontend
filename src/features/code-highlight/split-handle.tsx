"use client";

import {useEffect, useRef} from "react";
import {attachSplitHandle} from "./split";
import classes from "./run-workspace.module.css";

/**
 * The line between the code and what it serves, which is also how much of
 * each is shown.
 */
export function SplitHandle({label}: {label: string}) {
  const handle = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!handle.current) {
      return;
    }

    return attachSplitHandle(handle.current);
  }, []);

  return (
    <div
      ref={handle}
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      tabIndex={0}
      className={classes.handle}
    />
  );
}
