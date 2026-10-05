"use client";

import {type FormEvent, useState, useTransition} from "react";
import {
  Alert,
  Button,
  Code,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import {notifications} from "@mantine/notifications";
import {IconAlertTriangle} from "@tabler/icons-react";
import {useQueryClient} from "@tanstack/react-query";
import {useI18n} from "@/i18n/provider";
import {ProblemAlert} from "@/features/dashboard/workload/components/problem-alert";
import {hasMoreToSay} from "@/features/dashboard/workload/lib/problem";
import {type Scope} from "../../api";
import {updateVm} from "../../actions/update-vm";
import {vmKeys} from "../../hooks/queries";
import {
  applyUpdate,
  buildUpdateVmRequest,
  fieldErrorsFrom,
  restartsOnApply,
  validateVmForm,
  type VmField,
  vmFieldOf,
  type VmFormValues,
  vmFormValuesFrom,
} from "../../lib/form";
import {formatBytes} from "../../lib/units";
import {type ActionResult, type Vm} from "../../types";
import {LifetimeInput} from "../fields/lifetime-input";
import {NetworkFields} from "../fields/network-fields";
import {PortsInput} from "../fields/ports-input";
import {ResourceFields} from "../fields/resource-fields";
import {VmKindBadge} from "../vm-kind-badge";

// what of a VM its settings change, to tell when that has changed.
function editableOf(vm: Vm): string {
  return JSON.stringify([
    vm.name,
    vm.ports,
    vm.network,
    vm.lifetime_seconds,
    vm.resources,
  ]);
}

// the states in which a VM has something running that a restart would stop.
const LIVE = ["running", "starting", "restarting", "restoring", "scheduled"];

// the fields the settings show, beside which what the API refused is said.
const SHOWN: readonly VmField[] = [
  "name",
  "lifetime",
  "cpus",
  "memory",
  "disk",
  "ports",
  "ingress",
  "egress",
];

function shownBesideField(path: string): boolean {
  const field = vmFieldOf(path);

  return field !== undefined && SHOWN.includes(field);
}

type Props = {
  vm: Vm;

  /** The routes it is changed through. */
  scope: Scope;
};

/**
 * What can be changed about a VM once it exists: its name, ports, network,
 * lifetime and resources. Its kind and image cannot be, and its disk can only
 * grow. Only what was changed is sent.
 */
export function VmSettingsForm({vm, scope}: Props) {
  const {t, locale} = useI18n();
  const queryClient = useQueryClient();
  const [pending, startTransition] = useTransition();

  // what the form was filled in from, which is what a change is a change to:
  // the VM is read again every few seconds, and that is no reason to undo
  // what somebody is typing.
  const [base, setBase] = useState<Vm>(vm);
  const [values, setValues] = useState<VmFormValues>(() =>
    vmFormValuesFrom(vm),
  );
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);

  const request = buildUpdateVmRequest(base, values);
  const changed = Object.keys(request).length > 0;

  // the tab is drawn as the page is, and may be opened long after. Until
  // somebody changes something, it follows the VM as it is read again --
  // changed elsewhere, or by the save that just went through.
  const [seen, setSeen] = useState(() => editableOf(vm));
  if (editableOf(vm) !== seen) {
    setSeen(editableOf(vm));

    if (!changed && !pending) {
      setBase(vm);
      setValues(vmFormValuesFrom(vm));
    }
  }
  const restarts = LIVE.includes(vm.state) && restartsOnApply(request);

  const minDisk = base.resources.disk;
  const ours = submitted ? validateVmForm(values, {minDisk}) : {};
  const problem = result && !result.ok ? result.problem : null;
  const theirs = fieldErrorsFrom(problem?.fields);

  const errorOf = (field: VmField) => {
    const code = ours[field];
    if (code) {
      return t(`vms.form.errors.${code}`, {size: formatBytes(minDisk, locale)});
    }

    return theirs.fields[field];
  };

  const update = (patch: Partial<VmFormValues>) =>
    setValues((current) => ({...current, ...patch}));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);

    if (!changed || Object.keys(validateVmForm(values, {minDisk})).length > 0) {
      return;
    }

    startTransition(async () => {
      const answer = await updateVm(base.uuid, scope, request);
      setResult(answer);

      if (!answer.ok) {
        return;
      }

      setBase(applyUpdate(base, request));
      setSubmitted(false);
      notifications.show({
        color: "green",
        message: restarts
          ? t("vms.settings.savedRestarting")
          : t("vms.settings.saved"),
      });

      await queryClient.invalidateQueries({queryKey: vmKeys.all});
    });
  };

  return (
    <form onSubmit={submit} noValidate>
      <Stack>
        <Paper withBorder p="md">
          <Stack gap="xs">
            <Group gap="xs">
              <VmKindBadge kind={base.kind} />
              <Code>{base.image}</Code>
            </Group>
            <Text size="sm" c="dimmed">
              {t("vms.settings.immutable")}{" "}
              {base.persistent_disk
                ? t("vms.detail.persistentDisk")
                : t("vms.detail.ephemeralDisk")}
            </Text>
          </Stack>
        </Paper>

        <Paper withBorder p="md">
          <Stack>
            <TextInput
              label={t("vms.form.name")}
              value={values.name}
              onChange={(event) => update({name: event.currentTarget.value})}
              error={errorOf("name")}
              required
            />
            <LifetimeInput
              value={values.lifetime}
              onChange={(lifetime) => update({lifetime})}
              description={t("vms.settings.lifetimeHelp")}
              error={errorOf("lifetime")}
            />
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
              diskDescription={t("vms.settings.diskGrows", {
                size: formatBytes(minDisk, locale),
              })}
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
              kind={base.kind}
              ingress={values.ingress}
              egress={values.egress}
              onChange={update}
              errors={{ingress: errorOf("ingress"), egress: errorOf("egress")}}
            />
          </Stack>
        </Paper>

        {problem && hasMoreToSay(problem, shownBesideField) && (
          <ProblemAlert
            problem={problem}
            title={t("vms.settings.failed")}
            shown={shownBesideField}
          />
        )}

        <Alert
          variant="light"
          color={restarts ? "orange" : "gray"}
          icon={<IconAlertTriangle />}
          title={restarts ? t("vms.settings.restartTitle") : undefined}
        >
          {t("vms.settings.restartWarning")}
        </Alert>

        <Group justify="flex-end">
          <Button
            type="submit"
            loading={pending}
            disabled={!changed}
            color={restarts ? "orange" : undefined}
          >
            {restarts
              ? t("vms.settings.saveAndRestart")
              : t("vms.settings.save")}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
