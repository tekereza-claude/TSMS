import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { SessionWrapper } from "@/components/providers/session-provider";
import ChatWidget from "@/components/chatbot/ChatWidget";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TSMS | Teleparenting School Management System",
  description:
    "Multi-tenant school management platform connecting schools, teachers, and parents in real time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${fraunces.variable} antialiased`}>
        <SessionWrapper>
          <LanguageProvider>
            {children}
            <ChatWidget />
          </LanguageProvider>
        </SessionWrapper>
      </body>
    </html>
  );
}
