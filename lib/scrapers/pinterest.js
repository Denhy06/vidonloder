import axios from 'axios';
import * as cheerio from 'cheerio';

export async function scrapePinterest(url) {
  try {
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

    // --- LOGIKA BARU: AMBIL DESKRIPSI (CAPTION) DAN TITLE ---
    
    let description = $('meta[property="og:description"]').attr('content') || 
                      $('meta[name="description"]').attr('content') || '';
                      
    let rawTitle = $('meta[property="og:title"]').attr('content') || 
                   $('meta[name="twitter:title"]').attr('content') || 
                   $('title').text() || '';

    // Filter teks otomatis bawaan Pinterest agar tidak menimpa caption asli
    const lowerTitle = rawTitle.trim().toLowerCase();
    if (lowerTitle === 'pinterest' || lowerTitle.startsWith('pin on ')) {
      rawTitle = ''; // Kosongkan jika itu cuma judul otomatis dari nama Board
    }
    
    // Kadang deskripsi juga diisi otomatis dengan "Explore...", kita filter juga
    const lowerDesc = description.trim().toLowerCase();
    if (lowerDesc.startsWith('explore ') || lowerDesc.startsWith('discover ')) {
        description = '';
    }

    // Cari nama pembuat / pinner sebagai pertahanan terakhir
    let author = $('meta[name="author"]').attr('content') || 
                 $('meta[property="article:author"]').attr('content') || '';

    if (!author) {
      const authorMatch = html.match(/"pinner":\s*\{[^}]*"username":\s*"([^"]+)"/i) || 
                          html.match(/"pinner":\s*\{[^}]*"full_name":\s*"([^"]+)"/i) ||
                          html.match(/"username":\s*"([^"]+)"/i);
      if (authorMatch && authorMatch[1]) {
        author = authorMatch[1];
      }
    }

    // TENTUKAN HASIL AKHIR:
    // 1. Ambil deskripsi/caption (Karena biasanya ini yang paling relevan)
    // 2. Jika kosong, pakai title (yang sudah dibersihkan)
    // 3. Jika masih kosong, pakai format "Pin by @username"
    let finalTitle = description.trim() || rawTitle.trim();
    
    if (!finalTitle) {
      finalTitle = author ? `Pin by @${author.replace(/^@/, '')}` : 'Pinterest Video';
    }

    // --- PENCARIAN THUMBNAIL & VIDEO URL ---
    let thumbnail = $('meta[property="og:image"]').attr('content') || '';
    let download_url = null;

    // Trik 1: Cara normal
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
