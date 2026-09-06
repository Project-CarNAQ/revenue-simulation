import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CarNAQ | Revenue Simulation Engine & Fleet Portal",
  description:
    "Deterministic mobility revenue simulation engine and investor fleet portal for CarNAQ.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-dark-950 text-slate-100 antialiased min-h-screen selection:bg-brand-500 selection:text-dark-950 font-sans">
        {children}
      </body>
    </html>
  );
}
