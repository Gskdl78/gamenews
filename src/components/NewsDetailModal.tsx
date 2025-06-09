'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { NewsItem } from '@/types/news';

interface NewsDetailModalProps {
  item: NewsItem | null;
  onClose: () => void;
}

// 處理摘要中的簡單格式
const renderSummary = (summaryText: string | undefined) => {
  if (!summaryText) {
    return <Typography>暫無摘要資訊。</Typography>;
  }
  // 清理 Ollama 可能回傳的前綴
  const cleanedText = summaryText.replace('好的，根據公告內容，提取的資訊如下：', '').trim();
  
  return cleanedText.split('\n').map((line, index) => {
    // 處理 **粗體**
    const parts = line.split('**').map((part, i) =>
      i % 2 === 1 ? <strong key={i}>{part}</strong> : part
    );

    // 簡單的關鍵字上色
    if (line.includes('活動時間') || line.includes('活動期間')) {
      return <Typography key={index} component="p" sx={{ fontWeight: 'bold', my: 1 }}>{parts}</Typography>;
    }
    if (line.includes('獎勵')) {
        return <Typography key={index} component="p" sx={{ color: 'success.main', my: 1 }}>{parts}</Typography>;
    }

    return <Typography key={index} component="p" sx={{ my: 1 }}>{parts}</Typography>;
  });
};


const NewsDetailModal: React.FC<NewsDetailModalProps> = ({ item, onClose }) => {
  if (!item) {
    return null;
  }

  return (
    <Dialog open={!!item} onClose={onClose} scroll="paper" fullWidth maxWidth="md">
      <DialogTitle sx={{ m: 0, p: 2, fontWeight: 'bold' }}>
        {item.title}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 3 }}>
        {renderSummary(item.summary)}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>關閉</Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewsDetailModal; 