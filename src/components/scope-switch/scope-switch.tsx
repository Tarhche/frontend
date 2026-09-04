"use client";

import {useState, type ReactNode} from "react";
import {FloatingIndicator, Tabs} from "@mantine/core";
import classes from "./scope-switch.module.css";

type Props = {
  /** what the person may look at. Each side stands on its own permission. */
  canSeeAll: boolean;
  canSeeMine: boolean;

  labels: {all: string; mine: string};

  /** the two listings, rendered on the server and shown one at a time. */
  all: ReactNode;
  mine: ReactNode;
};

/**
 * All of something, or one's own.
 *
 * The switch lives on the page rather than in the address, the way the files
 * explorer does it: nothing is navigated, nothing is added to the url, and both
 * listings are the server-rendered ones.
 */
export function ScopeSwitch({canSeeAll, canSeeMine, labels, all, mine}: Props) {
  const [showing, setShowing] = useState<string | null>(
    canSeeAll ? "all" : "mine",
  );

  const [rootRef, setRootRef] = useState<HTMLDivElement | null>(null);
  const [controlsRefs, setControlsRefs] = useState<
    Record<string, HTMLButtonElement | null>
  >({});

  const setControlRef = (value: string) => (node: HTMLButtonElement) => {
    controlsRefs[value] = node;
    setControlsRefs(controlsRefs);
  };

  // allowed neither, there is nothing here to show — and the dashboard does
  // not link here at all.
  if (!canSeeAll && !canSeeMine) {
    return null;
  }

  // allowed one of them, there is nothing to switch between.
  if (!canSeeAll || !canSeeMine) {
    return <>{canSeeAll ? all : mine}</>;
  }

  return (
    <>
      <Tabs variant="none" value={showing} onChange={setShowing}>
        <Tabs.List ref={setRootRef} className={classes.list}>
          <Tabs.Tab
            value="all"
            ref={setControlRef("all")}
            className={classes.tab}
          >
            {labels.all}
          </Tabs.Tab>
          <Tabs.Tab
            value="mine"
            ref={setControlRef("mine")}
            className={classes.tab}
          >
            {labels.mine}
          </Tabs.Tab>
          <FloatingIndicator
            target={showing ? controlsRefs[showing] : null}
            parent={rootRef}
            className={classes.indicator}
          />
        </Tabs.List>
      </Tabs>

      {showing === "mine" ? mine : all}
    </>
  );
}
