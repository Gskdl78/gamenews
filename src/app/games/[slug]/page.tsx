import { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { getBlueArchiveNews, getPrincessConnectNews } from '@/lib/supabase';
import GameClientPage from './GameClientPage';
import { NewsItem } from '@/types/news';
import { GameSlug } from '@/types/index';
import { add, isWithinInterval, startOfTomorrow, endOfDay, lightFormat } from 'date-fns';

export const revalidate = 0; // 每次請求都重新驗證，確保資料最新
const ITEMS_PER_PAGE = 3;

// --- Helper Functions ---
const isStartingTomorrow = (item: NewsItem) => {
  if (!item.start_date) return false;
  const tomorrow = startOfTomorrow();
  try {
    return lightFormat(new Date(item.start_date), 'yyyy-MM-dd') === lightFormat(tomorrow, 'yyyy-MM-dd');
  } catch {
    return false;
  }
};

const isEndingSoon = (item: NewsItem, days: number) => {
  if (!item.end_date) return false;
  const now = new Date();
  try {
    const endDate = new Date(item.end_date);
    return isWithinInterval(endDate, { start: now, end: add(now, { days }) });
  } catch {
    return false;
  }
};

const isCurrent = (item: NewsItem) => {
  if (!item.start_date || !item.end_date) {
    return false;
  }
  const now = new Date();
  try {
    return isWithinInterval(now, { start: new Date(item.start_date), end: endOfDay(new Date(item.end_date)) });
  } catch {
    return false;
  }
};

export async function generateStaticParams() {
  return [{ slug: 'princess-connect' }, { slug: 'blue-archive' }];
}

export default async function GameNewsPage({
  params,
  searchParams,
}: {
  params: { slug: GameSlug };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const { slug } = params;
  
  let category: string;
  if (slug === 'princess-connect') {
    category = typeof searchParams?.category === 'string' ? searchParams.category : 'upcoming';
  } else {
    category = typeof searchParams?.category === 'string' ? searchParams.category : 'home';
  }
  
  const getPage = (name: string) => {
    const page = searchParams?.[`${name}_page`];
    return page && typeof page === 'string' && Number.isInteger(Number(page)) ? Number(page) : 1;
  };

  const paginate = (items: NewsItem[], page: number) => {
    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
    const paginatedItems = items.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
    return { data: paginatedItems, pageCount: totalPages, currentPage: page };
  };

  let sections: { title: string; description: string; subSections: { title: string; data: NewsItem[]; pageCount?: number; currentPage?: number;}[] }[] = [];

  // --- Princess Connect Logic ---
  if (slug === 'princess-connect') {
    const news = await getPrincessConnectNews({ type: 'news', limit: 100 });
    const updates = await getPrincessConnectNews({ type: 'updates', limit: 50 });

    switch (category) {
      case 'upcoming':
        const startingSoonItems = news.filter(isStartingTomorrow);
        const endingSoonItems = news.filter(item => isEndingSoon(item, 3));
        const latestNewsItems = [...news, ...updates]
          .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
          .slice(0, 3); // 只取最新的三筆公告
        
        sections.push({
          title: '公主連結',
          description: '近期遊戲動態總覽',
          subSections: [
            { title: '即將開始', ...paginate(startingSoonItems, getPage('即將開始')) },
            { title: '即將結束', ...paginate(endingSoonItems, getPage('即將結束')) },
            // 直接傳遞資料，不進行分頁
            { title: '最新消息', data: latestNewsItems },
          ],
        });
        break;

      case '活動':
      case '轉蛋':
        const allItems = news.filter(item => item.category === category);
        const currentItems = allItems.filter(isCurrent);
        const historicalItems = allItems.filter(item => !isCurrent(item));
        
        sections.push({
          title: category,
          description: `正在進行與過往的${category}資訊`,
          subSections: [
            { title: `目前${category}`, ...paginate(currentItems, getPage(`目前${category}`)) },
            { title: `歷史${category}`, ...paginate(historicalItems, getPage(`歷史${category}`)) },
          ],
        });
        break;

      case '更新':
        sections.push({ title: '遊戲更新', description: '版本更新與維護資訊', subSections: [{ title: '過往更新', ...paginate(updates, getPage('過往更新')) }] });
        break;

      case '戰隊戰':
        const clanBattleItems = news.filter(item => item.category === '戰隊戰');
        sections.push({ title: '戰隊戰', description: '戰隊戰相關情報', subSections: [{ title: '相關情報', ...paginate(clanBattleItems, getPage('相關情報')) }] });
        break;
    }
  } 
  // --- Blue Archive Logic ---
  else if (slug === 'blue-archive') {
    const news: NewsItem[] = await getBlueArchiveNews({ limit: 100 });

    if (category === 'home' || category === 'upcoming') { // 'upcoming' is the default
      const startingSoonItems = news.filter(isStartingTomorrow);
      const endingSoonItems = news.filter(item => isEndingSoon(item, 3));
       // FIX: 使用 created_at 進行排序
      const latestNewsItems = news.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      sections.push({
        title: '蔚藍檔案',
        description: '近期遊戲動態總覽',
        subSections: [
          { title: '即將開始', ...paginate(startingSoonItems, getPage('即將開始')) },
          { title: '即將結束', ...paginate(endingSoonItems, getPage('即將結束')) },
          { title: '最新消息', ...paginate(latestNewsItems, getPage('最新消息')) },
        ].filter(sub => sub.data.length > 0), // 只顯示有內容的區塊
      });
    } else {
      const categories = ['活動', '招募', '更新', '總力戰', '考試', '大決戰'];
      if (categories.includes(category)) {
        // FIX: 使用 .includes() 進行更寬鬆的比對
        const allItems = news.filter(item => item.category.includes(category));
        const currentItems = allItems.filter(isCurrent);
        const historicalItems = allItems.filter(item => !isCurrent(item));

        sections.push({
          title: category,
          description: `關於 ${category} 的正在進行與過往資訊`,
          subSections: [
            { title: `目前${category}`, ...paginate(currentItems, getPage(`目前${category}`)) },
            { title: `歷史${category}`, ...paginate(historicalItems, getPage(`歷史${category}`)) },
          ].filter(sub => sub.data.length > 0),
        });
      }
    }
  }

  return (
    <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>}>
      <GameClientPage sections={sections} gameSlug={slug} />
    </Suspense>
  );
} 