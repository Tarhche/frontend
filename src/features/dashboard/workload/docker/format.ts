import {isPort} from "@/features/dashboard/workload/vms/lib/form";
import {type PortBinding} from "./types";

/*
 * How Docker's own things are written and read. Sizes, numbers and moments
 * are written the way the VM pages write them (vms/lib/units.ts and
 * vms/lib/lifetime.ts).
 */

/**
 * A published port the way docker writes one: host → container / protocol. A
 * port that is exposed but not published has no host side to write.
 */
export function formatPortBinding(port: PortBinding): string {
  if (!port.host_port) {
    return `${port.container_port}/${port.protocol}`;
  }

  return `${port.host_port}→${port.container_port}/${port.protocol}`;
}

/** The part of a docker id anybody reads: twelve characters, no digest name. */
export function shortId(id: string): string {
  return id.replace(/^sha256:/, "").slice(0, 12);
}

export type ParsedWords = {words: string[]; unterminated: boolean};

/**
 * Splits a command into its arguments the way a shell would: on spaces, unless
 * they are quoted or escaped. A command is handed to docker as its arguments,
 * so `sh -c "echo hi"` has to arrive as three of them, not four.
 *
 * Nothing is expanded: there are no variables, globs or substitutions here,
 * only quoting.
 */
export function shellWords(input: string): ParsedWords {
  const words: string[] = [];
  let current = "";
  let started = false;
  let quote: "'" | '"' | null = null;

  for (let index = 0; index < input.length; index++) {
    const char = input[index];

    if (quote === "'") {
      if (char === "'") {
        quote = null;
      } else {
        current += char;
      }

      continue;
    }

    if (quote === '"') {
      if (char === '"') {
        quote = null;
      } else if (
        char === "\\" &&
        index + 1 < input.length &&
        '"\\$`'.includes(input[index + 1])
      ) {
        current += input[++index];
      } else {
        current += char;
      }

      continue;
    }

    if (char === "'" || char === '"') {
      quote = char;
      started = true;

      continue;
    }

    if (char === "\\" && index + 1 < input.length) {
      current += input[++index];
      started = true;

      continue;
    }

    if (/\s/.test(char)) {
      if (started) {
        words.push(current);
        current = "";
        started = false;
      }

      continue;
    }

    current += char;
    started = true;
  }

  if (started) {
    words.push(current);
  }

  return {words, unterminated: quote !== null};
}

/** A port number someone typed, or nothing when it is not one. */
export function portNumber(value: string | number | undefined): number | null {
  const number = typeof value === "number" ? value : Number(value);

  return isPort(number) ? number : null;
}

/**
 * Text that reads left to right whatever surrounds it, such as a list of
 * ports in a Persian sentence: without it, the commas between the numbers are
 * laid out right to left and the list reads back to front.
 */
export function ltr(text: string): string {
  return `⁦${text}⁩`;
}
