import './globals.css';
import Providers from '../components/Providers';

export const metadata = {
  title: 'Bidकेन्द्र — from finding to filing',
  description: 'AI-Powered Bid Compliance Verification Platform for GeM Procurement',
  icons: {
    icon: '/bidkendra-logo.jpg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Playfair+Display:wght@600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-100 transition-colors">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
