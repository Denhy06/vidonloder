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

    // --- 1. SAPU BERSIH NAMA USER ---
    // Cari "username":"namapengguna" di SELURUH tumpukan kode HTML
    const authorMatch = html.match(/"username"\s*:\s*"([^"]+)"/);
    if (authorMatch && authorMatch[1]) {
      authorName = authorMatch[1];
    }

    // --- 2. SAPU BERSIH CAPTION ASLI ---
    // Cari "closeup_unified_description":"captionnya" di SELURUH HTML
    const captionMatch = html.match(/"closeup_unified_description"\s*:\s*"([^"]+)"/) || 
                         html.match(/"description"\s*:\s*"([^"]+)"/);
    
    if (captionMatch && captionMatch[1]) {
      let rawCaption = captionMatch[1];
      try {
        // Parse string supaya kode unik seperti \u2764 (emoji love) berubah jadi emoji normal
        finalTitle = JSON.parse(`"${rawCaption}"`);
      } catch(e) {
        finalTitle = rawCaption;
      }
    }

    // --- 3. FILTER SPAM SEO OTOMATIS PINTEREST ---
    if (finalTitle) {
      const lower = finalTitle.toLowerCase();
      if (
        lower.includes('this pin was discovered by') || 
        lower.startsWith('explore ') || 
        lower === 'pinterest' || 
        lower.startsWith('pin on ')
      ) {
        finalTitle = ''; // Kosongkan kalau ternyata itu teks bot Pinterest
      }
    }

    // --- 4. FALLBACK LOGIC: JIKA CAPTION TETAP KOSONG ---
    if (!finalTitle || finalTitle.trim() === '') {
      if (authorName) {
        finalTitle = `Pinterest by @${authorName}`;
      } else {
        // Pertahanan terakhir kalau Regex user meleset, ambil dari URL author di meta tag
        let metaAuthor = $('meta[property="article:author"]').attr('content');
        if (metaAuthor) {
          let extractedName = metaAuthor.split('/').filter(Boolean).pop();
          finalTitle = `Pinterest by @${extractedName}`; 
        } else {
          finalTitle = 'Pinterest Video'; 
        }
      }
    }

    // --- 5. PENCARIAN THUMBNAIL & VIDEO URL ---
    let thumbnail = $('meta[property="og:image"]').attr('content') || '';
    let download_url = $('video').attr('src') || $('video source').attr('src');

    // Sapu bersih URL video
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
      title: finalTitle.trim(),
      download_url: download_url,
      thumbnail: thumbnail
    };

  } catch (error) {
    throw new Error(error.message);
  }
}
