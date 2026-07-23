import axios from 'axios';
import * as cheerio from 'cheerio';

export async function scrapeTiktok(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const $ = cheerio.load(response.data);
    
    // Logika cheerio di sini menyesuaikan tag meta TikTok
    const title = $('title').text() || 'TikTok Video';
    
    return {
      title: title,
      download_url: 'https://contoh-link-mp4-tiktok.com/video.mp4',
      thumbnail: 'https://contoh-thumbnail.jpg'
    };
  } catch (error) {
    throw new Error('Gagal scrape TikTok: ' + error.message);
  }
}