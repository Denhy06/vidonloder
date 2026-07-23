import './globals.css';

export const metadata = {
  title: 'API Video Downloader',
  description: 'Multi-platform video downloader API built with Next.js',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}