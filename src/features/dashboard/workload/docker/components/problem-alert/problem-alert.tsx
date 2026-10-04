"use client";

import {useId, useState, type ReactNode} from "react";
import {Alert, Button, Code, Collapse, Group, Stack, Text} from "@mantine/core";
import {IconAlertTriangle, IconClockHour4} from "@tabler/icons-react";
import {useTranslations} from "@/i18n/provider";
import {problemMessage, type Problem} from "../../errors";

type Props = {
  problem: Problem;
  title?: string;

  /** offered when asking again may help. */
  onRetry?: () => void;
  retrying?: boolean;

  /** whether a failed command's output is shown before anybody asks. */
  outputOpen?: boolean;

  children?: ReactNode;
};

/**
 * What went wrong, said where it went wrong. Whatever a command printed on its
 * way to failing is kept under it, since that is usually what says why.
 */
export function ProblemAlert({
  problem,
  title,
  onRetry,
  retrying,
  outputOpen = false,
  children,
}: Props) {
  const t = useTranslations();
  const outputId = useId();
  const [showingOutput, setShowingOutput] = useState(outputOpen);

  return (
    <Alert
      color={problem.unanswered ? "yellow" : "red"}
      variant="light"
      icon={problem.unanswered ? <IconClockHour4 /> : <IconAlertTriangle />}
      title={title ?? t("errors.errorTitle")}
    >
      <Stack gap="xs">
        <Text size="sm">{problemMessage(problem, t)}</Text>

        {children}

        {problem.output && (
          <div>
            <Button
              variant="subtle"
              size="compact-sm"
              onClick={() => setShowingOutput((showing) => !showing)}
              aria-expanded={showingOutput}
              aria-controls={outputId}
            >
              {showingOutput ? t("docker.hideOutput") : t("docker.showOutput")}
            </Button>
            <Collapse expanded={showingOutput} id={outputId}>
              <Code
                block
                dir="ltr"
                mt="xs"
                style={{
                  maxHeight: 320,
                  overflow: "auto",
                  whiteSpace: "pre-wrap",
                }}
              >
                {problem.output}
              </Code>
            </Collapse>
          </div>
        )}

        {onRetry && (
          <Group>
            <Button
              size="xs"
              variant="light"
              color={problem.unanswered ? "yellow" : "red"}
              onClick={onRetry}
              loading={retrying}
            >
              {t("common.retry")}
            </Button>
          </Group>
        )}
      </Stack>
    </Alert>
  );
}
