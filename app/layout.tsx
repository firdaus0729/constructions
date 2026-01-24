import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
import { LocaleProvider } from "@/lib/locale-context"
import { AuthProvider } from "@/lib/auth-context"
import { OfflineProvider } from "@/lib/offline-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { SyncStatusBanner } from "@/components/sync-status-banner"
import { StoreHydration } from "@/components/store-hydration"
import { InitDemoUsers } from "@/components/init-demo-users"
import "./globals.css"

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})
const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Construction Site Forms",
  description: "Enterprise construction site inspection, observation, and incident management",
  generator: "v0.app",
  icons: {
    icon: "/logo.png",
    apple: "/apple-icon.png",
    shortcut: "/logo.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1a365d",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LocaleProvider>
            <AuthProvider>
              <OfflineProvider>
                <StoreHydration />
                <InitDemoUsers />
                {children}
                <SyncStatusBanner />
                <Toaster position="top-right" />
              </OfflineProvider>
            </AuthProvider>
          </LocaleProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
