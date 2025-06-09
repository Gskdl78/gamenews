'use client';

import React from 'react';
import Image from 'next/image';
import { Box, Typography, Paper, Chip } from '@mui/material';
import { NewsItem } from '@/types/news';
import { GameSlug } from '@/types/index';
import { format, parseISO } from 'date-fns';

interface NewsCardProps {
  item: NewsItem;
  onItemClick: (item: NewsItem) => void;
  gameSlug: GameSlug;
  subSectionTitle: string;
}

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return '尚無日期';
  try {
    const date = parseISO(dateString);
    return format(date, 'yyyy/MM/dd HH:mm');
  } catch (error) {
    console.error('Invalid date format:', dateString);
    return '無效日期';
  }
};

const NewsCard: React.FC<NewsCardProps> = ({ item, onItemClick, gameSlug, subSectionTitle }) => {
  // 統一備用圖片邏輯
  const fallbackImage = gameSlug === 'princess-connect' 
    ? '/公連備用圖.jpg' 
    : '/檔案備用.jpg';
  const imageUrl = item.image_url || fallbackImage;

  // 統一日期顯示邏輯
  let dateText = '';
  if (item.start_date && item.end_date) {
    dateText = `期間: ${formatDate(item.start_date)} ~ ${formatDate(item.end_date)}`;
  } else if (item.start_date) {
    dateText = `開始: ${formatDate(item.start_date)}`;
  } else if (item.published_at) {
    dateText = `發布於: ${formatDate(item.published_at)}`;
  }

  return (
    <Paper
      elevation={2}
      onClick={() => onItemClick(item)}
      sx={{
        display: 'flex',
        mb: 2,
        p: 2,
        cursor: 'pointer',
        transition: 'box-shadow 0.3s, transform 0.3s',
        '&:hover': {
          boxShadow: 6,
          transform: 'translateY(-4px)',
        },
        overflow: 'hidden',
        borderRadius: '12px'
      }}
    >
      <Box sx={{ width: '150px', height: '84px', flexShrink: 0, position: 'relative', mr: 2, borderRadius: '8px', overflow: 'hidden' }}>
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: 'cover' }}
          />
        )}
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Chip label={item.category} size="small" color="primary" sx={{ mr: 1, fontWeight: 'bold' }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1.3 }}>
                {item.title}
            </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
          {dateText}
        </Typography>
      </Box>
    </Paper>
  );
};

export default NewsCard; 