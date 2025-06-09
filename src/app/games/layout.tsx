'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import BlueArchiveNavbar from '@/components/BlueArchiveNavbar';

export default function GamesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isBlueArchive = pathname.startsWith('/games/blue-archive');

  return (
    <>
      {isBlueArchive ? <BlueArchiveNavbar /> : <Navbar />}
      {children}
    </>
  );
} 