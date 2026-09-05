"use client";

import {useCallback} from "react";
import {getWebSocketBus, type StreamHandlers} from "@/lib/ws/websocket-bus";

/**
 * Returns a stable `openStream` function.
 *
 * Call it to ask something whose answer arrives in pieces — a container's log
 * as it is written, a terminal's output — over the WebSocket the page already
 * has. The handle it returns carries input back to that same stream, and
 * closing it ends the stream at both ends.
 *
 * @example
 * const openStream = useWsStream();
 * const stream = await openStream("runnerContainerLogs", {container_uuid, access_token}, {
 *   onChunk: (payload) => append(payload),
 * });
 */
export function useWsStream() {
  return useCallback(
    <TReq = unknown>(subject: string, data: TReq, handlers: StreamHandlers) =>
      getWebSocketBus().openStream<TReq>(subject, data, handlers),
    [],
  );
}
