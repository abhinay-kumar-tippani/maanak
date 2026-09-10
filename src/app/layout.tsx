import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NAWI Lab - SIH26035 Prototype",
  description: "Non-Automatic Weighing Instruments Laboratory Test-Report System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
