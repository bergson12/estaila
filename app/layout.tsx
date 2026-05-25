import type { Metadata } from "next";
import { Raleway, JetBrains_Mono } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { Providers } from "@/components/providers";
import "./globals.css";

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

// Legacy aliases — older components still reference these variable names.
// Pointing them at Raleway keeps a unified type system across the app.
const fontAliases = {
  "--font-inter": "var(--font-raleway)",
  "--font-cormorant": "var(--font-raleway)",
  "--font-playfair": "var(--font-raleway)",
  "--font-fraunces": "var(--font-raleway)",
  "--font-instrument": "var(--font-raleway)",
} as React.CSSProperties;

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
      className={`${raleway.variable} ${jetbrainsMono.variable} antialiased`}
      style={fontAliases}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background text-foreground overflow-x-hidden">
        {/* Top progress bar — fires on every Link navigation */}
        <NextTopLoader
          color="#00bf63"
          height={2}
          showSpinner={false}
          shadow="0 0 8px #00bf6380"
          easing="cubic-bezier(0.22,1,0.36,1)"
          speed={250}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
