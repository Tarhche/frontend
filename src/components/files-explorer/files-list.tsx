"use client";

import {Group, Alert} from "@mantine/core";
import {IconInfoCircle} from "@tabler/icons-react";
import {FileCard} from "./file-card";
import {FilesSkeleton} from "./files-skeleton";

type File = {
  uuid: string;
  name: string;
  mimetype: string;
};

type Props = {
  files: File[];
  isLoading: boolean;
  selectedFile?: string;
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
  canView: boolean;
  canDelete: boolean;
};

export function FilesList({
  files,
  isLoading,
  selectedFile,
  onSelect,
  onDelete,
  canView,
  canDelete,
}: Props) {
  if (isLoading) {
    return (
      <Group justify="center">
        <FilesSkeleton />
      </Group>
    );
  }

  if (files.length === 0) {
    return (
      <Alert variant="light" color="blue" title="فایلی یافت نشد" mt={"sm"} icon={<IconInfoCircle />}>
        در حال حاضر هیچ فایلی وجود ندارد
      </Alert>
    );
  }

  return (
    <Group justify="center">
      {files.map((file) => (
        <FileCard
          key={file.uuid}
          file={{
            name: file.name,
            uuid: file.uuid,
            mimeType: file.mimetype,
          }}
          isSelected={selectedFile === file.uuid}
          onSelect={canView && onSelect ? onSelect : undefined}
          onDelete={canDelete && onDelete ? onDelete : undefined}
        />
      ))}
    </Group>
  );
}

