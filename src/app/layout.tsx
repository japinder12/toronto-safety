import type { Metadata } from "next";
import { headers } from "next/headers";
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

export async function generateMetadata(): Promise<Metadata> {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const base = new URL(`${proto}://${host}`);

  return {
    metadataBase: base,
    title: "Toronto Neighbourhood Safety Dashboard",
    description: "Explore recent Toronto Police MCI incidents near any address.",
    openGraph: {
      title: "Toronto Neighbourhood Safety Dashboard",
      description: "Explore recent Toronto Police MCI incidents near any address.",
      url: base.href,
      siteName: "Toronto Safety",
      images: [
        { url: "/og.png?v=1", width: 1200, height: 630, alt: "Toronto Safety", type: "image/png" },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Toronto Neighbourhood Safety Dashboard",
      description: "Explore recent Toronto Police MCI incidents near any address.",
      images: ["/og.png?v=1"],
    },
    // Rely on Next auto-links for app/icon.png and app/apple-icon.png
    // Keep pinned tab for Safari
    icons: {
      other: [
        { rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#0ea5e9" },
      ],
    },
    manifest: "/site.webmanifest",
  };
}

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
