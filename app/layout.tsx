import './globals.css';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Providers } from '@/components/providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://safesphere.ai'),
  title: 'SafeSphere AI — Enterprise Safety Intelligence Platform',
  description:
    'AI-powered workplace safety intelligence platform. Monitor workers, sensors, machines, permits, and incidents in real-time.',
  applicationName: 'SafeSphere AI',
  authors: [{ name: 'ET AI Hackathon 2026' }],
  keywords: [
    'safety',
    'EHS',
    'workplace safety',
    'AI safety',
    'industrial monitoring',
    'compliance',
  ],
  openGraph: {
    title: 'SafeSphere AI — Enterprise Safety Intelligence Platform',
    description:
      'AI-powered workplace safety intelligence platform for industrial operations.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
