import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import Overlay from "@/components/layout/Overlay";

const dm_sans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "700", "300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Hazee - NFT Marketplace for creators and brands",
  description: "Find, buy and sell NFT or digital arts on Hazee.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={dm_sans.className}>
        <Overlay />
        {children}
      </body>
    </html>
  );
}
