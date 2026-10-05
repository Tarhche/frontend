"use client";

import {useTranslations} from "@/i18n/provider";
import {LogViewer} from "@/features/dashboard/workload/components/log-viewer";
import {type Scope} from "../../api";
import {getVmLogs} from "../../client";

/**
 * What a VM has written -- its kernel, its runtime, and whatever runs in it --
 * followed for what is new, each line saying which of those wrote it.
 */
export function VmLogs({scope, uuid}: {scope: Scope; uuid: string}) {
  const t = useTranslations();

  return (
    <LogViewer
      source={`${scope}/${uuid}`}
      read={(params) => getVmLogs(scope, uuid, params)}
      label={t("vms.logs.label")}
      tagOf={(line) => line.source}
    />
  );
}
