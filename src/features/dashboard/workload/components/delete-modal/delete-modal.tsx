"use client";

import {useId, useState, type ReactNode} from "react";
import {
  Box,
  Group,
  Loader,
  Radio,
  RadioGroup,
  Stack,
  Text,
} from "@mantine/core";
import {notifications} from "@mantine/notifications";
import {useQuery} from "@tanstack/react-query";
import {useTranslations} from "@/i18n/provider";
import {type TFunction} from "@/i18n/dictionary";
import {type Dependent, type Removal} from "../../lib/dependents";
import {problemOf, type Problem} from "../../lib/problem";
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
   * The same delete, asked as a dry run, which deletes nothing, and what it
   * is asked about and how, as a key: it is asked whenever the question opens,
   * and again whenever that changes, a force somebody ticked say.
   */
  dryRun: () => Promise<Removal>;
  dryRunKey: readonly unknown[];

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
 * Asks before deleting something stacks and containers may need: a VM, or a
 * network or a volume in one. What needs it is asked for as the question
 * opens, as a dry run of the very delete, and the answer waits until it is
 * known. Nothing needing it, the question is as it always was. Otherwise it
 * says what needs it, each linked where it may be looked at, and offers to
 * delete it alone, worded for what each of them then does -- make it again,
 * or wait for it to come back -- or together with them.
 *
 * A dry run that fails says why, and the question can still be answered: the
 * delete itself says whether it goes ahead.
 */
export function DeleteModal({
  opened,
  onClose,
  onConfirm,
  what,
  dryRun,
  dryRunKey,
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
    queryKey: ["workload", "dependents", ...dryRunKey],
    queryFn: dryRun,
    enabled: opened,
    retry: false,
    staleTime: 0,
    gcTime: 0,
    meta: {silent: true},
  });

  // what is said is what the last dry run said, once it has: one asked again
  // as the question opens again says nothing until it is answered.
  const checking = opened && preview.isFetching;
  const checked = !checking && preview.isSuccess ? preview.data : null;
  const unchecked =
    !checking && preview.isError ? problemOf(preview.error) : null;

  // what needs it: as the delete itself was refused with, which is the latest
  // word on it, or as the dry run was answered or refused with.
  const dependents =
    problem?.dependents ?? checked?.dependents ?? unchecked?.dependents ?? [];
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
        <ProblemAlert
          problem={unchecked}
          title={t(
            unchecked.status === 400
              ? "workload.dependents.refused"
              : "workload.dependents.checkFailed",
          )}
          dependentsShown={choosing}
        />
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
