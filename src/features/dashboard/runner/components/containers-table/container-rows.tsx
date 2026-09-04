"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import {useRouter} from "next/navigation";
import {decode} from "js-base64";
import JsCookie from "js-cookie";
import {TableTbody, TableTd, TableTr} from "@mantine/core";
import Link from "@/components/link";
import {ACCESS_TOKEN_COOKIE_NAME} from "@/constants";
import {useI18n} from "@/i18n/provider";
import {useWsStream} from "@/hooks/use-ws-stream";
import {APP_PATHS} from "@/lib/app-paths";
import {formatDate} from "@/lib/date-and-time";
import {type Author} from "@/features/authors/types";
import {OwnerInline} from "../owner-inline";
import {StateBadge, type Transition} from "../state-badge";
import {ContainerActions} from "./container-actions";
import {ContainerEndpoints, type Endpoint} from "./container-endpoints";
import {WATCH_CONTAINERS_SUBJECT} from "./subjects";

export type Container = {
  uuid: string;
  name: string;
  slug: string;
  state: string;

  // what it was asked to be, and what the runner has tried so far to make it
  // that: a container that failed is still on its way back until the attempts
  // it is worth run out.
  expected_state?: string;
  retries?: number;
  max_retries?: number;
  image: string;
  endpoints: Endpoint[];
  created_at: string;
  owner?: Partial<Author>;
};

/** What became of one container: what it is now, or that it is gone. */
type Change =
  | {kind: "changed"; uuid: string; container: Container}
  | {kind: "deleted"; uuid: string};

export type Permissions = {
  manageAll: boolean;
  manageOwn: boolean;
  deleteAll: boolean;
  deleteOwn: boolean;
};

type Props = {
  containers: Container[];
  may: Permissions;

  /** who is looking, so that "their own" means anything. */
  viewerUuid: string;

  /** whether whose it is is worth a column of its own. */
  showOwner?: boolean;
};

/**
 * The rows of the containers table, kept as they are.
 *
 * The page renders the containers as they were; from then on the runner says
 * what becomes of each one over the websocket the page already has, so a
 * container that starts, stops or is removed shows that here without anybody
 * asking for the page again.
 */
export function ContainerRows({
  containers: listed,
  may,
  viewerUuid,
  showOwner = true,
}: Props) {
  const {t, locale} = useI18n();
  const openStream = useWsStream();
  const router = useRouter();

  const [containers, setContainers] = useState(listed);

  // what somebody has just asked of a container. The runner takes a moment to
  // agree — and a delete takes longer, since the container is stopped before it
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

  // the page is what says which containers belong on it, so a fresh render of
  // it replaces what the watch has been keeping.
  useEffect(() => {
    setContainers(listed);
  }, [listed]);

  // what is on the page right now, for deciding whether a change belongs to it
  // without making the watch depend on the rows it is updating.
  const shown = useRef(containers);
  useEffect(() => {
    shown.current = containers;
  }, [containers]);

  // a change to a container this page is not showing is a container that came
  // or went, which moves the rest: that is the page's own business, and it is
  // asked for once however many such changes arrive at a time.
  const pendingRefresh = useRef<ReturnType<typeof setTimeout>>(undefined);
  const refresh = useCallback(() => {
    if (pendingRefresh.current !== undefined) return;

    pendingRefresh.current = setTimeout(() => {
      pendingRefresh.current = undefined;
      router.refresh();
    }, 300);
  }, [router]);

  useEffect(() => {
    const token = JsCookie.get(ACCESS_TOKEN_COOKIE_NAME);
    if (!token) return;

    let closed = false;
    let close: (() => void) | undefined;

    const apply = (payload: string | null) => {
      if (!payload) return;

      let change: Change;
      try {
        change = JSON.parse(decode(payload)) as Change;
      } catch {
        // a change that will not parse is one update lost, not a reason to
        // drop the watch carrying the rest.
        return;
      }

      const isShown = shown.current.some((c) => c.uuid === change.uuid);

      if (!isShown) {
        if (change.kind === "changed") refresh();

        return;
      }

      if (change.kind === "deleted") {
        setContainers((current) =>
          current.filter((c) => c.uuid !== change.uuid),
        );
        refresh();

        return;
      }

      setContainers((current) =>
        current.map((c) => (c.uuid === change.uuid ? change.container : c)),
      );
    };

    openStream(
      WATCH_CONTAINERS_SUBJECT,
      {access_token: token},
      {
        onChunk: apply,
        // whatever changed while there was no connection was missed, so the
        // page is asked for as it is now.
        onReopen: refresh,
      },
    ).then((stream) => {
      // the page may have been left while the socket was opening.
      if (closed) {
        stream.close();

        return;
      }

      close = () => stream.close();
    });

    return () => {
      closed = true;
      close?.();
    };
  }, [openStream, refresh]);

  useEffect(
    () => () => {
      clearTimeout(pendingRefresh.current);
    },
    [],
  );

  // one of these is somebody's own when the owner is who is looking. A
  // container nobody owns is nobody's own.
  const isMine = (container: {owner?: Partial<Author>}) =>
    Boolean(viewerUuid) && container.owner?.uuid === viewerUuid;

  return (
    <TableTbody>
      {containers.length === 0 && (
        <TableTr>
          <TableTd colSpan={showOwner ? 7 : 6} ta="center">
            {t("containers.table.empty")}
          </TableTd>
        </TableTr>
      )}
      {containers.map((container) => (
        <TableTr key={container.uuid}>
          <TableTd>
            <Link href={APP_PATHS.dashboard.containers.detail(container.uuid)}>
              {container.name}
            </Link>
          </TableTd>
          <TableTd>{container.image}</TableTd>
          <TableTd>
            <StateBadge
              state={container.state}
              expectedState={container.expected_state}
              retries={container.retries}
              maxRetries={container.max_retries}
              pending={asked[container.uuid]}
            />
          </TableTd>
          <TableTd>
            <ContainerEndpoints
              endpoints={container.endpoints ?? []}
              empty={t("containers.table.noEndpoints")}
            />
          </TableTd>
          {showOwner && (
            <TableTd>
              <OwnerInline owner={container.owner} size={28} />
            </TableTd>
          )}
          <TableTd>{formatDate(container.created_at, locale)}</TableTd>
          <TableTd>
            <ContainerActions
              uuid={container.uuid}
              name={container.name}
              state={container.state}
              onCommand={(underway) => markAsked(container.uuid, underway)}
              canManage={may.manageAll || (may.manageOwn && isMine(container))}
              canDelete={may.deleteAll || (may.deleteOwn && isMine(container))}
            />
          </TableTd>
        </TableTr>
      ))}
    </TableTbody>
  );
}
