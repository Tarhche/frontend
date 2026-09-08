"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import {useRouter} from "next/navigation";
import {decode} from "js-base64";
import {TableTbody, TableTd, TableTr} from "@mantine/core";
import Link from "@/components/link";
import {useI18n} from "@/i18n/provider";
import {useRefresh, useWatch} from "../../hooks/use-watch";
import {APP_PATHS} from "@/lib/app-paths";
import {formatDate} from "@/lib/date-and-time";
import {type Author} from "@/features/authors/types";
import {OwnerInline} from "../owner-inline";
import {StateBadge, type Transition} from "../state-badge";
import {StackActions} from "./stack-actions";
import {WATCH_STACKS_SUBJECT} from "./subjects";

export type Stack = {
  uuid: string;
  name: string;
  slug: string;
  state: string;

  // what it was asked to be, which is what it is on its way to while a command
  // is still reaching its services.
  expected_state?: string;
  services: unknown[];
  created_at: string;
  owner?: Partial<Author>;
};

/** What became of one stack: what it is now, or that it is gone. */
type Change =
  | {kind: "changed"; uuid: string; stack: Stack}
  | {kind: "deleted"; uuid: string};

export type Permissions = {
  // whether this listing is of one's own, which is what the actions on a row
  // ask for and what the permissions below were read for.
  own: boolean;
  manage: boolean;
  delete: boolean;
};

type Props = {
  stacks: Stack[];
  may: Permissions;

  /** who is looking, so that "their own" means anything. */
};

/**
 * The rows of the stacks table, kept as they are.
 *
 * A stack's state is read off its services, so it changes whenever one of them
 * does: the runner says so over the websocket the page already has, and the row
 * follows without anybody asking for the page again.
 */
export function StackRows({stacks: listed, may}: Props) {
  const {t, locale} = useI18n();
  const router = useRouter();

  const [stacks, setStacks] = useState(listed);

  // what somebody has just asked of a stack. The runner takes a moment to
  // agree — and a delete takes longer, since every service in it is stopped before it
  // is taken away — so until it does, this is what the row says is happening.
  const [asked, setAsked] = useState<Record<string, Transition>>({});
  const markAsked = useCallback(
    (uuid: string, underway: Transition | undefined) => {
      setAsked((current) => {
        if (current[uuid] === underway) {
          return current;
        }

        const next = {...current};
        if (underway) {
          next[uuid] = underway;
        } else {
          delete next[uuid];
        }

        return next;
      });
    },
    [],
  );

  // the page is what says which stacks belong on it, so a fresh render of it
  // replaces what the watch has been keeping.
  useEffect(() => {
    setStacks(listed);
  }, [listed]);

  // what is on the page right now, for deciding whether a change belongs to it
  // without making the watch depend on the rows it is updating.
  const shown = useRef(stacks);
  useEffect(() => {
    shown.current = stacks;
  }, [stacks]);

  const refresh = useRefresh(useCallback(() => router.refresh(), [router]));

  const apply = useCallback(
    (payload: string | null) => {
      if (!payload) return;

      let change: Change;
      try {
        change = JSON.parse(decode(payload)) as Change;
      } catch {
        // a change that will not parse is one update lost, not a reason to
        // drop the watch carrying the rest.
        return;
      }

      const isShown = shown.current.some((s) => s.uuid === change.uuid);

      if (!isShown) {
        if (change.kind === "changed") refresh();

        return;
      }

      if (change.kind === "deleted") {
        setStacks((current) => current.filter((s) => s.uuid !== change.uuid));
        refresh();

        return;
      }

      setStacks((current) =>
        current.map((s) => (s.uuid === change.uuid ? change.stack : s)),
      );
    },
    [refresh],
  );

  useWatch({
    subject: WATCH_STACKS_SUBJECT,
    onChange: apply,
    onResume: refresh,
  });

  return (
    <TableTbody>
      {stacks.length === 0 && (
        <TableTr>
          <TableTd colSpan={6} ta="center">
            {t("stacks.table.empty")}
          </TableTd>
        </TableTr>
      )}
      {stacks.map((stack) => (
        <TableTr key={stack.uuid}>
          <TableTd>
            <Link href={APP_PATHS.dashboard.stacks.detail(stack.uuid)}>
              {stack.name}
            </Link>
          </TableTd>
          <TableTd>
            <StateBadge
              state={stack.state}
              expectedState={stack.expected_state}
              pending={asked[stack.uuid]}
            />
          </TableTd>
          <TableTd>{stack.services?.length ?? 0}</TableTd>
          <TableTd>
            <OwnerInline owner={stack.owner} size={28} />
          </TableTd>
          <TableTd>{formatDate(stack.created_at, locale)}</TableTd>
          <TableTd>
            <StackActions
              uuid={stack.uuid}
              name={stack.name}
              onCommand={(underway) => markAsked(stack.uuid, underway)}
              state={stack.state}
              canManage={may.manage}
              canDelete={may.delete}
              own={may.own}
            />
          </TableTd>
        </TableTr>
      ))}
    </TableTbody>
  );
}
