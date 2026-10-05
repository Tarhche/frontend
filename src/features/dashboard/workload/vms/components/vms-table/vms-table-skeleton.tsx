import {TableSkeleton} from "@/components/skeletons";

/** Where the VMs will be, while they are being asked for. */
export function VmsTableSkeleton() {
  return (
    <TableSkeleton columnsCount={8} tableProps={{verticalSpacing: "sm"}} />
  );
}
