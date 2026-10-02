"use client";

import {useActionState, useState} from "react";
import {
  Alert,
  Button,
  Group,
  NumberInput,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Switch,
  TextInput,
  Textarea,
} from "@mantine/core";
import {IconInfoCircle} from "@tabler/icons-react";
import {ValidationErrorsAlert} from "@/components/errors/validation-errors-alert";
import {type TFunction} from "@/i18n/dictionary";
import {useTranslations} from "@/i18n/provider";
import {nonFieldErrors, validationMessage} from "@/lib/api/validation-errors";
import {runTask, type RunTaskState} from "../../actions/run-task";
import {useRedrawOnAnswer} from "../../hooks/use-redraw-on-answer";
import {
  allows,
  capabilitiesOf,
  composeSize,
  initialRuntime,
  within,
  type Runtime,
  type RuntimeCapabilities,
} from "../../runtimes";
import {RuntimeSelector} from "../runtime-selector";

const initialState: RunTaskState = {};

// the fields an error is drawn beside. Whatever else the workload refuses is
// listed above the button rather than not shown at all.
const FIELDS = [
  "name",
  "image",
  "runtime",
  "command",
  "entrypoint",
  "working_dir",
  "environment",
  "ports",
  "network_mode",
  "restart",
  "deploy.resources.limits",
] as const;

const NETWORK_POLICIES = [
  {value: "none", label: "tasks.form.networkNone"},
  {value: "isolated", label: "tasks.form.networkIsolated"},
  {value: "public", label: "tasks.form.networkPublic"},
];

const RESTART_POLICIES = ["no", "always", "on-failure", "unless-stopped"];

// what is sent instead of a choice the chosen class cannot honour: never more
// of a network than was asked for, and a restart as close to the one asked
// for as the class has.
const NETWORK_FALLBACK = ["isolated", "none", "public"];
const RESTART_FALLBACK = ["unless-stopped", "always", "on-failure", "no"];

type Props = {
  /**
   * The classes the workload offers to run a task as, or nothing when it has
   * not said. Then no choice is offered and none is sent, and the task runs as
   * the workload's default.
   */
  runtimes?: Runtime[] | null;
};

/**
 * The specification of one task, in the shape a docker compose service has.
 * There is no edit form, and there never will be: a task is immutable, so
 * changing one means running another and deleting this.
 */
