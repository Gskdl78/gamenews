'use client'

import React from 'react'
import Link from 'next/link'
import { useSearchParams, usePathname } from 'next/navigation'
import { Box, Typography, Tabs, Tab } from '@mui/material'
import Image from 'next/image'

const categories = [
  { label: '公主連結', value: 'all' },
  { label: '活動', value: '活動' },
  { label: '轉蛋', value: '轉蛋' },
  { label: '更新', value: '更新' },
  { label: '戰隊戰', value: '戰隊戰' },
]

const Navbar: React.FC = () => {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const currentCategory = searchParams.get('category') || 'all'

  return (
    <Box 
      sx={{ 
        width: '100%', 
        bgcolor: 'rgba(255, 255, 255, 0.85)', 
        backdropFilter: 'blur(10px)',
        borderBottom: 1,
        borderColor: 'divider',
        position: 'sticky',
        top: 0,
        zIndex: 1100, // 高於內容
      }}
    >
      <Box 
        sx={{ 
          maxWidth: 1200, 
          mx: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Link href="/games/princess-connect" passHref legacyBehavior>
            <a style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
              <Box sx={{ position: 'relative', width: '40px', height: '40px', mr: 1 }}>
                <Image 
                  src="/pcr-logo.png" 
                  alt="Princess Connect Re:Dive Logo" 
                  fill
                  sizes="40px"
                  style={{ objectFit: 'contain' }}
                />
              </Box>
              <Typography variant="h6" component="div" sx={{ 
                fontWeight: 'bold',
                color: '#000000', // 明確設置黑色文字
                fontSize: '1.25rem' // 增加字體大小
              }}>
                超異域公主連結☆Re:Dive
              </Typography>
            </a>
          </Link>
        </Box>
        <Tabs
          value={currentCategory}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          aria-label="news categories"
        >
          <Tab
            label="電玩快報"
            component={Link}
            href="/"
            sx={{ minWidth: 'auto', mr: 2, fontWeight: 'bold' }}
          />
          {categories.map((cat) => {
            const href = cat.value === 'all' ? pathname : `${pathname}?category=${cat.value}`;
            return (
              <Tab
                key={cat.value}
                label={cat.label}
                value={cat.value}
                component={Link}
                href={href}
              />
            );
          })}
        </Tabs>
      </Box>
    </Box>
  )
}

export default Navbar 