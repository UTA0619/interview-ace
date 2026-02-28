import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI面接練習",
  description: "AI面接官と練習して、本番に備えよう",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="antialiased min-h-screen bg-zinc-50 text-zinc-900">
        {children}
      </body>
    </html>
  );
}
