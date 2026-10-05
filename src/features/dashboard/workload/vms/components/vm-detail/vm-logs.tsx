"use client";

import {useTranslations} from "@/i18n/provider";
import {LogViewer} from "@/features/dashboard/workload/components/log-viewer";
import {type Scope} from "../../api";
import {getVmLogs, isNotFound} from "../../client";

type Props = {
  scope: Scope;
  uuid: string;

  /**
   * Told when the log is not there any more because the VM is not: a run of
   * the code runner's goes, log and all, once its snippet ends, which is the
   * run being over rather than a log that could not be read.
   */
  onGone?: () => void;
};

/**
 * What a VM has written -- its kernel, its runtime, and whatever runs in it --
 * followed for what is new, each line saying which of those wrote it.
 */
export function VmLogs({scope, uuid, onGone}: Props) {
  const t = useTranslations();

  return (
    <LogViewer
      source={`${scope}/${uuid}`}
      read={async (params) => {
        try {
          return await getVmLogs(scope, uuid, params);
        } catch (error) {
          if (onGone && isNotFound(error)) {
            onGone();

            return {items: []};
          }

          throw error;
        }
      }}
      label={t("vms.logs.label")}
      tagOf={(line) => line.source}
    />
  );
}
