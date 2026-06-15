import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HeptaSign — Internal approvals",
  description: "Internal document approval and verification system",
  icons: { icon: "/logo.svg" }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
