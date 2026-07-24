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

    // 1. Coba ambil deskripsi dari Meta Tag dulu
    let description = $('meta[property="og:description"]').attr('content') || 
                      $('meta[name="description"]').attr('content') || '';
                      
    let rawTitle = $('meta[property="og:title"]').attr('content') || 
                   $('meta[name="twitter:title"]').attr('content') || 
                   $('title').text() || '';

    // Filter judul otomatis bawaan Board Pinterest
    const lowerTitle = rawTitle.trim().toLowerCase();
    if (lowerTitle === 'pinterest' || lowerTitle.startsWith('pin on ')) {
      rawTitle = ''; 
    }
    
    // --- PERBAIKAN: FILTER TEKS OTOMATIS SEO PINTEREST ---
    let lowerDesc = description.trim().toLowerCase();
    if (
      lowerDesc.includes('this pin was discovered by') || 
      lowerDesc.includes('discover (and save!)') ||
      lowerDesc.startsWith('explore ')
    ) {
      description = ''; // Kosongkan karena ini cuma teks spam SEO dari Pinterest
    }

    // --- TRIK BARU: GALI CAPTION ASLI DARI JSON ---
    // Jika deskripsi kosong (karena kena filter di atas), kita korek dari script JSON
    if (!description) {
      // Cari properti "closeup_unified_description" atau "description" di dalam JSON string
      const jsonDescMatch = html.match(/"closeup_unified_description":"(.*?)"/) || 
                            html.match(/"description":"(.*?)"/);
                            
      if (jsonDescMatch && jsonDescMatch[1]) {
        try {
          // Parse string JSON agar karakter Unicode (seperti emoji ❤️ dll) terbaca normal
          description = JSON.parse(`"${jsonDescMatch[1]}"`);
        } catch (e) {
          description = jsonDescMatch[1]; // Fallback jika gagal parse
        }
      }
    }

    // Pastikan lagi hasil dari JSON bukan teks SEO otomatis
    if (description.toLowerCase().includes('this pin was discovered by')) {
        description = '';
    }

    // Cari nama pembuat / pinner
    let author = $('meta[name="author"]').attr('content') || 
                 $('meta[property="article:author"]').attr('content') || '';

    if (!author) {
      const authorMatch = html.match(/"pinner":\s*\{[^}]*"username":\s*"([^"]+)"/i) || 
                          html.match(/"username":\s*"([^"]+)"/i);
      if (authorMatch && authorMatch[1]) {
        author = authorMatch[1];
      }
    }

    // TENTUKAN HASIL AKHIR TITEL:
    // 1. Caption Asli -> 2. Title Asli -> 3. "Pin by @username" -> 4. "Pinterest Video"
    let finalTitle = description.trim() || rawTitle.trim();
    
    if (!finalTitle) {
      finalTitle = author ? `Pin by @${author.replace(/^@/, '')}` : 'Pinterest Video';
    }

    // --- PENCARIAN THUMBNAIL & VIDEO URL ---
    let thumbnail = $('meta[property="og:image"]').attr('content') || '';
    let download_url = null;

    download_url = $('video').attr('src') || $('video source').attr('src');

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
