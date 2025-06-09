import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers';
import Providers from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '遊戲快報',
  description: '為你總結遊戲每天遊戲情報',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const heads = headers();
  const pathname = heads.get('next-url') || '';

  let backgroundImageUrl = 'url("/檔案背景.jpg")';
  let backgroundOverlay = 'rgba(0, 0, 0, 0)'; 

  if (pathname.includes('/games/princess-connect')) {
    backgroundImageUrl = 'url("/公連背景.jpg")';
    backgroundOverlay = 'rgba(0, 0, 0, 0.5)';
  } else if (pathname === '/') {
    backgroundImageUrl = 'none';
  }

  return (
    <html lang="zh-TW">
      <body className={inter.className}>
        <Providers>
          <div 
            className="background-container" 
            style={{ 
              backgroundImage: backgroundImageUrl,
            }} 
          />
          <div 
            className="background-overlay"
            style={{
              backgroundColor: backgroundOverlay,
            }}
          />
          <div className="content-container">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
