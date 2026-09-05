"use client";

import {useCallback, useRef} from "react";
import classes from "./run-workspace.module.css";

const MINIMUM = 20;
const MAXIMUM = 80;
const STEP = 4;

/**
 * The line between the code and what it serves, which is also how much of
 * each is shown. Dragging it sets `--split` on the grid it sits in, so the
 * two sides are laid out from one number and nothing has to be measured.
 */
export function SplitHandle({label}: {label: string}) {
  const handle = useRef<HTMLDivElement>(null);

  const resize = useCallback((clientX: number) => {
    const grid = handle.current?.parentElement;

    if (!grid) {
      return;
    }

    const box = grid.getBoundingClientRect();
    const share = ((clientX - box.left) / box.width) * 100;

    grid.style.setProperty(
      "--split",
      `${Math.min(MAXIMUM, Math.max(MINIMUM, share))}%`,
    );
  }, []);

  const nudge = useCallback((by: number) => {
    const grid = handle.current?.parentElement;

    if (!grid) {
      return;
    }

    const current =
      Number.parseFloat(grid.style.getPropertyValue("--split")) || 50;

    grid.style.setProperty(
      "--split",
      `${Math.min(MAXIMUM, Math.max(MINIMUM, current + by))}%`,
    );
  }, []);

  return (
    <div
      ref={handle}
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      tabIndex={0}
      className={classes.handle}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        event.preventDefault();
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          resize(event.clientX);
        }
      }}
      onPointerUp={(event) =>
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          nudge(-STEP);
        } else if (event.key === "ArrowRight") {
          nudge(STEP);
        } else {
          return;
        }

        event.preventDefault();
      }}
    />
  );
}
