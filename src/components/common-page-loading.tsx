import {Center, Stack, Loader, Paper} from "@mantine/core";

function CommonPageLoading({fullScreen = true}: {fullScreen?: boolean}) {
  return (
    <Center
      style={
        fullScreen
          ? {minHeight: "100vh", width: "100%"}
          : {padding: "2rem", width: "100%"}
      }
    >
      <Paper radius="lg" p="xl" withBorder shadow="sm">
        <Stack align="center" gap="xs">
          <Loader size="lg" />
        </Stack>
      </Paper>
    </Center>
  );
}

export default CommonPageLoading;
