import type { Metadata } from "next";
import "../index.css";
import "../App.css";
import "../styles/landing.css";
import { VaultProvider } from "@/context/VaultContext";

export const metadata: Metadata = {
  title: "PwmngerTS - Zero-Knowledge Password Manager",
  description: "Secure, client-side encrypted password management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `globalThis.PW_API_URL = '/api';`
        }} />
      </head>
      <body>
        <div className="app-main">
          <div className="mesh-glow" />
          <VaultProvider>
            {children}
          </VaultProvider>
        </div>
      </body>
    </html>
  );
}
