import type { Metadata } from "next";
import "./globals.css";
import { FluentUIProvider } from './providers/fluent-ui-provider';
import SessionWrapper from "@/app/authentification/SessionWrapper";
import { ProtectedPage } from "./components/ProtectedPage";
import { Navigation } from "./components/navigation/Navigation";
import { SocketProvider } from "./providers/socket-provider";

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
    <html className="h-full m-0">
      <body className="h-full m-0">
        <FluentUIProvider>
          <SessionWrapper>
            <ProtectedPage>
              <div className="flex h-full m-0">
                <Navigation>
                  <SocketProvider>
                    {children}
                  </SocketProvider>
                </Navigation>
              </div>
            </ProtectedPage>
          </SessionWrapper>
        </FluentUIProvider>
      </body>
    </html>
  );
}
