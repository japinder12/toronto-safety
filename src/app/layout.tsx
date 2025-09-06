import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AboutData from "@/components/AboutData";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Toronto Neighbourhood Safety Dashboard",
  description: "Explore recent Toronto Police MCI incidents near any address.",
  openGraph: {
    title: "Toronto Neighbourhood Safety Dashboard",
    description: "Explore recent Toronto Police MCI incidents near any address.",
    url: "https://toronto-safety-five.vercel.app/",
    siteName: "Toronto Safety",
    images: [{ url: "/og", width: 1200, height: 630, alt: "Toronto Safety" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Toronto Neighbourhood Safety Dashboard",
    description: "Explore recent Toronto Police MCI incidents near any address.",
    images: ["/og"],
  },
  icons: {
    // Put PNG first for Safari; SVG last as enhancement
    icon: [
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon.svg", type: "image/svg+xml", sizes: "any" },
    ],
    shortcut: ["/favicon-32x32.png"],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
    ],
    other: [
      { rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#0ea5e9" },
    ],
  },
  manifest: "/site.webmanifest",
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
        <footer className="mt-10 px-6 sm:px-10 py-6 text-xs opacity-70">
          <div className="mx-auto w-full max-w-5xl">
            <div>
              Data coverage: City of Toronto (Toronto Police Service Major Crime Indicators). This dashboard is for awareness only and not an official report.
            </div>
            <AboutData />
          </div>
        </footer>
      </body>
    </html>
  );
}
