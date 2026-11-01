import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MY SCHOOL TASK SYSTEM - ប្រព័ន្ធគ្រប់គ្រងការងារសាលារៀន និងកិច្ចការបង្រៀន',
  description: 'School Academic & Teaching Management System - Complete management for academic planning, curriculum, timetables, lesson plans, attendance, and reporting.',
  openGraph: {
    title: 'MY SCHOOL TASK SYSTEM',
    description: 'School Academic & Teaching Management System',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MY SCHOOL TASK SYSTEM',
    description: 'School Academic & Teaching Management System',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="km" suppressHydrationWarning>
      <body suppressHydrationWarning className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
