import {
  vmTarget,
  type VmChoice,
} from "@/features/dashboard/workload/docker/components/docker-vm-select/choice";
import {type StackCreateRequest} from "../../types";

/** The most a compose file may be, as the platform takes them. */
export const MAX_COMPOSE_BYTES = 256 * 1024;

/** A compose file to start from: two services that reach each other by name. */
export const EXAMPLE_COMPOSE = `services:
  web:
    image: nginx:1.27-alpine
    ports:
      - "80:80"
    depends_on:
      - api
  api:
    image: hashicorp/http-echo
    command: ["-listen=:5678", "-text=hello from api"]
`;

/**
 * What is wrong with a stack as written, by field, as the words' keys:
 * required, or tooLarge for a compose file past what the platform takes.
 */
export type StackErrors = Record<string, string>;

/**
 * The request for a stack as written. Its compose file is sent exactly as it
 * was written: it is kept that way, and whether it is a compose file at all is
 * for compose to say, which the answer carries back when it is not.
 */
export function stackRequest(
  values: {name: string; compose: string},
  choice: VmChoice,
): {body: StackCreateRequest; errors: StackErrors} {
  const errors: StackErrors = {};

  const name = values.name.trim();
  if (name.length === 0) {
    errors.name = "required";
  }

  if (values.compose.trim().length === 0) {
    errors.compose = "required";
  } else if (new Blob([values.compose]).size > MAX_COMPOSE_BYTES) {
    errors.compose = "tooLarge";
  }

  return {
    body: {...vmTarget(choice), name, compose: values.compose},
    errors,
  };
}
