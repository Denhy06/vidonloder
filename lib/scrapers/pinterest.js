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

    let finalTitle = '';
    let authorName = '';

    // --- STRATEGI SUPER AMPUH: Ambil Data Khusus Google (JSON-LD) ---
    // Mencari tag <script type="application/ld+json">
    const ldJsonScripts = $('script[type="application/ld+json"]');
    
    ldJsonScripts.each((i, el) => {
      try {
        const jsonData = JSON.parse($(el).html());
        // Terkadang datanya berbentuk Array, terkadang Object langsung
        const items = Array.isArray(jsonData) ? jsonData : [jsonData];
        
        for (let item of items) {
          // 1. Ambil Caption (Prioritas: articleBody -> description -> headline)
          if (item.articleBody && !finalTitle) {
            finalTitle = item.articleBody;
          } else if (item.description && !finalTitle) {
            finalTitle = item.description;
          } else if (item.headline && !finalTitle) {
            finalTitle = item.headline;
          }

          // 2. Ambil Nama Kreator Asli (Bukan ID aneh)
          if (item.author && item.author.name) {
            authorName = item.author.name;
          } else if (item.creator && item.creator.name) {
            authorName = item.creator.name;
          }
        }
      } catch (e) {
        // Abaikan jika ada error saat parse JSON internal
      }
    });

    // Filter akhir jika JSON-LD masih kecolongan teks SEO otomatis Pinterest
    if (
      finalTitle.toLowerCase().includes('this pin was discovered by') || 
      finalTitle.toLowerCase().startsWith('explore ') ||
      finalTitle.toLowerCase() === 'pinterest'
    ) {
        finalTitle = '';
    }

    // Jika JSON-LD gagal total, cari "Full Name" dari source code (hindari key "username")
    if (!authorName) {
       const authorMatch = html.match(/"full_name":\s*"([^"]+)"/i);
       if (authorMatch && authorMatch[1]) {
         authorName = authorMatch[1];
       }
    }

    // TENTUKAN HASIL AKHIR TITEL:
    finalTitle = finalTitle.trim();
    if (!finalTitle) {
       // Hasilnya nanti rapi: "Pin by LINE ART & VOYAGE"
       finalTitle = authorName ? `Pin by ${authorName}` : 'Pinterest Video';
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
          download_url = videoUrls[0]; // Ambil link pertama yang valid
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
