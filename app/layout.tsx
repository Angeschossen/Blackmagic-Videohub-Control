import type { Metadata } from "next";
import "./globals.css";
import { FluentUIProvider } from './providers/fluent-ui-provider';
import SessionWrapper from "@/app/authentification/SessionWrapper";
import { Navigation } from "./components/navigation/Navigation";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

export const metadata: Metadata = {
  title: "Videohubs",
  description: "Control videohub outputs.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html className="min-h-full m-0">
      <body className="min-h-full m-0">
        <FluentUIProvider>
          <NextIntlClientProvider messages={messages}>
            <SessionWrapper>
              <Navigation>
                {children}
              </Navigation>
            </SessionWrapper>
          </NextIntlClientProvider>
        </FluentUIProvider>
      </body>
    </html>
  );
}
