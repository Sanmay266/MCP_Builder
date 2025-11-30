import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MCPForge - MCP Server Builder",
  description: "Build and export Model Context Protocol servers visually",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
