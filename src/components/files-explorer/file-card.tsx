"use client";

import {useState} from "react";
import Image from "next/image";
import clsx from "clsx";
import {useMutation} from "@tanstack/react-query";
import {
  Box,
  Paper,
  Overlay,
  Group,
  Button,
  ActionIconGroup,
  ActionIcon,
  Modal,
  Badge,
} from "@mantine/core";
import {IconEye, IconTrash, IconCheck} from "@tabler/icons-react";
import {FILES_PUBLIC_URL} from "@/constants/envs";
import {deleteFileAction} from "./actions";
import {mimeToIcon, defaultIcon} from "./mimetype-mapping";
import classes from "./file-card.module.css";

type File = {
  uuid: string;
  name: string;
  mimeType: string;
};

type Props = {
  file: File;
  isSelected?: boolean;
  onDelete?: (id: string) => void;
  onSelect?: (id: string) => void;
};

export function FileCard({file, isSelected, onDelete, onSelect}: Props) {
  const {mutate, isPending} = useMutation({
    mutationKey: ["file-delete"],
    mutationFn: deleteFileAction,
    onSuccess: () => {
      onDelete?.(file.uuid);
      handleClose();
    },
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAction, setShowActions] = useState(false);
  const isImageFile = file.mimeType.startsWith("image/");
  const FileIcon = mimeToIcon[file.mimeType] || defaultIcon;

  const handleClose = () => {
    setShowDeleteConfirm(false);
    setShowActions(false);
  };

  const handleSelect = () => {
    onSelect?.(file.uuid);
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    const fd = new FormData();
    fd.set("id", file.uuid);
    mutate(fd);
  };

  return (
    <>
      <Paper
        p={5}
        withBorder
        className={clsx({
          [classes.paper]: true,
          [classes.selected]: isSelected,
        })}
        onMouseEnter={() => {
          setShowActions(true);
        }}
        onMouseLeave={() => {
          setShowActions(false);
        }}
        onClick={onSelect ? handleSelect : undefined}
      >
        <Box pos={"relative"} h={100}>
          {isSelected && (
            <Badge
              size="lg"
              color="green"
              className={classes.checkmark}
              classNames={{
                label: classes.checkmarkSection,
              }}
              circle
            >
              <IconCheck stroke={3} />
            </Badge>
          )}
          {isImageFile ? (
            <Image
              width={300}
              height={300}
              className={classes.imageCard}
              src={`${FILES_PUBLIC_URL}/${file.uuid}`}
              alt={file.name}
            />
          ) : (
            <Box
              w={100}
              h={100}
              display="flex"
              style={{
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileIcon size={40} />
            </Box>
          )}
          {showAction ? (
            <Overlay zIndex={98}>
              <Box className={classes.actionsWrapper}>
                <ActionIconGroup>
                  <ActionIcon
                    component={"a"}
                    size={"lg"}
                    target="_blank"
                    href={`${FILES_PUBLIC_URL}/${file.uuid}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <IconEye />
                  </ActionIcon>
                  {onDelete !== undefined && (
                    <ActionIcon
                      size={"lg"}
                      color="red"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(true);
                      }}
                    >
                      <IconTrash />
                    </ActionIcon>
                  )}
                </ActionIconGroup>
              </Box>
            </Overlay>
          ) : null}
        </Box>
      </Paper>
      <Modal
        title="از حذف این فایل مطمئن هستید؟"
        opened={showDeleteConfirm}
        size="md"
        centered
        onClose={handleClose}
      >
        <Group justify="center">
          <Image
            width={300}
            height={300}
            className={classes.imageCard}
            src={`${FILES_PUBLIC_URL}/${file.uuid}`}
            alt={file.name}
          />
        </Group>
        <Group justify="flex-end" mt={"md"}>
          <Button color="gray" onClick={handleClose}>
            لفو کردن
          </Button>
          <form action={handleDelete}>
            <Button color="red" type="submit" loading={isPending}>
              حذف کردن
            </Button>
          </form>
        </Group>
      </Modal>
    </>
  );
}
