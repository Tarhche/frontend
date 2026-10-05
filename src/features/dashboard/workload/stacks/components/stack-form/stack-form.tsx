"use client";

import {useId, useState, type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {
  Alert,
  Button,
  Code,
  Fieldset,
  Group,
  List,
  ListItem,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import {notifications} from "@mantine/notifications";
import {useI18n} from "@/i18n/provider";
import {APP_PATHS} from "@/lib/app-paths";
import {
  choiceIssue,
  DockerVmSelect,
  useDockerVmChoice,
} from "@/features/dashboard/workload/docker/components/docker-vm-select";
import {ProblemAlert} from "@/features/dashboard/workload/docker/components/problem-alert";
import {
  fieldPaths,
  isRefusal,
  problemOf,
} from "@/features/dashboard/workload/docker/errors";
import {dockerKeys} from "@/features/dashboard/workload/docker/hooks/queries";
import {type VmSource} from "@/features/dashboard/workload/docker/types";
import {createStack} from "../../api";
import {type StackCreateRequest} from "../../types";
import {stackKeys} from "../../hooks/use-stacks";
import {ComposeEditor} from "../compose-editor";
import {
  EXAMPLE_COMPOSE,
  MAX_COMPOSE_BYTES,
  stackRequest,
} from "./stack-request";

// what the server may refuse that is shown beside the field it is about, as
// JSON paths; anything else it refuses is listed above the button.
const SHOWN_INLINE = [
  /^(name|compose|vm_uuid|vm)$/,
  /^vm\.(name|ports|resources\.(cpus|memory|disk)|network\.(ingress|egress))$/,
];

type Props = {
  /** where the person's own Docker VMs are listed. */
  vmSource: VmSource | null;
};

/**
 * A compose project to deploy into one of the person's Docker VMs, or into a
 * new one made for it. The compose file is taken as it is written, so it is
 * written in an editor that knows YAML; compose itself says whether it is
 * right, and what it said comes back with the refusal when it is not.
 *
 * There is no editing a stack: deploying a different file is a new stack.
 */
export function StackForm({vmSource}: Props) {
  const {t} = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();
  const composeLabel = useId();
  const composeHelp = useId();

  const vmState = useDockerVmChoice(vmSource, {allowNew: true});
  const [name, setName] = useState("");
  const [compose, setCompose] = useState(EXAMPLE_COMPOSE);
  const [attempted, setAttempted] = useState(false);

  const {body, errors: invalid} = stackRequest({name, compose}, vmState.choice);
  const vmIssue = choiceIssue(vmState.choice, vmState.vms);

  const create = useMutation({
    mutationFn: (request: StackCreateRequest) => createStack(request),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({queryKey: stackKeys.root});
      void queryClient.invalidateQueries({queryKey: dockerKeys.root});
      notifications.show({
        color: "green",
        title: t("stacks.form.created", {name: created.stack.name}),
        message: created.vm.created
          ? t("stacks.form.createdInNewVm", {vm: created.vm.name})
          : t("stacks.form.createdInVm", {vm: created.vm.name}),
      });
      router.push(APP_PATHS.dashboard.stacks.detail(created.stack.uuid));
    },
    // whatever went wrong is said in the form, beside what it was about.
    onError: () => {},
  });

  const problem = create.error ? problemOf(create.error) : null;
  const refused = fieldPaths(problem?.fields ?? {}, "stack");
  const unshown = Object.entries(refused).filter(
    ([field]) => !SHOWN_INLINE.some((pattern) => pattern.test(field)),
  );

  const fieldError = (field: string): string | undefined => {
    if (attempted && invalid[field]) {
      return t(`stacks.form.errors.${invalid[field]}`, {
        max: `${MAX_COMPOSE_BYTES / 1024} KiB`,
      });
    }

    return refused[field];
  };

  const vmError =
    attempted && vmIssue
      ? t(`containers.form.vmIssues.${vmIssue}`)
      : (refused.vm_uuid ??
        refused.vm ??
        (problem?.code === "vm_required"
          ? t("docker.errors.vm_required")
          : undefined));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAttempted(true);

    if (vmState.loading || vmIssue || Object.keys(invalid).length > 0) {
      return;
    }

    create.mutate(body);
  };

  const pending = create.isPending;
  const composeError = fieldError("compose");

  return (
    <form onSubmit={submit} noValidate>
      <Stack>
        <Fieldset legend={t("stacks.form.where")} disabled={pending}>
          <DockerVmSelect
            state={vmState}
            error={vmError}
            fieldErrors={refused}
            disabled={pending}
          />
        </Fieldset>

        <Fieldset legend={t("stacks.form.stack")} disabled={pending}>
          <Stack gap="sm">
            <TextInput
              label={t("stacks.form.name")}
              description={t("stacks.form.nameHelp")}
              value={name}
              onChange={(event) => setName(event.currentTarget.value)}
              error={fieldError("name")}
              required
              autoComplete="off"
            />

            <div>
              <Text size="sm" fw={500} id={composeLabel}>
                {t("stacks.form.compose")}{" "}
                <Text span c="red" aria-hidden>
                  *
                </Text>
              </Text>
              <Text size="xs" c="dimmed" mb="xs" id={composeHelp}>
                {t("stacks.form.composeHelp", {
                  max: `${MAX_COMPOSE_BYTES / 1024} KiB`,
                })}
              </Text>
              <ComposeEditor
                value={compose}
                onChange={setCompose}
                readOnly={pending}
                labelledBy={composeLabel}
                describedBy={composeHelp}
                invalid={Boolean(composeError)}
              />
              {composeError && (
                <Text c="red" size="sm" mt={4} role="alert">
                  {composeError}
                </Text>
              )}
            </div>
          </Stack>
        </Fieldset>

        {problem && (problem.unanswered || !isRefusal(problem)) && (
          <ProblemAlert
            problem={problem}
            title={t("stacks.form.failed")}
            outputOpen
          />
        )}

        {/* what compose said about the file, which is what says what to fix. */}
        {problem && isRefusal(problem) && problem.output && (
          <Alert
            color="red"
            variant="light"
            title={t("stacks.form.composeOutput")}
          >
            <Code
              block
              dir="ltr"
              style={{maxHeight: 320, overflow: "auto", whiteSpace: "pre-wrap"}}
            >
              {problem.output}
            </Code>
          </Alert>
        )}

        {problem && unshown.length > 0 && (
          <Alert color="red" variant="light" title={t("stacks.form.failed")}>
            <List size="sm">
              {unshown.map(([field, message]) => (
                <ListItem key={field}>
                  <Text span ff="monospace" size="sm">
                    {field}
                  </Text>
                  {": "}
                  {message}
                </ListItem>
              ))}
            </List>
          </Alert>
        )}

        <Group justify="flex-end">
          <Button type="submit" loading={pending}>
            {t("stacks.form.deploy")}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
