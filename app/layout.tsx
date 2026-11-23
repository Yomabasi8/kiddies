import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

// Fredoka One has been folded into the variable Fredoka family on Google
// Fonts; weight 600 reproduces the Fredoka One look.
const fredoka = Fredoka({
  variable: "--font-fredoka",
  // latin-ext provides the dotless "ı" used by the footer wordmark.
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // TODO: set NEXT_PUBLIC_SITE_URL to the production domain.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Kiddies Accessories | Kids' Essentials & Toys in Nigeria",
    template: "%s | Kiddies Accessories",
  },
  description:
    "Shop feeding essentials, bottles, mealtime accessories and educational toys for babies and children, delivered across Nigeria.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fredoka.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
