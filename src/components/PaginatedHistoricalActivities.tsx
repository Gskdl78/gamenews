'use client';

import { useState } from 'react';
import { Box, Pagination, Typography } from '@mui/material';
import NewsCard from './NewsCard';
import { NewsItem } from '@/types/news';

interface PaginatedHistoricalActivitiesProps {
  activities: NewsItem[];
  onItemClick: (item: NewsItem) => void;
  sectionTitle: string;
}

const ITEMS_PER_PAGE = 3;

export default function PaginatedHistoricalActivities({ activities, onItemClick, sectionTitle }: PaginatedHistoricalActivitiesProps) {
  const [page, setPage] = useState(1);
  const pageCount = Math.ceil(activities.length / ITEMS_PER_PAGE);
  const paginatedActivities = activities.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const handleChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  if (activities.length === 0) {
    return (
      <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          目前沒有相關消息
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {paginatedActivities.map((item) => (
        <NewsCard
          key={item.id}
          item={item}
          sectionTitle={sectionTitle}
          onItemClick={onItemClick}
        />
      ))}
      {pageCount > 1 && (
        <Box display="flex" justifyContent="flex-end" mt={2}>
          <Pagination
            count={pageCount}
            page={page}
            onChange={handleChange}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
} 