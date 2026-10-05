"use client";

import {type ReactNode, useState} from "react";
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
import {
  IconCamera,
  IconFileText,
  IconInfoCircle,
  IconSettings,
  IconTerminal2,
} from "@tabler/icons-react";
import {useTranslations} from "@/i18n/provider";

type Props = {
  overview: ReactNode;

  /** The tabs somebody may see; one they may not is left out. */
  terminal?: ReactNode;
  logs?: ReactNode;
  snapshots?: ReactNode;
  settings?: ReactNode;

  /**
   * Whether there is a session behind the terminal tab. A VM that is not
   * running has no session to lose, so there is nothing to ask about.
   */
  hasSession: boolean;
};

/**
 * What a VM can be looked at through.
 *
 * A tab that is not showing is kept but not running -- its terminal is closed,
 * and the shell inside the VM ends with it -- so leaving the terminal tab is
 * asked about first rather than quietly throwing a session away.
 */
export function VmTabs({
  overview,
  terminal,
  logs,
  snapshots,
  settings,
  hasSession,
}: Props) {
  const t = useTranslations();

  const [tab, setTab] = useState<string | null>("overview");
  const [leavingFor, setLeavingFor] = useState<string | null>(null);

  const change = (next: string | null) => {
    if (next === null || next === tab) return;

    if (tab === "terminal" && hasSession) {
      setLeavingFor(next);

      return;
    }

    setTab(next);
  };

  const tabs = [
    {value: "overview", icon: IconInfoCircle, panel: overview},
    {value: "terminal", icon: IconTerminal2, panel: terminal},
    {value: "logs", icon: IconFileText, panel: logs},
    {value: "snapshots", icon: IconCamera, panel: snapshots},
    {value: "settings", icon: IconSettings, panel: settings},
  ].filter((one) => one.panel !== undefined && one.panel !== null);

  return (
    <>
      <Tabs value={tab} onChange={change}>
        <TabsList>
          {tabs.map((one) => (
            <TabsTab
              key={one.value}
              value={one.value}
              leftSection={<one.icon size={16} />}
            >
              {t(`vms.detail.${one.value}`)}
            </TabsTab>
          ))}
        </TabsList>

        {tabs.map((one) => (
          <TabsPanel key={one.value} value={one.value} pt="md">
            {one.panel}
          </TabsPanel>
        ))}
      </Tabs>

      <Modal
        title={t("common.confirmAction")}
        opened={leavingFor !== null}
        size="md"
        centered
        onClose={() => setLeavingFor(null)}
      >
        <Text>{t("vms.detail.leaveTerminalConfirm")}</Text>
        <Group justify="flex-end" mt="md">
          <Button color="gray" onClick={() => setLeavingFor(null)}>
            {t("vms.detail.stayInTerminal")}
          </Button>
          <Button
            color="red"
            onClick={() => {
              setTab(leavingFor);
              setLeavingFor(null);
            }}
          >
            {t("vms.detail.leaveTerminal")}
          </Button>
        </Group>
      </Modal>
    </>
  );
}
