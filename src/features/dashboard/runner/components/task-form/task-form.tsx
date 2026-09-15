"use client";

import {useActionState} from "react";
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
import {useTranslations} from "@/i18n/provider";
import {runTask, type RunTaskState} from "../../actions/run-task";

const initialState: RunTaskState = {};

/**
 * The specification of one task, in the shape a docker compose service has.
 * There is no edit form, and there never will be: a task is immutable, so
 * changing one means running another and deleting this.
 */
export function TaskForm() {
  const t = useTranslations();
  const [state, formAction, isPending] = useActionState(runTask, initialState);

  const error = (field: string) => state.errors?.[field];

  return (
    <form action={formAction}>
      <Stack>
        <Alert
          variant="light"
          color="blue"
          icon={<IconInfoCircle />}
          title={t("tasks.form.immutable")}
        />

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
              defaultValue="isolated"
              error={error("network_mode")}
            >
              <Stack gap="xs" mt="xs">
                <Radio value="none" label={t("tasks.form.networkNone")} />
                <Radio
                  value="isolated"
                  label={t("tasks.form.networkIsolated")}
                />
                <Radio value="public" label={t("tasks.form.networkPublic")} />
              </Stack>
            </RadioGroup>
            <Switch
              name="read_only"
              label={t("tasks.form.readOnly")}
              description={t("tasks.form.readOnlyHelp")}
            />
          </Stack>
        </Paper>

        <Paper withBorder p="md">
          <Group grow align="flex-start">
            <NumberInput
              name="cpus"
              label={t("tasks.form.cpus")}
              defaultValue={0.5}
              min={0.1}
              step={0.1}
              decimalScale={2}
              error={error("deploy.resources.limits")}
            />
            <TextInput
              name="memory"
              label={t("tasks.form.memory")}
              defaultValue="256M"
            />
            <Select
              name="restart"
              label={t("tasks.form.restart")}
              defaultValue="unless-stopped"
              data={["no", "always", "on-failure", "unless-stopped"]}
              error={error("restart")}
            />
          </Group>
        </Paper>

        <Group justify="flex-end">
          <Button type="submit" loading={isPending}>
            {t("tasks.form.run")}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
