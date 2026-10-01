"use client";

import {useActionState, useState} from "react";
import dynamic from "next/dynamic";
import {Box, Button, Group, Stack, Text, TextInput} from "@mantine/core";
import {useTranslations} from "@/i18n/provider";
import {runStack, type RunStackState} from "../../actions/run-stack";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

const initialState: RunStackState = {};

const example = `{
  "web": {
    "image": "nginx:1.27-alpine",
    "ports": ["80"]
  },
  "api": {
    "image": "hashicorp/http-echo",
    "command": ["-listen=:5678", "-text=hello from api"],
    "ports": ["5678"],
    "read_only": true
  }
}`;

/**
 * A stack is written the way a compose file writes one: a services block, keyed
 * by the names the services reach each other by.
 */
export function StackForm() {
  const t = useTranslations();
  const [state, formAction, isPending] = useActionState(runStack, initialState);

  const [services, setServices] = useState(state.values?.services ?? example);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const validate = (value: string) => {
    if (value.trim().length === 0) {
      setJsonError(t("stacks.form.emptyJson"));

      return false;
    }

    try {
      JSON.parse(value);
      setJsonError(null);

      return true;
    } catch {
      setJsonError(t("stacks.form.invalidJson"));

      return false;
    }
  };

  const prettify = () => {
    try {
      setServices(JSON.stringify(JSON.parse(services), null, 2));
      setJsonError(null);
    } catch {
      setJsonError(t("stacks.form.prettifyError"));
    }
  };

  const servicesError =
    jsonError ??
    (state.errors?.services === "invalid_json"
      ? t("stacks.form.invalidJson")
      : state.errors?.services);

  return (
    <form action={formAction}>
      <Stack>
        <TextInput
          name="name"
          label={t("stacks.form.name")}
          defaultValue={state.values?.name}
          error={state.errors?.name}
          required
        />

        <div>
          <Text size="sm" fw={500} mb={2}>
            {t("stacks.form.services")}
          </Text>
          <Text size="xs" c="dimmed" mb="xs">
            {t("stacks.form.servicesHelp")}
          </Text>

          {/* the editor is not an input, so this is what the form submits. */}
          <input type="hidden" name="services" value={services} />

          <Box
            dir={"ltr"}
            style={{
              border: "1px solid var(--mantine-color-gray-4)",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <MonacoEditor
              height="420px"
              language="json"
              value={services}
              onChange={(value) => {
                const written = value ?? "";
                setServices(written);
                validate(written);
              }}
              options={{
                minimap: {enabled: false},
                scrollBeyondLastLine: false,
                readOnly: isPending,
                wordWrap: "on",
                automaticLayout: true,
                tabSize: 2,
              }}
            />
          </Box>

          {servicesError && (
            <Text c="red" size="sm" mt="xs">
              {servicesError}
            </Text>
          )}
        </div>

        <Group justify="space-between">
          <Button
            variant="default"
            type="button"
            onClick={prettify}
            disabled={isPending}
          >
            {t("stacks.form.prettify")}
          </Button>

          <Button type="submit" loading={isPending} disabled={!!jsonError}>
            {t("stacks.form.run")}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
