import type { Metadata } from "next";
import "./globals.css";
import { FluentUIProvider } from './providers/fluent-ui-provider';
import SessionWrapper from "@/app/authentification/SessionWrapper";
import { Navigation } from "./components/navigation/Navigation";

export const metadata: Metadata = {
  title: "Videohubs",
  description: "Control videohub outputs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="min-h-full m-0">
      <body className="min-h-full m-0">
        <FluentUIProvider>
          <SessionWrapper>
            <Navigation>
                {children}
            </Navigation>
          </SessionWrapper>
        </FluentUIProvider>
      </body>
    </html>
  );
}
