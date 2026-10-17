"use client";

import {
  type KeyboardEvent,
  type PointerEvent,
  useState,
  type ReactNode,
} from "react";
import {VisuallyHidden} from "@mantine/core";
import classes from "./sparkline.module.css";

type Props = {
  /** What was sampled, oldest first. */
  values: number[];

  /** When each one was sampled. */
  times: string[];

  /** What it shows, said whole: what a reader who cannot see it is told. */
  summary: string;

  /** What is said beside it while nothing is pointed at. */
  caption: ReactNode;

  /** How one value is read out, and when it was taken. */
  formatValue: (value: number) => string;
  formatTime: (at: string) => string;

  /** The latest point's colour: the meter's beside it. */
  color: string;
};

// the plot is drawn in these units and stretched to the box it is in.
const WIDTH = 100;
const HEIGHT = 40;
const PAD = 4;

function xOf(index: number, count: number): number {
  return count < 2 ? WIDTH : (index / (count - 1)) * WIDTH;
}

/**
 * Where a value sits, over the range the values span: what is written above a
 * trend is what it is now, so what the line has to show is how it has moved,
 * which drawn from zero is a flat line for anything that moves a little. One
 * that has not moved at all is drawn level through the middle.
 */
function yOf(value: number, low: number, high: number): number {
  if (high <= low) {
    return HEIGHT / 2;
  }

  return PAD + (1 - (value - low) / (high - low)) * (HEIGHT - 2 * PAD);
}

/**
 * How one figure has gone while the page has been open.
 *
 * Pointing at it, or moving along it with the arrow keys once it has focus,
 * reads out the sample nearest; the tile it is in says the latest anyway, so
 * nothing is only to be had by hovering.
 */
export function Sparkline({
  values,
  times,
  summary,
  caption,
  formatValue,
  formatTime,
  color,
}: Props) {
  const [focused, setFocused] = useState<number | null>(null);
  const count = values.length;

  // nothing sampled yet keeps its place, so a tile does not grow when it is.
  if (count === 0) {
    return (
      <div className={classes.root}>
        <div className={classes.readout}>
          <span>{caption}</span>
        </div>
        <div className={classes.plot} aria-hidden />
      </div>
    );
  }

  const last = count - 1;
  const low = Math.min(...values);
  const high = Math.max(...values);
  const points = values.map(
    (value, i) => `${xOf(i, count)},${yOf(value, low, high)}`,
  );
  const area = `M0,${HEIGHT} L${points.join(" L")} L${WIDTH},${HEIGHT} Z`;

  const left = (index: number) => `${(xOf(index, count) / WIDTH) * 100}%`;
  const top = (index: number) =>
    `${(yOf(values[index], low, high) / HEIGHT) * 100}%`;

  const point = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    if (box.width <= 0) {
      return;
    }

    const share = Math.min(
      1,
      Math.max(0, (event.clientX - box.left) / box.width),
    );
    setFocused(Math.round(share * last));
  };

  const step = (event: KeyboardEvent<HTMLDivElement>) => {
    const from = focused ?? last;
    const moves: Record<string, number> = {
      ArrowLeft: Math.max(0, from - 1),
      ArrowRight: Math.min(last, from + 1),
      Home: 0,
      End: last,
    };

    if (event.key in moves) {
      event.preventDefault();
      setFocused(moves[event.key]);
    } else if (event.key === "Escape") {
      setFocused(null);
    }
  };

  const reading =
    focused === null
      ? null
      : `${formatValue(values[focused])} · ${formatTime(times[focused])}`;

  return (
    <div className={classes.root}>
      <div className={classes.readout} aria-hidden>
        {focused === null ? (
          <span>{caption}</span>
        ) : (
          <>
            <span className={classes.value}>
              {formatValue(values[focused])}
            </span>
            <span>{formatTime(times[focused])}</span>
          </>
        )}
      </div>

      <div
        className={classes.plot}
        role="img"
        aria-label={summary}
        tabIndex={0}
        onPointerMove={point}
        onPointerLeave={() => setFocused(null)}
        onBlur={() => setFocused(null)}
        onKeyDown={step}
      >
        <svg
          className={classes.svg}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          aria-hidden
        >
          {count > 1 && <path className={classes.area} d={area} />}
          {count > 1 && (
            <polyline className={classes.line} points={points.join(" ")} />
          )}
        </svg>

        {focused !== null && (
          <>
            <span className={classes.crosshair} style={{left: left(focused)}} />
            {focused !== last && (
              <span
                className={classes.marker}
                style={{left: left(focused), top: top(focused)}}
              />
            )}
          </>
        )}

        <span
          className={classes.dot}
          style={{left: left(last), top: top(last), backgroundColor: color}}
        />
      </div>

      <VisuallyHidden aria-live="polite">{reading}</VisuallyHidden>
    </div>
  );
}
