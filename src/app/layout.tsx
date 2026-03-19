import type { Metadata } from "next";
import { shobhika } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sanskrit Learning Platform",
  description:
    "Sanskrit text analysis, kaavya reading, and vocabulary building — sandhi splitting, samasa decomposition, morphological breakdown, and dictionary-backed meanings.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sa" className={shobhika.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
