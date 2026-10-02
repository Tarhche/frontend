"use client";

import {useActionState, useState} from "react";
import dynamic from "next/dynamic";
import {Box, Button, Group, Stack, Text, TextInput} from "@mantine/core";
import {ValidationErrorsAlert} from "@/components/errors/validation-errors-alert";
import {useTranslations} from "@/i18n/provider";
import {
  nonFieldErrorEntries,
  validationMessage,
} from "@/lib/api/validation-errors";
import {runStack, type RunStackState} from "../../actions/run-stack";
import {useRedrawOnAnswer} from "../../hooks/use-redraw-on-answer";
import {initialRuntime, type Runtime} from "../../runtimes";
import {RuntimeSelector} from "../runtime-selector";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

const initialState: RunStackState = {};

// the fields an error is drawn beside. A stack is one payload, so whatever
// else the workload refuses is about some service in it, and is listed with
// the service it is about.
const FIELDS = ["name", "services", "runtime"] as const;

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

type Props = {
  /**
   * The classes the workload offers to run a stack as, or nothing when it has
   * not said. Then no choice is offered and none is sent, and the stack runs
   * as the workload's default.
   */
  runtimes?: Runtime[] | null;
};

/**
 * A stack is written the way a compose file writes one: a services block, keyed
 * by the names the services reach each other by.
 */
export function StackForm({runtimes}: Props) {
  const t = useTranslations();
  const [state, formAction, isPending] = useActionState(runStack, initialState);
  useRedrawOnAnswer(state);

  const [services, setServices] = useState(state.values?.services ?? example);
  const [jsonError, setJsonError] = useState<string | null>(null);

  // one class for the whole stack: its services share a network, and a
  // network belongs to one class.
  const [runtime, setRuntime] = useState(() =>
    runtimes ? initialRuntime(runtimes, {stack: true}) : undefined,
  );

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

  const error = (field: string) => {
    const message = state.errors?.[field];

    return message ? validationMessage(t, message) : undefined;
  };

  const servicesError =
    jsonError ??
    (state.errors?.services === "invalid_json"
      ? t("stacks.form.invalidJson")
      : error("services"));

  const refused = nonFieldErrorEntries(state.errors, FIELDS).map(
    ({field, message}) => `${field}: ${validationMessage(t, message)}`,
  );

  return (
    <form action={formAction}>
      <Stack>
        <TextInput
          name="name"
          label={t("stacks.form.name")}
          defaultValue={state.values?.name}
          error={error("name")}
          required
        />

        {runtimes && (
          <RuntimeSelector
            runtimes={runtimes}
            value={runtime}
            onChange={setRuntime}
            error={error("runtime")}
            stack
          />
        )}

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

        <ValidationErrorsAlert errors={refused} />

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
