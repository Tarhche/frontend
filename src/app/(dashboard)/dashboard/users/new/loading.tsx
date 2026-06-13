import {Box, Stack} from "@mantine/core";
import {BreadcrumbSkeleton} from "@/components/breadcrumb-skeleton";
import {UserUpsertFormSkeleton} from "@/features/users/components";

function NewUserLoading() {
  return (
    <Stack>
      <BreadcrumbSkeleton crumbsCount={2} />
      <Box>
        <UserUpsertFormSkeleton />
      </Box>
    </Stack>
  );
}

export default NewUserLoading;
