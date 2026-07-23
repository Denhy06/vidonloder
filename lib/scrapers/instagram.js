export async function scrapeInstagram(url) {
  try {
    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    const headers = {
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Sec-CH-UA": "\"Not)A;Brand\";v=\"8\", \"Chromium\";v=\"138\", \"Brave\";v=\"138\"",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"
    };

    // === STEP 1: Ambil Init Token dari SaveInsta ===
    const initRes = await fetch("https://saveinsta.to/en/highlights", { headers });
    const html = await initRes.text();

    const k_exp = html.match(/k_exp\s*=\s*"([^"]+)"/)?.[1];
    const k_token = html.match(/k_token\s*=\s*"([^"]+)"/)?.[1];

    if (!k_exp || !k_token) throw new Error("Gagal mengambil token JS (k_exp / k_token)");

    await delay(1000);

    // === STEP 2: Ambil CF Token ===
    const cfRes = await fetch("https://saveinsta.to/api/userverify", {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Origin": "https://saveinsta.to",
        "Referer": "https://saveinsta.to/en/video",
        "X-Requested-With": "XMLHttpRequest"
      },
      body: new URLSearchParams({ url })
    });
    const cfData = await cfRes.json();
    const cftoken = cfData?.token;

    if (!cftoken) throw new Error("Gagal mengambil CF Token");

    await delay(1000);

    // === STEP 3: Request Final Content ===
    const ajaxRes = await fetch("https://saveinsta.to/api/ajaxSearch", {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Origin": "https://saveinsta.to",
        "Referer": "https://saveinsta.to/en/highlights",
        "X-Requested-With": "XMLHttpRequest"
      },
      body: new URLSearchParams({
        k_exp, k_token, q: url, t: "media", lang: "en", v: "v2", cftoken
      })
    });
    const ajaxData = await ajaxRes.json();

    if (ajaxData?.status !== "ok" || !ajaxData?.data) {
      throw new Error("Respon HTML dari server SaveInsta kosong atau tidak valid");
    }

    const responseHtml = ajaxData.data;
    const videos = [];
    const images = [];

    // === EKSTRAK TITLE/CAPTION ===
    // Coba tangkap elemen yang biasanya dipakai SaveInsta untuk menampilkan teks caption
    let extractedTitle = "Instagram Media"; 
    const titleRegex = /<div[^>]*class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/div>|<p[^>]*>([\s\S]*?)<\/p>/i;
    const titleMatch = responseHtml.match(titleRegex);

    if (titleMatch) {
      // Ambil hasil tangkapan grup 1 atau grup 2 (tergantung mana yang match)
      let rawTitle = titleMatch[1] || titleMatch[2];
      if (rawTitle) {
        // Bersihkan dari tag HTML <b>, <i>, <br>, dll lalu hilangkan spasi berlebih
        let cleanTitle = rawTitle.replace(/<[^>]+>/g, '').trim();
        // Kalau teksnya bukan kata-kata default tombol, kita pakai teks tersebut
        if (cleanTitle && !/download|instagram/i.test(cleanTitle) && cleanTitle.length > 3) {
           extractedTitle = cleanTitle;
        }
      }
    }

    // === HELPER DECODE JWT ===
    const checkIsVideo = (downloadUrl) => {
      try {
        if (downloadUrl.includes('token=')) {
          const token = new URL(downloadUrl).searchParams.get('token');
          if (token && token.includes('.')) {
            const payloadBase64 = token.split('.')[1];
            const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf-8'));
            
            const filename = (payload.filename || '').toLowerCase();
            const targetUrl = (payload.url || '').toLowerCase();

            if (filename.includes('.mp4') || targetUrl.includes('.mp4')) return true;
            if (filename.match(/\.(jpg|jpeg|webp|png)$/) || targetUrl.match(/\.(jpg|jpeg|webp|png)$/)) return false;
          }
        }
      } catch (e) {
        // Abaikan error parse JSON
      }
      return /\.mp4/i.test(downloadUrl) || /video/i.test(downloadUrl);
    };

    // Cari semua tag <a> di HTML
    const aRegex = /<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;

    while ((match = aRegex.exec(responseHtml)) !== null) {
      let href = match[1].replace(/&amp;/g, '&');
      const aContent = match[2];

      if (!href || href === '#' || href.startsWith('javascript:')) continue;

      // Cari thumbnail terdekat (kalau tidak ketemu, pasang string kosong)
      const thumbMatch = responseHtml.match(/<img[^>]+(?:data-src|src)="([^"]+)"/i);
      const thumbUrl = thumbMatch ? thumbMatch[1] : '';

      const isVid = checkIsVideo(href) || /download video/i.test(aContent);

      if (isVid) {
        if (!videos.some(v => v.url === href)) {
          videos.push({ thumb_url: thumbUrl, url: href });
        }
      } else {
        if (!images.some(img => img.url === href)) {
          images.push({ thumb_url: thumbUrl, url: href });
        }
      }
    }

    const primaryItem = videos[0] || images[0];

    if (!primaryItem) {
      throw new Error("Tidak menemukan link download media di hasil parser");
    }

    return {
      title: extractedTitle, // <--- Sekarang memakai Title yang sudah diekstrak
      thumbnail: primaryItem.thumb_url,
      download_url: primaryItem.url,
      all_media: { videos, images }
    };

  } catch (error) {
    throw new Error('Gagal scrape Instagram: ' + error.message);
  }
}
