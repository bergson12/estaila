import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { Providers } from "@/components/providers";
import "./globals.css";

// Brand fonts (design handoff): Space Grotesk = display/headings,
// Hanken Grotesk = body/UI.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

// Legacy aliases — older components still reference these variable names.
// --font-raleway now points to Hanken (body) so nothing breaks; decorative
// display aliases point to Space Grotesk.
const fontAliases = {
  "--font-raleway": "var(--font-hanken)",
  "--font-inter": "var(--font-hanken)",
  "--font-cormorant": "var(--font-space-grotesk)",
  "--font-playfair": "var(--font-space-grotesk)",
  "--font-fraunces": "var(--font-space-grotesk)",
  "--font-instrument": "var(--font-hanken)",
} as React.CSSProperties;

export const metadata: Metadata = {
  title: "estaila — CRM + Studio IA",
  description:
    "CRM inmobiliario con herramientas de edición de fotos por IA. Para agentes inmobiliarios independientes en todo el mundo.",
  applicationName: "estaila",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "estaila",
  },
  icons: {
    icon: "/logos/iso-estaila.png",
    shortcut: "/logos/iso-estaila.png",
    apple: "/logos/iso-estaila.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#00bf63",
  width: "device-width",
  initialScale: 1,
  // Permite que env(safe-area-inset-*) funcione bajo el notch / Dynamic Island
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${spaceGrotesk.variable} ${hankenGrotesk.variable} ${jetbrainsMono.variable} antialiased`}
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
