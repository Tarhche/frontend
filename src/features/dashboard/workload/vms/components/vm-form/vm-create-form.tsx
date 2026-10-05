"use client";

import {type FormEvent, useActionState, useState, useTransition} from "react";
import {
  Alert,
  Button,
  Code,
  Group,
  InputWrapper,
  Paper,
  SegmentedControl,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import {IconInfoCircle} from "@tabler/icons-react";
import {ValidationErrorsAlert} from "@/components/errors/validation-errors-alert";
import {useI18n} from "@/i18n/provider";
import {createVm, type CreateVmState} from "../../actions/create-vm";
import {
  buildCreateVmRequest,
  CUSTOM_IMAGE,
  defaultVmFormValues,
  fieldErrorsFrom,
  IMAGE_PRESETS,
  type RestorableSnapshot,
  switchKind,
  validateVmForm,
  type VmField,
  type VmFormValues,
} from "../../lib/form";
import {formatBytes, fromBytes, toBytes} from "../../lib/units";
import {type VmKind} from "../../types";
import {LifetimeInput} from "../fields/lifetime-input";
import {NetworkFields} from "../fields/network-fields";
import {PortsInput} from "../fields/ports-input";
import {ResourceFields} from "../fields/resource-fields";

/** A snapshot the form offers to restore from, and what it says about one. */
export type SnapshotChoice = RestorableSnapshot & {
  name: string;
  image: string;
  vm_name?: string;
};

type Props = {
  /** The person's own snapshots that are ready to restore from. */
  snapshots: SnapshotChoice[];

  /** The one it was opened to restore, when it was. */
  snapshotUuid?: string | null;
};

const initialState: CreateVmState = {};

/**
 * The form a VM restored from a snapshot starts as: of the snapshot's kind,
 * with a disk at least as large as the one it was taken of.
 */
export function restoringFrom(
  values: VmFormValues,
  snapshot: RestorableSnapshot | null,
): VmFormValues {
  if (snapshot === null) {
    return {...values, snapshotUuid: null};
  }

  const next = {
    ...switchKind(values, snapshot.kind),
    snapshotUuid: snapshot.uuid,
  };
  if (toBytes(next.disk) < snapshot.disk) {
    next.disk = fromBytes(snapshot.disk);
  }

  return next;
}

/**
 * A new VM: a machine from an OS image, or a Docker VM to run containers and
 * stacks in -- either from scratch or restored from one of the person's
 * snapshots.
 */
export function VmCreateForm({snapshots, snapshotUuid = null}: Props) {
  const {t, locale} = useI18n();
  const [state, dispatch, isPending] = useActionState(createVm, initialState);
  const [, startTransition] = useTransition();

  const [values, setValues] = useState<VmFormValues>(() =>
    restoringFrom(
      defaultVmFormValues(),
      snapshots.find((one) => one.uuid === snapshotUuid) ?? null,
    ),
  );

  // nothing is said to be wrong before the first attempt to send it; from
  // then on, what is wrong is said as it is fixed.
  const [submitted, setSubmitted] = useState(false);

  const snapshot =
    snapshots.find((one) => one.uuid === values.snapshotUuid) ?? null;
  const ours = submitted ? validateVmForm(values) : {};
  const theirs = fieldErrorsFrom(state.errors);

  const errorOf = (field: VmField) => {
    const code = ours[field];
    if (code) {
      return t(`vms.form.errors.${code}`, {
        size: formatBytes(snapshot?.disk ?? 0, locale),
      });
    }

    return theirs.fields[field];
  };

  const update = (patch: Partial<VmFormValues>) =>
    setValues((current) => ({...current, ...patch}));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);

    if (Object.keys(validateVmForm(values)).length > 0) {
      return;
    }

    const request = buildCreateVmRequest(values, snapshot);
    startTransition(() => dispatch(request));
  };

  const kindLabel = (kind: VmKind) => t(`vms.kinds.${kind}`);

  return (
    <form onSubmit={submit} noValidate>
      <Stack>
        <Paper withBorder p="md">
          <Stack>
            <TextInput
              label={t("vms.form.name")}
              description={t("vms.form.nameHelp")}
              value={values.name}
              onChange={(event) => update({name: event.currentTarget.value})}
              error={errorOf("name")}
              required
            />

            {snapshots.length > 0 && (
              <Select
                label={t("vms.form.snapshot")}
                description={t("vms.form.snapshotHelp")}
                placeholder={t("vms.form.snapshotNone")}
                clearable
                value={values.snapshotUuid}
                onChange={(uuid) =>
                  setValues((current) =>
                    restoringFrom(
                      current,
                      snapshots.find((one) => one.uuid === uuid) ?? null,
                    ),
                  )
                }
                data={snapshots.map((one) => ({
                  value: one.uuid,
                  label: t("vms.form.snapshotOption", {
                    name: one.name,
                    kind: kindLabel(one.kind),
                    size: formatBytes(one.disk, locale),
                  }),
                }))}
                error={errorOf("snapshot")}
              />
            )}

            <InputWrapper
              label={t("vms.form.kind")}
              description={
                snapshot
                  ? t("vms.form.kindFromSnapshot")
                  : t("vms.form.kindHelp")
              }
              error={errorOf("kind")}
            >
              <SegmentedControl
                mt={6}
                fullWidth
                value={values.kind}
                disabled={snapshot !== null}
                onChange={(kind) =>
                  setValues((current) => switchKind(current, kind as VmKind))
                }
                data={[
                  {value: "machine", label: kindLabel("machine")},
                  {value: "docker", label: kindLabel("docker")},
                ]}
              />
            </InputWrapper>

            {snapshot ? (
              <Text size="sm" c="dimmed">
                {t("vms.form.imageFromSnapshot")} <Code>{snapshot.image}</Code>
              </Text>
            ) : values.kind === "docker" ? (
              <Alert variant="light" color="blue" icon={<IconInfoCircle />}>
                {t("vms.form.dockerImage")}
              </Alert>
            ) : (
              <Group grow align="flex-start">
                <Select
                  label={t("vms.form.image")}
                  description={t("vms.form.imageHelp")}
                  allowDeselect={false}
                  value={values.image}
                  onChange={(image) => image && update({image})}
                  data={[
                    ...IMAGE_PRESETS.map((preset) => ({
                      value: preset.value,
                      label: preset.label,
                    })),
                    {value: CUSTOM_IMAGE, label: t("vms.form.customImage")},
                  ]}
                  error={
                    values.image === CUSTOM_IMAGE ? undefined : errorOf("image")
                  }
                />
                {values.image === CUSTOM_IMAGE && (
                  <TextInput
                    label={t("vms.form.customImageReference")}
                    description={t("vms.form.customImageHelp")}
                    placeholder="docker.io/library/fedora:41"
                    value={values.customImage}
                    onChange={(event) =>
                      update({customImage: event.currentTarget.value})
                    }
                    error={errorOf("image")}
                    dir="ltr"
                  />
                )}
              </Group>
            )}
          </Stack>
        </Paper>

        <Paper withBorder p="md">
          <Stack>
            <Title order={4}>{t("vms.form.resources")}</Title>
            <ResourceFields
              cpus={values.cpus}
              memory={values.memory}
              disk={values.disk}
              onChange={update}
              errors={{
                cpus: errorOf("cpus"),
                memory: errorOf("memory"),
                disk: errorOf("disk"),
              }}
              diskDescription={
                snapshot
                  ? t("vms.form.diskAtLeast", {
                      size: formatBytes(snapshot.disk, locale),
                    })
                  : undefined
              }
            />
          </Stack>
        </Paper>

        <Paper withBorder p="md">
          <Stack>
            <Title order={4}>{t("vms.form.network")}</Title>
            <PortsInput
              value={values.ports}
              onChange={(ports) => update({ports})}
              error={errorOf("ports")}
            />
            <NetworkFields
              kind={values.kind}
              ingress={values.ingress}
              egress={values.egress}
              onChange={update}
              errors={{ingress: errorOf("ingress"), egress: errorOf("egress")}}
            />
          </Stack>
        </Paper>

        <Paper withBorder p="md">
          <Stack>
            <Switch
              label={t("vms.form.persistentDisk")}
              description={t("vms.form.persistentDiskHelp")}
              checked={values.persistentDisk}
              onChange={(event) =>
                update({persistentDisk: event.currentTarget.checked})
              }
              error={errorOf("persistentDisk")}
            />
            <LifetimeInput
              value={values.lifetime}
              onChange={(lifetime) => update({lifetime})}
              error={errorOf("lifetime")}
            />
          </Stack>
        </Paper>

        <ValidationErrorsAlert errors={theirs.rest} />
        {state.failed && (
          <Alert variant="light" color="red" title={t("errors.errorTitle")}>
            {t("vms.form.failed")}
          </Alert>
        )}

        <Group justify="flex-end">
          <Button type="submit" loading={isPending}>
            {snapshot ? t("vms.form.restore") : t("vms.form.create")}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
