"use client";

import {useEffect, useReducer} from "react";

/**
 * Draws a form again once its action has answered.
 *
 * React puts a form back the way it was first drawn whenever its action is
 * done, whatever the action said, and an input whose value is kept in state is
 * not told. Until something draws it again, it shows -- and the next
 * submission sends -- what it started with rather than what is chosen. This is
 * that something: the answer is what has changed when the form has been put
 * back.
 */
export function useRedrawOnAnswer(answer: unknown): void {
  const [, redraw] = useReducer((drawn: number) => drawn + 1, 0);

  useEffect(() => {
    redraw();
  }, [answer]);
}
