"use client";
import {Skeleton} from "@mantine/core";
import {UserAvatar} from "./user-avatar";
import {useIsClient} from "@/hooks/use-is-client";
import {useInit} from "@/hooks/data/init";

type Props = {
  width?: number;
  height?: number;
};

export function AuthUserAvatar({width = 45, height = 45}: Props) {
  const isClient = useIsClient();
  const {data, isLoading} = useInit();
  if (isLoading || !isClient) {
    return <Skeleton circle width={width} height={height} />;
  }

  if (data?.status === "authenticated") {
    const {avatar, uuid} = data.profile;
    return (
      <UserAvatar userId={uuid} src={avatar} width={width} height={height} />
    );
  }

  return null;
}
