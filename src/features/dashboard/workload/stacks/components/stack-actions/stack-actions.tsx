"use client";

import {useState} from "react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {
  ActionIcon,
  ActionIconGroup,
  Checkbox,
  Text,
  Tooltip,
  rem,
} from "@mantine/core";
import {notifications} from "@mantine/notifications";
import {
  IconPlayerPlay,
  IconPlayerStop,
  IconRefresh,
  IconTrash,
} from "@tabler/icons-react";
import {useTranslations} from "@/i18n/provider";
import {ConfirmModal} from "@/features/dashboard/workload/docker/components/confirm-modal";
import {
  problemMessage,
  problemOf,
} from "@/features/dashboard/workload/docker/errors";
import {dockerKeys} from "@/features/dashboard/workload/docker/hooks/queries";
import {type Scope} from "@/features/dashboard/workload/docker/types";
import {commandStack, deleteStack} from "../../api";
import {isSettling, stackKeys} from "../../hooks/use-stacks";
import {type StackMay} from "../../permissions";
import {type Stack, type StackCommand} from "../../types";
import {type StackTransition} from "../stack-state-badge";

// what asking for each command is, in the words of what it does to a stack.
const underway: Record<StackCommand, StackTransition> = {
  start: "starting",
  stop: "stopping",
  restart: "restarting",
};

type Props = {
  scope: Scope;
  stack: Stack;
  may: StackMay;

  /** told what is on its way to the stack, until its VM has caught up. */
  onPending?: (transition: StackTransition | undefined) => void;

  /** told once the stack is on its way out. */
  onDeleted?: () => void;
};

/**
 * What can be asked of a stack: each command reaches every container in it.
 * There is no edit: a stack is its compose file, and a different file is a
 * different stack.
 *
 * Stopping, restarting and deleting are asked about first. Deleting takes the
 * stack's containers and networks down with it, and its volumes only when
 * that is asked for too, since what is in them is usually what somebody would
 * want back.
 */
export function StackActions({scope, stack, may, onPending, onDeleted}: Props) {
  const t = useTranslations();
  const queryClient = useQueryClient();

  const [confirming, setConfirming] = useState<
    "stop" | "restart" | "delete" | null
  >(null);
  const [withVolumes, setWithVolumes] = useState(false);

  // a stack's containers change with it, so both are asked for again.
  const settle = async () => {
    await Promise.all([
      queryClient.invalidateQueries({queryKey: stackKeys.root}),
      queryClient.invalidateQueries({queryKey: dockerKeys.root}),
    ]);
    onPending?.(undefined);
  };

  const command = useMutation({
    mutationFn: (which: StackCommand) => commandStack(scope, stack.uuid, which),
    onMutate: (which) => onPending?.(underway[which]),
    onSuccess: () => setConfirming(null),
    onError: (error, which) => {
      // the question stays open with the refusal in it; one asked without a
      // question is said here instead.
      if (which === "start") {
        notifications.show({
          color: "red",
          title: t("stacks.actions.failed", {name: stack.name}),
          message: problemMessage(problemOf(error), t),
        });
      }
    },
    onSettled: settle,
  });

  const remove = useMutation({
    mutationFn: (volumes: boolean) => deleteStack(scope, stack.uuid, volumes),
    onMutate: () => onPending?.("removing"),
    onSuccess: () => {
      setConfirming(null);
      onDeleted?.();
    },
    // said in the question that asked.
    onError: () => {},
    onSettled: settle,
  });

  const busy = command.isPending || remove.isPending;

  // while a compose command is running in the VM, another would only queue
  // up behind it; deleting is the exception, which takes it down whatever
  // it is doing.
  const settling = isSettling(stack);
  const running = stack.state === "running";

  const ask = (which: "stop" | "restart" | "delete") => {
    command.reset();
    remove.reset();
    setWithVolumes(false);
    setConfirming(which);
  };

  const confirm = () => {
    if (confirming === "delete") {
      remove.mutate(withVolumes);
    } else if (confirming) {
      command.mutate(confirming);
    }
  };

  const failed = confirming === "delete" ? remove.error : command.error;

  return (
    <>
      <ActionIconGroup>
        {may.manage && (
          <>
            {running ? (
              <Tooltip label={t("stacks.actions.stop")} withArrow>
                <ActionIcon
                  variant="light"
                  size="lg"
                  color="yellow"
                  disabled={busy || settling}
                  aria-label={t("stacks.actions.stop")}
                  onClick={() => ask("stop")}
                >
                  <IconPlayerStop style={{width: rem(20)}} stroke={1.5} />
                </ActionIcon>
              </Tooltip>
            ) : (
              <Tooltip label={t("stacks.actions.start")} withArrow>
                <ActionIcon
                  variant="light"
                  size="lg"
                  color="green"
                  disabled={busy || settling}
                  loading={command.isPending && command.variables === "start"}
                  aria-label={t("stacks.actions.start")}
                  onClick={() => command.mutate("start")}
                >
                  <IconPlayerPlay style={{width: rem(20)}} stroke={1.5} />
                </ActionIcon>
              </Tooltip>
            )}
            <Tooltip label={t("stacks.actions.restart")} withArrow>
              <ActionIcon
                variant="light"
                size="lg"
                color="blue"
                disabled={busy || settling}
                aria-label={t("stacks.actions.restart")}
                onClick={() => ask("restart")}
              >
                <IconRefresh style={{width: rem(20)}} stroke={1.5} />
              </ActionIcon>
            </Tooltip>
          </>
        )}
        {may.delete && (
          <Tooltip label={t("stacks.actions.delete")} withArrow>
            <ActionIcon
              variant="light"
              size="lg"
              color="red"
              disabled={busy || stack.state === "removing"}
              aria-label={t("stacks.actions.delete")}
              onClick={() => ask("delete")}
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
          confirming === "delete"
            ? t("stacks.actions.delete")
            : confirming === "restart"
              ? t("stacks.actions.restart")
              : t("stacks.actions.stop")
        }
      >
        {confirming === "stop" && (
          <Text>{t("stacks.actions.stopConfirm", {name: stack.name})}</Text>
        )}
        {confirming === "restart" && (
          <Text>{t("stacks.actions.restartConfirm", {name: stack.name})}</Text>
        )}
        {confirming === "delete" && (
          <>
            <Text>{t("stacks.actions.deleteConfirm", {name: stack.name})}</Text>
            <Checkbox
              label={t("stacks.actions.removeVolumes")}
              description={t("stacks.actions.removeVolumesHelp")}
              checked={withVolumes}
              onChange={(event) => setWithVolumes(event.currentTarget.checked)}
              disabled={busy}
            />
          </>
        )}
      </ConfirmModal>
    </>
  );
}
