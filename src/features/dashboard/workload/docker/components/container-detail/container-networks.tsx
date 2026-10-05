"use client";

import {useState, type FormEvent} from "react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {
  ActionIcon,
  Badge,
  Button,
  Fieldset,
  Group,
  Select,
  Stack,
  Table,
  TableScrollContainer,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  TagsInput,
  Text,
  Tooltip,
} from "@mantine/core";
import {notifications} from "@mantine/notifications";
import {IconPlugConnectedX} from "@tabler/icons-react";
import {useI18n} from "@/i18n/provider";
import {type Scope} from "@/features/dashboard/workload/vms/api";
import {connectContainerNetwork, disconnectContainerNetwork} from "../../api";
import {problemOf} from "../../errors";
import {dockerKeys} from "../../hooks/queries";
import {useNetworks} from "../../hooks/use-docker-objects";
import {type Container} from "../../types";
import {ConfirmModal} from "../confirm-modal";
import {containerName} from "../containers-table/container-actions";
import {ProblemAlert} from "../problem-alert";

type Props = {
  scope: Scope;
  vmUuid: string;
  container: Container;
  may: {manage: boolean};
};

/**
 * The networks a container is on, all of them its own VM's: a network never
 * reaches from one VM into another. It can be taken off one, or put on another
 * of the same VM, under names the others on it reach it by.
 */
export function ContainerNetworks({scope, vmUuid, container, may}: Props) {
  const {t} = useI18n();
  const queryClient = useQueryClient();
  const networks = useNetworks(scope, vmUuid);

  const [network, setNetwork] = useState<string | null>(null);
  const [aliases, setAliases] = useState<string[]>([]);
  const [attempted, setAttempted] = useState(false);
  const [leaving, setLeaving] = useState<string | null>(null);

  const name = containerName(container);
  const attached = container.networks ?? [];
  const known = new Map((networks.data ?? []).map((each) => [each.name, each]));

  // host and none are not networks one joins beside another.
  const candidates = (networks.data ?? []).filter(
    (each) =>
      !attached.includes(each.name) &&
      each.driver !== "host" &&
      each.driver !== "null",
  );

  const settle = () =>
    queryClient.invalidateQueries({queryKey: dockerKeys.root});

  const connect = useMutation({
    mutationFn: (joining: {network: string; aliases: string[]}) =>
      connectContainerNetwork(
        scope,
        vmUuid,
        container.id,
        joining.network,
        joining.aliases,
      ),
    onSuccess: (_, joining) => {
      setNetwork(null);
      setAliases([]);
      setAttempted(false);
      notifications.show({
        color: "green",
        message: t("containers.networks.connected", {
          name,
          network: joining.network,
        }),
      });
    },
    // said under the form that asked.
    onError: () => {},
    onSettled: settle,
  });

  const disconnect = useMutation({
    mutationFn: (leavingNetwork: string) =>
      disconnectContainerNetwork(scope, vmUuid, container.id, leavingNetwork),
    onSuccess: () => setLeaving(null),
    // said in the question that asked.
    onError: () => {},
    onSettled: settle,
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAttempted(true);

    if (network) {
      connect.mutate({network, aliases});
    }
  };

  return (
    <Stack>
      <TableScrollContainer minWidth={480}>
        <Table verticalSpacing="sm" striped withRowBorders>
          <TableThead>
            <TableTr>
              <TableTh>{t("containers.networks.name")}</TableTh>
              <TableTh>{t("containers.networks.driver")}</TableTh>
              <TableTh>{t("common.actions")}</TableTh>
            </TableTr>
          </TableThead>
          <TableTbody>
            {attached.length === 0 && (
              <TableTr>
                <TableTd colSpan={3} ta="center">
                  {t("containers.networks.none")}
                </TableTd>
              </TableTr>
            )}
            {attached.map((attachedName) => {
              const details = known.get(attachedName);

              return (
                <TableTr key={attachedName}>
                  <TableTd>
                    <Group gap="xs">
                      <Text size="sm">{attachedName}</Text>
                      {details?.internal && (
                        <Badge size="sm" variant="light" color="gray">
                          {t("containers.networks.internal")}
                        </Badge>
                      )}
                    </Group>
                  </TableTd>
                  <TableTd>
                    <Text size="sm">{details?.driver ?? "—"}</Text>
                  </TableTd>
                  <TableTd>
                    {may.manage && (
                      <Tooltip
                        label={t("containers.networks.disconnect")}
                        withArrow
                      >
                        <ActionIcon
                          variant="light"
                          color="red"
                          size="lg"
                          aria-label={t("containers.networks.disconnectFrom", {
                            network: attachedName,
                          })}
                          onClick={() => {
                            disconnect.reset();
                            setLeaving(attachedName);
                          }}
                        >
                          <IconPlugConnectedX size={18} stroke={1.5} />
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

      {may.manage && (
        <form onSubmit={submit} noValidate>
          <Fieldset legend={t("containers.networks.attachLegend")}>
            <Stack gap="sm">
              <Group align="flex-start" grow>
                <Select
                  label={t("containers.networks.network")}
                  placeholder={
                    candidates.length > 0
                      ? t("containers.networks.pick")
                      : t("containers.networks.noneToAttach")
                  }
                  data={candidates.map((each) => each.name)}
                  value={network}
                  onChange={setNetwork}
                  error={
                    attempted && !network
                      ? t("containers.networks.pickError")
                      : undefined
                  }
                  required
                  searchable
                  disabled={connect.isPending}
                />
                <TagsInput
                  label={t("containers.networks.aliases")}
                  description={t("containers.networks.aliasesHelp")}
                  value={aliases}
                  onChange={setAliases}
                  disabled={connect.isPending}
                  clearable
                />
              </Group>
              {connect.error && (
                <ProblemAlert
                  problem={problemOf(connect.error)}
                  title={t("containers.networks.connectFailed")}
                />
              )}
              <Group justify="flex-end">
                <Button type="submit" loading={connect.isPending}>
                  {t("containers.networks.attach")}
                </Button>
              </Group>
            </Stack>
          </Fieldset>
        </form>
      )}

      <ConfirmModal
        opened={leaving !== null}
        onClose={() => setLeaving(null)}
        onConfirm={() => leaving && disconnect.mutate(leaving)}
        loading={disconnect.isPending}
        problem={disconnect.error ? problemOf(disconnect.error) : null}
        confirmLabel={t("containers.networks.disconnect")}
      >
        <Text>
          {t("containers.networks.disconnectConfirm", {
            name,
            network: leaving ?? "",
          })}
        </Text>
      </ConfirmModal>
    </Stack>
  );
}
