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

    // --- CARA ALA TIKTOK: AMBIL JSON RAKSASA PINTEREST ---
    // Pinterest menyimpan SEMUA data asli (caption & video) di dalam script id "__PWS_DATA__"
    const scriptData = $('script[id="__PWS_DATA__"]').html();

    if (scriptData) {
      try {
        const jsonData = JSON.parse(scriptData);

        // Fungsi pencari otomatis (mirip findStruct di TikTok)
        function extractPinData(obj) {
          if (!obj || typeof obj !== 'object') return;

          // Ambil caption asli (biasanya disimpan di key closeup_unified_description)
          if (obj.closeup_unified_description && !finalTitle) {
            finalTitle = obj.closeup_unified_description;
          } else if (obj.description && !finalTitle) {
             finalTitle = obj.description;
          }

          // Ambil nama pembuat (pinner)
          if (obj.pinner && obj.pinner.username && !authorName) {
            authorName = obj.pinner.username; // atau pakai .full_name jika ingin namanya
          }

          // Telusuri lebih dalam
          for (let key in obj) {
            if (typeof obj[key] === 'object') {
              extractPinData(obj[key]);
            }
          }
        }

        extractPinData(jsonData);

      } catch (e) {
        // Abaikan jika error parse JSON
      }
    }

    // --- DOUBLE CHECK: MENCEGAH TEKS SPAM SEO ---
    // Kalau captionnya ternyata bawaan sistem Pinterest, kita buang.
    if (finalTitle) {
      const lowerTitle = finalTitle.toLowerCase();
      if (
        lowerTitle.includes('this pin was discovered by') || 
        lowerTitle.startsWith('explore ') || 
        lowerTitle === 'pinterest' ||
        lowerTitle.startsWith('pin on ')
      ) {
        finalTitle = '';
      }
    }

    // --- FALLBACK KE NAMA USER SESUAI PERMINTAAN ---
    // Jika caption beneran kosong atau dibuang karena spam SEO, ganti format jadi: Pinterest by @username
    if (!finalTitle || finalTitle.trim() === '') {
      if (authorName) {
        finalTitle = `Pinterest by @${authorName}`;
      } else {
        // Mentok banget kalau author juga gak ada (sangat jarang terjadi)
        finalTitle = 'Pinterest by User'; 
      }
    }

    // --- PENCARIAN THUMBNAIL & VIDEO URL ---
    let thumbnail = $('meta[property="og:image"]').attr('content') || '';
    let download_url = $('video').attr('src') || $('video source').attr('src');

    // Regex anti-gagal untuk Video URL
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
