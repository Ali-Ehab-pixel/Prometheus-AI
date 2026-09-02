import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Data Analyst Platform",
  description: "Automated Data Cleaning, Interactive Visualizations, and Machine Learning Predictions orchestrated by LangGraph and E2B Sandbox.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090d16] text-slate-100 antialiased min-h-screen flex flex-col bg-grid-pattern">
        {children}
      </body>
    </html>
  );
}
