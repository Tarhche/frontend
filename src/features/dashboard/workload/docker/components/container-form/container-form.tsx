"use client";

import {useId, useState, type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {
  Alert,
  Anchor,
  Autocomplete,
  Button,
  Fieldset,
  Group,
  MultiSelect,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import {notifications} from "@mantine/notifications";
import {IconWorldOff} from "@tabler/icons-react";
import Link from "@/components/link";
import {useI18n} from "@/i18n/provider";
import {AmountInput} from "@/features/dashboard/workload/vms/components/fields/amount-input";
import {SizeInput} from "@/features/dashboard/workload/vms/components/fields/size-input";
import {APP_PATHS} from "@/lib/app-paths";
import {type Scope} from "@/features/dashboard/workload/vms/api";
import {type VmSource} from "@/features/dashboard/workload/vms/permissions";
import {vmReadiness} from "@/features/dashboard/workload/vms/lib/state";
import {
  fieldPaths,
  hasMoreToSay,
  problemOf,
} from "@/features/dashboard/workload/lib/problem";
import {ProblemAlert} from "@/features/dashboard/workload/components/problem-alert";
import {createContainer} from "../../api";
import {ltr} from "../../format";
import {dockerKeys} from "../../hooks/queries";
import {
  useImages,
  useNetworks,
  useVolumes,
} from "../../hooks/use-docker-objects";
import {type ContainerCreateRequest, type RestartPolicy} from "../../types";
import {
  choiceIssue,
  DockerVmSelect,
  useDockerVmChoice,
} from "../docker-vm-select";
import {Waiting} from "../waiting";
import {
  containerRequest,
  emptyContainer,
  reachability,
  type ContainerValues,
} from "./container-request";
import {EnvRowsField, MountRowsField, PortRowsField} from "./rows-fields";

const RESTART_POLICIES: RestartPolicy[] = [
  "no",
  "always",
  "unless-stopped",
  "on-failure",
];

// what the server may refuse that is shown beside the field it is about, as
// JSON paths; anything else it refuses is listed above the button instead, so
// that nothing it says goes unsaid.
const SHOWN_INLINE = [
  /^(image|name|command|entrypoint|working_dir|networks|restart_policy|cpus|memory|vm_uuid|vm|env|ports|mounts)$/,
  /^vm\.(name|ports(\.\d+)?|resources\.(cpus|memory|disk)|network\.(ingress|egress))$/,
  /^env\.\d+$/,
  /^ports\.\d+(\.(container_port|host_port))?$/,
  /^mounts\.\d+(\.(source|target))?$/,
];

export function shownInline(path: string): boolean {
  return SHOWN_INLINE.some((pattern) => pattern.test(path));
}

type Props = {
  /** where the person's own Docker VMs are listed. */
  vmSource: VmSource | null;

  /** where a VM's images, networks and volumes may be read, if anywhere. */
  listScope: Scope | null;
};

/**
 * A container, as `docker run` would have it, in one of the person's Docker
 * VMs or in a new one made for it.
 *
 * Creating it pulls its image first when the VM does not have it, which takes
 * minutes rather than seconds, and nothing comes back until it is done: the
 * form says so, and for how long it has been, while it waits. If no answer
 * comes back at all, the pull may still be going, and the form says that too
 * rather than calling it a failure.
 */
export function ContainerForm({vmSource, listScope}: Props) {
  const {t} = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();

  const vmState = useDockerVmChoice(vmSource, {allowNew: true});
  const [values, setValues] = useState<ContainerValues>(emptyContainer);
  const [attempted, setAttempted] = useState(false);
  const restartPolicyLabel = useId();

  const {choice} = vmState;
  const existing = choice.kind === "existing" ? choice.vm : null;

  // what is already in the VM is offered as it is, when the VM can say.
  const askable =
    existing !== null &&
    listScope !== null &&
    vmReadiness(existing.state) === "running";
  const vmUuid = existing?.uuid ?? "";
  const images = useImages(listScope ?? "mine", vmUuid, {enabled: askable});
  const networks = useNetworks(listScope ?? "mine", vmUuid, {
    enabled: askable,
  });
  const volumes = useVolumes(listScope ?? "mine", vmUuid, {enabled: askable});

  // a container joins networks of its own VM only, and host and none are not
  // networks one joins beside another.
  const attachable = askable
    ? (networks.data ?? []).filter(
        (network) => network.driver !== "host" && network.driver !== "null",
      )
    : [];
  const attachableNames = new Set(attachable.map((network) => network.name));
  const pickedNetworks = values.networks.filter((name) =>
    attachableNames.has(name),
  );

  const {body, errors: invalid} = containerRequest(
    {...values, networks: pickedNetworks},
    choice,
  );
  const reach = reachability(body.ports ?? [], choice);
  const vmIssue = choiceIssue(choice, vmState.vms);

  const create = useMutation({
    mutationFn: (request: ContainerCreateRequest) => createContainer(request),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({queryKey: dockerKeys.root});
      notifications.show({
        color: "green",
        title: t("containers.form.created"),
        message: created.vm.created
          ? t("containers.form.createdInNewVm", {vm: created.vm.name})
          : t("containers.form.createdInVm", {vm: created.vm.name}),
      });
      router.push(
        APP_PATHS.dashboard.containers.detail(
          created.vm.uuid,
          created.container.id,
        ),
      );
    },
    // whatever went wrong is said in the form, beside what it was about.
    onError: () => {},
  });

  // what was refused, by where it is in the request, which is where the form
  // says it.
  const sent = create.error ? problemOf(create.error) : null;
  const refused = fieldPaths(sent?.fields ?? {}, "container");
  const problem = sent && {...sent, fields: refused};

  // what is wrong is said once somebody has tried to send it, and then as it
  // is, so it goes away as soon as it is put right.
  const fieldError = (field: string): string | undefined => {
    if (attempted && invalid[field]) {
      return t(`containers.form.errors.${invalid[field]}`);
    }

    return refused[field];
  };

  const rowError = (list: string) => (index: number, field?: string) =>
    fieldError(field ? `${list}.${index}.${field}` : `${list}.${index}`);

  const vmError =
    attempted && vmIssue
      ? t(`containers.form.vmIssues.${vmIssue}`)
      : (refused.vm_uuid ?? refused.vm);

  const set = <K extends keyof ContainerValues>(
    key: K,
    next: ContainerValues[K],
  ) => setValues((current) => ({...current, [key]: next}));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAttempted(true);

    if (vmState.loading || vmIssue || Object.keys(invalid).length > 0) {
      return;
    }

    create.mutate(body);
  };

  const pending = create.isPending;
  const imageTags = [
    ...new Set((images.data ?? []).flatMap((image) => image.tags ?? [])),
  ].filter((tag) => !tag.startsWith("<none>"));

  return (
    <form onSubmit={submit} noValidate>
      <Stack>
        <Fieldset legend={t("containers.form.where")} disabled={pending}>
          <DockerVmSelect
            state={vmState}
            error={vmError}
            fieldErrors={refused}
            disabled={pending}
          />
        </Fieldset>

        <Fieldset legend={t("containers.form.container")} disabled={pending}>
          <Stack gap="sm">
            <SimpleGrid cols={{base: 1, sm: 2}}>
              <Autocomplete
                label={t("containers.form.image")}
                description={t("containers.form.imageHelp")}
                placeholder="nginx:1.27-alpine"
                data={imageTags}
                value={values.image}
                onChange={(image) => set("image", image)}
                error={fieldError("image")}
                required
                dir="ltr"
              />
              <TextInput
                label={t("containers.form.name")}
                description={t("containers.form.nameHelp")}
                value={values.name}
                onChange={(event) => set("name", event.currentTarget.value)}
                error={fieldError("name")}
                dir="ltr"
                autoComplete="off"
              />
            </SimpleGrid>
            <SimpleGrid cols={{base: 1, sm: 2}}>
              <TextInput
                label={t("containers.form.command")}
                description={t("containers.form.commandHelp")}
                placeholder={`sh -c "echo hello"`}
                value={values.command}
                onChange={(event) => set("command", event.currentTarget.value)}
                error={fieldError("command")}
                dir="ltr"
                autoComplete="off"
              />
              <TextInput
                label={t("containers.form.entrypoint")}
                description={t("containers.form.entrypointHelp")}
                value={values.entrypoint}
                onChange={(event) =>
                  set("entrypoint", event.currentTarget.value)
                }
                error={fieldError("entrypoint")}
                dir="ltr"
                autoComplete="off"
              />
            </SimpleGrid>
            <TextInput
              label={t("containers.form.workingDir")}
              placeholder="/app"
              value={values.workingDir}
              onChange={(event) => set("workingDir", event.currentTarget.value)}
              error={fieldError("working_dir")}
              dir="ltr"
              autoComplete="off"
            />
          </Stack>
        </Fieldset>

        <Fieldset legend={t("containers.form.env.legend")} disabled={pending}>
          <EnvRowsField
            rows={values.env}
            onChange={(env) => set("env", env)}
            errorFor={rowError("env")}
            disabled={pending}
          />
          {refused.env && (
            <Text c="red" size="sm" mt="xs">
              {refused.env}
            </Text>
          )}
        </Fieldset>

        <Fieldset legend={t("containers.form.ports.legend")} disabled={pending}>
          <Stack gap="sm">
            <Text size="sm" c="dimmed">
              {t("containers.form.ports.help")}
            </Text>
            <PortRowsField
              rows={values.ports}
              onChange={(ports) => set("ports", ports)}
              errorFor={rowError("ports")}
              disabled={pending}
            />
            {refused.ports && (
              <Text c="red" size="sm">
                {refused.ports}
              </Text>
            )}
            {reach && (
              <Alert
                color="yellow"
                variant="light"
                role="status"
                icon={<IconWorldOff />}
                title={t("containers.form.hint.title")}
              >
                {reach.ingressDenied
                  ? t("containers.form.hint.ingressDenied")
                  : t(
                      `containers.form.hint.${
                        choice.kind === "new"
                          ? "unreachableNewVm"
                          : "unreachable"
                      }${reach.unreachable.length === 1 ? "One" : ""}`,
                      {
                        ports: ltr(reach.unreachable.join(", ")),
                        exposed:
                          reach.exposed.length > 0
                            ? ltr(reach.exposed.join(", "))
                            : t("containers.form.hint.noExposed"),
                      },
                    )}
              </Alert>
            )}
          </Stack>
        </Fieldset>

        <Fieldset
          legend={t("containers.form.mounts.legend")}
          disabled={pending}
        >
          <MountRowsField
            rows={values.mounts}
            onChange={(mounts) => set("mounts", mounts)}
            errorFor={rowError("mounts")}
            disabled={pending}
            volumes={(volumes.data ?? []).map((volume) => volume.name)}
          />
          {refused.mounts && (
            <Text c="red" size="sm" mt="xs">
              {refused.mounts}
            </Text>
          )}
        </Fieldset>

        <Fieldset legend={t("containers.form.resources")} disabled={pending}>
          <Stack gap="sm">
            <MultiSelect
              label={t("containers.form.networks")}
              description={
                choice.kind === "new"
                  ? t("containers.form.networksNewVm")
                  : choice.kind === "unset"
                    ? t("containers.form.networksPickVm")
                    : askable
                      ? t("containers.form.networksHelp")
                      : t("containers.form.networksUnavailable")
              }
              data={attachable.map((network) => network.name)}
              value={pickedNetworks}
              onChange={(next) => set("networks", next)}
              disabled={pending || attachable.length === 0}
              error={fieldError("networks")}
              searchable
              clearable
            />
            <Stack gap={4}>
              <Text size="sm" fw={500} id={restartPolicyLabel}>
                {t("containers.form.restartPolicy")}
              </Text>
              <SegmentedControl
                aria-labelledby={restartPolicyLabel}
                value={values.restartPolicy}
                onChange={(policy) =>
                  set("restartPolicy", policy as RestartPolicy)
                }
                data={RESTART_POLICIES.map((policy) => ({
                  value: policy,
                  label: t(`containers.restartPolicies.${policy}`),
                }))}
                disabled={pending}
                fullWidth
              />
              {fieldError("restart_policy") && (
                <Text c="red" size="sm">
                  {fieldError("restart_policy")}
                </Text>
              )}
            </Stack>
            <SimpleGrid cols={{base: 1, sm: 2}}>
              <AmountInput
                label={t("containers.form.cpus")}
                description={t("containers.form.cpusHelp")}
                placeholder={t("containers.form.noLimit")}
                value={values.cpus}
                onChange={(cpus) => set("cpus", cpus)}
                min={0}
                step={0.25}
                decimalScale={2}
                allowNegative={false}
                error={fieldError("cpus")}
              />
              <SizeInput
                label={t("containers.form.memory")}
                description={t("containers.form.memoryHelp")}
                placeholder={t("containers.form.noLimit")}
                value={values.memory}
                onChange={(memory) => set("memory", memory)}
                error={fieldError("memory")}
              />
            </SimpleGrid>
          </Stack>
        </Fieldset>

        {pending && (
          <Waiting
            title={
              choice.kind === "new"
                ? t("containers.form.waiting.newVmTitle")
                : t("containers.form.waiting.title")
            }
            description={
              choice.kind === "new"
                ? t("containers.form.waiting.newVmHelp")
                : t("containers.form.waiting.help")
            }
          />
        )}

        {/* what the VM or dockerd refused, and anything not said beside a
            field, is said here, where it is seen before sending again. */}
        {problem && !pending && hasMoreToSay(problem, shownInline) && (
          <ProblemAlert
            problem={problem}
            shown={shownInline}
            title={
              problem.unanswered
                ? t("containers.form.unansweredTitle")
                : t("containers.form.failed")
            }
          >
            {problem.unanswered && (
              <Anchor
                component={Link}
                href={APP_PATHS.dashboard.containers.index}
                size="sm"
              >
                {t("containers.form.seeContainers")}
              </Anchor>
            )}
          </ProblemAlert>
        )}

        <Group justify="flex-end">
          <Button type="submit" loading={pending}>
            {t("containers.form.create")}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
