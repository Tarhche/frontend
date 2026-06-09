import {TableSkeleton} from "@/components/skeletons/table";
import {TABLE_HEADERS} from "./languages-table";

export function LanguagesTableSkeleton() {
  return (
    <TableSkeleton
      columnsCount={TABLE_HEADERS.length}
      tableProps={{
        verticalSpacing: "sm",
      }}
    />
  );
}
