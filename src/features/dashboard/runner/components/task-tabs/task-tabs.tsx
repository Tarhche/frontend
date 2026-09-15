"use client";

import {useState, type ReactNode} from "react";
import {
  Button,
  Group,
  Modal,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  Text,
} from "@mantine/core";
import {IconFileText, IconInfoCircle, IconTerminal2} from "@tabler/icons-react";
import {useTranslations} from "@/i18n/provider";

type Props = {
  overview: ReactNode;
  logs: ReactNode;
  terminal: ReactNode;

  /**
   * Whether there is a terminal behind the terminal tab. A task that is not
   * running has no session to lose, so there is nothing to ask about.
   */
  hasTerminal: boolean;
};

/**
 * What a task can be looked at through.
 *
 * A tab that is not showing is kept but not running — its terminal is closed
 * and its shell inside the task ends with it — so leaving the terminal tab is
 * asked about first rather than quietly throwing a session away.
 */
export function TaskTabs({overview, logs, terminal, hasTerminal}: Props) {
  const t = useTranslations();

  const [tab, setTab] = useState<string | null>("overview");
  const [leavingFor, setLeavingFor] = useState<string | null>(null);

  const change = (next: string | null) => {
    if (next === null || next === tab) return;

    if (tab === "terminal" && hasTerminal) {
      setLeavingFor(next);

      return;
    }

    setTab(next);
  };

  return (
    <>
      <Tabs value={tab} onChange={change}>
        <TabsList>
          <TabsTab value="overview" leftSection={<IconInfoCircle size={16} />}>
            {t("tasks.detail.overview")}
          </TabsTab>
          <TabsTab value="logs" leftSection={<IconFileText size={16} />}>
            {t("tasks.detail.logs")}
          </TabsTab>
          <TabsTab value="terminal" leftSection={<IconTerminal2 size={16} />}>
            {t("tasks.detail.terminal")}
          </TabsTab>
        </TabsList>

        <TabsPanel value="overview" pt="md">
          {overview}
        </TabsPanel>

        <TabsPanel value="logs" pt="md">
          {logs}
        </TabsPanel>

        <TabsPanel value="terminal" pt="md">
          {terminal}
        </TabsPanel>
      </Tabs>

      <Modal
        title={t("common.confirmAction")}
        opened={leavingFor !== null}
        size="md"
        centered
        onClose={() => setLeavingFor(null)}
      >
        <Text>{t("tasks.detail.leaveTerminalConfirm")}</Text>
        <Group justify="flex-end" mt="md">
          <Button color="gray" onClick={() => setLeavingFor(null)}>
            {t("tasks.detail.stayInTerminal")}
          </Button>
          <Button
            color="red"
            onClick={() => {
              setTab(leavingFor);
              setLeavingFor(null);
            }}
          >
            {t("tasks.detail.leaveTerminal")}
          </Button>
        </Group>
      </Modal>
    </>
  );
}
