import { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { getNews } from '@/lib/supabase';
import PrincessConnectClientPage from './PrincessConnectClientPage';
import { NewsItem } from '@/types/news';

export const revalidate = 0; // 每次請求都重新驗證，確保資料最新

export default async function PrincessConnectPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const category = typeof searchParams?.category === 'string' ? searchParams.category : 'all';

  let sections: { title: string; description: string; data: NewsItem[] }[] = [];
  let paginatedSection: { title: string; description: string; data: NewsItem[] } | undefined;
  
  if (category === 'all') {
    const [upcoming, ending, latest] = await Promise.all([
      getNews({ type: 'upcoming' }),
      getNews({ type: 'ending_soon' }),
      getNews({ type: 'latest', limit: 3 })
    ]);
    sections = [
      { title: "即將開始", description: "", data: upcoming },
      { title: "即將結束", description: "", data: ending },
      { title: "最新消息", description: "", data: latest }
    ];
  } else if (category === '活動') {
     const [upcoming, ending, historical] = await Promise.all([
      getNews({ type: 'upcoming', category: '活動' }),
      getNews({ type: 'ending_soon', category: '活動' }),
      getNews({ type: 'historical', category: '活動' })
    ]);
     sections = [
      { title: "即將開始的活動", description: "", data: upcoming },
      { title: "即將結束的活動", description: "", data: ending },
    ];
    paginatedSection = { title: "歷史活動", description: "", data: historical };
  } else if (category === '轉蛋') {
    const [ongoing, historical] = await Promise.all([
      getNews({ type: 'ongoing', category: '轉蛋' }),
      getNews({ type: 'historical', category: '轉蛋' })
    ]);
    sections = [{ title: "目前轉蛋", description: "", data: ongoing }];
    paginatedSection = { title: "過往轉蛋", description: "", data: historical };
  } else if (category === '更新') {
    const updates = await getNews({ type: 'updates' });
    sections = [{ title: "更新", description: "遊戲更新與其他消息", data: updates }];
  } else if (category === '戰隊戰') {
    const clanBattleNews = await getNews({ type: 'by_category', category: '戰隊戰' });
    sections = [{ title: "戰隊戰", description: "所有戰隊戰相關消息", data: clanBattleNews }];
  }

  return (
    <Suspense fallback={<Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh"><CircularProgress /></Box>}>
      <PrincessConnectClientPage 
        category={category}
        sections={sections}
        paginatedSection={paginatedSection}
      />
    </Suspense>
  );
} 