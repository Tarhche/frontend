import {Box, Stack} from "@mantine/core";
import {BreadcrumbSkeleton} from "@/components/breadcrumb-skeleton";
import {FormSkeleton} from "@/features/users/components";

function UserPasswordFormLoading() {
  return (
    <Stack>
      <BreadcrumbSkeleton crumbsCount={3} />
      <Box>
        <FormSkeleton />
      </Box>
    </Stack>
  );
}

export default UserPasswordFormLoading;
