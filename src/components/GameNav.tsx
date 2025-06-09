'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Box, Typography, Paper } from '@mui/material';
import Image from 'next/image';

// 遊戲導覽列設定
const gameNavConfig = {
  'princess-connect': {
    logo: '/pcr-logo.png',
    links: [
      { label: '公主連結', category: 'upcoming' },
      { label: '活動', category: '活動' },
      { label: '轉蛋', category: '轉蛋' },
      { label: '更新', category: '更新' },
      { label: '戰隊戰', category: '戰隊戰' },
    ],
  },
  'blue-archive': {
    logo: '/Blue_Archive_logo.png',
    links: [
      { label: '蔚藍檔案', category: 'home' },
      { label: '活動', category: '活動' },
      { label: '招募', category: '招募' },
      { label: '更新', category: '更新' },
      { label: '總力戰', category: '總力戰' },
      { label: '考試', category: '考試' },
      { label: '大決戰', category: '大決戰' },
    ],
  },
};

interface NavLinkProps {
  href: string;
  isActive: boolean;
  children: React.ReactNode;
}

const NavLink: React.FC<NavLinkProps> = ({ href, isActive, children }) => (
  <Link href={href} passHref>
    <Box
      component="div"
      sx={{
        py: 1,
        px: 2,
        mx: 1,
        color: isActive ? 'white' : 'rgba(255, 255, 255, 0.7)',
        textDecoration: 'none',
        position: 'relative',
        transition: 'color 0.3s',
        '&:hover': {
          color: 'white',
        },
        '&::after': {
          content: '""',
          display: 'block',
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '2px',
          backgroundColor: 'white',
          transform: isActive ? 'scaleX(1)' : 'scaleX(0)',
          transformOrigin: 'left',
          transition: 'transform 0.3s ease-in-out',
        },
        '&:hover::after': {
          transform: 'scaleX(1)',
        },
      }}
    >
      {children}
    </Box>
  </Link>
);

interface GameNavProps {
  gameSlug: keyof typeof gameNavConfig;
  gameName: string;
}

const GameNav: React.FC<GameNavProps> = ({ gameSlug, gameName }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const defaultCategory = gameSlug === 'princess-connect' ? 'upcoming' : 'home';
  const currentCategory = searchParams.get('category') || defaultCategory;

  const config = gameNavConfig[gameSlug] || { logo: '', links: [] };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 1,
        mb: 3,
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        background: 'linear-gradient(45deg, #1e3a8a 30%, #3b82f6 90%)',
        borderRadius: '0 0 12px 12px',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1200px', mx: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: 40, height: 40, position: 'relative', mr: 2 }}>
            <Image 
              src={config.logo} 
              alt={`${gameName} Logo`} 
              fill
              sizes="40px"
              style={{ objectFit: 'contain' }}
            />
          </Box>
          <Link href={`/games/${gameSlug}`} passHref>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
              {gameName}
            </Typography>
          </Link>
        </Box>
        <Box sx={{ display: 'flex' }}>
          <NavLink href="/" isActive={pathname === '/'}>
            <Typography>電玩快報</Typography>
          </NavLink>
          {config.links.map((link) => {
            const href = `/games/${gameSlug}?category=${link.category}`;
            const isActive = currentCategory === link.category;
            return (
              <NavLink key={link.category} href={href} isActive={isActive}>
                <Typography>{link.label}</Typography>
              </NavLink>
            );
          })}
        </Box>
      </Box>
    </Paper>
  );
};

export default GameNav; 