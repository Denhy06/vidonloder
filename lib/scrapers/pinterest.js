import axios from 'axios';
import * as cheerio from 'cheerio';

export async function scrapePinterest(url) {
  try {
    // Seperti biasa, User-Agent itu wajib agar tidak dikira bot jahat
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Ambil Judul & Thumbnail dari tag Open Graph (Standar Pinterest)
    let title = $('meta[property="og:title"]').attr('content') || $('title').text();
    if (!title) title = 'Pinterest Video';
    
    let thumbnail = $('meta[property="og:image"]').attr('content') || '';

    let download_url = null;

    // 1. Coba cara paling gampang dulu: cari di tag HTML <video>
    download_url = $('video source').attr('src') || $('video').attr('src');

    // 2. Kalau gagal, kita pancing pakai Regex dari data JSON di dalam <script>
    if (!download_url) {
      // Cari label "contentUrl" yang berakhiran .mp4
      const match = html.match(/"contentUrl":"([^"]+\.mp4)"/);
      
      if (match && match[1]) {
        download_url = match[1];
      } else {
        // Fallback: Sapu bersih semua text cari link server video Pinterest (v.pinimg.com)
        const fallbackMatch = html.match(/(https:\/\/v\.pinimg\.com\/[^"]+\.mp4)/);
        if (fallbackMatch && fallbackMatch[1]) {
          download_url = fallbackMatch[1];
        }
      }
    }

    if (!download_url) {
      throw new Error('Link video gagal ditemukan. Pastikan link adalah video, bukan gambar biasa.');
    }

    // Bersihkan karakter unicode escape (\u002F menjadi garis miring /) jika ada
    download_url = download_url.replace(/\\u002F/g, '/');

    return {
      title: title,
      download_url: download_url,
      thumbnail: thumbnail
    };

  } catch (error) {
    throw new Error('Gagal memproses Pinterest: ' + error.message);
  }
}
