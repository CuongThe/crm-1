import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'CRM Pro - Quản lý Khách hàng & Lịch hẹn',
  description: 'Hệ thống quản trị CRM cho Salon & Spa - Quản lý khách hàng, lịch hẹn, doanh thu.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-800 selection:bg-indigo-500 selection:text-white">
        <Navbar />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
