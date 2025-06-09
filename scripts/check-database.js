const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { createClient } = require('@supabase/supabase-js');

// Supabase 設定
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  try {
    console.log('🔍 檢查資料庫中的藍色檔案新聞...\n');
    
    const { data, error } = await supabase
      .from('blue_archive_news')
      .select('id, title, category, character_names, image_url, created_at')
      .order('id');
    
    if (error) {
      console.error('❌ 查詢錯誤:', error);
      return;
    }
    
    console.log(`📊 總共找到 ${data.length} 條記錄:\n`);
    
    data.forEach((item, index) => {
      console.log(`${index + 1}. [${item.category}] ${item.title}`);
      if (item.character_names && item.character_names.length > 0) {
        console.log(`   角色: ${item.character_names.join(', ')}`);
      }
      if (item.image_url) {
        console.log(`   圖片: ${item.image_url.substring(0, 50)}...`);
      }
      console.log(`   ID: ${item.id}, 時間: ${new Date(item.created_at).toLocaleString()}\n`);
    });
    
  } catch (error) {
    console.error('❌ 程式執行錯誤:', error);
  }
}

checkDatabase(); 