const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { createClient } = require('@supabase/supabase-js');

// Supabase 設定
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 修正Ollama主機URL格式
let ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
if (!ollamaHost.startsWith('http')) {
  ollamaHost = `http://${ollamaHost}`;
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少Supabase環境變數');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

let browser;

// Ollama API 調用函數
async function callOllama(prompt, content) {
  try {
    const response = await fetch(`${ollamaHost}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemma3:4b',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1,
          top_p: 0.9,
          num_predict: 1000
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Ollama API調用失敗:', error);
    return null;
  }
}

// 將內容按照標題分段（包含數字編號和非數字編號的標題）
function splitContentBySections(content) {
  const sections = [];
  
  // 使用更寬鬆的正則表達式匹配所有 [標題] 格式的段落
  const sectionRegex = /(?:(\d+)\.\s*)?\[([^\]]+)\]/g;
  let lastIndex = 0;
  let match;
  
  while ((match = sectionRegex.exec(content)) !== null) {
    if (lastIndex > 0) {
      // 提取前一個段落的內容
      const prevSectionContent = content.substring(lastIndex, match.index).trim();
      if (prevSectionContent && sections.length > 0) {
        sections[sections.length - 1].content = prevSectionContent;
      }
    }
    
    // 開始新段落
    const number = match[1] || null;
    const title = match[2];
    const fullTitle = number ? `${number}. ${title}` : title;
    
    sections.push({
      number: number,
      title: fullTitle,
      originalTitle: title,
      startIndex: match.index,
      content: ''
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // 處理最後一個段落
  if (sections.length > 0) {
    const lastSectionContent = content.substring(lastIndex).trim();
    sections[sections.length - 1].content = lastSectionContent;
  }
  
  // 過濾太短的段落並優化分組
  let filteredSections = sections.filter(section => section.content.length > 50);
  
  // 合併相關的小段落到主要段落
  const consolidatedSections = [];
  let currentMainSection = null;
  
  for (let section of filteredSections) {
    // 判斷是否為主要段落（有數字編號或內容較長）
    if (section.number || section.content.length > 300) {
      // 保存前一個主要段落
      if (currentMainSection) {
        consolidatedSections.push(currentMainSection);
      }
      currentMainSection = {
        title: section.title,
        content: section.content
      };
    } else if (currentMainSection) {
      // 將小段落合併到當前主要段落
      currentMainSection.content += '\n\n' + section.originalTitle + '\n' + section.content;
    } else {
      // 如果還沒有主要段落，就當作獨立段落
      consolidatedSections.push({
        title: section.title,
        content: section.content
      });
    }
  }
  
  // 添加最後一個主要段落
  if (currentMainSection) {
    consolidatedSections.push(currentMainSection);
  }
  
  return consolidatedSections;
}

// 映射新分類到舊分類系統
function mapCategoryToOld(newCategory) {
  const categoryMap = {
    '維護與補償': '更新',
    '招募活動': '招募',
    '活動劇情': '活動',
    '戰術考試': '考試',
    '商店與系統更新': '更新',
    '新增內容': '更新',
    '獎勵加倍活動': '活動',
    '其他': '其他',
    '大決戰': '大決戰',
    '總力戰': '總力戰'
  };
  
  return categoryMap[newCategory] || newCategory || '其他';
}

// 分析單個段落
async function analyzeSingleSection(sectionTitle, sectionContent) {
  const prompt = `
請閱讀以下段落，並根據其**內容特徵**（而非活動名稱）分類為以下其中一類：

【分類選項】  
1. 維護與補償  
2. 招募活動  
3. 活動劇情（包含 Story、活動貨幣、任務條件、商店、Challenge 等）  
4. 戰術考試
5. 商店與系統更新（如商城、組合包、新商品）  
6. 新增內容（例如新劇情、新任務、新稱號）  
7. 獎勵加倍活動  
8. 其他
9. 大決戰
10. 總力戰

⚠️ 注意：  
- 請根據**內容描述**來分類，而非根據活動名稱。  
- 若內容中有「時間資訊」，請擷取並標示活動的開始時間與結束時間。  
- 若找不到明確的結束時間，請將其輸出為 "無"。
- 如果是招募活動，請提取所有相關角色名稱。

段落標題：${sectionTitle}
段落內容：${sectionContent}

【輸出格式】（請用 JSON 格式回答）
{
  "分類": "活動劇情",
  "摘要": "說明某活動可透過任務與活動貨幣兌換道具的內容。",
  "開始時間": "2025-05-27 10:00",
  "結束時間": "2025-06-10 09:59",
  "角色名稱": ["角色1", "角色2"]
}
`;

  try {
    console.log(`🤖 分析段落: ${sectionTitle}`);
    const response = await callOllama(prompt, '');
    
    if (response && response.response) {
      try {
        const jsonStart = response.response.indexOf('{');
        const jsonEnd = response.response.lastIndexOf('}') + 1;
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
          const jsonStr = response.response.substring(jsonStart, jsonEnd);
          const analysis = JSON.parse(jsonStr);
          
          // 轉換新格式到舊格式以保持兼容性
          const convertedAnalysis = {
            title: sectionTitle,
            summary: analysis.摘要 || analysis.summary || '',
            category: mapCategoryToOld(analysis.分類 || analysis.category),
            sub_category: null,
            character_names: analysis.角色名稱 || analysis.character_names || [],
            start_date: analysis.開始時間 || analysis.start_date || null,
            end_date: analysis.結束時間 === '無' ? null : (analysis.結束時間 || analysis.end_date || null)
          };
          
          console.log(`✅ 成功分析: ${convertedAnalysis.category} - ${convertedAnalysis.title}`);
          return convertedAnalysis;
        }
      } catch (parseError) {
        console.warn(`⚠️  段落 "${sectionTitle}" JSON 解析失敗:`, parseError.message);
        console.log('原始回應:', response.response);
      }
    }
  } catch (error) {
    console.warn(`⚠️  段落 "${sectionTitle}" 分析失敗:`, error.message);
  }

  // 備用分析
  console.log(`🔄 使用備用分類: ${sectionTitle}`);
  let category = '其他';
  let characterNames = [];
  
  // 更詳細的備用分類邏輯
  if (sectionTitle.includes('招募') || sectionContent.includes('招募') || sectionContent.includes('特選') || sectionContent.includes('特別特選')) {
    category = '招募';
    // 提取角色名稱
    const charMatches = sectionContent.match(/(佳澄|一花|伊織|惠|優香|瑪麗|詠葉|亞都梨|乃愛|羽留奈|體育服|應援團)/g);
    if (charMatches) {
      characterNames = [...new Set(charMatches)];
    }
  } else if (sectionContent.includes('Story') || sectionContent.includes('活動貨幣') || sectionContent.includes('Challenge') || sectionContent.includes('Quest') || (sectionTitle.includes('活動') && sectionContent.includes('期間'))) {
    category = '活動';
  } else if (sectionTitle.includes('考試') || sectionContent.includes('考試') || sectionContent.includes('綜合戰術考試')) {
    category = '考試';
  } else if (sectionTitle.includes('大決戰') || sectionContent.includes('大決戰')) {
    category = '大決戰';
  } else if (sectionTitle.includes('總力戰') || sectionContent.includes('總力戰')) {
    category = '總力戰';
  } else if (sectionContent.includes('2倍') || sectionContent.includes('獎勵') || sectionContent.includes('倍率')) {
    category = '活動'; // 獎勵加倍活動歸類為活動
  } else if (sectionTitle.includes('商店') || sectionContent.includes('商店') || sectionContent.includes('購買') || sectionContent.includes('販售')) {
    category = '更新'; // 商店更新
  } else if (sectionTitle.includes('維護') || sectionContent.includes('維護') || sectionContent.includes('補償') || sectionContent.includes('更新')) {
    category = '更新';
  } else if (sectionTitle.includes('活動') || sectionContent.includes('活動')) {
    category = '活動';
  }

  return {
    title: sectionTitle,
    summary: sectionContent.substring(0, 100) + '...',
    category: category,
    sub_category: null,
    character_names: characterNames,
    start_date: null,
    end_date: null
  };
}

async function main() {
  try {
    console.log('🚀 開始測試藍色檔案分段處理...');
    
    // 只清空測試文章的記錄（更實際的做法）
    const threadId = '2914139';
    console.log(`🗑️  清空Thread ID ${threadId}的舊記錄...`);
    
    // 只刪除同一thread_id的記錄
    const { error: clearError } = await supabase
      .from('blue_archive_news')
      .delete()
      .eq('thread_id', threadId);
    
    if (clearError) {
      console.error('❌ 清空測試記錄失敗:', clearError);
      console.error('錯誤詳情:', clearError.message);
    } else {
      console.log('✅ 測試記錄清空完成');
    }
    
    // 啟動瀏覽器
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null
    });
    
    // 目標文章URL  
    const targetUrl = 'https://forum.nexon.com/bluearchiveTW/board_view?thread=2914139&board=3352';
    
    console.log(`🎯 目標文章: ${targetUrl}`);
    
    const page = await browser.newPage();
    await page.goto(targetUrl, { waitUntil: 'networkidle2' });
    
    // 提取文章內容和圖片
    const articleData = await page.evaluate(() => {
      const titleElement = document.querySelector('h1, .title, [class*="title"]');
      const dateElement = document.querySelector('.date');
      const contentElement = document.querySelector('[class*="content"]');
      
      // 尋找文章中的所有圖片
      let imageUrls = [];
      const images = document.querySelectorAll('img');
      for (let img of images) {
        const src = img.src;
        // 過濾掉小圖標、頭像等，只要較大的內容圖片
        if (src && !src.includes('icon') && !src.includes('avatar') && 
            (src.includes('.jpg') || src.includes('.png') || src.includes('.jpeg'))) {
          imageUrls.push(src);
        }
      }
      
      return {
        title: titleElement ? titleElement.textContent.trim() : '▎5/27 (二) 更新日誌',
        date: dateElement ? dateElement.textContent.trim() : '',
        content: contentElement ? contentElement.textContent.trim() : '',
        imageUrls: imageUrls
      };
    });
    
    await page.close();
    
    console.log(`📰 文章標題: ${articleData.title}`);
    console.log(`📅 發布日期: ${articleData.date}`);
    console.log(`📝 內容長度: ${articleData.content.length} 字元`);
    
    if (!articleData.content) {
      console.log('❌ 未找到文章內容');
      return;
    }
    
    // 按段落分割內容
    const sections = splitContentBySections(articleData.content);
    console.log(`📑 找到 ${sections.length} 個段落:`);
    sections.forEach((section, index) => {
      console.log(`   ${index + 1}. [${section.title}] (${section.content.length} 字元)`);
    });
    
    console.log('\n📊 開始分析段落...');
    
    // 分析每個段落
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      console.log(`\n📊 處理段落 ${i + 1}/${sections.length}: [${section.title}]`);
      
      const analysis = await analyzeSingleSection(section.title, section.content);
      
      // 為招募項目尋找對應圖片
      let itemImageUrl = null;
      if (analysis.category === '招募' && articleData.imageUrls) {
        for (let imgUrl of articleData.imageUrls) {
          if (imgUrl.includes('1280x720') || imgUrl.includes('pickup') || 
              imgUrl.toLowerCase().includes('banner')) {
            itemImageUrl = imgUrl;
            break;
          }
        }
      }
      
      // 如果沒有找到特定圖片，使用第一張可用圖片
      if (!itemImageUrl && articleData.imageUrls && articleData.imageUrls.length > 0) {
        itemImageUrl = articleData.imageUrls[0];
      }
      
      console.log(`   類別: ${analysis.category}`);
      console.log(`   角色: ${analysis.character_names?.length ? analysis.character_names.join(', ') : '無'}`);
      
      // 準備新聞項目
      const newsItem = {
        title: analysis.title,
        content: section.content,
        summary: analysis.summary,
        date: articleData.date ? new Date(articleData.date.replace(/\./g, '-')).toISOString() : new Date().toISOString(),
        start_date: analysis.start_date ? new Date(analysis.start_date).toISOString() : null,
        end_date: analysis.end_date ? new Date(analysis.end_date).toISOString() : null,
        category: analysis.category,
        sub_category: analysis.sub_category,
        character_names: analysis.character_names || [],
        original_url: targetUrl,
        thread_id: threadId,
        image_url: itemImageUrl
      };
      
      // 插入到資料庫
      const { data, error } = await supabase
        .from('blue_archive_news')
        .insert([newsItem])
        .select();
      
      if (error) {
        console.error(`❌ 段落 ${i + 1} 資料庫插入錯誤:`, error);
      } else {
        console.log(`✅ 段落 ${i + 1} 儲存成功，ID: ${data[0].id}`);
      }
      
      // 避免API調用過快
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
  } catch (error) {
    console.error('❌ 程式執行錯誤:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// 程式入口
main().catch(console.error); 