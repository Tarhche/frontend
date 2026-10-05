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
import {IconCloudDownload, IconTrash} from "@tabler/icons-react";
import {useI18n} from "@/i18n/provider";
import {pullImage, removeImage} from "../../api";
import {problemOf} from "../../errors";
import {formatBytes, formatDateTime, shortId} from "../../format";
import {dockerKeys} from "../../hooks/queries";
import {useImages} from "../../hooks/use-docker-objects";
import {type DockerMay} from "../../permissions";
import {type Image, type Scope, type Vm} from "../../types";
import {ConfirmModal} from "../confirm-modal";
import {ProblemAlert} from "../problem-alert";
import {TableSkeleton} from "../table-skeleton";
import {Waiting} from "../waiting";

/** What an image is called: its tags, or nothing when it has none left. */
export function imageNames(image: Image): string[] {
  return (image.tags ?? []).filter((tag) => !tag.startsWith("<none>"));
}

type Props = {
  scope: Scope;
  vm: Vm;
  may: DockerMay;
};

/**
 * The images a VM holds. Pulling one takes as long as the registry does, so
 * the wait is shown for what it is; removing one a container uses is refused
 * by docker unless it is forced, which is asked about first.
 */
export function ImagesTable({scope, vm, may}: Props) {
  const {t, locale} = useI18n();
  const queryClient = useQueryClient();
  const images = useImages(scope, vm.uuid);

  const [reference, setReference] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [removing, setRemoving] = useState<Image | null>(null);
  const [force, setForce] = useState(false);

  const settle = () =>
    queryClient.invalidateQueries({queryKey: dockerKeys.root});

  const pull = useMutation({
    mutationFn: (wanted: string) => pullImage(scope, vm.uuid, wanted),
    onSuccess: (_, wanted) => {
      setReference("");
      setAttempted(false);
      notifications.show({
        color: "green",
        message: t("images.pull.pulled", {reference: wanted, vm: vm.name}),
      });
    },
    // said under the form that asked.
    onError: () => {},
    onSettled: settle,
  });

  const remove = useMutation({
    mutationFn: (gone: {id: string; force: boolean}) =>
      removeImage(scope, vm.uuid, gone.id, gone.force),
    onSuccess: () => setRemoving(null),
    // said in the question that asked.
    onError: () => {},
    onSettled: settle,
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAttempted(true);

    const wanted = reference.trim();
    if (wanted.length > 0) {
      pull.mutate(wanted);
    }
  };

  const items = images.data ?? [];

  return (
    <Stack>
      {may.manage && (
        <form onSubmit={submit} noValidate>
          <Stack gap="xs">
            <TextInput
              label={t("images.pull.reference")}
              description={t("images.pull.referenceHelp")}
              placeholder="nginx:1.27-alpine"
              value={reference}
              onChange={(event) => setReference(event.currentTarget.value)}
              error={
                attempted && reference.trim().length === 0
                  ? t("images.pull.required")
                  : undefined
              }
              disabled={pull.isPending}
              required
              dir="ltr"
              autoComplete="off"
            />
            <Group justify="flex-end">
              <Button
                type="submit"
                leftSection={<IconCloudDownload size={18} />}
                loading={pull.isPending}
              >
                {t("images.pull.submit")}
              </Button>
            </Group>
          </Stack>
        </form>
      )}

      {pull.isPending && (
        <Waiting
          title={t("images.pull.waiting", {reference: pull.variables ?? ""})}
          description={t("images.pull.waitingHelp")}
        />
      )}

      {pull.error && !pull.isPending && (
        <ProblemAlert
          problem={problemOf(pull.error)}
          title={
            problemOf(pull.error).unanswered
              ? t("images.pull.unanswered")
              : t("images.pull.failed")
          }
        />
      )}

      {images.isPending ? (
        <TableSkeleton />
      ) : images.isError && !images.data ? (
        <ProblemAlert
          problem={problemOf(images.error)}
          title={t("images.table.listFailed")}
          onRetry={() => void images.refetch()}
          retrying={images.isFetching}
        />
      ) : (
        <TableScrollContainer minWidth={720}>
          <Table verticalSpacing="sm" striped withRowBorders>
            <TableThead>
              <TableTr>
                <TableTh>{t("images.table.tags")}</TableTh>
                <TableTh>{t("images.table.id")}</TableTh>
                <TableTh>{t("images.table.size")}</TableTh>
                <TableTh>{t("images.table.createdAt")}</TableTh>
                <TableTh>{t("images.table.inUse")}</TableTh>
                <TableTh>{t("common.actions")}</TableTh>
              </TableTr>
            </TableThead>
            <TableTbody>
              {items.length === 0 && (
                <TableTr>
                  <TableTd colSpan={6} ta="center">
                    {t("images.table.empty")}
                  </TableTd>
                </TableTr>
              )}
              {items.map((image) => {
                const names = imageNames(image);

                return (
                  <TableTr key={image.id}>
                    <TableTd>
                      {names.length > 0 ? (
                        <Stack gap={2}>
                          {names.map((name) => (
                            <Text key={name} size="sm" ff="monospace" dir="ltr">
                              {name}
                            </Text>
                          ))}
                        </Stack>
                      ) : (
                        <Text size="sm" c="dimmed">
                          {t("images.table.untagged")}
                        </Text>
                      )}
                    </TableTd>
                    <TableTd>
                      <Text size="sm" ff="monospace">
                        {shortId(image.id)}
                      </Text>
                    </TableTd>
                    <TableTd>
                      <Text size="sm">{formatBytes(image.size, locale)}</Text>
                    </TableTd>
                    <TableTd>
                      <Text size="sm">
                        {formatDateTime(image.created_at, locale) || "—"}
                      </Text>
                    </TableTd>
                    <TableTd>
                      {image.in_use ? (
                        <Badge variant="light" color="blue">
                          {t("images.table.used")}
                        </Badge>
                      ) : (
                        <Text size="sm" c="dimmed">
                          {t("images.table.unused")}
                        </Text>
                      )}
                    </TableTd>
                    <TableTd>
                      {may.delete && (
                        <Tooltip label={t("images.table.remove")} withArrow>
                          <ActionIcon
                            variant="light"
                            color="red"
                            size="lg"
                            aria-label={t("images.table.removeOne", {
                              image: names[0] ?? shortId(image.id),
                            })}
                            onClick={() => {
                              remove.reset();
                              setForce(false);
                              setRemoving(image);
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
        onConfirm={() => removing && remove.mutate({id: removing.id, force})}
        loading={remove.isPending}
        problem={remove.error ? problemOf(remove.error) : null}
        confirmLabel={t("images.table.remove")}
      >
        <Text>
          {t("images.table.removeConfirm", {
            image: removing
              ? (imageNames(removing)[0] ?? shortId(removing.id))
              : "",
          })}
        </Text>
        {removing?.in_use && (
          <Text size="sm" c="dimmed">
            {t("images.table.removeInUse")}
          </Text>
        )}
        <Checkbox
          label={t("images.table.force")}
          description={t("images.table.forceHelp")}
          checked={force}
          onChange={(event) => setForce(event.currentTarget.checked)}
        />
      </ConfirmModal>
    </Stack>
  );
}
