import {TableSkeleton} from "@/components/skeletons";

/** Where the snapshots will be, while they are being asked for. */
export function SnapshotsTableSkeleton() {
  return (
    <TableSkeleton columnsCount={7} tableProps={{verticalSpacing: "sm"}} />
  );
}
