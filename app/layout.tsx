import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import Overlay from "@/components/layout/Overlay";
import { WalletProvider } from "@/context/WalletProvider";
import { ToastProvider } from "@/context/ToastProvider";
import { NFTMarketplaceProvider } from "@/context/NFTMarketplaceProvider";
import { NFTAuctionProvider } from "@/context/NFTAuctionProvider";
import { NFTCollectionsProvider } from "@/context/NFTCollectionProvider";
import { NFTProvider } from "@/context/NFTProvider";
import ReactQueryProvider from "@/context/ReactQueryProvider";

const dm_sans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "700", "300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Hazee - NFT Marketplace for creators and brands",
  description: "Find, buy and sell NFT or digital art on Hazee.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={dm_sans.className}>
        <ReactQueryProvider>
          <ToastProvider>
            <WalletProvider>
              <NFTProvider>
                <NFTMarketplaceProvider>
                  <NFTAuctionProvider>
                    <NFTCollectionsProvider>
                      <Overlay />
                      {children}
                    </NFTCollectionsProvider>
                  </NFTAuctionProvider>
                </NFTMarketplaceProvider>
              </NFTProvider>
            </WalletProvider>
          </ToastProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
