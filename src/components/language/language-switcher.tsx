"use client";

import {useRouter, usePathname} from "next/navigation";
import {Menu, ActionIcon, Tooltip} from "@mantine/core";
import {IconLanguage, IconCheck} from "@tabler/icons-react";
import {LANGUAGE_COOKIE_NAME} from "@/constants";
import {useLanguage} from "./language-context";

// Topbar menu listing the available site languages. Selecting one swaps the
// language segment of the current URL, remembers the choice in a cookie (so the
// preference sticks for later unprefixed visits) and navigates.
export function LanguageSwitcher() {
  const language = useLanguage();
  const router = useRouter();
  const pathname = usePathname();

  if (!language || language.languages.length === 0) {
    return null;
  }

  const {languages, codes, activeCode} = language;

  const switchTo = (code: string) => {
    if (code === activeCode) {
      return;
    }

    document.cookie = `${LANGUAGE_COOKIE_NAME}=${code}; path=/; max-age=31536000`;

    const segments = pathname.split("/").filter(Boolean);
    // Drop an existing leading language segment (matched against codes, or the
    // active one as a fallback), then prepend the chosen one — so switching is
    // idempotent and never produces e.g. /EN/EN.
    if (segments[0] && (codes.includes(segments[0]) || segments[0] === activeCode)) {
      segments.shift();
    }
    segments.unshift(code);

    router.push(`/${segments.join("/")}`);
  };

  return (
    <Menu shadow="md" width={180} position="bottom-end">
      <Menu.Target>
        <Tooltip label="انتخاب زبان" withArrow>
          <ActionIcon
            variant="light"
            size="lg"
            radius="md"
            aria-label="انتخاب زبان"
          >
            <IconLanguage style={{width: "70%", height: "70%"}} stroke={1.5} />
          </ActionIcon>
        </Tooltip>
      </Menu.Target>
      <Menu.Dropdown>
        {languages.map((item) => (
          <Menu.Item
            key={item.code}
            onClick={() => switchTo(item.code)}
            rightSection={
              item.code === activeCode ? <IconCheck size={16} /> : null
            }
          >
            {item.name}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
