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

export const metadata: Metadata = {
  metadataBase: new URL("https://briefing.hyperdoctor.app"),
  title: "개원의 정석 데일리 브리핑",
  description: "날씨·시장·의료계 소식·최신 저널과 오늘의 문장을 한눈에 보는 개원의 아침 브리핑",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/hyperdoctor-favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", sizes: "64x64", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "/",
    siteName: "HyperDoctor",
    title: "개원의 정석 데일리 브리핑",
    description: "개원의에게 필요한 오늘의 날씨·시장·의료계 소식·최신 저널을 한 장에",
    images: [
      {
        url: "/daily-briefing-share.png",
        width: 1254,
        height: 1254,
        alt: "아침 햇살과 브리핑 보드로 표현한 개원의 정석 데일리 브리핑",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "개원의 정석 데일리 브리핑",
    description: "개원의에게 필요한 오늘의 날씨·시장·의료계 소식·최신 저널을 한 장에",
    images: ["/daily-briefing-share.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#2E7D6E",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
