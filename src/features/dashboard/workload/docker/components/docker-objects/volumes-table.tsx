"use client";

import {useState, type FormEvent} from "react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {
  ActionIcon,
  Badge,
  Button,
  Checkbox,
  Group,
  Stack,
  Table,
  TableScrollContainer,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import {notifications} from "@mantine/notifications";
import {IconPlus, IconTrash} from "@tabler/icons-react";
import {useI18n} from "@/i18n/provider";
import {type Scope} from "@/features/dashboard/workload/vms/api";
import {type Vm} from "@/features/dashboard/workload/vms/types";
import {formatDateTime} from "@/features/dashboard/workload/vms/lib/lifetime";
import {createVolume, removeVolume} from "../../api";
import {problemOf} from "../../errors";
import {dockerKeys} from "../../hooks/queries";
import {useVolumes} from "../../hooks/use-docker-objects";
import {type DockerMay} from "../../permissions";
import {type Volume} from "../../types";
import {ConfirmModal} from "../confirm-modal";
import {ProblemAlert} from "../problem-alert";
import {TableSkeleton} from "../table-skeleton";

type Props = {
  scope: Scope;
  vm: Vm;
  may: DockerMay;
};

/**
 * The volumes inside a VM: what its containers keep when they are removed.
 * Removing one takes what is in it with it, and docker refuses to remove one
 * a container still uses unless it is forced, which is asked about first.
 */
export function VolumesTable({scope, vm, may}: Props) {
  const {t, locale} = useI18n();
  const queryClient = useQueryClient();
  const volumes = useVolumes(scope, vm.uuid);

  const [name, setName] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [removing, setRemoving] = useState<Volume | null>(null);
  const [force, setForce] = useState(false);

  const settle = () =>
    queryClient.invalidateQueries({queryKey: dockerKeys.root});

  const create = useMutation({
    mutationFn: (wanted: string) =>
      createVolume(scope, vm.uuid, {name: wanted}),
    onSuccess: (_, wanted) => {
      setName("");
      setAttempted(false);
      notifications.show({
        color: "green",
        message: t("volumes.form.created", {name: wanted}),
      });
    },
    // said under the form that asked.
    onError: () => {},
    onSettled: settle,
  });

  const remove = useMutation({
    mutationFn: (gone: {name: string; force: boolean}) =>
      removeVolume(scope, vm.uuid, gone.name, gone.force),
    onSuccess: () => setRemoving(null),
    // said in the question that asked.
    onError: () => {},
    onSettled: settle,
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAttempted(true);

    if (name.trim().length > 0) {
      create.mutate(name.trim());
    }
  };

  const items = volumes.data ?? [];

  return (
    <Stack>
      {may.manage && (
        <form onSubmit={submit} noValidate>
          <Stack gap="xs">
            <TextInput
              label={t("volumes.form.name")}
              description={t("volumes.form.nameHelp")}
              value={name}
              onChange={(event) => setName(event.currentTarget.value)}
              error={
                attempted && name.trim().length === 0
                  ? t("volumes.form.required")
                  : undefined
              }
              disabled={create.isPending}
              required
              dir="ltr"
              autoComplete="off"
            />
            {create.error && (
              <ProblemAlert
                problem={problemOf(create.error)}
                title={t("volumes.form.failed")}
              />
            )}
            <Group justify="flex-end">
              <Button
                type="submit"
                leftSection={<IconPlus size={18} />}
                loading={create.isPending}
              >
                {t("volumes.form.create")}
              </Button>
            </Group>
          </Stack>
        </form>
      )}

      {volumes.isPending ? (
        <TableSkeleton />
      ) : volumes.isError && !volumes.data ? (
        <ProblemAlert
          problem={problemOf(volumes.error)}
          title={t("volumes.table.listFailed")}
          onRetry={() => void volumes.refetch()}
          retrying={volumes.isFetching}
        />
      ) : (
        <TableScrollContainer minWidth={720}>
          <Table verticalSpacing="sm" striped withRowBorders>
            <TableThead>
              <TableTr>
                <TableTh>{t("volumes.table.name")}</TableTh>
                <TableTh>{t("volumes.table.driver")}</TableTh>
                <TableTh>{t("volumes.table.mountpoint")}</TableTh>
                <TableTh>{t("volumes.table.inUse")}</TableTh>
                <TableTh>{t("volumes.table.createdAt")}</TableTh>
                <TableTh>{t("common.actions")}</TableTh>
              </TableTr>
            </TableThead>
            <TableTbody>
              {items.length === 0 && (
                <TableTr>
                  <TableTd colSpan={6} ta="center">
                    {t("volumes.table.empty")}
                  </TableTd>
                </TableTr>
              )}
              {items.map((volume) => (
                <TableTr key={volume.name}>
                  <TableTd>
                    <Text size="sm" ff="monospace" dir="ltr">
                      {volume.name}
                    </Text>
                  </TableTd>
                  <TableTd>
                    <Text size="sm">{volume.driver ?? "—"}</Text>
                  </TableTd>
                  <TableTd>
                    <Text size="sm" ff="monospace" dir="ltr">
                      {volume.mountpoint ?? "—"}
                    </Text>
                  </TableTd>
                  <TableTd>
                    {volume.in_use ? (
                      <Badge variant="light" color="blue">
                        {t("volumes.table.used")}
                      </Badge>
                    ) : (
                      <Text size="sm" c="dimmed">
                        {t("volumes.table.unused")}
                      </Text>
                    )}
                  </TableTd>
                  <TableTd>
                    <Text size="sm">
                      {formatDateTime(volume.created_at, locale) || "—"}
                    </Text>
                  </TableTd>
                  <TableTd>
                    {may.delete && (
                      <Tooltip label={t("volumes.table.remove")} withArrow>
                        <ActionIcon
                          variant="light"
                          color="red"
                          size="lg"
                          aria-label={t("volumes.table.removeOne", {
                            name: volume.name,
                          })}
                          onClick={() => {
                            remove.reset();
                            setForce(false);
                            setRemoving(volume);
                          }}
                        >
                          <IconTrash size={18} stroke={1.5} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </TableTd>
                </TableTr>
              ))}
            </TableTbody>
          </Table>
        </TableScrollContainer>
      )}

      <ConfirmModal
        opened={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={() =>
          removing && remove.mutate({name: removing.name, force})
        }
        loading={remove.isPending}
        problem={remove.error ? problemOf(remove.error) : null}
        confirmLabel={t("volumes.table.remove")}
      >
        <Text>
          {t("volumes.table.removeConfirm", {name: removing?.name ?? ""})}
        </Text>
        {removing?.in_use && (
          <Text size="sm" c="dimmed">
            {t("volumes.table.removeInUse")}
          </Text>
        )}
        <Checkbox
          label={t("volumes.table.force")}
          description={t("volumes.table.forceHelp")}
          checked={force}
          onChange={(event) => setForce(event.currentTarget.checked)}
        />
      </ConfirmModal>
    </Stack>
  );
}
