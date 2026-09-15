"use client";

import {useCallback, useEffect, useRef} from "react";
import {decode} from "js-base64";
import JsCookie from "js-cookie";
import {ACCESS_TOKEN_COOKIE_NAME} from "@/constants";
import {useWsStream} from "@/hooks/use-ws-stream";

// how long to wait before opening a watch again, growing with each attempt so
// that a runner which is down is not asked over and over.
const WAIT_MS = [1_000, 2_000, 5_000, 10_000];

/**
 * Whether a watch ended because it was refused rather than interrupted.
 *
 * A refusal is an answer — the token identifies nobody, or somebody who may
 * not watch this — and asking again would only be refused again.
 */
function refused(payload: string | null): boolean {
  if (!payload) {
    return false;
  }

  try {
    return Boolean((JSON.parse(decode(payload)) as {errors?: unknown}).errors);
  } catch {
    return false;
  }
}

type Options = {
  /** The subject the watch is opened on. */
  subject: string;

  /** One change, as the raw payload it arrived as: what is in it is the caller's. */
  onChange: (payload: string | null) => void;

  /**
   * Called when the watch is carrying changes again after having been opened
   * anew. Whatever happened while it was gone went unheard, so whoever is
   * showing it asks for what it shows now.
   */
  onResume: () => void;
};

/**
 * Keeps a watch open for as long as the page showing it is.
 *
 * A watch is a stream, and a stream ends: the runner is restarted, a replica
 * is replaced, a connection goes. What is being watched carries on regardless,
 * so a page that let the watch end would sit there showing what it last heard,
 * with nothing to say that it had stopped listening. This opens it again, and
 * says so, until the page goes away.
 */
export function useWatch({subject, onChange, onResume}: Options): void {
  const openStream = useWsStream();

  // held apart from the watch, so that a caller which hands over a new
  // function does not close and reopen what it is watching.
  const handlers = useRef({onChange, onResume});
  useEffect(() => {
    handlers.current = {onChange, onResume};
  });

  useEffect(() => {
    if (!JsCookie.get(ACCESS_TOKEN_COOKIE_NAME)) {
      return;
    }

    let closed = false;
    let close: (() => void) | undefined;
    let attempt = 0;
    let waiting: ReturnType<typeof setTimeout> | undefined;

    // read as the watch is opened rather than once: a token is refreshed while
    // a page is open, and a watch opened again carries whichever is current.
    const request = () => ({
      access_token: JsCookie.get(ACCESS_TOKEN_COOKIE_NAME),
    });

    const open = () => {
      void openStream(subject, request, {
        onChunk: (payload) => handlers.current.onChange(payload),
        onEnd: (payload) => {
          if (closed || refused(payload)) {
            return;
          }

          waiting = setTimeout(
            open,
            WAIT_MS[Math.min(attempt++, WAIT_MS.length - 1)],
          );
        },
        onError: () => {
          if (closed) {
            return;
          }

          waiting = setTimeout(
            open,
            WAIT_MS[Math.min(attempt++, WAIT_MS.length - 1)],
          );
        },
        // the connection it was on went and it was opened on a new one, which
        // is the same gap in what was heard.
        onReopen: () => handlers.current.onResume(),
      }).then((stream) => {
        // the page may have been left while the socket was opening.
        if (closed) {
          stream.close();

          return;
        }

        close = () => stream.close();

        if (attempt > 0) {
          attempt = 0;
          handlers.current.onResume();
        }
      });
    };

    open();

    return () => {
      closed = true;
      clearTimeout(waiting);
      close?.();
    };
  }, [openStream, subject]);
}

/**
 * Asks for the page again, once, however many reasons to arrive at a time.
 *
 * A change to something a page is not showing is something that came or went,
 * which moves everything else on it: that is the page's own business rather
 * than a row's.
 */
export function useRefresh(refresh: () => void): () => void {
  const pending = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(
    () => () => {
      clearTimeout(pending.current);
    },
    [],
  );

  return useCallback(() => {
    if (pending.current !== undefined) {
      return;
    }

    pending.current = setTimeout(() => {
      pending.current = undefined;
      refresh();
    }, 300);
  }, [refresh]);
}
