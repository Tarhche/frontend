import {Box, Group, Skeleton, Stack} from "@mantine/core";
import classes from "./note-card.module.css";

export function NoteCardSkeleton() {
  return (
    <Box p="lg" className={classes.card}>
      <Group justify="space-between" wrap="nowrap">
        <Group gap="sm" wrap="nowrap">
          <Skeleton circle width={32} height={32} />
          <Skeleton h={12} w={100} />
        </Group>
        <Skeleton h={10} w={70} />
      </Group>
      <Stack gap={8} mt="md">
        <Skeleton h={12} w={"100%"} />
        <Skeleton h={12} w={"95%"} />
        <Skeleton h={12} w={"60%"} />
      </Stack>
      <Group justify="flex-end" mt="md">
        <Skeleton h={26} w={100} />
      </Group>
    </Box>
  );
}
