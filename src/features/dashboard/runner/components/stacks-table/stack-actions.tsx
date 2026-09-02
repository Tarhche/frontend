"use client";

import {useState, useTransition, useActionState} from "react";
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
  commandStack,
  deleteStack,
  type StackCommand,
} from "../../actions/stack-commands";

type Props = {
  uuid: string;
  name: string;
  state: string;
  canManage: boolean;
  canDelete: boolean;
};

/**
 * What can be asked of a stack once it is running. Each command reaches every
 * service in it. There is no edit: a stack is immutable, like the containers
 * in it.
 */
export function StackActions({uuid, name, state, canManage, canDelete}: Props) {
  const t = useTranslations();
  const [pending, startTransition] = useTransition();
  const [, deleteAction, isDeleting] = useActionState(deleteStack, false);
  const [confirming, setConfirming] = useState<"delete" | null>(null);

  const running = state === "running" || state === "restarting";

  const run = (command: StackCommand) => {
    startTransition(async () => {
      await commandStack(command, uuid);
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
                onClick={() => run("kill")}
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

      <Modal
        title={t("common.confirmAction")}
        opened={confirming !== null}
        size="md"
        centered
        onClose={() => setConfirming(null)}
      >
        <Text>{t("stacks.table.deleteConfirm", {name})}</Text>
        <Group justify="flex-end" mt="md">
          <Button color="gray" onClick={() => setConfirming(null)}>
            {t("common.cancel")}
          </Button>
          <form action={deleteAction}>
            <input type="hidden" name="id" value={uuid} />
            <Button color="red" type="submit" loading={isDeleting}>
              {t("common.delete")}
            </Button>
          </form>
        </Group>
      </Modal>
    </>
  );
}
