import type { Metadata } from "next";
import "./globals.css";
import "./gestures-stories.css";
import "./travel-cover.css";
import "./motion-home.css";

export const metadata: Metadata = {
  title: "Wanderbook — your travel journal",
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
