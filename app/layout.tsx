import './globals.css';
import { Inter } from 'next/font/google';
import { Metadata } from 'next';
import ClientLayout from './client-layout';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Expert guideline system',
    template: '%s | Guideline AI'
  },
  description: 'Advanced AI-powered medical intelligence platform providing comprehensive drug safety analysis, hepatology insights, and clinical decision support for healthcare professionals.',
  keywords: [
    'medical AI',
    'drug safety',
    'hepatology',
    'clinical decision support',
    'adverse events',
    'pharmaceutical analysis',
    'medical intelligence',
    'healthcare AI',
    'FDA adverse events',
    'drug interactions'
  ],
  authors: [{ name: 'MedForce Team' }],
  creator: 'MedForce',
  publisher: 'MedForce',
  robots: {
    index: false, // Set to true when ready for production indexing
    follow: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ],
    apple: [
      { url: '/favicon.ico', sizes: '180x180' }
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://medforce.ai',
    siteName: 'EASL AI',
    title: 'EASL AI - Advanced Medical Intelligence Platform',
    description: 'Advanced AI-powered medical intelligence platform providing comprehensive drug safety analysis, hepatology insights, and clinical decision support.',
    images: [
      {
        url: '/icons/medforcelogo.webp',
        width: 1200,
        height: 630,
        alt: 'MedForce AI Platform',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MedForce AI - Advanced Medical Intelligence Platform',
    description: 'Advanced AI-powered medical intelligence platform for healthcare professionals.',
    images: ['/icons/medforcelogo.webp'],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' }
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans`}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}