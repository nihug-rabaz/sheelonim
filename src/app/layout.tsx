import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SystemFooter } from "@/components/layout/system-footer";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "מערכת שאלונים | למיטב",
  description: "הקמה, איסוף וניתוח שאלונים",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
  appleWebApp: {
    capable: true,
    title: "שאלונים",
    statusBarStyle: "default",
  },
  other: {
    "msapplication-TileColor": "#0d9488",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <body
        className={cn(
          "flex min-h-screen flex-col font-sans antialiased",
          heebo.variable
        )}
      >
        <ThemeProvider>
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          <SystemFooter />
          <Toaster position="top-center" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
