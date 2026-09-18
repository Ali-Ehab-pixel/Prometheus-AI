import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { CookieConsent } from "../components/CookieConsent";

export const metadata: Metadata = {
  title: "Prometheus AI — AI Data Scientist Platform",
  description:
    "Autonomous AI-powered data science platform. Upload datasets, auto-clean, generate visualizations, find insights, and get executive reports — all powered by LangGraph agents and isolated sandbox execution.",
  keywords: [
    "AI data analyst",
    "data science platform",
    "Prometheus AI",
    "data cleaning",
    "data visualization",
    "data insights",
    "LangGraph",
  ],
  authors: [{ name: "Prometheus AI" }],
  openGraph: {
    title: "Prometheus AI — AI Data Scientist Platform",
    description:
      "Upload your dataset and let AI agents clean, analyze, visualize, and find insights automatically.",
    type: "website",
    siteName: "Prometheus AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prometheus AI — AI Data Scientist Platform",
    description:
      "Autonomous AI-powered data science. Clean, visualize, and extract insights in minutes.",
  },
  robots: "index, follow",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="theme-color" content="#090d16" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="bg-[#090d16] text-slate-100 antialiased min-h-screen flex flex-col bg-grid-pattern">
        <AuthProvider>
          {children}
          <CookieConsent />
        </AuthProvider>
      </body>
    </html>
  );
}
