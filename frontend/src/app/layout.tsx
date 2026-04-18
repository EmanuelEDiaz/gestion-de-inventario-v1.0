import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/presentation/shared/components/ServiceWorkerRegistration";
import { Toaster } from "@/presentation/shared/components/ui";

export const metadata: Metadata = {
  title: "Gestión de Inventario",
  description: "Sistema de gestión de inventario offline-first",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.svg" />
      </head>
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegistration />
        <Toaster />
        {children}
      </body>
    </html>
  );
}
