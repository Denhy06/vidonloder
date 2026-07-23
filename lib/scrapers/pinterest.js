import axios from 'axios';
import * as cheerio from 'cheerio';

export async function scrapePinterest(url) {
  try {
    // 1. Header super lengkap agar Axios terlihat persis seperti browser sungguhan
    // Ini membantu melewati blokir saat me-resolve URL pendek (pin.it)
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

    let title = $('meta[property="og:title"]').attr('content') || $('title').text() || 'Pinterest Video';
    let thumbnail = $('meta[property="og:image"]').attr('content') || '';
    
    let download_url = null;

    // Trik 1: Cara normal, cari di elemen <video> (jarang berhasil, tapi untuk jaga-jaga)
    download_url = $('video').attr('src') || $('video source').attr('src');

    // Trik 2: Regex "Sapu Bersih" (Paling Ampuh)
    if (!download_url) {
      // Cari SEMUA string yang diawali http/https dan diakhiri .mp4
      // Regex ini dirancang kebal terhadap tumpukan backslash (\) ala Pinterest
      const regex = /(https?:[a-zA-Z0-9\-\.\/\\_]+\.mp4)/g;
      const matches = html.match(regex);
      
      if (matches) {
        // Bersihkan semua karakter backslash (\) dari hasil tangkapan
        const cleanUrls = matches.map(m => m.replace(/\\/g, ''));
        
        // Saring, ambil hanya link yang berasal dari server video Pinterest
        const videoUrls = cleanUrls.filter(u => u.includes('v.pinimg.com') || u.includes('pinimg.com/video'));
        
        if (videoUrls.length > 0) {
          download_url = videoUrls[0]; // Langsung ambil index pertama
        }
      }
    }

    // Evaluasi Akhir
    if (!download_url) {
      throw new Error('Gagal menemukan link MP4. Pastikan link berisi konten video atau server diblokir.');
    }

    return {
      title: title,
      download_url: download_url,
      thumbnail: thumbnail
    };

  } catch (error) {
    throw new Error(error.message);
  }
}
