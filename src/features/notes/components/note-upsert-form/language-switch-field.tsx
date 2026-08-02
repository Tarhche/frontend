"use client";

import {useRouter} from "next/navigation";
import {Box, Button, InputLabel, Menu, Stack} from "@mantine/core";
import {IconChevronDown, IconLanguage, IconCheck} from "@tabler/icons-react";
import {APP_PATHS} from "@/lib/app-paths";
import type {Language} from "@/dal/public/languages";
import {useTranslations} from "@/i18n/provider";
import {type NotesScope} from "@/dal/private/notes";

type Props = {
  languages: Language[];
  correlationUuid: string;
  currentCode: string;
  // Keeps the switch inside the section the editor came from — the all-notes
  // pages or the self-scoped "my notes" ones.
  scope: NotesScope;
};

// Edit-mode language control: keeps the note's correlation uuid and switches
// between the website's available languages, so the editor can jump to (or start)
// a translation in another language under the same translation group.
export function LanguageSwitchField({
  languages,
  correlationUuid,
  currentCode,
  scope,
}: Props) {
  const t = useTranslations();
  const router = useRouter();

  const current = languages.find((language) => language.code === currentCode);
  const editPath =
    scope === "own"
      ? APP_PATHS.dashboard.my.notes.edit
      : APP_PATHS.dashboard.notes.edit;

  const switchTo = (code: string) => {
    if (code === currentCode) {
      return;
    }
    router.push(editPath(correlationUuid, code));
  };

  return (
    <Stack gap={4}>
      <InputLabel>{t("notes.form.languageLabel")}</InputLabel>
      <Box>
        <Menu shadow="md" width={220} position="bottom-start">
          <Menu.Target>
            <Button
              variant="default"
              leftSection={<IconLanguage size={18} />}
              rightSection={<IconChevronDown size={16} />}
            >
              {current?.name ?? currentCode}
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>{t("notes.form.addOrEditTranslation")}</Menu.Label>
            {languages.map((language) => (
              <Menu.Item
                key={language.code}
                onClick={() => switchTo(language.code)}
                rightSection={
                  language.code === currentCode ? <IconCheck size={16} /> : null
                }
              >
                {language.name}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
      </Box>
    </Stack>
  );
}
