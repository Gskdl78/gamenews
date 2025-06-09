'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const games = [
  {
    id: 1,
    name: '公主連結 Re:Dive',
    slug: 'princess-connect',
    image: '/pcr-logo.png',
    genre: 'RPG',
    count: '1 Game'
  },
  {
    id: 2,
    name: '蔚藍檔案',
    slug: 'blue-archive',
    image: '/Blue_Archive_logo.png',
    genre: 'RPG',
    count: '1 Game'
  }
];

const recentGames = [
  {
    id: 1,
    title: '公主連結 Re:Dive',
    date: 'December 12, 2024',
    genres: ['RPG', 'Action'],
    image: '/公連背景.jpg',
    slug: 'princess-connect'
  },
  {
    id: 2,
    title: '蔚藍檔案',
    date: 'December 12, 2024',
    genres: ['RPG', 'Strategy'],
    image: '/Blue_Archive_logo.png',
    slug: 'blue-archive'
  }
];

const articles = [
  {
    id: 1,
    title: '公主連結遊戲攻略完整指南',
    category: 'Interview',
    author: '電玩快報',
    image: '/pcr-logo.png'
  },
  {
    id: 2,
    title: '最新活動資訊與獎勵詳解',
    category: 'Resource',
    author: '電玩快報',
    image: '/公連背景.jpg'
  }
];

interface SliderItemsProps {
  title: string;
  showAll?: string;
  children: React.ReactNode;
}

const SliderItems = ({ title, showAll, children }: SliderItemsProps) => {
  const sliderRef = useRef<HTMLUListElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const scroll = (direction: 'left' | 'right') => {
    if (!sliderRef.current) return;
    
    const scrollAmount = 330;
    const newScrollLeft = direction === 'left' 
      ? sliderRef.current.scrollLeft - scrollAmount
      : sliderRef.current.scrollLeft + scrollAmount;
    
    sliderRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  const handleScroll = () => {
    if (!sliderRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

    return (
    <section className="slider__items slider__items--genres">
      <div className="wrapper">
        <div className="row between-xs bottom-xs">
          <div className="col col-auto">
            <h2 className="slider__items-title">{title}</h2>
          </div>
          {showAll && (
            <div className="col col-auto">
              <Link href={showAll} className="slider__items-all">
                <span>All {title.toLowerCase()}</span>
                <div className="slider__items-all-icon">
                  <svg focusable="false" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                  </svg>
                </div>
              </Link>
            </div>
          )}
        </div>
              </div>

      <div className="slider__items-slider js_slider relative">
        <div className="slider__items-frame js_frame">
          <ul 
            ref={sliderRef}
            onScroll={handleScroll}
            className="slider__items-slides row js_slides scrollbar-hide"
            style={{
              transitionTimingFunction: 'ease',
              transitionDuration: '600ms',
              transform: 'translateX(0px)'
            }}
          >
            {children}
          </ul>

          <div className="slider__items-buttons">
            <div className={`slider__items-button slider__items-button--prev ${!canScrollLeft ? 'disabled' : ''}`}>
              <button 
                className={`button button--arrow ${!canScrollLeft ? 'disabled' : ''}`}
                aria-label="Previous"
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
              >
                <span className="button__icon button__icon--arrow">
                  <FiChevronLeft size={16} />
                </span>
                <span className="button__label">
                  <span className="button__label-text">Previous</span>
                </span>
              </button>
            </div>

            <div className={`slider__items-button slider__items-button--next ${!canScrollRight ? 'disabled' : ''}`}>
              <button 
                className={`button button--arrow ${!canScrollRight ? 'disabled' : ''}`}
                aria-label="Next"
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
              >
                <span className="button__icon button__icon--arrow">
                  <FiChevronRight size={16} />
                </span>
                <span className="button__label">
                  <span className="button__label-text">Next</span>
              </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
    );
};

// 背景影片組件
const HomeBannerVideo = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // 直接設置影片源，不使用懶載入
    video.src = '/首頁影片.mp4';

    // 處理影片載入事件
    const handleLoadedData = () => {
      setIsLoaded(true);
      setError(null);
      
      // 嘗試播放影片
      video.play().catch(err => {
        console.log('自動播放被阻止:', err);
      });
    };

    const handleError = (e: Event) => {
      const target = e.target as HTMLVideoElement;
      console.error('影片載入錯誤:', target.error);
      setError('影片載入失敗');
    };

    const handleCanPlay = () => {
      // 再次嘗試播放
      video.play().catch(err => {
        console.log('播放嘗試:', err);
      });
    };

    // 添加事件監聽器
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);
    video.addEventListener('canplay', handleCanPlay);

    // 清理函數
    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      className={`home__banner-video lazy ${isLoaded ? 'loaded' : ''}`}
      loop
      muted
      playsInline
      poster="/公連背景.jpg"
      data-loaded={isLoaded}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        objectPosition: 'center',
        transform: 'scale(1)',
        opacity: isLoaded ? 0.7 : 0
      }}
      onLoadedData={() => {
        setIsLoaded(true);
      }}
      onError={(e) => {
        console.error('影片錯誤:', e);
        setError('載入失敗');
      }}
    >
      {/* 暫時移除以避免混淆 */}
    </video>
  );
};

