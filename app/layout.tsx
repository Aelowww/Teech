import type { Metadata } from "next";
import { LayoutSwitch } from "./_components/layout-switch";
import "./globals.css";

export const metadata: Metadata = {
  title: "Teech | Student and Faculty Consultations",
  description: "A clearer way for students and faculty to connect for consultations.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <LayoutSwitch />
        {children}
      </body>
    </html>
  );
}
