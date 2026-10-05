"use client";

import {useTranslations} from "@/i18n/provider";
import {LogViewer} from "@/features/dashboard/workload/components/log-viewer";
import {type Scope} from "@/features/dashboard/workload/vms/api";
import {fetchContainerLogs} from "../../api";

type Props = {
  scope: Scope;
  vmUuid: string;
  id: string;
};

/**
 * What a container has written, followed for what is new. A stopped container
 * still has what it wrote, so this works for one that is not running too.
 */
export function ContainerLogs({scope, vmUuid, id}: Props) {
  const t = useTranslations();

  return (
    <LogViewer
      source={`${scope}/${vmUuid}/${id}`}
      read={(params) => fetchContainerLogs(scope, vmUuid, id, params)}
      label={t("containers.logs.label")}
      tagOf={(line) => line.stream}
      isError={(line) => line.stream === "stderr"}
    />
  );
}
