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

    // Ambil setiap item elemen <li>
    const liMatches = responseHtml.match(/<li\b[^>]*>([\s\S]*?)<\/li>/gi) || [];

    for (const liHtml of liMatches) {
      // 1. Ambil Thumbnail
      let thumbUrl = '';
      const thumbMatch = liHtml.match(/<img[^>]+(?:data-src|src)="([^"]+)"/i);
      if (thumbMatch) {
        thumbUrl = thumbMatch[1];
        if (thumbUrl.includes('/imgs/loader.gif')) {
          const dataSrcMatch = liHtml.match(/data-src="([^"]+)"/i);
          if (dataSrcMatch) thumbUrl = dataSrcMatch[1];
        }
      }

      // 2. CARI AREA TOMBOL SAJA! (Ini kunci perbaikannya)
      // Mencegah link dari thumbnail atau profile tercapture
      let btnArea = liHtml;
      const btnDivMatch = liHtml.match(/<div[^>]*download-items__btn[^>]*>([\s\S]*?)<\/div>/i);
      if (btnDivMatch) {
        btnArea = btnDivMatch[1];
      }

      // 3. Cari tag <a> hanya di area tombol download
      const aMatches = btnArea.match(/<a\b[^>]*>([\s\S]*?)<\/a>/gi) || [];
      
      let videoUrl = null;
      let imageUrl = null;

      for (const aHtml of aMatches) {
        const hrefMatch = aHtml.match(/href="([^"]+)"/i);
        if (!hrefMatch) continue;
        
        // Hapus entitas HTML jika url ter-encode
        const href = hrefMatch[1].replace(/&amp;/g, '&'); 
        
        if (href === '#' || href.includes('javascript:')) continue;

        // Cek spesifik HANYA di tag <a> ini
        const isVideoBtn = /\bvideo(=|\s|>)/i.test(aHtml) || 
                           /download video/i.test(aHtml) || 
                           /\.mp4/i.test(href);
        
        if (isVideoBtn && !videoUrl) {
          videoUrl = href;
        } else if (!imageUrl && !isVideoBtn) {
          imageUrl = href;
        }
      }

      // 4. Fallback (Jika teks bukan video, tapi dari layout awalnya adalah video)
      if (!videoUrl && imageUrl && /icon-dlvideo/i.test(liHtml)) {
         videoUrl = imageUrl; 
         imageUrl = null; // Pindahkan dari image ke video
      }

      if (videoUrl) {
        videos.push({ thumb_url: thumbUrl, url: videoUrl });
      } else if (imageUrl) {
        images.push({ thumb_url: thumbUrl, url: imageUrl });
      }
    }

    const primaryItem = videos[0] || images[0];

    if (!primaryItem) {
      throw new Error("Tidak menemukan link download media di hasil parser");
    }

    return {
      title: 'Instagram Downloader',
      thumbnail: primaryItem.thumb_url,
      download_url: primaryItem.url, // Link pasti .mp4 jika aslinya video
      all_media: { videos, images }
    };

  } catch (error) {
    throw new Error('Gagal scrape Instagram: ' + error.message);
  }
}
