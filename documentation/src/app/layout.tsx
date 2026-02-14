import { Geist_Mono } from 'next/font/google';
import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';

const geistMono = Geist_Mono({
  subsets: ['latin']
});

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={geistMono.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
