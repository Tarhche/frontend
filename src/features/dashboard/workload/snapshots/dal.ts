import {privateDalDriver} from "@/dal/private/private-dal-driver";
import {type Scope} from "@/features/dashboard/workload/vms/api";
import {type Page} from "@/features/dashboard/workload/vms/types";
import {snapshotsPath} from "./api";
import {type Snapshot, type SnapshotListParams} from "./types";

/** What the server renders snapshots from. */
export async function fetchSnapshots(
  scope: Scope,
  params: SnapshotListParams = {},
): Promise<Page<Snapshot>> {
  const response = await privateDalDriver.get(snapshotsPath(scope), {params});

  return response.data;
}
