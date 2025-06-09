import Image from 'next/image';
import Link from 'next/link';
import { ChevronRightIcon } from './icons'; // 假設我們也會建立一個圖示元件

// 定義元件接收的 props 型別
export interface NewsCardProps {
  href: string;
  category: string;
  categoryColor?: 'green' | 'orange'; // 可以擴充更多顏色
  title: string;
  imageUrl?: string;
  dateText: string;
  dateColor?: 'red' | 'gray';
}

// 分類標籤的顏色對應
const categoryColorMap = {
  green: 'bg-green-300 text-black',
  orange: 'bg-orange-300 text-black',
};

// 日期文字的顏色對應
const dateColorMap = {
  red: 'text-red-600',
  gray: 'text-gray-700',
};

export const NewsCard = ({
  href,
  category,
  categoryColor = 'green',
  title,
  imageUrl,
  dateText,
  dateColor = 'gray',
}: NewsCardProps) => {
  return (
    <Link href={href} legacyBehavior>
      <a className="
        flex items-center
        bg-white/80 backdrop-blur-sm
        rounded-lg overflow-hidden
        mb-3
        cursor-pointer
        shadow-lg hover:shadow-xl hover:-translate-y-1
        transition-all duration-300
        border border-white/20
      ">
        {/* 左側圖片 */}
        {imageUrl && (
          <div className="relative w-[150px] h-[84px] flex-shrink-0">
            <Image
              src={imageUrl}
              alt={title}
              layout="fill"
              objectFit="cover"
            />
          </div>
        )}

        {/* 右側內容 */}
        <div className="flex-grow flex items-center p-4">
          <div className="flex-grow">
            <div className="flex items-center mb-2">
              {/* 分類標籤 */}
              <span className={`
                px-3 py-1 rounded-full font-bold text-xs mr-3
                ${categoryColorMap[categoryColor]}
              `}>
                {category}
              </span>
              {/* 標題 */}
              <h3 className="font-bold text-base text-gray-900 line-clamp-2">
                {title}
              </h3>
            </div>
            {/* 日期 */}
            <p className={`font-medium text-sm ${dateColorMap[dateColor]}`}>
              {dateText}
            </p>
          </div>
          
          {/* 箭頭圖示 */}
          <div className="ml-4 text-gray-400">
            <ChevronRightIcon className="w-7 h-7" />
          </div>
        </div>
      </a>
    </Link>
  );
}; 