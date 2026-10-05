"use client";

import {type FormEvent, useState, useTransition} from "react";
import {
  Button,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import {notifications} from "@mantine/notifications";
import {IconCameraPlus} from "@tabler/icons-react";
import {useQueryClient} from "@tanstack/react-query";
import {useTranslations} from "@/i18n/provider";
import {ProblemAlert} from "@/features/dashboard/workload/components/problem-alert";
import {
  hasMoreToSay,
  type Problem,
} from "@/features/dashboard/workload/lib/problem";
import {canSnapshot} from "@/features/dashboard/workload/vms/lib/state";
import {type Vm} from "@/features/dashboard/workload/vms/types";
import {takeSnapshot} from "../actions/snapshot-commands";
import {snapshotKeys} from "../hooks/queries";
import {snapshotName} from "../lib";

/**
 * Takes a snapshot of a VM, under a name somebody can change. Only a VM that
 * is running or stopped can have one taken.
 */
export function TakeSnapshotButton({
  vm,
}: {
  vm: Pick<Vm, "uuid" | "name" | "state">;
}) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [pending, startTransition] = useTransition();
  const [opened, setOpened] = useState(false);
  const [name, setName] = useState("");
  const [missing, setMissing] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);

  const ready = canSnapshot(vm.state);

  const open = () => {
    setName(snapshotName(vm.name, new Date()));
    setMissing(false);
    setProblem(null);
    setOpened(true);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProblem(null);

    if (name.trim() === "") {
      setMissing(true);

      return;
    }

    setMissing(false);
    startTransition(async () => {
      const answer = await takeSnapshot(vm.uuid, name.trim());

      if (!answer.ok) {
        setProblem(answer.problem);

        return;
      }

      setOpened(false);
      notifications.show({
        color: "green",
        message: t("snapshots.take.started"),
      });
      await queryClient.invalidateQueries({queryKey: snapshotKeys.all});
    });
  };

  const nameError = missing
    ? t("snapshots.take.nameRequired")
    : problem?.fields.name;
  const shown = (path: string) => path === "name";

  return (
    <>
      <Tooltip
        label={t("snapshots.take.notNow")}
        disabled={ready}
        withArrow
        multiline
        maw={280}
      >
        <Button
          variant="light"
          leftSection={<IconCameraPlus size={18} stroke={1.5} />}
          disabled={!ready}
          onClick={open}
        >
          {t("snapshots.actions.take")}
        </Button>
      </Tooltip>

      <Modal
        title={t("snapshots.take.title")}
        opened={opened}
        onClose={() => setOpened(false)}
        centered
      >
        <form onSubmit={submit} noValidate>
          <Stack>
            <Text size="sm" c="dimmed">
              {t("snapshots.take.help", {vm: vm.name})}
            </Text>
            <TextInput
              label={t("snapshots.take.name")}
              value={name}
              onChange={(event) => setName(event.currentTarget.value)}
              error={nameError}
              data-autofocus
              required
            />
            {problem && hasMoreToSay(problem, shown) && (
              <ProblemAlert problem={problem} shown={shown} />
            )}
            <Group justify="flex-end">
              <Button color="gray" onClick={() => setOpened(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" loading={pending}>
                {t("snapshots.take.submit")}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
