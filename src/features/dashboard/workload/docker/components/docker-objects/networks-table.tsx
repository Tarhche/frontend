"use client";

import {useState, type FormEvent} from "react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {
  ActionIcon,
  Badge,
  Button,
  Fieldset,
  Group,
  NativeSelect,
  SimpleGrid,
  Stack,
  Switch,
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
import {createNetwork, removeNetwork} from "../../api";
import {problemOf} from "../../errors";
import {dockerKeys} from "../../hooks/queries";
import {useNetworks} from "../../hooks/use-docker-objects";
import {type DockerMay} from "../../permissions";
import {type Network} from "../../types";
import {ConfirmModal} from "../confirm-modal";
import {ProblemAlert} from "../problem-alert";
import {TableSkeleton} from "../table-skeleton";

/** The networks docker makes for itself, which are not anybody's to remove. */
export const PREDEFINED_NETWORKS = ["bridge", "host", "none"];

type Props = {
  scope: Scope;
  vm: Vm;
  may: DockerMay;
};

/**
 * The networks inside a VM. Containers on one reach each other by name; none
 * of them reaches any other VM, whatever it is called. An internal network
 * has no way out of the VM at all.
 */
export function NetworksTable({scope, vm, may}: Props) {
  const {t, locale} = useI18n();
  const queryClient = useQueryClient();
  const networks = useNetworks(scope, vm.uuid);

  const [name, setName] = useState("");
  const [internal, setInternal] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [removing, setRemoving] = useState<Network | null>(null);

  const settle = () =>
    queryClient.invalidateQueries({queryKey: dockerKeys.root});

  const create = useMutation({
    mutationFn: (network: {name: string; internal: boolean}) =>
      createNetwork(scope, vm.uuid, {...network, driver: "bridge"}),
    onSuccess: (_, network) => {
      setName("");
      setInternal(false);
      setAttempted(false);
      notifications.show({
        color: "green",
        message: t("networks.form.created", {name: network.name}),
      });
    },
    // said under the form that asked.
    onError: () => {},
    onSettled: settle,
  });

  const remove = useMutation({
    mutationFn: (id: string) => removeNetwork(scope, vm.uuid, id),
    onSuccess: () => setRemoving(null),
    // said in the question that asked.
    onError: () => {},
    onSettled: settle,
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAttempted(true);

    if (name.trim().length > 0) {
      create.mutate({name: name.trim(), internal});
    }
  };

  const refused = create.error ? problemOf(create.error).fields : {};
  const items = networks.data ?? [];

  return (
    <Stack>
      {may.manage && (
        <form onSubmit={submit} noValidate>
          <Fieldset
            legend={t("networks.form.legend")}
            disabled={create.isPending}
          >
            <Stack gap="sm">
              <SimpleGrid cols={{base: 1, sm: 2}}>
                <TextInput
                  label={t("networks.form.name")}
                  value={name}
                  onChange={(event) => setName(event.currentTarget.value)}
                  error={
                    attempted && name.trim().length === 0
                      ? t("networks.form.required")
                      : refused.name
                  }
                  required
                  dir="ltr"
                  autoComplete="off"
                />
                <NativeSelect
                  label={t("networks.form.driver")}
                  description={t("networks.form.driverHelp")}
                  data={["bridge"]}
                  value="bridge"
                  onChange={() => {}}
                />
              </SimpleGrid>
              <Switch
                label={t("networks.form.internal")}
                description={t("networks.form.internalHelp")}
                checked={internal}
                onChange={(event) => setInternal(event.currentTarget.checked)}
              />
              {create.error && !problemOf(create.error).fields.name && (
                <ProblemAlert
                  problem={problemOf(create.error)}
                  title={t("networks.form.failed")}
                />
              )}
              <Group justify="flex-end">
                <Button
                  type="submit"
                  leftSection={<IconPlus size={18} />}
                  loading={create.isPending}
                >
                  {t("networks.form.create")}
                </Button>
              </Group>
            </Stack>
          </Fieldset>
        </form>
      )}

      {networks.isPending ? (
        <TableSkeleton />
      ) : networks.isError && !networks.data ? (
        <ProblemAlert
          problem={problemOf(networks.error)}
          title={t("networks.table.listFailed")}
          onRetry={() => void networks.refetch()}
          retrying={networks.isFetching}
        />
      ) : (
        <TableScrollContainer minWidth={720}>
          <Table verticalSpacing="sm" striped withRowBorders>
            <TableThead>
              <TableTr>
                <TableTh>{t("networks.table.name")}</TableTh>
                <TableTh>{t("networks.table.driver")}</TableTh>
                <TableTh>{t("networks.table.scope")}</TableTh>
                <TableTh>{t("networks.table.containers")}</TableTh>
                <TableTh>{t("networks.table.createdAt")}</TableTh>
                <TableTh>{t("common.actions")}</TableTh>
              </TableTr>
            </TableThead>
            <TableTbody>
              {items.length === 0 && (
                <TableTr>
                  <TableTd colSpan={6} ta="center">
                    {t("networks.table.empty")}
                  </TableTd>
                </TableTr>
              )}
              {items.map((network) => {
                const predefined = PREDEFINED_NETWORKS.includes(network.name);

                return (
                  <TableTr key={network.id}>
                    <TableTd>
                      <Group gap="xs">
                        <Text size="sm">{network.name}</Text>
                        {network.internal && (
                          <Badge size="sm" variant="light" color="gray">
                            {t("networks.table.internal")}
                          </Badge>
                        )}
                        {predefined && (
                          <Badge size="sm" variant="outline" color="gray">
                            {t("networks.table.predefined")}
                          </Badge>
                        )}
                      </Group>
                    </TableTd>
                    <TableTd>
                      <Text size="sm">{network.driver}</Text>
                    </TableTd>
                    <TableTd>
                      <Text size="sm">{network.scope ?? "—"}</Text>
                    </TableTd>
                    <TableTd>
                      <Text size="sm">
                        {network.containers && network.containers.length > 0
                          ? network.containers.join(", ")
                          : "—"}
                      </Text>
                    </TableTd>
                    <TableTd>
                      <Text size="sm">
                        {formatDateTime(network.created_at, locale) || "—"}
                      </Text>
                    </TableTd>
                    <TableTd>
                      {may.delete && !predefined && (
                        <Tooltip label={t("networks.table.remove")} withArrow>
                          <ActionIcon
                            variant="light"
                            color="red"
                            size="lg"
                            aria-label={t("networks.table.removeOne", {
                              name: network.name,
                            })}
                            onClick={() => {
                              remove.reset();
                              setRemoving(network);
                            }}
                          >
                            <IconTrash size={18} stroke={1.5} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </TableTd>
                  </TableTr>
                );
              })}
            </TableTbody>
          </Table>
        </TableScrollContainer>
      )}

      <ConfirmModal
        opened={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={() => removing && remove.mutate(removing.id)}
        loading={remove.isPending}
        problem={remove.error ? problemOf(remove.error) : null}
        confirmLabel={t("networks.table.remove")}
      >
        <Text>
          {t("networks.table.removeConfirm", {name: removing?.name ?? ""})}
        </Text>
        {removing?.containers && removing.containers.length > 0 && (
          <Text size="sm" c="dimmed">
            {t("networks.table.removeInUse")}
          </Text>
        )}
      </ConfirmModal>
    </Stack>
  );
}
