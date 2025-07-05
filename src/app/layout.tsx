import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Jogos IFMA",
  description: "Sistema de controle de jogos escolares do IFMA - Campus Timon",
  icons: {
    icon: "/assets/favicon.ico",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <Toaster position="top-right" />
      <body>{children}</body>
    </html>
  );
}
