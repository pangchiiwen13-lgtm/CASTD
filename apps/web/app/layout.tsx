import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
import "./globals.css";

// Body / UI font - Inter (designed for screen readability)
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

// Display / Headline font - Syne (H1–H3, wordmark only)
const syne = Syne({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-syne",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CASTD - Find Your On-Screen Talent",
  description: "Discover and book vetted beauty & lifestyle on-screen talent for your brand videos.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body suppressHydrationWarning className={`${inter.variable} ${syne.variable} min-h-full flex flex-col bg-background text-foreground`}>
        {children}
      </body>
    </html>
  );
}
