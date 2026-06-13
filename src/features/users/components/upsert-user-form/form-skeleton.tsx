import {Paper, Stack, Group, Skeleton} from "@mantine/core";

export function UserUpsertFormSkeleton() {
  return (
    <Paper p={"xl"} withBorder>
      <Group justify="center" align="flex-start" gap={"xl"}>
        <Skeleton w={138} h={138} circle />
        <Stack gap={"sm"} flex={1}>
          <Skeleton w={"100%"} h={58} />
          <Skeleton w={"100%"} h={58} />
          <Skeleton w={"100%"} h={58} />
          <Skeleton w={"100%"} h={58} />
          <Skeleton w={"100%"} h={58} />
          <Group justify="flex-end" mt={"lg"}>
            <Skeleton w={125} h={36} />
          </Group>
        </Stack>
      </Group>
    </Paper>
  );
}
