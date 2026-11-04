import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CNU CHA CHA STORE | 충남대학교 차차 공식 굿즈 스토어',
  description: '충남대학교 마스코트 차차(CHA CHA)를 활용한 공식 굿즈 쇼핑몰 및 스토어',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
