'use client'

import React, { useState } from 'react'
import { 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Box, 
  Modal, 
  IconButton,
  CardMedia,
  CardActionArea,
  Chip
} from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'

interface NewsItem {
  id: string
  title: string
  content: string
  image_url: string
  summary: string
  created_at: string
  updated_at: string
  category: string
  type: 'news' | 'update'
}

interface RecentNewsProps {
  news: NewsItem[]
  type: 'news' | 'update'
}

const RecentNews: React.FC<RecentNewsProps> = ({ news, type }) => {
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null)

  // 從內容中提取時間
  const extractDates = (content: string) => {
    const startTimeMatch = content.match(/(\d{4})[\/\.](\d{1,2})[\/\.](\d{1,2})\s*(\d{1,2}):(\d{1,2}).*?(?:開始|舉辦|登場|開催|維持|開啟|實施)/)
    const endTimeMatch = content.match(/(\d{4})[\/\.](\d{1,2})[\/\.](\d{1,2})\s*(\d{1,2}):(\d{1,2}).*?(?:結束|截止|直到|維持到|關閉|終止|結算)/)
    
    return {
      startTime: startTimeMatch ? new Date(
        parseInt(startTimeMatch[1]),
        parseInt(startTimeMatch[2]) - 1,
        parseInt(startTimeMatch[3]),
        parseInt(startTimeMatch[4]),
        parseInt(startTimeMatch[5])
      ) : null,
      endTime: endTimeMatch ? new Date(
        parseInt(endTimeMatch[1]),
        parseInt(endTimeMatch[2]) - 1,
        parseInt(endTimeMatch[3]),
        parseInt(endTimeMatch[4]),
        parseInt(endTimeMatch[5])
      ) : null
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '未指定'
    return format(date, 'yyyy/MM/dd HH:mm', { locale: zhTW })
  }

  const getChipColor = (category: string) => {
    switch (category) {
      case '活動':
        return 'primary'
      case '轉蛋':
        return 'secondary'
      case '更新':
        return 'info'
      case '公告':
        return 'warning'
      default:
        return 'default'
    }
  }

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        {type === 'news' ? '最新活動' : '遊戲更新'}
      </Typography>
      <Grid container spacing={2} direction="column">
        {news.map((item) => {
          const { startTime, endTime } = extractDates(item.content)
          
          return (
            <Grid item xs={12} key={item.id}>
              <Card 
                sx={{ 
                  display: 'flex',
                  height: 160,
                  '&:hover': {
                    boxShadow: 6
                  }
                }}
              >
                <CardActionArea 
                  sx={{ display: 'flex', height: '100%' }}
                  onClick={() => setSelectedNews(item)}
                >
                  <CardMedia
                    component="img"
                    sx={{ width: 240, height: '100%' }}
                    image={item.image_url || '/placeholder.png'}
                    alt={item.title}
                  />
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Chip 
                          label={item.category} 
                          color={getChipColor(item.category)} 
                          size="small" 
                          sx={{ mr: 1 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(item.created_at), 'yyyy/MM/dd HH:mm', { locale: zhTW })}
                        </Typography>
                      </Box>
                      <Typography variant="h6" component="div" sx={{ mb: 1 }}>
                        {item.title}
                      </Typography>
                    </Box>
                    <Box>
                      {startTime && (
                        <Typography variant="body2" color="text.secondary">
                          開始時間：{formatDate(startTime)}
                        </Typography>
                      )}
                      {endTime && (
                        <Typography variant="body2" color="text.secondary">
                          結束時間：{formatDate(endTime)}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      {/* 詳細內容彈窗 */}
      <Modal
        open={!!selectedNews}
        onClose={() => setSelectedNews(null)}
        aria-labelledby="news-modal-title"
        aria-describedby="news-modal-description"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          maxWidth: 800,
          maxHeight: '90vh',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
          overflow: 'auto'
        }}>
          <IconButton
            sx={{
              position: 'absolute',
              right: 8,
              top: 8
            }}
            onClick={() => setSelectedNews(null)}
          >
            <CloseIcon />
          </IconButton>
          
          {selectedNews && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Chip 
                  label={selectedNews.category} 
                  color={getChipColor(selectedNews.category)} 
                  sx={{ mr: 1 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {format(new Date(selectedNews.created_at), 'yyyy/MM/dd HH:mm', { locale: zhTW })}
                </Typography>
              </Box>
              
              <Typography id="news-modal-title" variant="h5" component="h2" gutterBottom>
                {selectedNews.title}
              </Typography>
              
              {selectedNews.image_url && (
                <Box sx={{ 
                  width: '100%',
                  maxHeight: 400,
                  display: 'flex',
                  justifyContent: 'center',
                  mb: 2,
                  overflow: 'hidden'
                }}>
                  <img
                    src={selectedNews.image_url}
                    alt={selectedNews.title}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain'
                    }}
                  />
                </Box>
              )}

              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
                {selectedNews.summary}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                更新時間：{format(new Date(selectedNews.updated_at), 'yyyy/MM/dd HH:mm', { locale: zhTW })}
              </Typography>
            </>
          )}
        </Box>
      </Modal>
    </Box>
  )
}

export default RecentNews 