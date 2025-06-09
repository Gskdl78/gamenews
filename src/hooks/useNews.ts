import { useQuery } from '@tanstack/react-query';
import { getBlueArchiveNews, NewsItem } from '@/lib/api';

export function useNews(category: string = 'all', type: string = 'latest') {
  return useQuery<NewsItem[]>({
    queryKey: ['news', category, type],
    queryFn: () => getBlueArchiveNews({ type, category }),
  });
}

export function useInfiniteNews(category: string = 'all', type: string = 'latest') {
  return useInfiniteQuery<NewsItem[]>({
    queryKey: ['infinite-news', category, type],
    queryFn: ({ pageParam = 1 }) => getBlueArchiveNews({ 
      type, 
      category, 
      page: pageParam,
      limit: 10 
    }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (!Array.isArray(lastPage) || lastPage.length < 10) return undefined;
      return allPages.length + 1;
    }
  });
} 