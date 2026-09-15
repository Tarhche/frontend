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
import {TaskActions} from "./task-actions";
import {TaskEndpoints, type Endpoint} from "./task-endpoints";
import {watchTasksSubject} from "./subjects";

export type Task = {
  uuid: string;
  name: string;
  slug: string;
  state: string;

  // what it was asked to be, and what the runner has tried so far to make it
  // that: a task that failed is still on its way back until the attempts it is
  // worth run out.
  expected_state?: string;
  retries?: number;
  max_retries?: number;
  image: string;
  endpoints: Endpoint[];
  created_at: string;

  /** when a task that may only run for so long will be stopped. */
  deadline?: string;
  owner?: Partial<Author>;
};

/**
 * What became of one task: what changed about it, or that it is gone.
 *
 * A change carries as much of the task as the runner reports about it -- its
 * state, where it is reachable, how long it has left -- rather than the whole
 * of one: the rest is what the listing already said, so what arrives is merged
 * onto the row rather than put in its place.
 */
type Change =
  | {kind: "changed"; uuid: string; task: Partial<Task>}
  | {kind: "deleted"; uuid: string};

export type Permissions = {
  // whether this listing is of one's own, which is what the actions on a row
  // ask for and what the permissions below were read for.
  own: boolean;
  manage: boolean;
  delete: boolean;
};

type Props = {
  tasks: Task[];
  may: Permissions;

  /** who is looking, so that "their own" means anything. */

  /** whether whose it is is worth a column of its own. */
  showOwner?: boolean;
};

/**
 * The rows of the tasks table, kept as they are.
 *
 * The page renders the tasks as they were; from then on the runner says what
 * becomes of each one over the websocket the page already has, so a task that
 * starts, stops or is removed shows that here without anybody asking for the
 * page again.
 */
export function TaskRows({tasks: listed, may, showOwner = true}: Props) {
  const {t, locale} = useI18n();
  const router = useRouter();

  const [tasks, setTasks] = useState(listed);

  // what somebody has just asked of a task. The runner takes a moment to
  // agree — and a delete takes longer, since the task is stopped before it is
  // taken away — so until it does, this is what the row says is happening.
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

  // the page is what says which tasks belong on it, so a fresh render of it
  // replaces what the watch has been keeping.
  useEffect(() => {
    setTasks(listed);
  }, [listed]);

  // what is on the page right now, for deciding whether a change belongs to it
  // without making the watch depend on the rows it is updating.
  const shown = useRef(tasks);
  useEffect(() => {
    shown.current = tasks;
  }, [tasks]);

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

      const isShown = shown.current.some((one) => one.uuid === change.uuid);

      if (!isShown) {
        if (change.kind === "changed") refresh();

        return;
      }

      if (change.kind === "deleted") {
        setTasks((current) =>
          current.filter((one) => one.uuid !== change.uuid),
        );
        refresh();

        return;
      }

      setTasks((current) =>
        current.map((one) =>
          one.uuid === change.uuid ? {...one, ...change.task} : one,
        ),
      );
    },
    [refresh],
  );

  useWatch({
    subject: watchTasksSubject(may.own),
    onChange: apply,
    onResume: refresh,
  });

  return (
    <TableTbody>
      {tasks.length === 0 && (
        <TableTr>
          <TableTd colSpan={showOwner ? 7 : 6} ta="center">
            {t("tasks.table.empty")}
          </TableTd>
        </TableTr>
      )}
      {tasks.map((task) => (
        <TableTr key={task.uuid}>
          <TableTd>
            <Link href={APP_PATHS.dashboard.tasks.detail(task.uuid)}>
              {task.name}
            </Link>
          </TableTd>
          <TableTd>{task.image}</TableTd>
          <TableTd>
            <StateBadge
              state={task.state}
              expectedState={task.expected_state}
              retries={task.retries}
              maxRetries={task.max_retries}
              pending={asked[task.uuid]}
              deadline={task.deadline}
            />
          </TableTd>
          <TableTd>
            <TaskEndpoints
              endpoints={task.endpoints ?? []}
              empty={t("tasks.table.noEndpoints")}
            />
          </TableTd>
          {showOwner && (
            <TableTd>
              <OwnerInline owner={task.owner} size={28} />
            </TableTd>
          )}
          <TableTd>{formatDate(task.created_at, locale)}</TableTd>
          <TableTd>
            <TaskActions
              uuid={task.uuid}
              name={task.name}
              state={task.state}
              onCommand={(underway) => markAsked(task.uuid, underway)}
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
