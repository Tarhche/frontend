"use client";

import { useEffect } from "react";
import { getWebSocketBus } from "@/lib/ws/websocket-bus";

/**
 * Subscribe to server-pushed messages on `subject`.
 * The handler receives the already-decoded payload.
 * The subscription is torn down automatically on unmount.
 *
 * Pass a stable handler (via useCallback) to avoid re-subscribing on every render.
 *
 * @example
 * useWsTopic<NotifyPayload>("notifications", useCallback((data) => {
 *   console.log("got notification", data);
 * }, []));
 */
export function useWsTopic<T = unknown>(
  subject: string,
  handler: (data: T) => void,
) {
  useEffect(() => {
    return getWebSocketBus().subscribe<T>(subject, handler);
    // handler must be stable — wrap in useCallback at the call site
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject]);
}
