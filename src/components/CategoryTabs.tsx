'use client';

import { useMemo, memo } from 'react';
import { Tabs, Tab, Box } from '@mui/material';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const categories = [
  { label: '全部', value: 'all' },
  { label: '活動', value: 'event' },
  { label: '轉蛋', value: 'gacha' },
  { label: '角色', value: 'character' },
  { label: '劇情', value: 'story' },
  { label: '更新', value: 'update' },
  { label: '維護', value: 'maintenance' },
] as const;

const CategoryTabs = memo(function CategoryTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('category') || 'all';

  const handleChange = useMemo(
    () => (event: React.SyntheticEvent, newValue: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('category', newValue);
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const tabValue = useMemo(() => {
    return categories.some(c => c.value === currentCategory) ? currentCategory : 'all';
  }, [currentCategory]);

  return (
    <Box 
      sx={{ 
        borderBottom: 1, 
        borderColor: 'divider', 
        mb: 3,
        position: 'sticky',
        top: 64, // Navbar 高度
        zIndex: 1,
        bgcolor: 'background.paper',
        backdropFilter: 'blur(8px)',
      }}
    >
      <Tabs
        value={tabValue}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        aria-label="news categories"
      >
        {categories.map((cat) => (
          <Tab 
            key={cat.value} 
            label={cat.label} 
            value={cat.value}
            sx={{
              '&:hover': {
                color: 'primary.main',
              },
            }}
          />
        ))}
      </Tabs>
    </Box>
  );
});

CategoryTabs.displayName = 'CategoryTabs';

export default CategoryTabs; 