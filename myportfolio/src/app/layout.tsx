import type { Metadata, Viewport } from "next";
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

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const windowIconPath = `${basePath}/icons/DoctorLiveseyR.png`;

export const metadata: Metadata = {
  title: "3llimi",
  description: "This is the Portfolio of Ahmed Baha Eddine Alimi",
  icons: {
    icon: windowIconPath,
    shortcut: windowIconPath,
    apple: windowIconPath,
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
        className={`${geistSans.variable} ${geistMono.variable}`}
        style={{ overflow: "hidden" }}
      >
        {children}
      </body>
    </html>
  );
}