const GenreCard = ({ game }: { game: typeof games[0] }) => {
  return (
    <li className="slider__items-slide col js_slide active">
      <Link 
        href={`/games/${game.slug}`} 
        aria-label={game.name}
        style={{ textDecoration: 'none', display: 'block' }}
      >
        <article className="item item--image item--genres">
          <div className="item__inner" style={{ position: 'relative' }}>
            <div className="item__media">
              <picture className="image lazy loaded">
            <Image
                  src={game.image}
                  alt={`genre-${game.slug}`}
                  width={500}
                  height={281}
                  className="lazy loaded"
                  priority={true}
            />
              </picture>
          </div>
          
            <div className="item__infos" style={{
              position: 'absolute',
              bottom: '15px',
              left: '50%',
              transform: 'translateX(-50%)',
              textAlign: 'center',
              zIndex: 2,
              width: '90%'
            }}>
              <h2 className="item__title" style={{ 
                margin: 0, 
                fontSize: '1.4rem',
                color: '#fff',
                fontWeight: 'bold'
              }}>
                <span className="item__title-text">{game.name}</span>
              </h2>
            </div>
          </div>
        </article>
      </Link>
    </li>
  );
};

const GameCard = ({ game }: { game: typeof recentGames[0] }) => {
  return (
    <li className="slider__items-slide col js_slide">
      <article className="item item--image item--games">
        <div className="item__inner">
          <div className="item__infos">
            <h2 className="item__title">
              <Link 
                href={`/games/${game.slug}`} 
                className="item__title-link"
                aria-label={game.title}
              >
                <span className="item__title-text">{game.title}</span>
              </Link>
            </h2>
            <h3 className="item__subtitle">{game.date}</h3>
            <div className="item__tags">
              {game.genres.map((genre, index) => (
                <span key={index} className="item__tag">{genre}</span>
              ))}
            </div>
          </div>
          
          <div className="item__media">
            <picture className="image lazy loaded">
              <Image
                src={game.image}
                alt={`game-${game.slug}`}
                width={500}
                height={281}
                className="lazy loaded"
              />
            </picture>
          </div>
        </div>
      </article>
    </li>
  );
};

const ArticleCard = ({ article }: { article: typeof articles[0] }) => {
  return (
    <li className="slider__items-slide col js_slide">
      <article className="item item--image item--articles">
        <div className="item__inner">
          <div className="item__infos">
            <h2 className="item__title">
              <Link 
                href={`/articles/${article.id}`} 
                className="item__title-link"
                aria-label={article.title}
              >
                <span className="item__title-text">{article.title}</span>
              </Link>
            </h2>
            <h3 className="item__subtitle">{article.category}</h3>
            <div className="item__author">{article.author}</div>
          </div>
          
          <div className="item__media">
            <picture className="image lazy loaded">
              <Image
                src={article.image}
                alt={`article-${article.id}`}
                width={500}
                height={281}
                className="lazy loaded"
              />
            </picture>
        </div>
      </div>
      </article>
    </li>
  );
};

export default function HomePage() {
  return (
    <div style={{ 
      paddingTop: '3em',
      overflow: 'hidden',
      fontFamily: 'din-2014, sans-serif',
      lineHeight: 1,
      color: '#fff',
      fontSize: '156.25%',
      background: '#000'
    }}>
      {/* Hero Section */}
      <section style={{ 
        textAlign: 'center', 
        padding: '4rem 0',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '60vh'
      }}>
        {/* 背景影片容器 */}
        <div style={{
          position: 'absolute',
          top: 10,
          left: 10,
          width: 'calc(100% - 40px)',
          height: 'calc(100% - 40px)',
          zIndex: 1,
          overflow: 'hidden',
          borderRadius: '8px'
        }}>
          {/* 使用新的影片組件 */}
          <HomeBannerVideo />
          
          {/* 影片上的漸變遮罩 - 減輕不透明度 */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(6,147,227,0.05) 50%, rgba(155,81,224,0.05) 100%)',
            zIndex: 2
          }} />
        </div>

        <div className="wrapper" style={{ position: 'relative', zIndex: 10 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <h1 style={{ 
              fontSize: '4rem',
              fontWeight: 900,
              marginBottom: '2rem',
              background: 'var(--wp--preset--gradient--vivid-cyan-blue-to-vivid-purple)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              cursor: 'pointer',
              transition: 'transform 0.3s ease',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              電玩快報
            </h1>
          </Link>
          <p style={{
            fontSize: '1.2rem',
            color: '#abb8c3',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: 1.6,
            textShadow: '0 1px 2px rgba(0,0,0,0.5)'
          }}>
            為你總結每天遊戲情報
          </p>
        </div>
      </section>

      {/* Games Section */}
      <SliderItems title="Games" showAll="/games">
        {games.map((game) => (
          <GenreCard key={game.id} game={game} />
        ))}
      </SliderItems>

      {/* Footer */}
      <footer style={{
        marginTop: '6rem',
        padding: '3rem 0',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center'
      }}>
        <div className="wrapper">
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{
              fontSize: '2rem',
              fontWeight: 700,
              marginBottom: '1rem',
              background: 'var(--wp--preset--gradient--vivid-cyan-blue-to-vivid-purple)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              電玩快報
            </h3>
          </div>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '2rem', 
            marginBottom: '2rem',
            flexWrap: 'wrap'
          }}>
            <Link href="/games" style={{ color: '#abb8c3', textDecoration: 'none' }}>Games</Link>
            <Link href="/screenshots" style={{ color: '#abb8c3', textDecoration: 'none' }}>Screenshots</Link>
            <Link href="/articles" style={{ color: '#abb8c3', textDecoration: 'none' }}>Articles</Link>
            <Link href="/about" style={{ color: '#abb8c3', textDecoration: 'none' }}>About</Link>
        </div>

          <div style={{ fontSize: '0.9rem', color: '#666' }}>
            <p>遊戲、圖片、所有商標和註冊商標均為其各自所有者的財產。</p>
            <p style={{ marginTop: '0.5rem' }}>
              © {new Date().getFullYear()} 電玩快報
          </p>
        </div>
      </div>
      </footer>
    </div>
  );
} 