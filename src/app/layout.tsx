import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { RouteLoader } from "@/components/route-loader";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Suvarna GoldLoan ERP",
  description: "Enterprise SaaS for Gold Loan Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Suspense fallback={null}>
          <RouteLoader />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
