import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Loko - Logistique & Dernier Kilomètre aux Comores",
    template: "%s | Loko"
  },
  description: "La plateforme logistique de référence aux Comores. Livraison rapide, suivi en temps réel et solutions pour e-commerce.",
  keywords: ["logistique", "Comores", "livraison", "dernier kilomètre", "e-commerce", "Moroni", "transport"],
  authors: [{ name: "Loko Team" }],
  creator: "Loko",
  openGraph: {
    type: "website",
    locale: "fr_KM",
    url: "https://loko.km",
    title: "Loko - Logistique & Dernier Kilomètre",
    description: "Simplifiez vos livraisons aux Comores avec Loko. Suivi GPS et fiabilité garantie.",
    siteName: "Loko",
    images: [{
      url: "/loko.png",
      width: 512,
      height: 512,
      alt: "Loko Logo"
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Loko - Logistique Comores",
    description: "Le futur de la logistique aux Comores est ici.",
    images: ["/loko.png"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/loko.png",
    apple: "/loko.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Loko",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import { Providers } from "@/components/providers";
import { OfflineAlert } from "@/components/layout/offline-alert";
import { ServiceWorkerRegister } from "@/components/sw-register";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <OfflineAlert />
          <ServiceWorkerRegister />
          {children}
        </Providers>
      </body>
    </html>
  );
}
