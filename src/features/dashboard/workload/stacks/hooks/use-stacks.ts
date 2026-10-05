"use client";

import {useQuery} from "@tanstack/react-query";
import {type Scope} from "@/features/dashboard/workload/vms/api";
import {
  IDLE_POLL_MS,
  LIVE,
} from "@/features/dashboard/workload/vms/hooks/queries";
import {fetchStack, fetchStacks} from "../api";
import {type Stack} from "../types";

export const stackKeys = {
  root: ["workload", "stacks"] as const,
  list: (scope: Scope, page: number) =>
    ["workload", "stacks", scope, "list", page] as const,
  one: (scope: Scope, uuid: string) =>
    ["workload", "stacks", scope, "one", uuid] as const,
};

// what a compose command is in the middle of, and so what is worth watching.
const UNDER_WAY = [
  "deploying",
  "starting",
  "stopping",
  "restarting",
  "removing",
];

/**
 * Whether a stack is on its way somewhere: a compose command is running in
 * its VM, and its state changes when that command is done.
 */
export function isInFlight(stack: Pick<Stack, "state">): boolean {
  return UNDER_WAY.includes(stack.state);
}

// a stack whose command is running is looked at every few seconds, until it
// is done; the rest now and then, since their containers come and go.
function every(inFlight: boolean) {
  return inFlight ? 3_000 : IDLE_POLL_MS / 2;
}

/** A page of a scope's stacks. */
export function useStacks(scope: Scope, page: number) {
  return useQuery({
    ...LIVE,
    queryKey: stackKeys.list(scope, page),
    queryFn: () => fetchStacks(scope, {page}),
    refetchInterval: (query) =>
      every(query.state.data?.items.some(isInFlight) ?? false),
  });
}

/** A stack, with its containers. */
export function useStack(scope: Scope, uuid: string) {
  return useQuery({
    ...LIVE,
    queryKey: stackKeys.one(scope, uuid),
    queryFn: () => fetchStack(scope, uuid),
    refetchInterval: (query) =>
      every(query.state.data ? isInFlight(query.state.data) : false),
  });
}
