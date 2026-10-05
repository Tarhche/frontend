"use client";

import {useEffect, useState, useTransition} from "react";
import {
  ActionIcon,
  ActionIconGroup,
  Button,
  Group,
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
import {useQueryClient} from "@tanstack/react-query";
import {useTranslations} from "@/i18n/provider";
import {ConfirmModal} from "@/features/dashboard/workload/components/confirm-modal";
import {
  problemMessage,
  type Problem,
} from "@/features/dashboard/workload/lib/problem";
import {type VmTransition} from "./vm-state-badge";
import {type Scope} from "../api";
import {commandVm, deleteVm} from "../actions/vm-commands";
import {vmKeys} from "../hooks/queries";
import {canRestart, canStart, canStop} from "../lib/state";
import {type ActionResult, type Vm, type VmCommand} from "../types";

type Asked = VmCommand | "delete";

// what asking for each of these is, in the words of what it does to a VM.
const underway: Record<Asked, VmTransition> = {
  start: "starting",
  stop: "stopping",
  restart: "restarting",
  delete: "deleting",
};

type Props = {
  vm: Pick<Vm, "uuid" | "name" | "state">;

  /** The routes it is managed and deleted through; null where it may not be. */
  manage: Scope | null;
  remove: Scope | null;

  /**
   * Told what is on its way to the VM while it is being asked for, so that
   * its state can say so before the workload does.
   */
  onPending?: (underway: VmTransition | undefined) => void;

  /** Called once it has been asked to go. */
  onDeleted?: () => void;

  /** Icons in a table row; buttons where there is room for words. */
  variant?: "icons" | "buttons";
};

/**
 * What can be asked of a VM: start, stop, restart, delete. Starting one is
 * harmless and happens at once; anything that interrupts what is running in it
 * is asked about first, and the question stays open until the answer comes, so
 * a refusal is said where it was asked.
 */
export function VmActions({
  vm,
  manage,
  remove,
  onPending,
  onDeleted,
  variant = "icons",
}: Props) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [pending, startTransition] = useTransition();
  const [asked, setAsked] = useState<Asked | null>(null);
  const [confirming, setConfirming] = useState<Asked | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);

  useEffect(() => {
    onPending?.(pending && asked ? underway[asked] : undefined);
  }, [asked, pending, onPending]);

  const actions: Array<{
    what: Asked;
    allowed: boolean;
    enabled: boolean;
    color: string;
    icon: typeof IconPlayerPlay;
    confirm: boolean;
  }> = [
    {
      what: "start",
      allowed: manage !== null,
      enabled: canStart(vm.state),
      color: "green",
      icon: IconPlayerPlay,
      confirm: false,
    },
    {
      what: "stop",
      allowed: manage !== null,
      enabled: canStop(vm.state),
      color: "yellow",
      icon: IconPlayerStop,
      confirm: true,
    },
    {
      what: "restart",
      allowed: manage !== null,
      enabled: canRestart(vm.state),
      color: "blue",
      icon: IconRefresh,
      confirm: true,
    },
    {
      what: "delete",
      allowed: remove !== null,
      enabled: vm.state !== "deleting",
      color: "red",
      icon: IconTrash,
      confirm: true,
    },
  ];

  const ask = (what: Asked, confirmed: boolean) => {
    setAsked(what);
    setProblem(null);

    startTransition(async () => {
      let result: ActionResult;

      if (what === "delete") {
        if (!remove) {
          return;
        }

        result = await deleteVm(vm.uuid, remove);
      } else {
        if (!manage) {
          return;
        }

        result = await commandVm(what, vm.uuid, manage);
      }

      if (result.ok) {
        setConfirming(null);
        if (what === "delete") {
          onDeleted?.();
        }
      } else if (confirmed) {
        // the question is still open, and says why.
        setProblem(result.problem);
      } else {
        notifications.show({
          color: "red",
          title: t("workload.errors.startFailed", {name: vm.name}),
          message: problemMessage(result.problem, t),
        });
      }

      // read again now rather than at the next poll, so what the workload
      // says about it follows straight on from what was asked.
      await queryClient.invalidateQueries({queryKey: vmKeys.all});
    });
  };

  const shown = actions.filter((action) => action.allowed);
  if (shown.length === 0) {
    return null;
  }

  const request = (action: (typeof actions)[number]) => {
    if (action.confirm) {
      setProblem(null);
      setConfirming(action.what);
    } else {
      ask(action.what, false);
    }
  };

  return (
    <>
      {variant === "icons" ? (
        <ActionIconGroup>
          {shown.map((action) => (
            <Tooltip
              key={action.what}
              label={t(`vms.actions.${action.what}`)}
              withArrow
            >
              <ActionIcon
                variant="light"
                size="lg"
                color={action.color}
                disabled={!action.enabled || pending}
                loading={!action.confirm && pending && asked === action.what}
                aria-label={t(`vms.actions.${action.what}`)}
                onClick={() => request(action)}
              >
                <action.icon style={{width: rem(20)}} stroke={1.5} />
              </ActionIcon>
            </Tooltip>
          ))}
        </ActionIconGroup>
      ) : (
        <Group gap="xs">
          {shown.map((action) => (
            <Button
              key={action.what}
              variant="light"
              color={action.color}
              disabled={!action.enabled || (pending && asked !== action.what)}
              loading={pending && asked === action.what}
              leftSection={<action.icon size={18} stroke={1.5} />}
              onClick={() => request(action)}
            >
              {t(`vms.actions.${action.what}`)}
            </Button>
          ))}
        </Group>
      )}

      {/* each question is a modal of its own, so one closing keeps what it
          asked while it fades away. */}
      {shown
        .filter((action) => action.confirm)
        .map((action) => (
          <ConfirmModal
            key={action.what}
            opened={confirming === action.what}
            onClose={() => setConfirming(null)}
            onConfirm={() => ask(action.what, true)}
            loading={pending && asked === action.what}
            problem={confirming === action.what ? problem : null}
            confirmLabel={t(`vms.actions.${action.what}`)}
            confirmColor={action.color}
          >
            <Text>
              {t(`vms.actions.${action.what}Confirm`, {name: vm.name})}
            </Text>
          </ConfirmModal>
        ))}
    </>
  );
}
