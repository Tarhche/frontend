"use client";

import {ActionIcon, useMantineColorScheme} from "@mantine/core";
import {IconMoon, IconSun} from "@tabler/icons-react";
import classes from "./color-scheme-toggle.module.css";

export function ColorSchemeToggle() {
  const {toggleColorScheme} = useMantineColorScheme();

  return (
    <ActionIcon
      variant="light"
      size="lg"
      radius="md"
      onClick={toggleColorScheme}
      aria-label="Toggle color scheme"
    >
      <IconSun
        style={{width: "70%", height: "70%"}}
        stroke={1.5}
        className={classes.light}
      />
      <IconMoon
        style={{width: "70%", height: "70%"}}
        stroke={1.5}
        className={classes.dark}
      />
    </ActionIcon>
  );
}
