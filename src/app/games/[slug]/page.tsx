import { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { getBlueArchiveNews, getPrincessConnectNews } from '@/lib/supabase';
import GameClientPage from './GameClientPage';
import { NewsItem } from '@/types/news';

export const revalidate = 0; // 每次請求都重新驗證，確保資料最新

export default async function GameNewsPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const { slug } = params;
  const category = typeof searchParams?.category === 'string' ? searchParams.category : 'all';

  let sections: { title: string; description: string; data: NewsItem[] }[] = [];
  let paginatedSection: { title: string; description: string; data: NewsItem[] } | undefined;
  
  // 以下邏輯基於 slug 是 'blue-archive'，需要為 'princess-connect' 擴充或調整
  // 這裡暫時保留蔚藍檔案的邏輯作為範例
  if (slug === 'blue-archive') {
    if (category === 'all') {
      const [upcoming, ending, latest] = await Promise.all([
        getBlueArchiveNews({ type: 'upcoming' }),
        getBlueArchiveNews({ type: 'ending_soon' }),
        getBlueArchiveNews({ type: 'latest', limit: 3 })
      ]);
      sections = [
        { title: "即將開始", description: "", data: upcoming },
        { title: "即將結束", description: "", data: ending },
        { title: "最新消息", description: "", data: latest }
      ];
    } else if (category === '活動') {
      const [upcoming, ending, historical] = await Promise.all([
        getBlueArchiveNews({ type: 'upcoming', category: '活動' }),
        getBlueArchiveNews({ type: 'ending_soon', category: '活動' }),
        getBlueArchiveNews({ type: 'historical', category: '活動' })
      ]);
      sections = [
        { title: "即將開始的活動", description: "", data: upcoming },
        { title: "即將結束的活動", description: "", data: ending },
      ];
      paginatedSection = { title: "歷史活動", description: "", data: historical };
    } else if (category === '招募') {
      const [ongoing, historical] = await Promise.all([
        getBlueArchiveNews({ type: 'ongoing', category: '招募' }),
        getBlueArchiveNews({ type: 'historical', category: '招募' })
      ]);
      sections = [{ title: "目前招募", description: "", data: ongoing }];
      paginatedSection = { title: "過往招募", description: "", data: historical };
    } else if (category === '更新') {
      const updates = await getBlueArchiveNews({ type: 'updates' });
      sections = [{ title: "更新", description: "遊戲更新與其他消息", data: updates }];
    } else if (category === '總力戰') {
      const totalAssaultNews = await getBlueArchiveNews({ type: 'by_category', category: '總力戰' });
      sections = [{ title: "總力戰", description: "所有總力戰相關消息", data: totalAssaultNews }];
    } else if (category === '考試') {
      const examNews = await getBlueArchiveNews({ type: 'by_category', category: '考試' });
      sections = [{ title: "綜合戰術考試", description: "所有考試相關消息", data: examNews }];
    } else if (category === '大決戰') {
      const grandAssaultNews = await getBlueArchiveNews({ type: 'by_category', category: '大決戰' });
      sections = [{ title: "大決戰", description: "所有大決戰相關消息", data: grandAssaultNews }];
    }
  } else if (slug === 'princess-connect') {
    if (category === 'all') {
      const [upcoming, ending, latest] = await Promise.all([
        getPrincessConnectNews({ type: 'upcoming' }),
        getPrincessConnectNews({ type: 'ending_soon' }),
        getPrincessConnectNews({ type: 'latest', limit: 3 })
      ]);
      sections = [
        { title: "即將開始", description: "", data: upcoming },
        { title: "即將結束", description: "", data: ending },
        { title: "最新消息", description: "", data: latest }
      ];
    } else if (category === '活動') {
      const [upcoming, ending, historical] = await Promise.all([
        getPrincessConnectNews({ type: 'upcoming', category: '活動' }),
        getPrincessConnectNews({ type: 'ending_soon', category: '活動' }),
        getPrincessConnectNews({ type: 'historical', category: '活動' })
      ]);
      sections = [
        { title: "即將開始的活動", description: "", data: upcoming },
        { title: "即將結束的活動", description: "", data: ending },
      ];
      paginatedSection = { title: "歷史活動", description: "", data: historical };
    } else if (category === '轉蛋') {
        const [ongoing, historical] = await Promise.all([
            getPrincessConnectNews({ type: 'ongoing', category: '轉蛋' }),
            getPrincessConnectNews({ type: 'historical', category: '轉蛋' })
        ]);
        sections = [{ title: "目前轉蛋", description: "", data: ongoing }];
        paginatedSection = { title: "過往轉蛋", description: "", data: historical };
    } else if (category === '更新') {
        const updates = await getPrincessConnectNews({ type: 'updates' });
        sections = [{ title: "系統更新", description: "遊戲更新與其他消息", data: updates }];
    } else if (category === '戰隊戰') {
        const clanBattleNews = await getPrincessConnectNews({ type: 'by_category', category: '戰隊戰' });
        sections = [{ title: "戰隊戰", description: "所有戰隊戰相關消息", data: clanBattleNews }];
    }
  }

  const backgroundImageUrl = slug === 'princess-connect' ? '/公連背景.jpg' : 'none';

  return (
    <div 
      style={{ 
        position: 'relative', 
        minHeight: '100vh', 
        width: '100%',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${backgroundImageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          zIndex: -2,
        }}
      />
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: slug === 'princess-connect' ? 'rgba(0, 0, 0, 0.5)' : 'transparent',
          zIndex: -1,
        }}
      />
      <Suspense fallback={<Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh"><CircularProgress /></Box>}>
        <GameClientPage 
          gameSlug={slug}
          category={category}
          sections={sections}
          paginatedSection={paginatedSection}
        />
      </Suspense>
    </div>
  );
} 