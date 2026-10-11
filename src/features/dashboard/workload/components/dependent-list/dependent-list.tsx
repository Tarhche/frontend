"use client";

import {type ReactNode} from "react";
import {List, ListItem, Text} from "@mantine/core";
import Link from "@/components/link";
import {useTranslations} from "@/i18n/provider";
import {type TFunction} from "@/i18n/dictionary";
import {shortId} from "@/features/dashboard/workload/docker/format";
import {type Dependent} from "../../lib/dependents";

/** What stacks and containers may need, as it is named in what is said. */
export type Needed = "vm" | "network" | "volume";

// the kinds of what needs something that are named as such; anything else is
// named by its name alone.
const KINDS = ["stack", "container"];

// where a sentence has the name of what needs something.
const NAME = "{name}";

/**
 * What a dependent does once what it needs is gone, in a sentence: it makes
 * it again, or it waits for it to come back. Without a name, the sentence
 * keeps {name} where the name goes.
 */
export function dependentSentence(
  t: TFunction,
  dependent: Dependent,
  what?: Needed,
  name?: string,
): string {
  const kind = KINDS.includes(dependent.kind) ? dependent.kind : "other";
  const does = dependent.recreates ? "recreates" : "waits";
  const vars: Record<string, string> = {
    what: t(`workload.dependents.what.${what ?? "it"}`),
  };

  if (name !== undefined) {
    vars.name = name;
  }

  return t(`workload.dependents.${kind}.${does}`, vars);
}

/** What a dependent is called: its name, or the start of its uuid. */
export function dependentName(dependent: Dependent): string {
  return dependent.name || shortId(dependent.uuid);
}

// a sentence with a name in it, the name as it is given: a link, say. One
// whose words leave the name out has it after them.
function withName(sentence: string, name: ReactNode): ReactNode {
  const at = sentence.indexOf(NAME);

  if (at < 0) {
    return (
      <>
        {sentence} {name}
      </>
    );
  }

  return (
    <>
      {sentence.slice(0, at)}
      {name}
      {sentence.slice(at + NAME.length)}
    </>
  );
}

type Props = {
  dependents: Dependent[];

  /** what they need, as it is named; "it" when that is clear already. */
  what?: Needed;

  /** where each may be looked at, for whoever may; null where not. */
  hrefOf?: (dependent: Dependent) => string | null;

  id?: string;
};

/**
 * What needs something, each in a sentence of its own: what kind of thing it
 * is, its name, linked to it where it may be looked at, and whether it makes
 * what it needs again once it is gone or only waits for it to come back.
 */
export function DependentList({dependents, what, hrefOf, id}: Props) {
  const t = useTranslations();

  return (
    <List size="sm" spacing={4} id={id}>
      {dependents.map((dependent) => {
        const name = dependentName(dependent);
        const href = hrefOf?.(dependent) ?? null;

        return (
          <ListItem key={`${dependent.kind}/${dependent.uuid}`}>
            {withName(
              dependentSentence(t, dependent, what),
              href ? (
                <Link href={href}>{name}</Link>
              ) : (
                <Text span inherit fw={500}>
                  {name}
                </Text>
              ),
            )}
          </ListItem>
        );
      })}
    </List>
  );
}
