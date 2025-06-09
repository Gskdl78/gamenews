import { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { getBlueArchiveNews, getPrincessConnectNews } from '@/lib/supabase';
import GameClientPage from './GameClientPage';
import { NewsItem } from '@/types/news';

export const revalidate = 0; // 每次請求都重新驗證，確保資料最新

const gameNewsFetchers: { [key: string]: typeof getBlueArchiveNews } = {
  'blue-archive': getBlueArchiveNews,
  'princess-connect': getPrincessConnectNews,
};

export default async function GameNewsPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const { slug } = params;
  const getNews = gameNewsFetchers[slug] || getBlueArchiveNews; // 默認回退
  const category = typeof searchParams?.category === 'string' ? searchParams.category : 'all';

  let sections: { title: string; description: string; data: NewsItem[] }[] = [];
  let paginatedSection: { title: string; description: string; data: NewsItem[] } | undefined;
  
  // 以下邏輯基於 slug 是 'blue-archive'，需要為 'princess-connect' 擴充或調整
  // 這裡暫時保留蔚藍檔案的邏輯作為範例
  if (slug === 'blue-archive') {
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
    } else if (category === '招募') {
      const [ongoing, historical] = await Promise.all([
        getNews({ type: 'ongoing', category: '招募' }),
        getNews({ type: 'historical', category: '招募' })
      ]);
      sections = [{ title: "目前招募", description: "", data: ongoing }];
      paginatedSection = { title: "過往招募", description: "", data: historical };
    } else if (category === '更新') {
      const updates = await getNews({ type: 'updates' });
      sections = [{ title: "更新", description: "遊戲更新與其他消息", data: updates }];
    } else if (category === '總力戰') {
      const totalAssaultNews = await getNews({ type: 'by_category', category: '總力戰' });
      sections = [{ title: "總力戰", description: "所有總力戰相關消息", data: totalAssaultNews }];
    } else if (category === '考試') {
      const examNews = await getNews({ type: 'by_category', category: '考試' });
      sections = [{ title: "綜合戰術考試", description: "所有考試相關消息", data: examNews }];
    } else if (category === '大決戰') {
      const grandAssaultNews = await getNews({ type: 'by_category', category: '大決戰' });
      sections = [{ title: "大決戰", description: "所有大決戰相關消息", data: grandAssaultNews }];
    }
  } else if (slug === 'princess-connect') {
    // 公主連結的邏輯
    const news = await getNews({});
    sections = [{ title: "最新消息", description: "所有公主連結的最新消息", data: news }];
  }

  return (
    <Suspense fallback={<Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh"><CircularProgress /></Box>}>
      <GameClientPage 
        gameSlug={slug}
        category={category}
        sections={sections}
        paginatedSection={paginatedSection}
      />
    </Suspense>
  );
} 