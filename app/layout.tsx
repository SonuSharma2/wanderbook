import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wanderbook — a little further, a little fuller",
  description: "Your personal travel journal. Collect trails, tables, places, and the moments in between.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
