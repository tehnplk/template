import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KPI Template",
  description: "KPI template recording system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
