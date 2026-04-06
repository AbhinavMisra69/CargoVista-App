import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "CargoVista",
  description: "Intelligent Logistics Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-black text-white font-sans antialiased overflow-x-hidden selection:bg-white/10 selection:text-white">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}