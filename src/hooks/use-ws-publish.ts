"use client";

import { useCallback } from "react";
import { getWebSocketBus } from "@/lib/ws/websocket-bus";

/**
 * Returns a stable `publish` function.
 * Call it to send a request over the shared WebSocket and await the
 * correlated response (matched by UUID).
 *
 * @example
 * const publish = useWsPublish();
 * const result = await publish<RunCodeReq, RunCodeRes>("runCode", { runner, code });
 */
export function useWsPublish() {
  return useCallback(
    <TReq = unknown, TRes = unknown>(
      subject: string,
      data: TReq,
    ): Promise<TRes> => getWebSocketBus().publish<TReq, TRes>(subject, data),
    [],
  );
}
