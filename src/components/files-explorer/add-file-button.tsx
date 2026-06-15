"use client";

import {useState, useRef, useId} from "react";
import {Tooltip, ActionIcon, Loader} from "@mantine/core";
import {IconPlus} from "@tabler/icons-react";
import {useTranslations} from "@/i18n/provider";
import {addFileAction} from "./add-action";

type Props = {
  onAdd: () => void;
};

export function AddFileButton({onAdd}: Props) {
  const t = useTranslations();
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const handleFileChange = async () => {
    if (formRef.current) {
      const fd = new FormData(formRef.current);
      try {
        setPending(true);
        await addFileAction(fd);
        onAdd();
        if (inputRef.current?.value) {
          inputRef.current.value = "";
        }
      } finally {
        setPending(false);
      }
    }
  };

  return (
    <form ref={formRef}>
      <Tooltip
        label={pending ? t("files.addingFiles") : t("files.addImage")}
        withArrow
      >
        <ActionIcon
          variant="light"
          size="lg"
          component="label"
          htmlFor={inputId}
        >
          {pending ? <Loader size="xs" /> : <IconPlus />}
        </ActionIcon>
      </Tooltip>
      <input
        name="file"
        id={inputId}
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        hidden
      />
    </form>
  );
}
