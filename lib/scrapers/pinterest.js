import axios from 'axios';
import * as cheerio from 'cheerio';

export async function scrapePinterest(url) {
  try {
    // 1. Header super lengkap agar Axios terlihat persis seperti browser sungguhan
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // --- LOGIKA MENCARI TITEL DENGAN FALLBACK AUTHOR ---
    
    // 1. Ambil judul dari meta tag
    let rawTitle = $('meta[property="og:title"]').attr('content') || 
                   $('meta[name="twitter:title"]').attr('content') || 
                   $('title').text() || 
                   '';

    // Filter jika judul cuma bawaan kata "Pinterest"
    if (rawTitle.trim().toLowerCase() === 'pinterest') {
      rawTitle = '';
    }

    // 2. Cari nama pembuat / pinner (jika judul kosong)
    let author = $('meta[name="author"]').attr('content') || 
                 $('meta[property="article:author"]').attr('content') || 
                 '';

    // Jika meta tag author tidak ketemu, cari lewat Regex di dalam script JSON Pinterest
    if (!author) {
      const authorMatch = html.match(/"pinner":\s*\{[^}]*"username":\s*"([^"]+)"/i) || 
                          html.match(/"pinner":\s*\{[^}]*"full_name":\s*"([^"]+)"/i) ||
                          html.match(/"username":\s*"([^"]+)"/i);
      if (authorMatch && authorMatch[1]) {
        author = authorMatch[1];
      }
    }

    // 3. Tentukan judul akhir (Gunakan judul -> jika kosong gunakan author -> jika kosong gunakan fallback)
    let finalTitle = rawTitle.trim();
    if (!finalTitle) {
      finalTitle = author ? `Pin by @${author.replace(/^@/, '')}` : 'Pinterest Video';
    }

    // --- PENCARIAN THUMBNAIL & VIDEO URL ---
    let thumbnail = $('meta[property="og:image"]').attr('content') || '';
    let download_url = null;

    // Trik 1: Cara normal, cari di elemen <video>
    download_url = $('video').attr('src') || $('video source').attr('src');

    // Trik 2: Regex "Sapu Bersih"
    if (!download_url) {
      const regex = /(https?:[a-zA-Z0-9\-\.\/\\_]+\.mp4)/g;
      const matches = html.match(regex);
      
      if (matches) {
        const cleanUrls = matches.map(m => m.replace(/\\/g, ''));
        const videoUrls = cleanUrls.filter(u => u.includes('v.pinimg.com') || u.includes('pinimg.com/video'));
        
        if (videoUrls.length > 0) {
          download_url = videoUrls[0];
        }
      }
    }

    // Evaluasi Akhir
    if (!download_url) {
      throw new Error('Gagal menemukan link MP4. Pastikan link berisi konten video atau server diblokir.');
    }

    return {
      title: finalTitle,
      download_url: download_url,
      thumbnail: thumbnail
    };

  } catch (error) {
    throw new Error(error.message);
  }
}
