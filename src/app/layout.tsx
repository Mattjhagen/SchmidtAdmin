import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Schmidt Construction — Admin",
    template: "%s | Schmidt Admin",
  },
  description: "Internal estimator and proposal management for Schmidt Construction.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} min-h-full flex flex-col bg-slate-50 text-slate-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
