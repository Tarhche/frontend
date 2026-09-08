"use client";

import {
  useEffect,
  useState,
  useTransition,
  useActionState,
  type ReactNode,
} from "react";
import {
  ActionIcon,
  ActionIconGroup,
  Button,
  Group,
  Modal,
  Text,
  Tooltip,
  rem,
} from "@mantine/core";
import {
  IconPlayerStop,
  IconRefresh,
  IconSkull,
  IconTrash,
} from "@tabler/icons-react";
import {useTranslations} from "@/i18n/provider";
import {
  commandContainer,
  deleteContainer,
  deleteMyContainerAction,
  commandMyContainerAction,
  type ContainerCommand,
} from "../../actions/container-commands";
import {type Transition} from "../state-badge";

type Props = {
  uuid: string;
  name: string;
  state: string;
  canManage: boolean;
  canDelete: boolean;

  // whether this is asked for as one's own: a container somebody else owns is not
  // there to be commanded that way.
  own?: boolean;

  // told what is on its way to this container, so that whatever else shows it
  // can say that is what is happening to it. The runner takes a moment to
  // agree, and until it does this is the only thing that knows.
  onCommand?: (underway: Transition | undefined) => void;
};

// what asking for each of these is, in the words of what it does to a
// container: what the runner calls the state it passes through on the way is
// its own business.
const underway: Record<ContainerCommand, Transition> = {
  stop: "stopping",
  kill: "killing",
  restart: "restarting",
};

/**
 * What can be asked of a container once it is running. There is no edit: a
 * container is immutable, so changing one means running another.
 */
export function ContainerActions({
  uuid,
  name,
  state,
  canManage,
  canDelete,
  own = false,
  onCommand,
}: Props) {
  const t = useTranslations();
  const [pending, startTransition] = useTransition();
  const [, deleteAction, isDeleting] = useActionState(
    own ? deleteMyContainerAction : deleteContainer,
    false,
  );
  const [confirming, setConfirming] = useState<"kill" | "delete" | null>(null);

  const running = state === "running" || state === "restarting";

  // what was asked for last, kept until the answer comes back.
  const [asked, setAsked] = useState<Transition | undefined>(undefined);

  useEffect(() => {
    if (isDeleting) {
      onCommand?.("deleting");

      return;
    }

    onCommand?.(pending ? asked : undefined);
  }, [asked, pending, isDeleting, onCommand]);

  const run = (command: ContainerCommand) => {
    setAsked(underway[command]);

    startTransition(async () => {
      await (own ? commandMyContainerAction : commandContainer)(command, uuid);
    });
  };

  return (
    <>
      <ActionIconGroup>
        {canManage && (
          <>
            <Tooltip label={t("containers.table.stop")} withArrow>
              <ActionIcon
                variant="light"
                size="lg"
                color="yellow"
                disabled={!running || pending}
                aria-label={t("containers.table.stop")}
                onClick={() => run("stop")}
              >
                <IconPlayerStop style={{width: rem(20)}} stroke={1.5} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={t("containers.table.restart")} withArrow>
              <ActionIcon
                variant="light"
                size="lg"
                color="blue"
                disabled={pending}
                aria-label={t("containers.table.restart")}
                onClick={() => run("restart")}
              >
                <IconRefresh style={{width: rem(20)}} stroke={1.5} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={t("containers.table.kill")} withArrow>
              <ActionIcon
                variant="light"
                size="lg"
                color="orange"
                disabled={!running || pending}
                aria-label={t("containers.table.kill")}
                onClick={() => setConfirming("kill")}
              >
                <IconSkull style={{width: rem(20)}} stroke={1.5} />
              </ActionIcon>
            </Tooltip>
          </>
        )}
        {canDelete && (
          <Tooltip label={t("containers.table.delete")} withArrow>
            <ActionIcon
              variant="light"
              size="lg"
              color="red"
              aria-label={t("containers.table.delete")}
              onClick={() => setConfirming("delete")}
            >
              <IconTrash style={{width: rem(20)}} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
        )}
      </ActionIconGroup>

      <Confirmation
        opened={confirming === "delete"}
        message={t("containers.table.deleteConfirm", {name})}
        onCancel={() => setConfirming(null)}
      >
        <form action={deleteAction}>
          <input type="hidden" name="id" value={uuid} />
          <Button color="red" type="submit" loading={isDeleting}>
            {t("common.delete")}
          </Button>
        </form>
      </Confirmation>

      <Confirmation
        opened={confirming === "kill"}
        message={t("containers.table.killConfirm", {name})}
        onCancel={() => setConfirming(null)}
      >
        <Button
          color="orange"
          loading={pending}
          onClick={() => {
            setConfirming(null);
            run("kill");
          }}
        >
          {t("containers.table.kill")}
        </Button>
      </Confirmation>
    </>
  );
}

/**
 * One thing to make sure of before it is done.
 *
 * Each question is a modal of its own: a modal that has been closed is still on
 * screen while it fades away, so one modal asking whichever question is current
 * turns into the other one on the way out.
 */
function Confirmation({
  opened,
  message,
  onCancel,
  children,
}: {
  opened: boolean;
  message: string;
  onCancel: () => void;
  children: ReactNode;
}) {
  const t = useTranslations();

  return (
    <Modal
      title={t("common.confirmAction")}
      opened={opened}
      size="md"
      centered
      onClose={onCancel}
    >
      <Text>{message}</Text>
      <Group justify="flex-end" mt="md">
        <Button color="gray" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
        {children}
      </Group>
    </Modal>
  );
}
