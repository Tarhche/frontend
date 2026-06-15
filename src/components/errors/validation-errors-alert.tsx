"use client";

import {Alert, List, ListItem, type MantineSpacing} from "@mantine/core";
import {IconInfoCircle} from "@tabler/icons-react";
import {useTranslations} from "@/i18n/provider";

type Props = {
  errors?: string[];
  title?: string;
  mt?: MantineSpacing;
};

export function ValidationErrorsAlert({errors = [], title, mt = "sm"}: Props) {
  const t = useTranslations();
  const visible = errors.filter(Boolean);
  if (visible.length === 0) return null;

  return (
    <Alert
      variant="filled"
      color="red"
      title={title ?? t("errors.validationError")}
      icon={<IconInfoCircle />}
      mt={mt}
    >
      {visible.length === 1 ? (
        visible[0]
      ) : (
        <List size="sm" withPadding>
          {visible.map((err) => (
            <ListItem key={err}>{err}</ListItem>
          ))}
        </List>
      )}
    </Alert>
  );
}
