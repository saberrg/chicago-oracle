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
  title: "Chicago Oracle - Discover Chicago",
  description: "A local sharing how they see Chicago",
  keywords: ["Chicago", "photography", "geotagged photos", "Chicago landmarks", "local photography", "Chicago exploration", "interactive maps", "Chicago Oracle"],
  authors: [{ name: "Chicago Oracle" }],
  creator: "Chicago Oracle",
  publisher: "Chicago Oracle",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://chicagooracle.com',
    title: 'Chicago Oracle - Discover Chicago',
    description: 'A local sharing how they see Chicago',
    siteName: 'Chicago Oracle',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chicago Oracle - Discover Chicago',
    description: 'A local sharing how they see Chicago',
  },
  icons: {
    icon: "/CO-favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
