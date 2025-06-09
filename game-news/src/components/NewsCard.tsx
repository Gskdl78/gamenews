'use client';

import React, { memo } from 'react';
import Image from 'next/image';
import { Box, Typography, Paper } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { NewsItem } from '@/lib/api';

interface NewsCardProps {
  item: NewsItem;
  sectionTitle: string;
  onItemClick?: (item: NewsItem) => void;
}

const CategoryChip: React.FC<{ category: string }> = ({ category }) => {
  const isGacha = category.includes('轉蛋');
  const backgroundColor = isGacha ? '#ffb74d' : '#81c784';
  const color = '#000';

  return (
    <Box
      sx={{
        display: 'inline-block',
        px: 1.5,
        py: 0.5,
        borderRadius: '16px',
        backgroundColor,
        color,
        fontWeight: 'bold',
        fontSize: '0.8rem',
        mr: 1.5
      }}
    >
      {category}
    </Box>
  );
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}`;
};

const NewsCard: React.FC<NewsCardProps> = ({ item, sectionTitle, onItemClick }) => {
  const handleClick = () => {
    if (onItemClick) {
      onItemClick(item);
    }
  };

  return (
    <Paper 
      onClick={handleClick}
      elevation={2}
      sx={{ 
        mb: 1.5, 
        borderRadius: 2, 
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        cursor: onItemClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        willChange: 'transform, box-shadow',
        '&:hover': onItemClick ? {
          transform: 'translateY(-4px)',
          boxShadow: '0 4px 20px 0 rgba(0,0,0,0.12)'
        } : {}
      }}
    >
      {item.image_url && (
        <Box
          sx={{
            width: 150,
            height: 84,
            flexShrink: 0,
            position: 'relative',
          }}
        >
          <Image
            src={item.image_url}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: 'cover' }}
          />
        </Box>
      )}
      <Box sx={{ p: 2, flexGrow: 1, display: 'flex', alignItems: 'center' }}>
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <CategoryChip category={item.category} />
            <Typography 
              variant="h6" 
              component="h3" 
              sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}
            >
              {item.title}
            </Typography>
          </Box>

          {sectionTitle.includes('即將開始') && item.start_date && (
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 'medium' }}>
              {`開始時間: ${formatDateTime(item.start_date)}`}
            </Typography>
          )}

          {(sectionTitle.includes('即將結束') || sectionTitle.includes('歷史')) && item.end_date && (
            <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 'medium' }}>
              {`結束時間: ${formatDateTime(item.end_date)}`}
            </Typography>
          )}

          {!sectionTitle.includes('即將開始') && !sectionTitle.includes('即將結束') && !sectionTitle.includes('歷史') && item.start_date && (
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 'medium' }}>
              {`開始時間: ${formatDateTime(item.start_date)}`}
            </Typography>
          )}
          
          <Box sx={{ borderBottom: '2px dotted', borderColor: 'grey.300', my: 1 }} />
        </Box>
        <ChevronRightIcon sx={{ color: 'grey.400', fontSize: 30 }} />
      </Box>
    </Paper>
  );
};

export default memo(NewsCard); 