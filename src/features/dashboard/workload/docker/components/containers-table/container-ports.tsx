import {Stack, Text} from "@mantine/core";
import {formatPortBinding} from "../../format";
import {type PortBinding} from "../../types";

/** The ports a container publishes, host side first, as docker writes them. */
export function ContainerPorts({ports}: {ports?: PortBinding[]}) {
  if (!ports || ports.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        —
      </Text>
    );
  }

  return (
    <Stack gap={2}>
      {ports.map((port) => (
        <Text
          key={`${port.host_port}-${port.container_port}-${port.protocol}`}
          size="sm"
          ff="monospace"
          dir="ltr"
        >
          {formatPortBinding(port)}
        </Text>
      ))}
    </Stack>
  );
}
