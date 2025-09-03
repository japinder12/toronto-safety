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
  title: "Neighborhood Safety Dashboard",
  description: "View nearby incidents in Toronto and Peel",
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
          <div>
            Data coverage: City of Toronto (Toronto Police Service Major Crime Indicators). This dashboard is for awareness only and not an official report.
          </div>
        </footer>
      </body>
    </html>
  );
}
