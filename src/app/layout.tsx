import type { Metadata } from "next";
import { Header } from "@/components/header";
import "./globals.css";
import { WishlistProvider } from "@/components/wishlist-provider";
import { getSessionUserId } from "@/lib/auth";
import { wishlistService } from "@/lib/services/wishlist-service";
import { cartService } from "@/lib/services/cart-service";
import { CartProvider } from "@/components/cart-provider";
import { StoreFooter } from "@/components/store-footer";

export const metadata: Metadata = {
  title: "CommerceCraft",
  description: "A production-style full-stack e-commerce platform built with Next.js and DynamoDB.",
  other: {
    google: "notranslate"
  }
};

// Catalog and account data are read from DynamoDB at request time.
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const userId = await getSessionUserId();
  const [wishlist, cart] = await Promise.all([
    userId ? wishlistService.getWishlist(userId) : [],
    userId ? cartService.getCart(userId) : { items: [], subtotal: 0, itemCount: 0 }
  ]);
  return (
    <html lang="en" translate="no" className="notranslate" suppressHydrationWarning>
      <body>
        <WishlistProvider key={userId ?? "guest"} initialItems={wishlist}>
          <CartProvider key={userId ?? "guest"} initialCart={cart}>
            <Header />
            <main>{children}</main>
            <StoreFooter />
          </CartProvider>
        </WishlistProvider>
      </body>
    </html>
  );
}
