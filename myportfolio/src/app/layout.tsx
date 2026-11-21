import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Manrope } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Satoshi has no Cyrillic: Manrope (a close geometric match) fills in only the Russian letters,
// e.g. in Doctor Livesey's speech bubble — Latin text keeps Satoshi.
const cyrillic = Manrope({
  variable: "--font-cyrillic",
  subsets: ["cyrillic"],
  weight: ["500", "700"],
  adjustFontFallback: false,
});

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const iconVersion = "20260403";
const pngIconPath = `${basePath}/icons/doctor-livsey-favicon-64.png?v=${iconVersion}`;
const icoIconPath = `${basePath}/favicon.ico?v=${iconVersion}`;
const appleIconPath = `${basePath}/icons/doctor-livsey-apple-180.png?v=${iconVersion}`;

export const metadata: Metadata = {
  title: "3llimi",
  description: "This is the Portfolio of Ahmed Baha Eddine Alimi",
  icons: {
    icon: [
      { url: pngIconPath, sizes: "64x64", type: "image/png" },
      { url: icoIconPath, type: "image/x-icon" },
    ],
    shortcut: icoIconPath,
    apple: [{ url: appleIconPath, sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cyrillic.variable}`}
        style={{ overflow: "hidden" }}
      >
        {children}
      </body>
    </html>
  );
}
