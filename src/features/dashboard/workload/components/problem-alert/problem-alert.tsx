"use client";

import {useId, useState, type ReactNode} from "react";
import {
  Alert,
  Button,
  Code,
  Collapse,
  Group,
  List,
  ListItem,
  Stack,
  Text,
} from "@mantine/core";
import {IconAlertTriangle, IconClockHour4} from "@tabler/icons-react";
import {useTranslations} from "@/i18n/provider";
import {
  isAboutTheWhole,
  problemMessage,
  unshownRefusals,
  type Problem,
} from "../../lib/problem";

type Props = {
  problem: Problem;
  title?: string;

  /**
   * Which refusals are already said beside the field they are about, by JSON
   * path. Those are left out here; what was refused about the request as a
   * whole -- the VM it went to, what dockerd said -- never is.
   */
  shown?: (path: string) => boolean;

  /** offered when asking again may help. */
  onRetry?: () => void;
  retrying?: boolean;

  /** whether a failed command's output is shown before anybody asks. */
  outputOpen?: boolean;

  children?: ReactNode;
};

/**
 * What went wrong, said where it went wrong: in the form that was sent, the
 * question that was answered, or in place of what could not be read. Whatever
 * a command printed on its way to failing is kept under it, since that is
 * usually what says why.
 */
export function ProblemAlert({
  problem,
  title,
  shown,
  onRetry,
  retrying,
  outputOpen = false,
  children,
}: Props) {
  const t = useTranslations();
  const outputId = useId();
  const [showingOutput, setShowingOutput] = useState(outputOpen);

  // refusals are listed, each its own sentence, and one about a field the
  // form does not show says which field that is; a single refusal of the
  // request as a whole, or anything else, is said as it is.
  const refusals =
    problem.unanswered || problem.code ? [] : unshownRefusals(problem, shown);
  const listed =
    refusals.length > 1 || refusals.some(([path]) => !isAboutTheWhole(path));

  return (
    <Alert
      color={problem.unanswered ? "yellow" : "red"}
      variant="light"
      icon={problem.unanswered ? <IconClockHour4 /> : <IconAlertTriangle />}
      title={title ?? t("errors.errorTitle")}
    >
      <Stack gap="xs">
        {listed ? (
          <List size="sm">
            {refusals.map(([path, message]) => (
              <ListItem key={path}>
                {!isAboutTheWhole(path) && (
                  <>
                    <Text span ff="monospace" size="sm" dir="ltr">
                      {path}
                    </Text>
                    {": "}
                  </>
                )}
                <Text span size="sm">
                  {message}
                </Text>
              </ListItem>
            ))}
          </List>
        ) : (
          <Text size="sm">{problemMessage(problem, t, shown)}</Text>
        )}

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
              {showingOutput
                ? t("workload.hideOutput")
                : t("workload.showOutput")}
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
