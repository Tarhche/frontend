"use client";

import {Indicator, Skeleton, Tooltip} from "@mantine/core";
import {UserAvatar} from "./user-avatar";
import {useIsClient} from "@/hooks/use-is-client";
import {useInit} from "@/hooks/data/init";
import {useTranslations} from "@/i18n/provider";

type Props = {
  width?: number;
  height?: number;
};

export function AuthUserAvatar({width = 45, height = 45}: Props) {
  const isClient = useIsClient();
  const t = useTranslations();
  const {data, isLoading} = useInit();
  if (isLoading || !isClient) {
    return <Skeleton circle width={width} height={height} />;
  }

  if (data?.status !== "authenticated") {
    return null;
  }

  const {avatar, uuid, name, username, impersonated_by} = data.profile;
  const avatarElement = (
    <UserAvatar userId={uuid} src={avatar} width={width} height={height} />
  );

  // the public side of a shadow session: a comment left here is left as this
  // person, so the avatar says it is not the account it looks like.
  if (!impersonated_by) {
    return avatarElement;
  }

  return (
    <Tooltip
      label={t("accounts.impersonation.title", {
        name: name || username || uuid,
      })}
      withArrow
    >
      <Indicator color="orange" size={10} offset={4} withBorder>
        {avatarElement}
      </Indicator>
    </Tooltip>
  );
}
