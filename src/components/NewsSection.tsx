'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { NewsItem } from '@/types/news';
import NewsCard from './NewsCard';

interface NewsSectionProps {
  title: string;
  description: string;
  news: NewsItem[];
  onItemClick: (item: NewsItem) => void;
  children?: React.ReactNode;
}

const NewsSection: React.FC<NewsSectionProps> = ({ title, description, news, onItemClick, children }) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Box>
      
      {news.map((item) => (
        <NewsCard key={item.id} item={item} onItemClick={onItemClick} />
      ))}

      {/* 支援 PaginatedHistoricalActivities 等自訂子元件 */}
      {children}
    </Box>
  );
};

export default NewsSection; 