"use client";

import {useEffect, useMemo, useRef} from "react";
import {Box, NavLink, ScrollArea, Text} from "@mantine/core";
import Link from "@/components/link";
import {useTranslations} from "@/i18n/provider";
import classes from "./element-stack.module.css";

// How many items are shown before and after the current one when the element
// carries no `visible_neighbors` configuration.
const DEFAULT_VISIBLE_NEIGHBORS = 2;

type Props = {
  data: any;
  // Correlation uuid of the content the visitor is currently on. When it is not
  // part of the stack, the list simply starts at its top.
  currentUuid?: string;
  style?: any;
};

const ElementStack = ({data, currentUuid, style}: Props) => {
  const t = useTranslations();
  const viewportRef = useRef<HTMLDivElement>(null);
  const currentItemRef = useRef<HTMLAnchorElement>(null);

  const items = useMemo(
    () =>
      Array.isArray(data?.body?.items)
        ? data.body.items.filter((item) => item?.body).map((item) => item.body)
        : [],
    [data],
  );

  const currentIndex = useMemo(
    () =>
      currentUuid
        ? items.findIndex((article) => article.correlation_uuid === currentUuid)
        : -1,
    [items, currentUuid],
  );

  const highlightCurrent = data?.body?.highlight_current === true;

  const neighbors = Number.isFinite(data?.body?.visible_neighbors)
    ? Math.max(0, Math.trunc(data.body.visible_neighbors))
    : DEFAULT_VISIBLE_NEIGHBORS;

  // The current item plus `neighbors` items on each side of it.
  const visibleItems = 2 * neighbors + 1;

  // Keep the current item in the middle of the viewport so that the configured
  // number of neighbors shows up before it; the rest stays a scroll away.
  useEffect(() => {
    const viewport = viewportRef.current;
    const currentItem = currentItemRef.current;

    if (!viewport || !currentItem) {
      return;
    }

    const offsetTop =
      currentItem.getBoundingClientRect().top -
      viewport.getBoundingClientRect().top +
      viewport.scrollTop;

    viewport.scrollTop = Math.max(
      0,
      offsetTop - neighbors * currentItem.offsetHeight,
    );
  }, [neighbors, currentIndex]);

  if (items.length === 0) {
    return null;
  }

  return (
    <Box
      component="nav"
      aria-label={t("elements.stack.ariaLabel")}
      className={classes.stack}
      style={style}
    >
      <ScrollArea.Autosize
        viewportRef={viewportRef}
        scrollbars="y"
        classNames={{content: classes.viewportContent}}
        style={{
          maxHeight: `calc(var(--stack-item-height) * ${visibleItems})`,
        }}
        type="auto"
      >
        {items.map((article, index) => {
          const isCurrent = index === currentIndex;

          return (
            <NavLink
              key={article.correlation_uuid ?? index}
              ref={isCurrent ? currentItemRef : undefined}
              component={Link}
              href={`/articles/${article.slug ?? article.correlation_uuid}`}
              // Mantine styles `[aria-current="page"]` exactly like `[data-active]`,
              // so it may only be set when highlighting is turned on.
              active={isCurrent && highlightCurrent}
              aria-current={isCurrent && highlightCurrent ? "page" : undefined}
              // Filled, so the highlighted row still stands out against the panel's
              // own tint — a light variant would nearly blend into it.
              color="blue"
              variant="filled"
              className={classes.item}
              classNames={{body: classes.itemBody, label: classes.itemLabel}}
              noWrap
              leftSection={
                <Text size="xs" fw={600} className={classes.itemOrder}>
                  {index + 1}
                </Text>
              }
              label={article.title}
            />
          );
        })}
      </ScrollArea.Autosize>
    </Box>
  );
};

export default ElementStack;
