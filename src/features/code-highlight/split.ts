const MINIMUM = 20;
const MAXIMUM = 80;
const STEP = 4;

const clamp = (share: number) =>
  Math.min(MAXIMUM, Math.max(MINIMUM, share)).toFixed(2);

/**
 * Makes a line between two panes the handle that moves it.
 *
 * How much of a card each side takes is one number — `--split` on the grid the
 * handle sits in — so dragging it, or nudging it with the arrow keys, is a
 * matter of setting that number. Nothing is measured and nothing is stored.
 */
export function attachSplitHandle(handle: HTMLElement): () => void {
  const grid = () => handle.parentElement;

  const resize = (clientX: number) => {
    const parent = grid();

    if (!parent) {
      return;
    }

    const box = parent.getBoundingClientRect();

    parent.style.setProperty(
      "--split",
      `${clamp(((clientX - box.left) / box.width) * 100)}%`,
    );
  };

  const nudge = (by: number) => {
    const parent = grid();

    if (!parent) {
      return;
    }

    const current =
      Number.parseFloat(parent.style.getPropertyValue("--split")) || 50;

    parent.style.setProperty("--split", `${clamp(current + by)}%`);
  };

  const onPointerDown = (event: PointerEvent) => {
    handle.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const onPointerMove = (event: PointerEvent) => {
    if (handle.hasPointerCapture(event.pointerId)) {
      resize(event.clientX);
    }
  };

  const onPointerUp = (event: PointerEvent) => {
    handle.releasePointerCapture(event.pointerId);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowLeft") {
      nudge(-STEP);
    } else if (event.key === "ArrowRight") {
      nudge(STEP);
    } else {
      return;
    }

    event.preventDefault();
  };

  handle.addEventListener("pointerdown", onPointerDown);
  handle.addEventListener("pointermove", onPointerMove);
  handle.addEventListener("pointerup", onPointerUp);
  handle.addEventListener("keydown", onKeyDown);

  return () => {
    handle.removeEventListener("pointerdown", onPointerDown);
    handle.removeEventListener("pointermove", onPointerMove);
    handle.removeEventListener("pointerup", onPointerUp);
    handle.removeEventListener("keydown", onKeyDown);
  };
}
