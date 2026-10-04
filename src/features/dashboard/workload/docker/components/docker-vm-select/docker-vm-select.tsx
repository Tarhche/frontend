"use client";

import {
  Alert,
  EmptyState,
  Group,
  Loader,
  Select,
  Stack,
  Text,
} from "@mantine/core";
import {
  IconBrandDocker,
  IconInfoCircle,
  IconPlus,
  IconSparkles,
} from "@tabler/icons-react";
import {useTranslations} from "@/i18n/provider";
import {problemOf} from "../../errors";
import {ProblemAlert} from "../problem-alert";
import {VmStateBadge} from "../vm-state-badge";
import {NEW_VM} from "./choice";
import {NewDockerVmFields} from "./new-docker-vm-fields";
import {type DockerVmChoiceState} from "./use-docker-vm-choice";
import {VmSummary} from "./vm-summary";

type Props = {
  state: DockerVmChoiceState;

  /** what the form, or the server, said about the choice. */
  error?: string;

  /** what the server refused about a new VM, by field. */
  fieldErrors?: Record<string, string>;
  disabled?: boolean;

  /** told of a pick as well, for whoever keeps it somewhere else too. */
  onPick?: (value: string | null) => void;
};

/**
 * Which Docker VM something goes in, or is looked at in.
 *
 * A create form offers the person's Docker VMs and a new one. With none, a new
 * one is all there is, so its defaults are shown for changing; with one, it is
 * already picked; with several, the person picks, and nothing is picked for
 * them. A page that looks into a VM offers the VMs alone, one already shown.
 *
 * Whichever is picked says where it is: a VM that is not running has nothing
 * to ask, and says so before anybody asks it anything.
 */
export function DockerVmSelect({
  state,
  error,
  fieldErrors,
  disabled,
  onPick,
}: Props) {
  const t = useTranslations();
  const {source, vms, loading, failed, choice, allowNew} = state;
  const label = t("dockerVms.select.label");

  if (source === null) {
    return (
      <Alert
        color="blue"
        variant="light"
        role="status"
        icon={<IconInfoCircle />}
        title={label}
      >
        {allowNew
          ? t("dockerVms.select.chosenForYou")
          : t("dockerVms.select.cannotList")}
      </Alert>
    );
  }

  if (loading) {
    return (
      <Select
        label={label}
        data={[]}
        placeholder={t("dockerVms.select.loading")}
        rightSection={<Loader size="xs" />}
        disabled
      />
    );
  }

  if (failed || vms === undefined) {
    return (
      <ProblemAlert
        problem={problemOf(state.error)}
        title={t("dockerVms.select.listFailed")}
        onRetry={() => void state.refetch()}
        retrying={state.refetching}
      >
        {allowNew && (
          <Text size="sm">{t("dockerVms.select.listFailedGoAhead")}</Text>
        )}
      </ProblemAlert>
    );
  }

  if (vms.length === 0) {
    if (!allowNew) {
      return (
        <EmptyState
          icon={<IconBrandDocker />}
          withIndicatorBackground
          title={t("dockerVms.select.noneTitle")}
          description={t("dockerVms.select.noneHelp")}
        />
      );
    }

    return (
      <Stack gap="sm">
        <Alert
          color="blue"
          variant="light"
          role="status"
          icon={<IconSparkles />}
          title={t("dockerVms.select.willBeCreated")}
        >
          {t("dockerVms.select.willBeCreatedHelp")}
        </Alert>
        <NewDockerVmFields
          value={state.newVm}
          onChange={state.setNewVm}
          errors={fieldErrors}
          disabled={disabled}
        />
      </Stack>
    );
  }

  const byUuid = new Map(vms.map((vm) => [vm.uuid, vm]));
  const data = vms.map((vm) => ({value: vm.uuid, label: vm.name}));
  if (allowNew) {
    data.push({value: NEW_VM, label: t("dockerVms.select.newVm")});
  }

  const value =
    choice.kind === "existing"
      ? choice.vm.uuid
      : choice.kind === "new"
        ? NEW_VM
        : null;

  return (
    <Stack gap="sm">
      <Select
        label={label}
        description={
          allowNew && vms.length > 1
            ? t("dockerVms.select.pickHelp")
            : undefined
        }
        placeholder={t("dockerVms.select.placeholder")}
        data={data}
        value={value}
        onChange={(next) => {
          state.pick(next);
          onPick?.(next);
        }}
        allowDeselect={false}
        searchable={data.length > 7}
        required={allowNew}
        disabled={disabled}
        error={error}
        leftSection={
          choice.kind === "new" ? (
            <IconPlus size={16} />
          ) : (
            <IconBrandDocker size={16} />
          )
        }
        renderOption={({option}) => {
          const vm = byUuid.get(option.value);

          if (!vm) {
            return (
              <Group gap="xs" wrap="nowrap">
                <IconPlus size={14} />
                <Text size="sm">{option.label}</Text>
              </Group>
            );
          }

          return (
            <Group justify="space-between" wrap="nowrap" style={{flex: 1}}>
              <Text size="sm">{vm.name}</Text>
              <VmStateBadge state={vm.state} />
            </Group>
          );
        }}
      />

      {choice.kind === "existing" && <VmSummary vm={choice.vm} />}

      {choice.kind === "new" && (
        <NewDockerVmFields
          value={state.newVm}
          onChange={state.setNewVm}
          errors={fieldErrors}
          disabled={disabled}
        />
      )}
    </Stack>
  );
}
