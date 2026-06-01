import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EU AI Act Assistant",
  description: "RAG-powered legal assistant for the EU AI Act",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
