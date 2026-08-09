import { Toaster } from "@/components/ui/sonner";
import "./globals.css"

export const metadata = {
  title: "ACE々GYM · Admin Dashboard",
  description: "ACE々GYM member, subscription and dues management since 2026.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/acegym-icon.png" />
      </head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
