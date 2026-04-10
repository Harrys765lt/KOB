import type { Metadata } from "next";
import "./globals.css";
import { UserRoleProvider } from "@/context/user-role-context";

export const metadata: Metadata = {
  title: "Talent Cloud by Boxin Global",
  description: "KOL Order Book prototype for Malaysian creator-brand matching.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <UserRoleProvider>{children}</UserRoleProvider>
      </body>
    </html>
  );
}
