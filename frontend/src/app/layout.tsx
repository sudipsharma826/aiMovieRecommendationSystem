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
  title: "AI Movie Recommendation",
  description: "AI Movie Recommendation by Sudip Sharma. Discover your next favorite movie with our intelligent recommendation engine.",
  icons:{ icon: "/logo.png" },
  authors: [{ name: "Sudip Sharma" }],
  openGraph: {
    title: "AI Movie Recommendation",
    description: "AI Movie Recommendation by Sudip Sharma. Discover your next favorite movie with our intelligent recommendation engine.",
    url: "https://aimovie.sudipsharma.com.np",
    siteName: "AI Movie Recommendation",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Movie Recommendation",
    description: "AI Movie Recommendation by Sudip Sharma",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href="/logo.png" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
