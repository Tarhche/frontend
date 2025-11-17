"use client";

import {useState, useEffect} from "react";
import {Stack, Group, Alert} from "@mantine/core";
import {IconInfoCircle} from "@tabler/icons-react";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {getFilesExplorerConfig, type FilesExplorerConfig} from "./get-files-explorer-config";
import {FilesTabsClient, FilesPagination, FileSelectButton} from "./files-explorer-components";
import {AddFileButton} from "./add-file-button";
import {FilesList} from "./files-list";

type Data = {
  items: any[];
  pagination: {
    total_pages: number;
    current_page: number;
  };
};

type Props = {
  onSelect?: (id: string) => void;
};

type TabState = {
  searchParams: { page: string };
  selectedFile?: string;
};

const NoAccessAlert = () => (
  <Alert variant="filled" color="red" title="عدم دسترسی" mt={"sm"} icon={<IconInfoCircle />}>
    شما به این قسمت دسترسی ندارید
  </Alert>
);

/**
 * FilesExplorer component - self-contained file explorer with permission-based access.
 */
export function FilesExplorer({onSelect}: Props) {
  // Fetch configuration - MUST be called unconditionally
  const {data: config, isLoading: isConfigLoading} = useQuery<FilesExplorerConfig | null>({
    queryKey: ["files-explorer-config"],
    queryFn: () => getFilesExplorerConfig(),
    staleTime: 1 * 1000, // 1 seconds
  });

  const accessibleTabs = config?.accessibleTabs || [];
  const canUpload = config?.canUpload || false;
  const canDeleteMyFiles = config?.canDeleteMyFiles || false;
  const canDeleteAllFiles = config?.canDeleteAllFiles || false;
  const canView = config?.canView || false;

  // Initialize tab state - MUST be called unconditionally
  const [tabsState, setTabsState] = useState<Record<string, TabState>>({});
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Update state when config loads
  useEffect(() => {
    if (config && config.accessibleTabs.length > 0) {
      // Initialize tabs state, preserving existing tab states
      setTabsState(prevState => {
        const newState = {...prevState};
        config.accessibleTabs.forEach(tab => {
          if (!newState[tab.id]) {
            newState[tab.id] = { searchParams: { page: "1" } };
          }
        });
        return newState;
      });
      
      // Set active tab to first tab if not already set
      setActiveTab(prevTab => prevTab || config.accessibleTabs[0].id);
    }
  }, [config]);

  const activeTabData = accessibleTabs.find((tab) => tab.id === activeTab);
  const currentTabState = activeTab ? tabsState[activeTab] : null;

  // Fetch files data - MUST be called unconditionally
  const {data, isLoading} = useQuery<Data>({
    queryKey: ["files", activeTab, currentTabState?.searchParams.page],
    queryFn: async () => {
      if (!activeTabData || !currentTabState) {
        return { items: [], pagination: { total_pages: 0, current_page: 1 } };
      }

      const responseData = await activeTabData.fetchFiles({
        params: {
          page: currentTabState.searchParams.page,
        },
      });
      return responseData;
    },
    enabled: !!activeTabData && !!currentTabState && !!config,
    retry: 1,
    staleTime: Infinity,
  });

  const files = data?.items || [];
  const totalPages = data?.pagination.total_pages || 0;
  const selectedFile = currentTabState?.selectedFile;

  // NOW we can do conditional returns after all hooks are called
  if (isConfigLoading) return null;
  if (!config) return <NoAccessAlert />;
  if (!activeTabData || !activeTab || !currentTabState) return null;

  // Helper to update tab state
  const updateTabState = (updates: Partial<TabState>) => {
    setTabsState((prev) => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], ...updates },
    }));
  };

  const invalidateQuery = () => {
    queryClient.invalidateQueries({queryKey: ["files"]});
  };

  const handleSelectFile = (id: string) => {
    updateTabState({ selectedFile: id === selectedFile ? undefined : id });
  };

  const handleDeleteFile = (id: string) => {
    if (id === selectedFile) {
      updateTabState({ selectedFile: undefined });
    }
    invalidateQuery();
  };

  const handlePagination = (page: number) => {
    updateTabState({ searchParams: { page: String(page) } });
  };

  const handleAddFile = () => {
    updateTabState({ searchParams: { page: "1" } });
    invalidateQuery();
  };

  const canDelete = activeTab === 'my-files' ? canDeleteMyFiles : canDeleteAllFiles;

  return (
    <Stack gap={"md"}>
      <Group justify="space-between" mb={"sm"}>
        <FilesTabsClient
          tabs={accessibleTabs.map(tab => ({ id: tab.id, label: tab.label }))}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        {canUpload && <AddFileButton onAdd={handleAddFile} />}
      </Group>

      <FilesList
        files={files}
        isLoading={isLoading}
        selectedFile={selectedFile}
        onSelect={handleSelectFile}
        onDelete={handleDeleteFile}
        canView={canView}
        canDelete={canDelete}
        deleteFileAction={activeTabData.deleteFileAction}
      />

      <FilesPagination
        currentPage={Number(currentTabState.searchParams.page)}
        totalPages={totalPages}
        onPageChange={handlePagination}
      />

      {selectedFile && onSelect && (
        <FileSelectButton selectedFile={selectedFile} onSelect={onSelect} />
      )}
    </Stack>
  );
}
