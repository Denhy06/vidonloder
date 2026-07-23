import axios from 'axios';
import * as cheerio from 'cheerio';

export async function scrapeTiktok(url) {
  try {
    // 1. Gunakan User-Agent Mobile (iPhone) agar server TikTok meloloskan request kita
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // 2. Ambil Judul dan Thumbnail dari Meta Tags Open Graph
    let title = $('meta[property="og:title"]').attr('content') || $('title').text() || 'TikTok Video';
    let thumbnail = $('meta[property="og:image"]').attr('content') || '';

    let download_url = null;

    // 3. Coba ambil langsung dari meta og:video atau og:video:secure_url
    download_url = $('meta[property="og:video"]').attr('content') || $('meta[property="og:video:secure_url"]').attr('content');

    // 4. Jika meta tag tidak ada, gunakan Regex pencari link video di dalam struktur script HTML
    if (!download_url) {
      // Cari pola playAddr atau downloadAddr di dalam data JSON internal TikTok
      const matchPlayAddr = html.match(/"playAddr":"([^"]+)"/) || html.match(/"downloadAddr":"([^"]+)"/);
      
      if (matchPlayAddr && matchPlayAddr[1]) {
        download_url = matchPlayAddr[1];
      } else {
        // Fallback: Sapu bersih semua string berakhiran .mp4 yang berasal dari CDN TikTok
        const regex = /(https?:[a-zA-Z0-9\-\.\/\\_]+\.mp4)/g;
        const matches = html.match(regex);
        
        if (matches) {
          const cleanUrls = matches.map(m => m.replace(/\\/g, '').replace(/\\u002F/g, '/'));
          const videoUrls = cleanUrls.filter(u => u.includes('tiktokcdn') || u.includes('akamaized'));
          
          if (videoUrls.length > 0) {
            download_url = videoUrls[0];
          }
        }
      }
    }

    if (!download_url) {
      throw new Error('Gagal mengekstrak link video TikTok. Pastikan link publik dan valid.');
    }

    // Bersihkan karakter unicode/escape agar menjadi URL aktif yang normal
    download_url = download_url.replace(/\\u002F/g, '/').replace(/\\/g, '');

    return {
      title: title,
      download_url: download_url,
      thumbnail: thumbnail
    };

  } catch (error) {
    throw new Error('Gagal memproses TikTok: ' + error.message);
  }
}
