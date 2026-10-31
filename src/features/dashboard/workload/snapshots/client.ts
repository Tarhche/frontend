import {clientDalDriver} from "@/dal/client/client-dal-driver";
import {type Scope} from "@/features/dashboard/workload/vms/api";
import {type Page} from "@/features/dashboard/workload/vms/types";
import {snapshotsPath} from "./api";
import {type Snapshot, type SnapshotListParams} from "./types";

/** What the browser reads snapshots through, while it waits for them. */
export async function getSnapshots(
  scope: Scope,
  params: SnapshotListParams = {},
): Promise<Page<Snapshot>> {
  const response = await clientDalDriver.get(snapshotsPath(scope), {params});

  return response.data;
}
