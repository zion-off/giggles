import { Barriecito, Geist_Mono } from 'next/font/google';
import './global.css';
import { Provider } from './provider';

const geistMono = Geist_Mono({
  subsets: ['latin']
});

const barriecito = Barriecito({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-barriecito'
});

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${geistMono.className} ${barriecito.variable}`} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
