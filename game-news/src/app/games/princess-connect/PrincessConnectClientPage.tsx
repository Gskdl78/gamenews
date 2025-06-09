'use client';

import { useState, useCallback } from 'react';
import { 
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import NewsSection from '@/components/NewsSection';
import PaginatedHistoricalActivities from '@/components/PaginatedHistoricalActivities';
import { NewsItem } from '@/types/news';

interface PrincessConnectClientPageProps {
  category: string;
  sections?: { title: string; description: string; data: NewsItem[] }[];
  paginatedSection?: { title: string; description: string; data: NewsItem[] };
}

const renderSummary = (summaryText: string) => {
  if (!summaryText) return <Typography>暫無摘要資訊。</Typography>;
  const cleanedText = summaryText.replace('好的，根據公告內容，提取的資訊如下：', '').trim();
  
  return cleanedText.split('\n').map((line, index) => {
    const parts = line.split('**').map((part, i) => 
      i % 2 === 1 ? <strong key={i}>{part}</strong> : part
    );

    if (line.includes('活動開始時間')) {
      return <Typography key={index} component="p" sx={{ color: 'success.main', fontWeight: 'bold' }}>{parts}</Typography>;
    }
    if (line.includes('活動結束時間')) {
      return <Typography key={index} component="p" sx={{ color: 'error.main', fontWeight: 'bold' }}>{parts}</Typography>;
    }
    return <Typography key={index} component="p">{parts}</Typography>;
  });
};

export default function PrincessConnectClientPage({ 
  category,
  sections = [],
  paginatedSection
}: PrincessConnectClientPageProps) {
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  const handleOpen = useCallback((item: NewsItem) => {
    setSelectedNews(item);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedNews(null);
  }, []);

  return (
    <Box sx={{ 
      p: { xs: 1, sm: 2, md: 3 },
      backgroundColor: 'rgba(255, 255, 255, 0.9)', // 半透明白色背景
      borderRadius: 2,
      margin: 2,
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' // 輕微陰影
    }}>
      {sections.map(section => (
        <NewsSection 
          key={section.title}
          title={section.title} 
          description={section.description} 
          news={section.data} 
          onItemClick={handleOpen} 
        />
      ))}
      
      {paginatedSection && (
        <NewsSection title={paginatedSection.title} description={paginatedSection.description}>
          <PaginatedHistoricalActivities 
            activities={paginatedSection.data} 
            onItemClick={handleOpen} 
            sectionTitle={paginatedSection.title}
          />
        </NewsSection>
      )}

      {sections.length === 0 && !paginatedSection && (
         <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
                目前沒有關於 {category} 的相關消息
            </Typography>
        </Box>
      )}

      {selectedNews && (
        <Dialog 
          open={!!selectedNews} 
          onClose={handleClose} 
          scroll="paper"
          fullWidth
          maxWidth="md"
          PaperProps={{ sx: { borderRadius: 2 } }}
        >
          <DialogTitle sx={{ m: 0, p: 2, fontWeight: 'bold' }}>
            {selectedNews.title}
            <IconButton
              aria-label="close"
              onClick={handleClose}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3 }}>
            {renderSummary(selectedNews.summary)}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>關閉</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
} 