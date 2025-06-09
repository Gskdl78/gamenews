'use client';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

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

export default function BlueArchiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div 
        style={{
          backgroundImage: "url('/檔案背景.jpg')",
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
        <div style={{ 
          position: 'relative', 
          zIndex: 1,
          color: '#000',
          fontSize: '156.25%',
          minHeight: '100vh'
        }}>
          {children}
        </div>
      </ThemeProvider>
    </>
  );
} 