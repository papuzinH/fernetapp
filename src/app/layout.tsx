import type { Metadata, Viewport } from "next";
import { Kanit, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";

const kanit = Kanit({
  variable: "--font-kanit",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  style: ["normal", "italic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0A192F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "FernetApp | Fernet con Guaymallén",
  description:
    "Dashboard y gestión administrativa del historial futbolero de Fernet con Guaymallén",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FernetApp",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-16x16.png",  sizes: "16x16",  type: "image/png" },
      { url: "/icons/icon-32x32.png",  sizes: "32x32",  type: "image/png" },
      { url: "/icons/icon-96x96.png",  sizes: "96x96",  type: "image/png" },
      { url: "/icons/icon-192x192.png",sizes: "192x192",type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "apple-touch-icon-precomposed", url: "/apple-touch-icon.png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${kanit.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <Providers>
          <TooltipProvider>
            <ServiceWorkerRegistration />
            <Navbar />
            <main className="min-h-[calc(100vh-4rem)]">{children}</main>
            <Toaster richColors position="top-right" />
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
