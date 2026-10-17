"use client";

import {type ReactNode} from "react";
import {Alert, Button, Group, List, ListItem, Stack, Text} from "@mantine/core";
import {IconAlertTriangle, IconClockHour4} from "@tabler/icons-react";
import {useTranslations} from "@/i18n/provider";
import {
  isAboutTheWhole,
  problemMessage,
  unshownRefusals,
  type Problem,
} from "../../lib/problem";
import {DependentList} from "../dependent-list";

type Props = {
  problem: Problem;
  title?: string;

  /**
   * Which refusals are already said beside the field they are about, by JSON
   * path. Those are left out here; what was refused about the request as a
   * whole -- the VM it went to, what dockerd said -- never is.
   */
  shown?: (path: string) => boolean;

  /**
   * Whether what needs what a delete was refused for is said beside it
   * already, as a question about deleting it says it; it is left out here.
   */
  dependentsShown?: boolean;

  /** offered when asking again may help. */
  onRetry?: () => void;
  retrying?: boolean;

  children?: ReactNode;
};

/**
 * What went wrong, said where it went wrong: in the form that was sent, the
 * question that was answered, or in place of what could not be read. A delete
 * refused for what something else needs says what needs it, beneath.
 */
export function ProblemAlert({
  problem,
  title,
  shown,
  dependentsShown = false,
  onRetry,
  retrying,
  children,
}: Props) {
  const t = useTranslations();

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

        {!dependentsShown &&
          problem.dependents &&
          problem.dependents.length > 0 && (
            <div>
              <Text size="sm" fw={500}>
                {t("workload.dependents.neededBy")}
              </Text>
              <DependentList dependents={problem.dependents} />
            </div>
          )}

        {children}

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
