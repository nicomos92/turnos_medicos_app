import type { Metadata } from "next";
import { Sora, Space_Mono } from "next/font/google";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Sistema de Gestion de Turnos | Consultorios Medicos",
  description:
    "Plataforma SaaS para gestionar turnos, profesionales y pacientes en consultorios multiespecialidad.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${sora.variable} ${spaceMono.variable} min-h-screen bg-sand text-slate-900 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
