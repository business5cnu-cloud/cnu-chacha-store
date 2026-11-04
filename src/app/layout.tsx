import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CNU CHA CHA STORE | 충남대학교 차차 공식 굿즈 스토어',
  description: '충남대학교 마스코트 차차(CHA CHA) 공식 굿즈 쇼핑몰',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
