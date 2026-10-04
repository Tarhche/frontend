"use client";

import {useEffect, useState, useTransition} from "react";
import {
  ActionIcon,
  ActionIconGroup,
  Button,
  Group,
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
import {type Transition} from "@/features/dashboard/workload/components/state-badge";
import {type Scope} from "../api";
import {commandVm, deleteVm} from "../actions/vm-commands";
import {vmKeys} from "../hooks/queries";
import {canRestart, canStart, canStop} from "../lib/state";
import {type ActionResult, type Vm, type VmCommand} from "../types";
import {ConfirmModal} from "./confirm-modal";

type Asked = VmCommand | "delete";

// what asking for each of these is, in the words of what it does to a VM.
const underway: Record<Asked, Transition> = {
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
  onPending?: (underway: Transition | undefined) => void;

  /** Called once it has been asked to go. */
  onDeleted?: () => void;

  /** Icons in a table row; buttons where there is room for words. */
  variant?: "icons" | "buttons";
};

/**
 * What can be asked of a VM: start, stop, restart, delete. Anything that
 * interrupts what is running in it is asked about first.
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

  useEffect(() => {
    onPending?.(pending && asked ? underway[asked] : undefined);
  }, [asked, pending, onPending]);

  const fail = (result: ActionResult) => {
    const said = result.ok ? [] : Object.values(result.errors ?? {});

    notifications.show({
      color: "red",
      title: t("errors.errorTitle"),
      message: said.length > 0 ? said.join(" ") : t("vms.actions.failed"),
    });
  };

  const ask = (what: Asked) => {
    setConfirming(null);
    setAsked(what);

    startTransition(async () => {
      let result: ActionResult;

      if (what === "delete") {
        result = remove ? await deleteVm(vm.uuid, remove) : {ok: false};
      } else {
        result = manage ? await commandVm(what, vm.uuid, manage) : {ok: false};
      }

      if (!result.ok) {
        fail(result);
      } else if (what === "delete") {
        onDeleted?.();
      }

      // read again now rather than at the next poll, so what the workload
      // says about it follows straight on from what was asked.
      await queryClient.invalidateQueries({queryKey: vmKeys.all});
    });
  };

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

  const shown = actions.filter((action) => action.allowed);
  if (shown.length === 0) {
    return null;
  }

  const request = (action: (typeof actions)[number]) =>
    action.confirm ? setConfirming(action.what) : ask(action.what);

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

      {shown
        .filter((action) => action.confirm)
        .map((action) => (
          <ConfirmModal
            key={action.what}
            opened={confirming === action.what}
            message={t(`vms.actions.${action.what}Confirm`, {name: vm.name})}
            confirmLabel={t(`vms.actions.${action.what}`)}
            color={action.color}
            onConfirm={() => ask(action.what)}
            onCancel={() => setConfirming(null)}
          />
        ))}
    </>
  );
}
