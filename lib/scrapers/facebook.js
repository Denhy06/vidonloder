import axios from 'axios';
import * as cheerio from 'cheerio';

export async function scrapeFacebook(url) {
  try {
    // 1. Menembak URL target dengan header yang menyamar sebagai browser PC
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Fetch-Mode': 'navigate',
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // 2. Ambil Judul Video
    let rawTitle = $('meta[property="og:title"]').attr('content') || $('title').text() || 'Facebook Video';

    // --- PEMBERSIHAN JUDUL (Membuang "2.6K reactions · 27 shares |") ---
    let title = rawTitle;
    if (title.includes('|')) {
      const parts = title.split('|');
      // Cek apakah potongan pertama berisi kata statistik FB (reactions, shares, views, likes, comments)
      if (/\b(reactions|shares|views|likes|comments)\b/i.test(parts[0])) {
        // Ambil potongan setelah '|' pertama dan bersihkan spasi di awal/akhir
        title = parts.slice(1).join('|').trim();
      }
    }

    // 3. Ambil Thumbnail
    let thumbnail = $('meta[property="og:image"]').attr('content') || '';

    // 4. Ekstrak Link MP4
    let download_url = null;
    const hdMatch = html.match(/"browser_native_hd_url":"(.*?)"/) || html.match(/"playable_url_quality_hd":"(.*?)"/);
    const sdMatch = html.match(/"browser_native_sd_url":"(.*?)"/) || html.match(/"playable_url":"(.*?)"/);

    if (hdMatch && hdMatch[1]) {
      download_url = hdMatch[1].replace(/\\/g, ''); 
    } else if (sdMatch && sdMatch[1]) {
      download_url = sdMatch[1].replace(/\\/g, '');
    }

    if (!download_url) {
      throw new Error('Link MP4 tidak ditemukan. Pastikan video bersifat Publik (bukan Private) atau format URL didukung.');
    }

    // 5. Kembalikan data lengkap (Termasuk platform: 'FACEBOOK')
    return {
      platform: 'FACEBOOK',
      title: title,
      download_url: download_url,
      thumbnail: thumbnail
    };

  } catch (error) {
    throw new Error('Gagal memproses Facebook: ' + error.message);
  }
}
