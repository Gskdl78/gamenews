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
  return lightFormat(new Date(item.start_date), 'yyyy-MM-dd') === lightFormat(tomorrow, 'yyyy-MM-dd');
};

const isEndingSoon = (item: NewsItem, days: number) => {
  if (!item.end_date) return false;
  const now = new Date();
  const endDate = new Date(item.end_date);
  return isWithinInterval(endDate, { start: now, end: add(now, { days }) });
};

const isCurrent = (item: NewsItem) => {
  if (!item.start_date || !item.end_date) return true; // Assume current if no dates
  const now = new Date();
  return isWithinInterval(now, { start: new Date(item.start_date), end: endOfDay(new Date(item.end_date)) });
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
  const category = typeof searchParams?.category === 'string' ? searchParams.category : 'upcoming';
  
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
        const latestNewsItems = [...news, ...updates].sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
        
        sections.push({
          title: '公主連結',
          description: '近期遊戲動態總覽',
          subSections: [
            { title: '即將開始', ...paginate(startingSoonItems, getPage('即將開始')) },
            { title: '即將結束', ...paginate(endingSoonItems, getPage('即將結束')) },
            { title: '最新消息', ...paginate(latestNewsItems, getPage('最新消息')) },
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
  // --- Blue Archive Logic (remains the same) ---
  else if (slug === 'blue-archive') {
    const news = await getBlueArchiveNews({ limit: 20 });
    const filteredNews = category === 'all'
      ? news
      : news.filter(item => item.category === category);

    if (category === 'all') {
      sections.push({ title: '蔚藍檔案', description: '所有最新消息', subSections: [
        { title: '進行中的活動', data: news.filter(item => item.category === '活動') },
        { title: '特別招募', data: news.filter(item => item.category === '招募') },
        { title: '更新資訊', data: news.filter(item => item.category === '更新') },
        { title: '總力戰', data: news.filter(item => item.category === '總力戰') },
        { title: '考試', data: news.filter(item => item.category === '考試') },
        { title: '大決戰', data: news.filter(item => item.category === '大決戰') }
      ]});
    } else {
      sections.push({ title: category, description: `關於 ${category} 的最新消息`, subSections: [{ title: category, data: filteredNews }] });
    }
  }

  return (
    <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>}>
      <GameClientPage sections={sections} gameSlug={slug} />
    </Suspense>
  );
} 