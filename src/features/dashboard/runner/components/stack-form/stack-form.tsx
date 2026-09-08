"use client";

import {useActionState} from "react";
import {Button, Group, Stack, TextInput, Textarea} from "@mantine/core";
import {useTranslations} from "@/i18n/provider";
import {runStack, type RunStackState} from "../../actions/run-stack";

const initialState: RunStackState = {};

const example = `{
  "web": {
    "image": "nginx:1.27-alpine",
    "ports": ["80"]
  },
  "api": {
    "image": "hashicorp/http-echo",
    "command": ["-listen=:5678", "-text=hello from api"],
    "ports": ["5678"]
  }
}`;

/**
 * A stack is written the way a compose file writes one: a services block, keyed
 * by the names the services reach each other by.
 */
export function StackForm() {
  const t = useTranslations();
  const [state, formAction, isPending] = useActionState(runStack, initialState);

  const servicesError =
    state.errors?.services === "invalid_json"
      ? t("stacks.form.invalidJson")
      : state.errors?.services;

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
        <Textarea
          name="services"
          label={t("stacks.form.services")}
          description={t("stacks.form.servicesHelp")}
          defaultValue={state.values?.services ?? example}
          error={servicesError}
          autosize
          minRows={14}
          styles={{input: {fontFamily: "var(--mantine-font-family-monospace)"}}}
          required
        />
        <Group justify="flex-end">
          <Button type="submit" loading={isPending}>
            {t("stacks.form.run")}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
