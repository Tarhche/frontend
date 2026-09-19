"use client";

import {useState, useTransition} from "react";
import {Button, Divider, Stack} from "@mantine/core";
import {
  IconBrandGithub,
  IconBrandGoogle,
  IconBrandLinkedin,
  IconLogin2,
} from "@tabler/icons-react";
import {ValidationErrorsAlert} from "@/components/errors/validation-errors-alert";
import {useTranslations} from "@/i18n/provider";
import {beginProviderLogin} from "../actions/provider-login";

// What each provider is called and drawn as here. A provider the backend offers
// that this list has never heard of is still shown, under its own name: better
// a plain button than no way in.
const BRANDS: Record<string, {label: string; icon: typeof IconBrandGoogle}> = {
  google: {label: "Google", icon: IconBrandGoogle},
  github: {label: "GitHub", icon: IconBrandGithub},
  linkedin: {label: "LinkedIn", icon: IconBrandLinkedin},
};

type Props = {
  // the providers the backend actually has secrets for. Empty renders nothing
  // at all, dividers included.
  providers: string[];
};

/**
 * Signing in with an account somebody else keeps.
 *
 * The same buttons serve the login page and the register page, because they are
 * the same door: somebody arriving with a Google account this estate has never
 * seen is enrolled on the spot, and cannot tell you which of the two they meant.
 */
export function ProviderButtons({providers}: Props) {
  const t = useTranslations();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState("");
  const [failed, setFailed] = useState(false);

  if (providers.length === 0) {
    return null;
  }

  const begin = (provider: string) => {
    setBusy(provider);
    setFailed(false);

    startTransition(async () => {
      const {url} = await beginProviderLogin(provider);

      if (!url) {
        setBusy("");
        setFailed(true);

        return;
      }

      // the provider's own page is not this app's to route to
      window.location.href = url;
    });
  };

  return (
    <>
      <Divider label={t("auth.providers.or")} labelPosition="center" my="lg" />
      <Stack gap="sm">
        {failed && (
          <ValidationErrorsAlert
            errors={[t("auth.providers.unavailable")]}
            title={t("auth.shared.operationFailed")}
          />
        )}
        {providers.map((provider) => {
          const brand = BRANDS[provider];
          const Icon = brand?.icon ?? IconLogin2;

          return (
            <Button
              key={provider}
              variant="default"
              fullWidth
              leftSection={<Icon size="1.2rem" stroke={1.5} />}
              loading={pending && busy === provider}
              disabled={pending && busy !== provider}
              onClick={() => begin(provider)}
            >
              {t("auth.providers.continueWith", {
                provider: brand?.label ?? provider,
              })}
            </Button>
          );
        })}
      </Stack>
    </>
  );
}
