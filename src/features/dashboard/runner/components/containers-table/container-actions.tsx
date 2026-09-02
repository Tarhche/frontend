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
  commandContainer,
  deleteContainer,
  type ContainerCommand,
} from "../../actions/container-commands";

type Props = {
  uuid: string;
  name: string;
  state: string;
  canManage: boolean;
  canDelete: boolean;
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
}: Props) {
  const t = useTranslations();
  const [pending, startTransition] = useTransition();
  const [, deleteAction, isDeleting] = useActionState(deleteContainer, false);
  const [confirming, setConfirming] = useState<"kill" | "delete" | null>(null);

  const running = state === "running" || state === "restarting";

  const run = (command: ContainerCommand) => {
    startTransition(async () => {
      await commandContainer(command, uuid);
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

      <Modal
        title={t("common.confirmAction")}
        opened={confirming !== null}
        size="md"
        centered
        onClose={() => setConfirming(null)}
      >
        <Text>
          {confirming === "delete"
            ? t("containers.table.deleteConfirm", {name})
            : t("containers.table.killConfirm", {name})}
        </Text>
        <Group justify="flex-end" mt="md">
          <Button color="gray" onClick={() => setConfirming(null)}>
            {t("common.cancel")}
          </Button>
          {confirming === "delete" ? (
            <form action={deleteAction}>
              <input type="hidden" name="id" value={uuid} />
              <Button color="red" type="submit" loading={isDeleting}>
                {t("common.delete")}
              </Button>
            </form>
          ) : (
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
          )}
        </Group>
      </Modal>
    </>
  );
}
