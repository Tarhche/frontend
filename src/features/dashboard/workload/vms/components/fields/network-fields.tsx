"use client";

import {type ReactNode} from "react";
import {Alert, Stack, Switch} from "@mantine/core";
import {IconAlertTriangle} from "@tabler/icons-react";
import {useTranslations} from "@/i18n/provider";
import {type VmKind} from "../../types";

type Props = {
  kind: VmKind;
  ingress: boolean;
  egress: boolean;
  onChange: (network: {ingress: boolean; egress: boolean}) => void;
  errors?: {ingress?: ReactNode; egress?: ReactNode};
  disabled?: boolean;
};

/**
 * The two ways a VM touches the network, each on its own. Neither ever lets
 * it reach another VM.
 */
export function NetworkFields({
  kind,
  ingress,
  egress,
  onChange,
  errors,
  disabled,
}: Props) {
  const t = useTranslations();

  return (
    <Stack gap="sm">
      <Switch
        label={t("vms.form.ingress")}
        description={t("vms.form.ingressHelp")}
        checked={ingress}
        disabled={disabled}
        error={errors?.ingress}
        onChange={(event) =>
          onChange({ingress: event.currentTarget.checked, egress})
        }
      />
      <Switch
        label={t("vms.form.egress")}
        description={t("vms.form.egressHelp")}
        checked={egress}
        disabled={disabled}
        error={errors?.egress}
        onChange={(event) =>
          onChange({ingress, egress: event.currentTarget.checked})
        }
      />

      {/* dockerd pulls over the VM's own egress, and there is no other way in
          for an image. */}
      {kind === "docker" && !egress && (
        <Alert
          variant="light"
          color="yellow"
          icon={<IconAlertTriangle />}
          title={t("vms.form.dockerWithoutEgressTitle")}
        >
          {t("vms.form.dockerWithoutEgress")}
        </Alert>
      )}
    </Stack>
  );
}
