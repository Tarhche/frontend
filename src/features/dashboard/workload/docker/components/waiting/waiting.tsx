"use client";

import {useEffect, useState, type ReactNode} from "react";
import {Group, Loader, Paper, Progress, Stack, Text} from "@mantine/core";
import {useTranslations} from "@/i18n/provider";

/**
 * Seconds since this was first shown, counted while it is on the screen. It is
 * shown when the wait begins, so that is what it counts from.
 */
function useElapsed(): number {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const ticking = setInterval(
      () => setElapsed(Math.floor((Date.now() - started) / 1_000)),
      1_000,
    );

    return () => clearInterval(ticking);
  }, []);

  return elapsed;
}

function minutesAndSeconds(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

type Props = {
  title: string;
  description?: ReactNode;
};

/**
 * A request that takes as long as it takes. Pulling an image is minutes, not
 * seconds, and nothing comes back until it is done, so what is shown is that
 * it is still going and for how long it has been.
 */
export function Waiting({title, description}: Props) {
  const t = useTranslations();
  const elapsed = useElapsed();

  return (
    <Paper withBorder p="md">
      <Group gap="sm" wrap="nowrap" align="flex-start">
        <Loader size="sm" mt={2} />
        <Stack gap={6} style={{flex: 1}}>
          <Group justify="space-between" wrap="nowrap" align="flex-start">
            {/* the words are what a screen reader is told, once; the clock
                beside them changes every second and is left to the eye. */}
            <div role="status">
              <Text fw={500}>{title}</Text>
              {description && (
                <Text size="sm" c="dimmed">
                  {description}
                </Text>
              )}
            </div>
            <Text
              size="sm"
              c="dimmed"
              ff="monospace"
              aria-label={t("docker.waiting.elapsed")}
            >
              {minutesAndSeconds(elapsed)}
            </Text>
          </Group>
          <Progress value={100} striped animated size="sm" aria-hidden />
        </Stack>
      </Group>
    </Paper>
  );
}
