import {type ReactNode} from "react";
import {render} from "@testing-library/react";
import {MantineProvider} from "@mantine/core";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {type Vm} from "./types";

// jsdom draws nothing, so it measures nothing: Mantine's scroll areas watch
// their size anyway, and a combobox scrolls to the option it has picked.
if (typeof window !== "undefined" && !("ResizeObserver" in window)) {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  Object.defineProperty(window, "ResizeObserver", {
    writable: true,
    value: ResizeObserver,
  });
}

if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

/**
 * Renders something the way the dashboard does, with a cache of its own that
 * does not ask twice: a test says once what the server answers.
 */
export function renderWithProviders(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: {
      queries: {retry: false},
      mutations: {retry: false},
    },
  });

  const view = render(
    <QueryClientProvider client={client}>
      <MantineProvider env="test">{ui}</MantineProvider>
    </QueryClientProvider>,
  );

  return {client, ...view};
}

/** A Docker VM, as the API would list one. */
export function dockerVm(overrides: Partial<Vm> = {}): Vm {
  return {
    uuid: "vm-1",
    name: "docker-one",
    slug: "docker-one-ab12c",
    owner_uuid: "me",
    kind: "docker",
    image: "docker:29-dind",
    state: "running",
    ports: [80, 443, 8080],
    network: {ingress: "allow", egress: "allow"},
    resources: {cpus: 2, memory: 2 * 1024 ** 3, disk: 20 * 1024 ** 3},
    persistent_disk: true,
    lifetime_seconds: 0,
    created_at: "2026-10-04T12:00:00Z",
    ...overrides,
  };
}
