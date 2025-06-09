'use client';

import React, { ReactNode } from 'react';
import { 
  Box, 
  Typography, 
  Paper,
} from '@mui/material';
import NewsCard from './NewsCard';
import { NewsItem } from '@/types/news';

interface NewsSectionProps {
  title: string;
  description?: string;
  news?: NewsItem[];
  onItemClick?: (item: NewsItem) => void;
  children?: ReactNode;
}

const NewsSection: React.FC<NewsSectionProps> = ({ title, description, news, onItemClick, children }) => {
  return (
    <Paper elevation={2} sx={{ p: 3, mb: 4, background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)' }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {description}
        </Typography>
      )}
      
      {news && news.length === 0 && (
        <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            目前沒有相關消息
          </Typography>
        </Box>
      )}

      {news && onItemClick && news.map((item) => (
        <NewsCard
          key={item.id}
          item={item}
          sectionTitle={title}
          onItemClick={onItemClick}
        />
      ))}

      {children}
    </Paper>
  );
};

export default NewsSection; 