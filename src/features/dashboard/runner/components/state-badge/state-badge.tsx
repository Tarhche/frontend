import {Badge} from "@mantine/core";

type Props = {
  state: string;
};

// what each state says about a container, at a glance.
const colors: Record<string, string> = {
  created: "gray",
  scheduled: "blue",
  running: "green",
  restarting: "blue",
  stopping: "yellow",
  stopped: "gray",
  completed: "teal",
  failed: "red",
};

export function StateBadge({state}: Props) {
  return (
    <Badge color={colors[state] ?? "gray"} variant="light">
      {state}
    </Badge>
  );
}