export function TaskForm({runtimes}: Props) {
  const t = useTranslations();
  const [state, formAction, isPending] = useActionState(runTask, initialState);
  useRedrawOnAnswer(state);

  // what is chosen. What is drawn and sent is as much of it as the chosen
  // class can honour, so that trying another class and coming back gives
  // back what was chosen.
  const [runtime, setRuntime] = useState(() =>
    runtimes ? initialRuntime(runtimes) : undefined,
  );
  const [network, setNetwork] = useState("isolated");
  const [readOnly, setReadOnly] = useState(false);
  const [restart, setRestart] = useState("unless-stopped");

  const capabilities = capabilitiesOf(runtimes, runtime);
  const networkAllowed = (policy: string) =>
    allows(capabilities?.network_policies, policy);
  const restartAllowed = (policy: string) =>
    allows(capabilities?.restart_policies, policy);
  const readOnlyAllowed = capabilities?.read_only_root !== false;

  const error = (field: string) => {
    const message = state.errors?.[field];

    return message ? validationMessage(t, message) : undefined;
  };

  const refused = nonFieldErrors(state.errors, FIELDS).map((message) =>
    validationMessage(t, message),
  );

  return (
    <form action={formAction}>
      <Stack>
        <Alert
          variant="light"
          color="blue"
          icon={<IconInfoCircle />}
          title={t("tasks.form.immutable")}
        />

        {runtimes && (
          <Paper withBorder p="md">
            <RuntimeSelector
              runtimes={runtimes}
              value={runtime}
              onChange={setRuntime}
              error={error("runtime")}
            />
          </Paper>
        )}

        <Paper withBorder p="md">
          <Stack>
            <TextInput
              name="name"
              label={t("tasks.form.name")}
              description={t("tasks.form.nameHelp")}
              error={error("name")}
              required
            />
            <TextInput
              name="image"
              label={t("tasks.form.image")}
              placeholder="nginx:1.27-alpine"
              error={error("image")}
              required
            />
            <Textarea
              name="command"
              label={t("tasks.form.command")}
              autosize
              minRows={1}
              error={error("command")}
            />
            <Textarea
              name="entrypoint"
              label={t("tasks.form.entrypoint")}
              autosize
              minRows={1}
              error={error("entrypoint")}
            />
            <TextInput
              name="working_dir"
              label={t("tasks.form.workingDir")}
              error={error("working_dir")}
            />
            <Textarea
              name="environment"
              label={t("tasks.form.environment")}
              description={t("tasks.form.environmentHelp")}
              autosize
              minRows={3}
              error={error("environment")}
            />
          </Stack>
        </Paper>

        <Paper withBorder p="md">
          <Stack>
            <Textarea
              name="ports"
              label={t("tasks.form.ports")}
              description={t("tasks.form.portsHelp")}
              autosize
              minRows={2}
              placeholder="80"
              error={error("ports")}
            />
            <RadioGroup
              name="network_mode"
              label={t("tasks.form.network")}
              value={within(
                network,
                capabilities?.network_policies,
                NETWORK_FALLBACK,
              )}
              onChange={setNetwork}
              error={error("network_mode")}
            >
              <Stack gap="xs" mt="xs">
                {NETWORK_POLICIES.map(({value, label}) => (
                  <Radio
                    key={value}
                    value={value}
                    label={t(label)}
                    disabled={!networkAllowed(value)}
                    description={
                      networkAllowed(value)
                        ? undefined
                        : t("tasks.runtime.unsupported")
                    }
                  />
                ))}
              </Stack>
            </RadioGroup>
            <Switch
              name="read_only"
              label={t("tasks.form.readOnly")}
              description={
                readOnlyAllowed
                  ? t("tasks.form.readOnlyHelp")
                  : `${t("tasks.form.readOnlyHelp")} ${t("tasks.runtime.unsupported")}`
              }
              checked={readOnlyAllowed && readOnly}
              disabled={!readOnlyAllowed}
              onChange={(event) => setReadOnly(event.currentTarget.checked)}
            />
          </Stack>
        </Paper>

        <Paper withBorder p="md">
          <Group grow align="flex-start">
            <NumberInput
              name="cpus"
              label={t("tasks.form.cpus")}
              description={cpusHint(t, capabilities)}
              defaultValue={0.5}
              min={0.1}
              max={capabilities?.max_cpu || undefined}
              step={0.1}
              decimalScale={2}
              error={error("deploy.resources.limits")}
            />
            <TextInput
              name="memory"
              label={t("tasks.form.memory")}
              description={memoryHint(t, capabilities)}
              defaultValue="256M"
            />
            <Select
              name="restart"
              label={t("tasks.form.restart")}
              value={within(
                restart,
                capabilities?.restart_policies,
                RESTART_FALLBACK,
              )}
              onChange={(value) => value && setRestart(value)}
              allowDeselect={false}
              data={RESTART_POLICIES.map((policy) => ({
                value: policy,
                label: policy,
                disabled: !restartAllowed(policy),
              }))}
              error={error("restart")}
            />
          </Group>
        </Paper>

        <ValidationErrorsAlert errors={refused} />

        <Group justify="flex-end">
          <Button type="submit" loading={isPending}>
            {t("tasks.form.run")}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}

/** How many CPUs the chosen class gives a task at most, when it says. */
function cpusHint(
  t: TFunction,
  capabilities: RuntimeCapabilities | undefined,
): string | undefined {
  if (!capabilities?.max_cpu) {
    return undefined;
  }

  return t("tasks.runtime.cpusAtMost", {max: capabilities.max_cpu});
}

/**
 * How much memory the chosen class gives a task, when it says, in the units
 * the field is written in.
 */
function memoryHint(
  t: TFunction,
  capabilities: RuntimeCapabilities | undefined,
): string | undefined {
  const min = capabilities?.min_memory ?? 0;
  const max = capabilities?.max_memory ?? 0;

  if (min > 0 && max > 0) {
    return t("tasks.runtime.memoryBetween", {
      min: composeSize(min),
      max: composeSize(max),
    });
  }

  if (min > 0) {
    return t("tasks.runtime.memoryAtLeast", {min: composeSize(min)});
  }

  if (max > 0) {
    return t("tasks.runtime.memoryAtMost", {max: composeSize(max)});
  }

  return undefined;
}
