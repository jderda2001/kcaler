import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import { ToastProvider } from '@/components/Toaster';
import { Providers } from '@/components/Providers';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Kcal Tracker',
  description: 'Liczenie kalorii i makro — szybko, bez konta, offline.',
  manifest: '/manifest.json',
  applicationName: 'Kcal Tracker',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kcal',
    startupImage: ['/icons/icon-512.png'],
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#0A0A0A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className={`${inter.variable} h-full`}>
      <body className="bg-background text-foreground min-h-full antialiased">
        <Providers>
          <ServiceWorkerRegister />
          <ToastProvider>
            <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">{children}</div>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
