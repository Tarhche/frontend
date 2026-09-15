import {PUBLIC_RUNNER_INGRESS_URL} from "@/constants";

/**
 * The subprotocol a token is offered alongside.
 *
 * A websocket opened from a browser cannot carry an Authorization header --
 * the constructor takes a url and a list of subprotocols and nothing else --
 * so the token is offered as one of those. It travels in a header either way,
 * which keeps it out of the url, and so out of every access log on the way.
 */
export const BEARER_PROTOCOL = "bearer";

/**
 * Where a terminal on a task is opened.
 *
 * It is the runner's ingress rather than the blog: the ingress is what knows
 * which node is holding the task, and the node is what decides who may be let
 * in. Nothing is returned when no ingress is configured, which is what a
 * deployment without the runner looks like.
 */
export function attachURL(taskUuid: string): string | undefined {
  const base = PUBLIC_RUNNER_INGRESS_URL;
  if (!base) return undefined;

  const scheme = base.startsWith("https:") ? "wss" : "ws";
  const host = base.replace(/^https?:\/\//, "").replace(/\/+$/, "");

  return `${scheme}://${host}/tasks/${encodeURIComponent(taskUuid)}/attach`;
}
