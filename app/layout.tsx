import type { Metadata } from "next";
import {
  Inter,
  JetBrains_Mono,
  Cormorant_Garamond,
  Playfair_Display,
  Fraunces,
  Instrument_Sans,
} from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "estaila — CRM + Studio IA",
  description:
    "CRM inmobiliario con herramientas de edición de fotos por IA. Para agentes inmobiliarios independientes en todo el mundo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${jetbrainsMono.variable} ${cormorant.variable} ${playfair.variable} ${fraunces.variable} ${instrumentSans.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background text-foreground overflow-x-hidden">
        {/* Top progress bar — fires on every Link navigation */}
        <NextTopLoader
          color="oklch(0.58 0.135 38)"
          height={2}
          showSpinner={false}
          shadow="0 0 8px oklch(0.58 0.135 38 / 0.5)"
          easing="cubic-bezier(0.22,1,0.36,1)"
          speed={250}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
