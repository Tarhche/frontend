import {Anchor, Stack, Text} from "@mantine/core";

export type Endpoint = {
  container_port: number;
  host: string;
  url: string;
};

type Props = {
  endpoints: Endpoint[];
  empty: string;
};

/**
 * The addresses a container's ports are served on. Each one is a name of its
 * own, so a link goes straight to the container rather than to whichever node
 * happens to be holding it.
 */
export function ContainerEndpoints({endpoints, empty}: Props) {
  if (endpoints.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        {empty}
      </Text>
    );
  }

  return (
    <Stack gap={2}>
      {endpoints.map((endpoint) => (
        <Anchor
          key={endpoint.container_port}
          href={endpoint.url}
          target="_blank"
          rel="noreferrer"
          size="sm"
        >
          {endpoint.host}
        </Anchor>
      ))}
    </Stack>
  );
}
