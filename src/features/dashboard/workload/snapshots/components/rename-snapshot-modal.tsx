"use client";

import {type FormEvent, useState, useTransition} from "react";
import {Button, Group, Modal, Stack, TextInput} from "@mantine/core";
import {useQueryClient} from "@tanstack/react-query";
import {ValidationErrorsAlert} from "@/components/errors/validation-errors-alert";
import {useTranslations} from "@/i18n/provider";
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (name.trim() === "") {
      setErrors({name: t("snapshots.take.nameRequired")});

      return;
    }

    startTransition(async () => {
      const answer = await renameSnapshot(snapshot.uuid, name.trim(), scope);

      if (!answer.ok) {
        setErrors(answer.errors ?? {"": t("snapshots.actions.failed")});

        return;
      }

      setErrors({});
      onClose();
      await queryClient.invalidateQueries({queryKey: snapshotKeys.all});
    });
  };

  const {name: nameError, ...others} = errors;

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
          <ValidationErrorsAlert errors={Object.values(others)} />
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
