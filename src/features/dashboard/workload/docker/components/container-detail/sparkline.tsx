"use client";

import {useState, type KeyboardEvent, type PointerEvent} from "react";
import {Text} from "@mantine/core";
import {useElementSize} from "@mantine/hooks";
import classes from "./container-stats.module.css";

const HEIGHT = 36;

// room around the line for the end marker and its ring, so neither is cut.
const PAD = 6;

type Props = {
  /** oldest first. */
  values: number[];

  /** when each value was sampled, for the readout. */
  times: string[];

  /** what the trend is of, which is also what a screen reader is told. */
  label: string;
  summary: string;
  format: (value: number) => string;
  formatTime: (at: string) => string;
};

/**
 * How one number has gone over the samples kept so far: a quiet line, with
 * where it is now marked in the accent. Pointing at it, or moving along it
 * with the arrow keys once it has focus, reads out the sample under it; the
 * number it is now is already written above it.
 */
export function Sparkline({
  values,
  times,
  label,
  summary,
  format,
  formatTime,
}: Props) {
  const {ref, width} = useElementSize<HTMLDivElement>();
  const [looking, setLooking] = useState<number | null>(null);

  const count = values.length;
  const at = looking !== null && looking < count ? looking : null;

  // the trend is drawn over its own range: the number it is now is written
  // above it, so what the line has to show is how it has moved. One that has
  // not moved at all is drawn level through the middle.
  const low = Math.min(...values);
  const high = Math.max(...values);
  const span = high - low;
  const x = (index: number) =>
    PAD + (count > 1 ? (index / (count - 1)) * (width - 2 * PAD) : 0);
  const y = (value: number) =>
    span > 0
      ? HEIGHT - PAD - ((value - low) / span) * (HEIGHT - 2 * PAD)
      : HEIGHT / 2;

  const nearest = (event: PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = box.width > 0 ? (event.clientX - box.left) / box.width : 1;

    return Math.min(count - 1, Math.max(0, Math.round(ratio * (count - 1))));
  };

  const move = (event: KeyboardEvent<SVGSVGElement>) => {
    const from = at ?? count - 1;

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setLooking(Math.max(0, from - 1));
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      setLooking(Math.min(count - 1, from + 1));
    } else if (event.key === "Escape") {
      setLooking(null);
    }
  };

  const marked = at ?? count - 1;

  return (
    <div ref={ref}>
      {count > 1 && width > 0 ? (
        <svg
          className={classes.trend}
          width={width}
          height={HEIGHT}
          viewBox={`0 0 ${width} ${HEIGHT}`}
          role="img"
          aria-label={`${label}: ${summary}`}
          tabIndex={0}
          onPointerMove={(event) => setLooking(nearest(event))}
          onPointerLeave={() => setLooking(null)}
          onKeyDown={move}
          onBlur={() => setLooking(null)}
        >
          <polyline
            className={classes.line}
            points={values
              .map((value, index) => `${x(index)},${y(value)}`)
              .join(" ")}
          />
          {at !== null && (
            <line
              className={classes.crosshair}
              x1={x(at)}
              x2={x(at)}
              y1={0}
              y2={HEIGHT}
            />
          )}
          <circle
            className={classes.dot}
            cx={x(marked)}
            cy={y(values[marked])}
            r={4}
          />
        </svg>
      ) : (
        <div style={{height: HEIGHT}} aria-hidden />
      )}
      <Text size="xs" c="dimmed" className={classes.readout}>
        {at !== null ? `${format(values[at])} · ${formatTime(times[at])}` : ""}
      </Text>
    </div>
  );
}
