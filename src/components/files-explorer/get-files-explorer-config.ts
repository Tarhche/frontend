"use server";

import {getUserPermissions} from "@/lib/auth";
import {PERMISSIONS} from "@/lib/app-permissions";
import {hasPermission} from "@/lib/auth/shared";

export type FilesExplorerConfig = {
  accessibleTabs: Array<{
    id: string;
    label: string;
    apiEndpoint: string;
  }>;
  canUpload: boolean;
  canDeleteMyFiles: boolean;
  canDeleteAllFiles: boolean;
  canView: boolean;
};

export async function getFilesExplorerConfig(): Promise<FilesExplorerConfig | null> {
  const userPermissions = await getUserPermissions();
  
  if (userPermissions === null) {
    return null;
  }

  const ALL_TABS = [
    {
      id: 'my-files',
      label: 'فایل‌های من',
      apiEndpoint: '/dashboard/my/files',
      requiredPermissions: [PERMISSIONS.self.files.INDEX],
    },
    {
      id: 'all-files',
      label: 'همه فایل‌ها',
      apiEndpoint: '/dashboard/files',
      requiredPermissions: [PERMISSIONS.files.INDEX],
    },
  ] as const;

  const accessibleTabs = ALL_TABS.filter(tab => 
    hasPermission(userPermissions, [...tab.requiredPermissions])
  );

  if (accessibleTabs.length === 0) {
    return null;
  }

  const canUpload = hasPermission(userPermissions, [
    PERMISSIONS.files.CREATE,
  ] as string[]);
  
  const canDeleteMyFiles = hasPermission(userPermissions, [
    PERMISSIONS.self.files.DELETE,
  ] as string[]);
  
  const canDeleteAllFiles = hasPermission(userPermissions, [
    PERMISSIONS.files.DELETE,
  ] as string[]);
  
  const canView = hasPermission(userPermissions, [
    PERMISSIONS.files.INDEX,
    PERMISSIONS.self.files.INDEX,
  ] as string[]);

  return {
    accessibleTabs: accessibleTabs.map(tab => ({
      id: tab.id,
      label: tab.label,
      apiEndpoint: tab.apiEndpoint,
    })),
    canUpload,
    canDeleteMyFiles,
    canDeleteAllFiles,
    canView,
  };
}

