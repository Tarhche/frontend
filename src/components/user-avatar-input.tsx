"use client";

import {useState} from "react";
import {Stack, Tooltip, ActionIcon, Modal} from "@mantine/core";
import {UserAvatar} from "@/components/user-avatar";
import {FilesExplorer} from "@/components/files-explorer";
import {IconPencil} from "@tabler/icons-react";

type Props = {
  defaultValue?: string;
  userId?: string;
  inputName?: string;
};

export function UserAvatarInput({
  inputName = "avatar",
  userId,
  defaultValue,
}: Props) {
  const [showFileExplorer, setShowFileExplorer] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState("");
  const fileId = selectedFileId ? selectedFileId : defaultValue;

  return (
    <>
      <Stack align="center" gap={"xs"}>
        <UserAvatar userId={userId} src={fileId} width={138} height={138} />
        <Tooltip label="تغییر آواتار" withArrow>
          <ActionIcon
            color="dimmed"
            variant="transparent"
            onClick={() => {
              setShowFileExplorer(true);
            }}
          >
            <IconPencil />
          </ActionIcon>
        </Tooltip>
      </Stack>
      <input name={inputName} value={fileId} hidden readOnly />
      <Modal
        size={"xl"}
        opened={showFileExplorer}
        keepMounted={false}
        withCloseButton={false}
        centered
        onClose={() => {
          setShowFileExplorer(false);
        }}
      >
        <FilesExplorer
          onSelect={(fileId) => {
            setShowFileExplorer(false);
            setSelectedFileId(fileId);
          }}
        />
      </Modal>
    </>
  );
}
