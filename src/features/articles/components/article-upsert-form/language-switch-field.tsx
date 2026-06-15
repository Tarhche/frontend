"use client";

import {useRouter} from "next/navigation";
import {Box, Button, InputLabel, Menu, Stack} from "@mantine/core";
import {IconChevronDown, IconLanguage, IconCheck} from "@tabler/icons-react";
import {APP_PATHS} from "@/lib/app-paths";
import type {Language} from "@/dal/public/languages";
import {useTranslations} from "@/i18n/provider";

type Props = {
  languages: Language[];
  correlationUuid: string;
  currentCode: string;
};

// Edit-mode language control: keeps the article's correlation uuid and switches
// between the website's available languages, so the editor can jump to (or start)
// a translation in another language under the same translation group.
export function LanguageSwitchField({
  languages,
  correlationUuid,
  currentCode,
}: Props) {
  const t = useTranslations();
  const router = useRouter();

  const current = languages.find((language) => language.code === currentCode);

  const switchTo = (code: string) => {
    if (code === currentCode) {
      return;
    }
    router.push(APP_PATHS.dashboard.articles.edit(correlationUuid, code));
  };

  return (
    <Stack gap={4}>
      <InputLabel>{t("articles.form.languageLabel")}</InputLabel>
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
            <Menu.Label>{t("articles.form.addOrEditTranslation")}</Menu.Label>
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
