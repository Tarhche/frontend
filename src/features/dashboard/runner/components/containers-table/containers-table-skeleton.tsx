import {Skeleton, Stack} from "@mantine/core";

export function ContainersTableSkeleton() {
  return (
    <Stack>
      {Array.from({length: 5}).map((_, index) => (
        <Skeleton key={index} height={44} radius="sm" />
      ))}
    </Stack>
  );
}
