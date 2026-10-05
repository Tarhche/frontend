"use client";

import {useState} from "react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {ActionIcon, ActionIconGroup, Text, Tooltip, rem} from "@mantine/core";
import {notifications} from "@mantine/notifications";
import {
  IconPlayerPlay,
  IconPlayerStop,
  IconRefresh,
  IconTrash,
} from "@tabler/icons-react";
import {useTranslations} from "@/i18n/provider";
import {type Scope} from "@/features/dashboard/workload/vms/api";
import {commandContainer, removeContainer} from "../../api";
import {problemMessage, problemOf} from "../../errors";
import {dockerKeys} from "../../hooks/queries";
import {type Container, type ContainerCommand} from "../../types";
import {ConfirmModal} from "../confirm-modal";
import {type ContainerTransition} from "../container-state-badge";

// what asking for each command is, in the words of what it does to one.
const underway: Record<ContainerCommand, ContainerTransition> = {
  start: "starting",
  stop: "stopping",
  restart: "restarting",
};

/** Whether docker would call a container running, for what may be asked of it. */
export function isUp(container: Pick<Container, "state">): boolean {
  return (
    container.state === "running" ||
    container.state === "restarting" ||
    container.state === "paused"
  );
}

/** A container's name without the slash docker keeps in front of it. */
export function containerName(container: Pick<Container, "name" | "id">) {
  return container.name.replace(/^\//, "") || container.id.slice(0, 12);
}

type Props = {
  scope: Scope;
  vmUuid: string;
  container: Container;
  may: {manage: boolean; delete: boolean};

  /** told what is on its way to the container, until docker has caught up. */
  onPending?: (transition: ContainerTransition | undefined) => void;

  /** told once the container is gone. */
  onRemoved?: () => void;
};

/**
 * What can be asked of a container. Starting one is harmless and happens at
 * once; stopping, restarting and removing interrupt whatever it is doing, so
 * they are asked about first. A running container is only removed by force,
 * which the question says before anybody agrees to it.
 */
export function ContainerActions({
  scope,
  vmUuid,
  container,
  may,
  onPending,
  onRemoved,
}: Props) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState<
    "stop" | "restart" | "remove" | null
  >(null);

  const name = containerName(container);
  const up = isUp(container);

  // what is shown stays what was asked for until the listing that follows has
  // come back, so the badge does not flick back to what it was in between.
  const settle = async () => {
    await queryClient.invalidateQueries({queryKey: dockerKeys.root});
    onPending?.(undefined);
  };

  const command = useMutation({
    mutationFn: (which: ContainerCommand) =>
      commandContainer(scope, vmUuid, container.id, which),
    onMutate: (which) => onPending?.(underway[which]),
    onSuccess: () => setConfirming(null),
    onError: (error, which) => {
      // the question stays open with the refusal in it; one asked without a
      // question is said here instead.
      if (which === "start") {
        notifications.show({
          color: "red",
          title: t("containers.actions.failed", {name}),
          message: problemMessage(problemOf(error), t),
        });
      }
    },
    onSettled: settle,
  });

  const remove = useMutation({
    mutationFn: () => removeContainer(scope, vmUuid, container.id, up),
    onMutate: () => onPending?.("removing"),
    onSuccess: () => {
      setConfirming(null);
      onRemoved?.();
    },
    // the question is still open, and says why: the app's notice would only
    // say it again somewhere else.
    onError: () => {},
    onSettled: settle,
  });

  const busy = command.isPending || remove.isPending;

  const ask = (which: "stop" | "restart" | "remove") => {
    command.reset();
    remove.reset();
    setConfirming(which);
  };

  const confirm = () => {
    if (confirming === "remove") {
      remove.mutate();
    } else if (confirming) {
      command.mutate(confirming);
    }
  };

  const failed = confirming === "remove" ? remove.error : command.error;

  return (
    <>
      <ActionIconGroup>
        {may.manage && (
          <>
            {up ? (
              <Tooltip label={t("containers.actions.stop")} withArrow>
                <ActionIcon
                  variant="light"
                  size="lg"
                  color="yellow"
                  disabled={busy}
                  aria-label={t("containers.actions.stop")}
                  onClick={() => ask("stop")}
                >
                  <IconPlayerStop style={{width: rem(20)}} stroke={1.5} />
                </ActionIcon>
              </Tooltip>
            ) : (
              <Tooltip label={t("containers.actions.start")} withArrow>
                <ActionIcon
                  variant="light"
                  size="lg"
                  color="green"
                  disabled={busy}
                  loading={command.isPending && command.variables === "start"}
                  aria-label={t("containers.actions.start")}
                  onClick={() => command.mutate("start")}
                >
                  <IconPlayerPlay style={{width: rem(20)}} stroke={1.5} />
                </ActionIcon>
              </Tooltip>
            )}
            <Tooltip label={t("containers.actions.restart")} withArrow>
              <ActionIcon
                variant="light"
                size="lg"
                color="blue"
                disabled={busy}
                aria-label={t("containers.actions.restart")}
                onClick={() => ask("restart")}
              >
                <IconRefresh style={{width: rem(20)}} stroke={1.5} />
              </ActionIcon>
            </Tooltip>
          </>
        )}
        {may.delete && (
          <Tooltip label={t("containers.actions.remove")} withArrow>
            <ActionIcon
              variant="light"
              size="lg"
              color="red"
              disabled={busy}
              aria-label={t("containers.actions.remove")}
              onClick={() => ask("remove")}
            >
              <IconTrash style={{width: rem(20)}} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
        )}
      </ActionIconGroup>

      <ConfirmModal
        opened={confirming !== null}
        onClose={() => setConfirming(null)}
        onConfirm={confirm}
        loading={busy}
        problem={failed ? problemOf(failed) : null}
        confirmColor={confirming === "restart" ? "blue" : "red"}
        confirmLabel={
          confirming === "remove"
            ? t("containers.actions.remove")
            : confirming === "restart"
              ? t("containers.actions.restart")
              : t("containers.actions.stop")
        }
      >
        {confirming === "stop" && (
          <Text>{t("containers.actions.stopConfirm", {name})}</Text>
        )}
        {confirming === "restart" && (
          <Text>{t("containers.actions.restartConfirm", {name})}</Text>
        )}
        {confirming === "remove" && (
          <>
            <Text>{t("containers.actions.removeConfirm", {name})}</Text>
            {up && (
              <Text c="red" size="sm">
                {t("containers.actions.removeRunning")}
              </Text>
            )}
            {container.stack && (
              <Text c="dimmed" size="sm">
                {t("containers.actions.removeFromStack", {
                  stack: container.stack,
                })}
              </Text>
            )}
          </>
        )}
      </ConfirmModal>
    </>
  );
}
