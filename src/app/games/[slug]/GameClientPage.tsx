'use client';

import React, { useState, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Box, Typography, Divider, Pagination, Paper } from '@mui/material';
import { NewsItem } from '@/types/news';
import { GameSlug } from '@/types/index';
import NewsCard from '@/components/NewsCard';
import NewsDetailModal from '@/components/NewsDetailModal';

interface SubSection {
  title: string;
  data: NewsItem[];
  pageCount?: number;
  currentPage?: number;
}

interface Section {
  title: string;
  description: string;
  subSections: SubSection[];
}

interface GameClientPageProps {
  sections: Section[];
  gameSlug: GameSlug;
}

const GameClientPage: React.FC<GameClientPageProps> = ({ sections, gameSlug }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  const handleOpenModal = useCallback((item: NewsItem) => {
    setSelectedNews(item);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedNews(null);
  }, []);

  const handlePageChange = (page: number, subSectionTitle: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(`${subSectionTitle}_page`, page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Box>
      {sections.map((section, sectionIndex) => (
        <Box key={sectionIndex} sx={{ mb: 4 }}>
          {section.subSections.map((subSection, subIndex) => (
            <Paper key={subIndex} elevation={3} sx={{ p: 3, mb: 4, borderRadius: '16px' }}>
              <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                {subSection.title}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {subSection.data.length > 0 ? (
                subSection.data.map((item) => (
                  <NewsCard
                    key={item.id}
                    item={item}
                    onItemClick={handleOpenModal}
                    gameSlug={gameSlug}
                    subSectionTitle={subSection.title}
                  />
                ))
              ) : (
                <Typography>此分類目前沒有消息。</Typography>
              )}
              {subSection.pageCount && subSection.pageCount > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Pagination
                    count={subSection.pageCount}
                    page={subSection.currentPage}
                    onChange={(_, page) => handlePageChange(page, subSection.title)}
                    color="primary"
                  />
                </Box>
              )}
            </Paper>
          ))}
        </Box>
      ))}
      <NewsDetailModal item={selectedNews} onClose={handleCloseModal} />
    </Box>
  );
};

export default GameClientPage; 