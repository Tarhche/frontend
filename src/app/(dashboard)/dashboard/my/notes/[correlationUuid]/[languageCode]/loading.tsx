import {Paper, Stack, Group, Skeleton} from "@mantine/core";
import {BreadcrumbSkeleton} from "@/components/breadcrumb-skeleton";

function UpdateNotePageLoading() {
  return (
    <Stack>
      <BreadcrumbSkeleton crumbsCount={3} />
      <Paper p="lg" withBorder>
        <Stack gap="xl">
          <Skeleton w={"100%"} h={25} />
          <Skeleton w={"100%"} h={150} />
          <Skeleton w={"100%"} h={25} />
          <Skeleton w={"100%"} h={25} />
          <Group justify="flex-end">
            <Skeleton w={100} h={30} />
          </Group>
        </Stack>
      </Paper>
    </Stack>
  );
}

export default UpdateNotePageLoading;
