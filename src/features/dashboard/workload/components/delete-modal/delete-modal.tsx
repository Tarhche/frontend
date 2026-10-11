"use client";

import {useId, useState, type ReactNode} from "react";
import {
  Alert,
  Box,
  Group,
  Loader,
  Radio,
  RadioGroup,
  Stack,
  Text,
} from "@mantine/core";
import {notifications} from "@mantine/notifications";
import {IconAlertTriangle} from "@tabler/icons-react";
import {useQuery} from "@tanstack/react-query";
import {useTranslations} from "@/i18n/provider";
import {type TFunction} from "@/i18n/dictionary";
import {type Dependent, type Removal} from "../../lib/dependents";
import {type Problem} from "../../lib/problem";
import {ConfirmModal} from "../confirm-modal";
import {
  DependentList,
  dependentName,
  dependentSentence,
  type Needed,
} from "../dependent-list";
import {ProblemAlert} from "../problem-alert";

/**
 * Says, once something was deleted alone, that it will come back, and what
 * brings it back: what needs it makes it again. Nothing is said otherwise.
 */
export function sayComingBack(
  t: TFunction,
  what: Needed,
  name: string,
  removal: Removal,
) {
  if (!removal.recreated) {
    return;
  }

  notifications.show({
    color: "blue",
    title: t("workload.dependents.comesBack", {name}),
    message: removal.dependents
      .filter((dependent) => dependent.recreates)
      .map((dependent) =>
        dependentSentence(t, dependent, what, dependentName(dependent)),
      )
      .join(" "),
  });
}

type Props = {
  opened: boolean;
  onClose: () => void;

  /** asked to delete it alone, or together with what needs it (cascade). */
  onConfirm: (cascade: boolean) => void;

  /** what is deleted, as it is named. */
  what: Needed;

  /**
   * What needs it, read as the question opens, and what it is read about, as
   * the key it is kept under. Left out for what nothing can need, a VM that
   * is not a Docker VM: its question is as it always was.
   */
  needs?: {key: readonly unknown[]; read: () => Promise<Removal>};

  /** the question, and anything that has to be decided about it. */
  children: ReactNode;
  confirmLabel: string;
  loading?: boolean;

  /** why the delete itself did not go through, said where it was asked. */
  problem?: Problem | null;

  /** where what needs it may be looked at, for whoever may; null where not. */
  hrefOf?: (dependent: Dependent) => string | null;
};

/**
 * Asks before deleting something stacks and containers may need: a Docker
 * VM, or a network or a volume in one. What needs it is read as the question
 * opens, which changes nothing, and the answer waits until it is known.
 * Nothing needing it, the question is as it always was. Otherwise it says
 * what needs it, each linked where it may be looked at, and offers to delete
 * it alone, worded for what each of them then does -- make it again, or wait
 * for it to come back -- or together with them.
 *
 * What needs it may not be readable -- the API may not know how to say -- in
 * which case that is said, and the question can still be answered. A delete
 * refused for what needs it says so with the same two answers.
 */
export function DeleteModal({
  opened,
  onClose,
  onConfirm,
  what,
  needs,
  children,
  confirmLabel,
  loading = false,
  problem,
  hrefOf,
}: Props) {
  const t = useTranslations();
  const listId = useId();
  const [together, setTogether] = useState(false);

  // each time it opens, it is to be deleted alone until somebody says
  // otherwise.
  const [wasOpened, setWasOpened] = useState(opened);
  if (opened !== wasOpened) {
    setWasOpened(opened);
    if (opened) {
      setTogether(false);
    }
  }

  const preview = useQuery({
    queryKey: ["workload", "dependents", ...(needs?.key ?? [])],
    queryFn: () => needs!.read(),
    enabled: opened && needs !== undefined,
    retry: false,
    staleTime: 0,
    gcTime: 0,
    meta: {silent: true},
  });

  // what is said is what the last read said, once it has: one read again as
  // the question opens again says nothing until it is answered.
  const checking = opened && preview.isFetching;
  const checked = !checking && preview.isSuccess ? preview.data : null;
  const unchecked = !checking && preview.isError;

  // what needs it: as the delete itself was refused with, which is the latest
  // word on it, or as it was read.
  const dependents = problem?.dependents ?? checked?.dependents ?? [];
  const choosing = !checking && dependents.length > 0;

  return (
    <ConfirmModal
      opened={opened}
      onClose={onClose}
      onConfirm={() => onConfirm(choosing && together)}
      confirmLabel={confirmLabel}
      loading={loading}
      waiting={checking}
    >
      {children}

      {checking && (
        <Group gap="xs" role="status">
          <Loader size="xs" />
          <Text size="sm" c="dimmed">
            {t("workload.dependents.checking")}
          </Text>
        </Group>
      )}

      {unchecked && !problem && (
        <Alert
          color="yellow"
          variant="light"
          role="status"
          icon={<IconAlertTriangle />}
        >
          <Text size="sm">{t("workload.dependents.checkFailed")}</Text>
        </Alert>
      )}

      {choosing && (
        <RadioGroup
          label={t("workload.dependents.choose")}
          value={together ? "together" : "alone"}
          onChange={(value) => setTogether(value === "together")}
        >
          <Stack gap="sm" mt="xs">
            <div>
              <Radio
                value="alone"
                label={t(`workload.dependents.alone.${what}`)}
                aria-describedby={listId}
              />
              <Box ps="xl" pt={4}>
                <DependentList
                  id={listId}
                  dependents={dependents}
                  what={what}
                  hrefOf={hrefOf}
                />
              </Box>
            </div>
            <Radio
              value="together"
              label={t(`workload.dependents.together.${what}`)}
              description={t(`workload.dependents.togetherHelp.${what}`)}
            />
          </Stack>
        </RadioGroup>
      )}

      {problem && <ProblemAlert problem={problem} dependentsShown={choosing} />}
    </ConfirmModal>
  );
}
