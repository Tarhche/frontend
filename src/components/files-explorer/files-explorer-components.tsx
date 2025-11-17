"use client";

import {useState} from "react";
import {Tabs, FloatingIndicator, Group, Pagination, Divider, Button} from "@mantine/core";
import {IconCheck} from "@tabler/icons-react";
import classes from './files-explorer.module.css';

// Types
type Tab = {
  id: string;
  label: string;
};

// FilesTabsClient Component
type FilesTabsClientProps = {
  tabs: Tab[];
  activeTab: string | null;
  onTabChange: (tab: string | null) => void;
};

export function FilesTabsClient({tabs, activeTab, onTabChange}: FilesTabsClientProps) {
  const [rootRef, setRootRef] = useState<HTMLDivElement | null>(null);
  const [controlsRefs, setControlsRefs] = useState<Record<string, HTMLButtonElement | null>>({});

  const setControlRef = (val: string) => (node: HTMLButtonElement) => {
    controlsRefs[val] = node;
    setControlsRefs(controlsRefs);
  };

  return (
    <Tabs variant="none" value={activeTab} onChange={onTabChange}>
      <Tabs.List ref={setRootRef} className={classes.list}>
        {tabs.map((tab) => (
          <Tabs.Tab
            key={tab.id}
            value={tab.id}
            ref={setControlRef(tab.id)}
            className={classes.tab}
          >
            {tab.label}
          </Tabs.Tab>
        ))}
        <FloatingIndicator
          target={activeTab ? controlsRefs[activeTab] : null}
          parent={rootRef}
          className={classes.indicator}
        />
      </Tabs.List>
    </Tabs>
  );
}

// FilesPagination Component
type FilesPaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function FilesPagination({currentPage, totalPages, onPageChange}: FilesPaginationProps) {
  if (currentPage <= 0 || totalPages <= 0) {
    return null;
  }

  return (
    <Group justify="flex-end" mt={"md"}>
      <Pagination total={totalPages} value={currentPage} onChange={onPageChange} />
    </Group>
  );
}

// FileSelectButton Component
type FileSelectButtonProps = {
  selectedFile: string;
  onSelect: (id: string) => void;
};

export function FileSelectButton({selectedFile, onSelect}: FileSelectButtonProps) {
  return (
    <>
      <Divider />
      <Group justify="flex-end">
        <Button
          leftSection={<IconCheck size={20} />}
          onClick={() => onSelect(selectedFile)}
        >
          انتخاب فایل
        </Button>
      </Group>
    </>
  );
}

