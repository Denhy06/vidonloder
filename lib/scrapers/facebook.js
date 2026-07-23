import axios from 'axios';
import * as cheerio from 'cheerio';

export async function scrapeFacebook(url) {
  try {
    // 1. Menembak URL target dengan header yang menyamar sebagai browser PC sungguhan
    // Ini sangat penting agar Facebook tidak memblokir request dari server Vercel
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

    // 2. Ambil Judul Video (Biasanya ada di tag meta og:title)
    let title = $('meta[property="og:title"]').attr('content') || $('title').text();
    if (!title) title = 'Facebook Video';

    // 3. Ambil Thumbnail (Biasanya ada di tag meta og:image)
    let thumbnail = $('meta[property="og:image"]').attr('content') || '';

    // 4. Proses Inti: Ekstrak Link MP4 menggunakan Regex dari dalam HTML
    let download_url = null;

    // Facebook sering menggunakan key "browser_native_hd_url" atau "playable_url_quality_hd"
    const hdMatch = html.match(/"browser_native_hd_url":"(.*?)"/) || html.match(/"playable_url_quality_hd":"(.*?)"/);
    
    // Fallback jika tidak ada kualitas HD, cari kualitas SD ("browser_native_sd_url" atau "playable_url")
    const sdMatch = html.match(/"browser_native_sd_url":"(.*?)"/) || html.match(/"playable_url":"(.*?)"/);

    if (hdMatch && hdMatch[1]) {
      // Facebook menambahkan karakter escape '\' di URL mereka, jadi kita harus membersihkannya
      download_url = hdMatch[1].replace(/\\/g, ''); 
    } else if (sdMatch && sdMatch[1]) {
      download_url = sdMatch[1].replace(/\\/g, '');
    }

    // Validasi akhir jika link benar-benar tidak ketemu
    if (!download_url) {
      throw new Error('Link MP4 tidak ditemukan. Pastikan video bersifat Publik (bukan Private) atau format URL didukung.');
    }

    // 5. Kembalikan data yang sudah bersih
    return {
      title: title,
      download_url: download_url,
      thumbnail: thumbnail
    };

  } catch (error) {
    throw new Error('Gagal memproses Facebook: ' + error.message);
  }
}
