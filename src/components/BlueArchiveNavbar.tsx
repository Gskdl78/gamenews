'use client'

import React from 'react'
import Link from 'next/link'
import { useSearchParams, usePathname } from 'next/navigation'
import { Box, Typography, Tabs, Tab } from '@mui/material'
import Image from 'next/image'

const categories = [
  { label: '蔚藍檔案', value: 'all' },
  { label: '活動', value: '活動' },
  { label: '招募', value: '招募' },
  { label: '更新', value: '更新' },
  { label: '總力戰', value: '總力戰' },
  { label: '考試', value: '考試' },
  { label: '大決戰', value: '大決戰' },
]

const BlueArchiveNavbar: React.FC = () => {
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
        zIndex: 1100,
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
          <Link href="/games/blue-archive" passHref legacyBehavior>
            <a style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
              <Box sx={{ position: 'relative', width: '40px', height: '40px', mr: 1 }}>
                <Image 
                  src="/Blue_Archive_logo.png" 
                  alt="Blue Archive Logo" 
                  fill
                  sizes="40px"
                  style={{ objectFit: 'contain' }}
                />
              </Box>
              <Typography variant="h6" component="div" sx={{ 
                fontWeight: 'bold',
                color: '#000000',
                fontSize: '1.25rem'
              }}>
                蔚藍檔案
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

export default BlueArchiveNavbar 