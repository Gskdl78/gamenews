'use client';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, Container } from '@mui/material';
import GameNav from '@/components/GameNav'; // 引入 GameNav
import { GameSlug } from '@/types/index';

// 根據 slug 獲取遊戲資訊
const getGameInfo = (slug: GameSlug) => {
  if (slug === 'princess-connect') {
    return {
      name: '公主連結 Re:Dive',
      backgroundImage: "/公連背景.jpg",
    };
  }
  if (slug === 'blue-archive') {
    return {
      name: '蔚藍檔案',
      backgroundImage: "/檔案背景.jpg",
    };
  }
  return {
    name: '遊戲新聞',
    backgroundImage: '', // 預設背景
  };
};

const theme = createTheme({
  palette: {
    mode: 'light',
    text: {
      primary: '#000000', // 黑色主要文字
      secondary: '#333333', // 深灰色次要文字
    },
    background: {
      default: 'transparent',
      paper: 'rgba(255, 255, 255, 0.9)',
    },
  },
  typography: {
    fontSize: 20, // 從16調整為20 (16 × 1.25)
  },
});

export default function GameSpecificLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: GameSlug };
}) {
  const { slug } = params;
  const gameInfo = getGameInfo(slug);

  return (
    <>
      <Box 
        style={{
          backgroundImage: `url('${gameInfo.backgroundImage}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          backgroundRepeat: 'no-repeat',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: -1,
        }}
      />
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GameNav gameSlug={slug} gameName={gameInfo.name} />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: 2 }}>
          {children}
        </Container>
      </ThemeProvider>
    </>
  );
} 