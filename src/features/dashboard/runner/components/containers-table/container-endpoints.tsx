import {Anchor, Stack, Text} from "@mantine/core";

export type Endpoint = {
  container_port: number;
  host: string;
  url: string;

  /** where the port is reached whole, for what does not speak http. */
  address?: string;
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
        <div key={endpoint.container_port}>
          <Anchor
            href={endpoint.url}
            target="_blank"
            rel="noreferrer"
            size="sm"
          >
            {endpoint.host}
          </Anchor>

          {/* and where the same port answers whatever does not speak http. */}
          {endpoint.address && (
            <Text size="xs" c="dimmed" ff="monospace">
              {endpoint.address}
            </Text>
          )}
        </div>
      ))}
    </Stack>
  );
}
