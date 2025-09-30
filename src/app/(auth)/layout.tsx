import {Metadata} from "next";
import {type ReactNode} from "react";
import {Container} from "@mantine/core";

export const metadata: Metadata = {
  title: {
    default: "احراز هویت | طرح‌چه",
    template: "%s | احراز هویت | طرح‌چه",
  },
};

type Props = {
  children: ReactNode;
};

export default function RootLayout({children}: Props) {
  return (
    <Container size={480} my={60}>
      {children}
    </Container>
  );
}
