import {Paper, Stack, Group, Skeleton} from "@mantine/core";

export function FormSkeleton() {
  return (
    <Paper withBorder p="xl">
      <Stack>
        <Skeleton w="100%" h={58} />
        <Skeleton w="100%" h={58} />
        <Group justify="flex-end" mt={"lg"}>
          <Skeleton w={125} h={36} />
        </Group>
      </Stack>
    </Paper>
  );
}
