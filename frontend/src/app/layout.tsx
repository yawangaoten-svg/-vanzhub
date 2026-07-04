import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

export const runtime = 'edge';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'VANZHUB - Connect • Share • Discover',
  description: 'VANZHUB is a social networking platform where you can connect with friends, share your moments, discover new content, and build communities.',
  keywords: ['social network', 'connect', 'share', 'discover', 'vanzhub', 'community'],
  authors: [{ name: 'VANZHUB' }],
  openGraph: {
    title: 'VANZHUB - Connect • Share • Discover',
    description: 'Connect with friends, share your moments, and discover new content.',
    siteName: 'VANZHUB',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VANZHUB - Connect • Share • Discover',
    description: 'Connect with friends, share your moments, and discover new content.',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="font-sans antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
