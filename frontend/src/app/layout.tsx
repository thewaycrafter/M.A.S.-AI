import type { Metadata } from "next";
import "../styles/design-system.css";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Aegis AI - Defensive-First AI Penetration Testing Engine",
  description: "Enterprise-grade AI-powered security engine for authorized penetration testing and vulnerability assessment.",
  keywords: ["security", "penetration testing", "AI", "vulnerability scanning", "cybersecurity"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
