import {AppMainShell} from "@/components/app-main-shell";
import Footer from "./footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppMainShell>
      {children} <Footer />
    </AppMainShell>
  );
}
