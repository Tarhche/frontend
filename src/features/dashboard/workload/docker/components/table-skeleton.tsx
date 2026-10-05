import {Skeleton, Stack} from "@mantine/core";

/** Where a listing will be, while it is being asked for. */
export function TableSkeleton({rows = 5}: {rows?: number}) {
  return (
    <Stack>
      {Array.from({length: rows}).map((_, index) => (
        <Skeleton key={index} height={44} radius="sm" />
      ))}
    </Stack>
  );
}
