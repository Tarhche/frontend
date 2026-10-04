"use client";

import {type ReactNode} from "react";
import {Badge, Radio, RadioGroup, Stack} from "@mantine/core";
import {useTranslations} from "@/i18n/provider";
import {
  refusalOf,
  runtimeHint,
  runtimeName,
  type Runtime,
} from "../../runtimes";

type Props = {
  runtimes: Runtime[];
  value: string | undefined;
  onChange: (runtime: string) => void;
  error?: ReactNode;

  /**
   * Whether what is being run is a stack, which a class can only run when it
   * can give the stack's services a network to share.
   */
  stack?: boolean;
};

/**
 * Which class a task is run as.
 *
 * Every class the workload allows is offered. One that cannot be chosen right
 * now is still shown, and says why, rather than left out: that it is there and
 * out of reach is worth knowing.
 */
export function RuntimeSelector({
  runtimes,
  value,
  onChange,
  error,
  stack = false,
}: Props) {
  const t = useTranslations();

  return (
    <RadioGroup
      name="runtime"
      label={t("tasks.runtime.label")}
      value={value ?? null}
      onChange={onChange}
      error={error}
    >
      <Stack gap="xs" mt="xs">
        {runtimes.map((runtime) => {
          const refusal = refusalOf(runtime, {stack});
          const description = [
            runtimeHint(t, runtime),
            refusal && t(`tasks.runtime.${refusal}`),
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <Radio
              key={runtime.class}
              value={runtime.class}
              disabled={refusal !== undefined}
              label={
                <>
                  {runtimeName(t, runtime.class)}
                  {runtime.default && (
                    <Badge
                      component="span"
                      size="xs"
                      variant="light"
                      color="gray"
                      ms={6}
                    >
                      {t("tasks.runtime.default")}
                    </Badge>
                  )}
                </>
              }
              description={description || undefined}
            />
          );
        })}
      </Stack>
    </RadioGroup>
  );
}
