import {Box, Group, Skeleton} from "@mantine/core";

export function ContentSkeleton() {
  return (
    <Box component="article">
      <Group wrap="nowrap" c={"dimmed"} mb={"md"} justify="space-between">
        <Group gap={"md"}>
          <Skeleton w={140} h={32} />
        </Group>
        <Skeleton w={30} h={20} />
      </Group>
      <Skeleton mb={"sm"} w={"90%"} h={30} />
      <Skeleton mb={"sm"} w={"100%"} h={30} />
      <Skeleton mb={"sm"} w={"70%"} h={30} />
      <Skeleton mb={"sm"} w={"85%"} h={30} />
      <Group gap={"xs"} mt={"xl"}>
        <Skeleton w={75} h={30} />
        <Skeleton w={75} h={30} />
      </Group>
    </Box>
  );
}
