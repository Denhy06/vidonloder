export async function scrapeInstagram(url) {
  try {
    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    const headers = {
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Sec-CH-UA": "\"Not)A;Brand\";v=\"8\", \"Chromium\";v=\"138\", \"Brave\";v=\"138\"",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"
    };

    // ========================================================
    // KONSEP BARU: CURI TITLE / USERNAME LANGSUNG DARI IG
    // ========================================================
    let customTitle = "Instagram Media";
    try {
      // Ekstrak ID postingan dari URL untuk fallback
      const idMatch = url.match(/(?:p|reel|tv)\/([^\/?#&]+)/i);
      const postId = idMatch ? idMatch[1] : "UnknownID";

      // Fetch halaman asli Instagram
      const igRes = await fetch(url, { headers });
      const igHtml = await igRes.text();

      // 1. Cari caption di og:description
      const descMatch = igHtml.match(/<meta property="og:description" content="([^"]+)"/i);
      let caption = descMatch ? descMatch[1] : "";

      // 2. Cari Username di title atau URL
      let username = "";
      // Format URL kadang: instagram.com/username/p/ID
      const urlUserMatch = url.match(/(?:instagram\.com\/)([a-zA-Z0-9._]+)\/(?:p|reel|tv)/i);
      
      if (urlUserMatch) {
         username = urlUserMatch[1];
      } else {
         // Coba ambil dari <title> HTML IG: biasanya "Nama (@username) on Instagram..."
         const titleTagMatch = igHtml.match(/<title>([\s\S]*?)<\/title>/i);
         if (titleTagMatch && titleTagMatch[1].includes('(@')) {
            const uMatch = titleTagMatch[1].match(/\(@([^)]+)\)/);
            if (uMatch) username = uMatch[1];
         }
      }

      // 3. Logika Penentuan Title sesuai Konsep Lu
      // Bersihkan html entities (seperti &#x27; menjadi ')
      caption = caption.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');

      if (caption && caption.length > 5) {
         // Jika IG menyediakan caption (biasanya dipotong sekian karakter oleh IG)
         customTitle = caption;
      } else if (username !== "") {
         // Jika tidak ada caption, pakai format @username - ID
         customTitle = `@${username} - ${postId}`;
      } else {
         // Fallback paling akhir
         customTitle = `Instagram Media - ${postId}`;
      }
    } catch (err) {
      // Jika fetch ke IG gagal/diblokir, fallback ke format ID dasar
      const idMatch = url.match(/(?:p|reel|tv)\/([^\/?#&]+)/i);
      if (idMatch) customTitle = `Instagram Media - ${idMatch[1]}`;
    }
    // ========================================================

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
        // Abaikan error
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
      title: customTitle, // <--- Title hasil scrape manual dari IG!
      thumbnail: primaryItem.thumb_url,
      download_url: primaryItem.url,
      all_media: { videos, images }
    };

  } catch (error) {
    throw new Error('Gagal scrape Instagram: ' + error.message);
  }
}
