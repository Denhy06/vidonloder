import axios from 'axios';
import * as cheerio from 'cheerio';

export async function scrapeFacebook(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const $ = cheerio.load(response.data);
    
    return {
      title: $('title').text() || 'Facebook Video',
      download_url: 'https://contoh-link-mp4-fb.com/video.mp4',
      thumbnail: 'https://contoh-thumbnail.jpg'
    };
  } catch (error) {
    throw new Error('Gagal scrape Facebook: ' + error.message);
  }
}