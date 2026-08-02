"use client";

import Link from "@/components/link";
import {Badge, Tabs} from "@mantine/core";
import {type TablerIcon} from "@tabler/icons-react";

export type ContentTab = {
  // Identifies the tab and marks it selected when it equals `active`.
  value: string;
  label: string;
  icon: TablerIcon;
  href: string;
  // Shown as a badge. Omit for a tab whose size isn't known.
  count?: number;
};

type Props = {
  tabs: ContentTab[];
  active: string;
};

// Tab bar for pages that list two kinds of content side by side — a hashtag's
// articles and notes, an author's articles and notes. The tabs are links rather
// than local state, because each kind is fetched and paginated on its own.
export function ContentTabs({tabs, active}: Props) {
  return (
    <Tabs value={active} mt="md">
      <Tabs.List>
        {tabs.map(({value, label, icon: Icon, href, count}) => (
          <Tabs.Tab
            key={value}
            value={value}
            // `Tabs.Tab` is typed as a button, so the link is supplied through
            // renderRoot rather than `component`/`href`.
            renderRoot={(props) => <Link href={href} {...props} />}
            leftSection={<Icon size={18} />}
            rightSection={
              count === undefined ? undefined : (
                <Badge size="sm" variant="light" circle>
                  {count}
                </Badge>
              )
            }
          >
            {label}
          </Tabs.Tab>
        ))}
      </Tabs.List>
    </Tabs>
  );
}
