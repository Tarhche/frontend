"use client";

import {useQuery} from "@tanstack/react-query";
import {retryTransient} from "@/features/dashboard/workload/docker/errors";
import {type Scope} from "@/features/dashboard/workload/docker/types";
import {fetchStack, fetchStacks} from "../api";
import {type Stack} from "../types";

export const stackKeys = {
  root: ["workload", "stacks"] as const,
  list: (scope: Scope, page: number) =>
    ["workload", "stacks", scope, "list", page] as const,
  one: (scope: Scope, uuid: string) =>
    ["workload", "stacks", scope, "one", uuid] as const,
  links: (scope: Scope) => ["workload", "stacks", scope, "links"] as const,
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
export function isSettling(stack: Pick<Stack, "state">): boolean {
  return UNDER_WAY.includes(stack.state);
}

// a stack whose command is running is looked at every few seconds, until it
// is done; the rest now and then, since their containers come and go.
function every(settling: boolean) {
  return settling ? 3_000 : 15_000;
}

/** A page of a scope's stacks. */
export function useStacks(scope: Scope, page: number) {
  return useQuery({
    queryKey: stackKeys.list(scope, page),
    queryFn: () => fetchStacks(scope, {page}),
    staleTime: 2_000,
    retry: retryTransient,
    refetchInterval: (query) =>
      query.state.status === "error"
        ? false
        : every(query.state.data?.items.some(isSettling) ?? false),
  });
}

/** A stack, with its containers. */
export function useStack(scope: Scope, uuid: string) {
  return useQuery({
    queryKey: stackKeys.one(scope, uuid),
    queryFn: () => fetchStack(scope, uuid),
    staleTime: 2_000,
    retry: retryTransient,
    refetchInterval: (query) =>
      query.state.status === "error"
        ? false
        : every(query.state.data ? isSettling(query.state.data) : false),
  });
}

// a person has a handful of stacks; past this many pages a link is not worth
// what it takes to find.
const MAX_LINK_PAGES = 5;

/** Where a stack is found from what its containers say: its VM and slug. */
export function stackLinkKey(vmUuid: string, slug: string): string {
  return `${vmUuid}/${slug}`;
}

/**
 * Which stack a container belongs to. A container says only the compose
 * project it was deployed as, which is its stack's slug inside its VM, so the
 * stacks are read once to tell which uuid that is.
 */
export function useStackLinks(scope: Scope, enabled: boolean) {
  return useQuery({
    queryKey: stackKeys.links(scope),
    queryFn: async () => {
      const links: Record<string, string> = {};

      for (let page = 1; page <= MAX_LINK_PAGES; page++) {
        const {items, pagination} = await fetchStacks(scope, {page});
        for (const stack of items) {
          links[stackLinkKey(stack.vm_uuid, stack.slug)] = stack.uuid;
        }

        if (page >= (pagination?.total_pages ?? 1)) {
          break;
        }
      }

      return links;
    },
    enabled,
    staleTime: 60_000,
    retry: retryTransient,
  });
}
