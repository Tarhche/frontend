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
import {
  runContainer,
  type RunContainerState,
} from "../../actions/run-container";

const initialState: RunContainerState = {};

/**
 * The specification of one container, in the shape a docker compose service
 * has. There is no edit form, and there never will be: a container is
 * immutable, so changing one means running another and deleting this.
 */
export function ContainerForm() {
  const t = useTranslations();
  const [state, formAction, isPending] = useActionState(
    runContainer,
    initialState,
  );

  const error = (field: string) => state.errors?.[field];

  return (
    <form action={formAction}>
      <Stack>
        <Alert
          variant="light"
          color="blue"
          icon={<IconInfoCircle />}
          title={t("containers.form.immutable")}
        />

        <Paper withBorder p="md">
          <Stack>
            <TextInput
              name="name"
              label={t("containers.form.name")}
              description={t("containers.form.nameHelp")}
              error={error("name")}
              required
            />
            <TextInput
              name="image"
              label={t("containers.form.image")}
              placeholder="nginx:1.27-alpine"
              error={error("image")}
              required
            />
            <Textarea
              name="command"
              label={t("containers.form.command")}
              autosize
              minRows={1}
              error={error("command")}
            />
            <Textarea
              name="entrypoint"
              label={t("containers.form.entrypoint")}
              autosize
              minRows={1}
              error={error("entrypoint")}
            />
            <TextInput
              name="working_dir"
              label={t("containers.form.workingDir")}
              error={error("working_dir")}
            />
            <Textarea
              name="environment"
              label={t("containers.form.environment")}
              description={t("containers.form.environmentHelp")}
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
              label={t("containers.form.ports")}
              description={t("containers.form.portsHelp")}
              autosize
              minRows={2}
              placeholder="80"
              error={error("ports")}
            />
            <RadioGroup
              name="network_mode"
              label={t("containers.form.network")}
              defaultValue="isolated"
              error={error("network_mode")}
            >
              <Stack gap="xs" mt="xs">
                <Radio value="none" label={t("containers.form.networkNone")} />
                <Radio
                  value="isolated"
                  label={t("containers.form.networkIsolated")}
                />
                <Radio
                  value="public"
                  label={t("containers.form.networkPublic")}
                />
              </Stack>
            </RadioGroup>
            <Switch
              name="read_only"
              label={t("containers.form.readOnly")}
              description={t("containers.form.readOnlyHelp")}
            />
          </Stack>
        </Paper>

        <Paper withBorder p="md">
          <Group grow align="flex-start">
            <NumberInput
              name="cpus"
              label={t("containers.form.cpus")}
              defaultValue={0.5}
              min={0.1}
              step={0.1}
              decimalScale={2}
              error={error("deploy.resources.limits")}
            />
            <TextInput
              name="memory"
              label={t("containers.form.memory")}
              defaultValue="256M"
            />
            <Select
              name="restart"
              label={t("containers.form.restart")}
              defaultValue="unless-stopped"
              data={["no", "always", "on-failure", "unless-stopped"]}
              error={error("restart")}
            />
          </Group>
        </Paper>

        <Group justify="flex-end">
          <Button type="submit" loading={isPending}>
            {t("containers.form.run")}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
