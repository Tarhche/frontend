"use client";

import {type FormEvent, useState, useTransition} from "react";
import {Button, Group, Modal, Stack, TextInput} from "@mantine/core";
import {useQueryClient} from "@tanstack/react-query";
import {useTranslations} from "@/i18n/provider";
import {ProblemAlert} from "@/features/dashboard/workload/components/problem-alert";
import {
  hasMoreToSay,
  type Problem,
} from "@/features/dashboard/workload/lib/problem";
import {type Scope} from "@/features/dashboard/workload/vms/api";
import {renameSnapshot} from "../actions/snapshot-commands";
import {snapshotKeys} from "../hooks/queries";
import {type Snapshot} from "../types";

type Props = {
  snapshot: Pick<Snapshot, "uuid" | "name">;
  scope: Scope;
  opened: boolean;
  onClose: () => void;
};

/** A snapshot's name, changed. Nothing else about one can be. */
export function RenameSnapshotModal({snapshot, scope, opened, onClose}: Props) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(snapshot.name);
  const [missing, setMissing] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProblem(null);

    if (name.trim() === "") {
      setMissing(true);

      return;
    }

    setMissing(false);
    startTransition(async () => {
      const answer = await renameSnapshot(snapshot.uuid, name.trim(), scope);

      if (!answer.ok) {
        setProblem(answer.problem);

        return;
      }

      onClose();
      await queryClient.invalidateQueries({queryKey: snapshotKeys.all});
    });
  };

  const nameError = missing
    ? t("snapshots.take.nameRequired")
    : problem?.fields.name;
  const shown = (path: string) => path === "name";

  return (
    <Modal
      title={t("snapshots.rename.title")}
      opened={opened}
      onClose={onClose}
      centered
    >
      <form onSubmit={submit} noValidate>
        <Stack>
          <TextInput
            label={t("snapshots.rename.name")}
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
            <Button color="gray" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" loading={pending}>
              {t("snapshots.rename.submit")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
