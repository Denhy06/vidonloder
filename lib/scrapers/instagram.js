export async function scrapeInstagram(url) {
  try {
    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    const headers = {
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Sec-CH-UA": '"Not)A;Brand";v="8", "Chromium";v="138", "Brave";v="138"',
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"
    };

    // ========================================================
    // HELPER: CURI CAPTION & USERNAME DARI EMBED IG (MULTI-METHOD)
    // ========================================================
    let customTitle = "Instagram Media";
    let extractedCaption = "";

    try {
      const idMatch = url.match(/(?:p|reel|tv)\/([^\/?#&]+)/i);
      const postId = idMatch ? idMatch[1] : null;

      if (postId) {
        const embedUrl = `https://www.instagram.com/p/${postId}/embed/captioned/`;
        const igRes = await fetch(embedUrl, { headers });

        if (igRes.ok) {
          const igHtml = await igRes.text();
          let username = "";

          // METODE 1: Ambil dari data JSON dalam script IG (Paling Akurat)
          const jsonCaptionMatch = igHtml.match(/"caption":\s*{\s*"text":\s*"([^"]+)"/i) || 
                                   igHtml.match(/"text":\s*"([^"]+)"/i);
          if (jsonCaptionMatch && jsonCaptionMatch[1]) {
            try {
              // Decode string JSON (karakter unicode \u00xx / \n)
              extractedCaption = JSON.parse(`"${jsonCaptionMatch[1]}"`);
            } catch {
              extractedCaption = jsonCaptionMatch[1];
            }
          }

          // METODE 2: Fallback Regex HTML jika JSON tidak ditemukan
          if (!extractedCaption) {
            const htmlCaptionMatch = igHtml.match(/<div class="(?:Caption|CaptionComments|CaptionNameValue|CaptionText)"[^>]*>([\s\S]*?)<\/div>/i);
            if (htmlCaptionMatch) {
              extractedCaption = htmlCaptionMatch[1];
            }
          }

          // CARI USERNAME
          const userMatch = igHtml.match(/class="[^"]*(?:Username|UsernameText)[^"]*"[^>]*>([^<]+)<\/a>/i) ||
                            igHtml.match(/"username":\s*"([^"]+)"/i);
          if (userMatch) {
            username = userMatch[1].trim();
          }

          // BERSIHKAN CAPTION
          if (extractedCaption) {
            extractedCaption = extractedCaption
              .replace(/\\n/g, "\n")
              .replace(/<br\s*\/?>/gi, "\n")
              .replace(/<[^>]+>/g, "")
              .replace(/&#x27;/g, "'")
              .replace(/&quot;/g, '"')
              .replace(/&amp;/g, '&')
              .trim();
          }

          // PENENTUAN TITLE / CAPTION DISPLAY
          if (extractedCaption) {
            customTitle = extractedCaption;
          } else if (username) {
            customTitle = `@${username} - ${postId}`;
          } else {
            customTitle = `Instagram Media - ${postId}`;
          }
        }
      }
    } catch (err) {
      const idMatch = url.match(/(?:p|reel|tv)\/([^\/?#&]+)/i);
      if (idMatch) customTitle = `Instagram Media - ${idMatch[1]}`;
    }

    // ========================================================
    // STEP 1: Ambil Init Token dari SaveInsta
    // ========================================================
    const initRes = await fetch("https://saveinsta.to/en/highlights", { headers });
    const html = await initRes.text();

    const k_exp = html.match(/k_exp\s*=\s*"([^"]+)"/)?.[1];
    const k_token = html.match(/k_token\s*=\s*"([^"]+)"/)?.[1];

    if (!k_exp || !k_token) throw new Error("Gagal mengambil token JS (k_exp / k_token)");

    await delay(1000);

    // ========================================================
    // STEP 2: Ambil CF Token
    // ========================================================
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

    // ========================================================
    // STEP 3: Request Final Content
    // ========================================================
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

    // FALLBACK TAMBAHAN: Jika caption dari Embed IG kosong, coba cari di HTML bawaan SaveInsta
    if (!extractedCaption || customTitle.startsWith("Instagram Media")) {
      const saveInstaCaption = responseHtml.match(/<(?:p|div|span)[^>]*class="[^"]*(?:desc|caption|photo-option)[^"]*"[^>]*>([\s\S]*?)<\/(?:p|div|span)>/i);
      if (saveInstaCaption && saveInstaCaption[1]) {
        const cleanDesc = saveInstaCaption[1].replace(/<[^>]+>/g, '').trim();
        if (cleanDesc) {
          extractedCaption = cleanDesc;
          customTitle = cleanDesc;
        }
      }
    }

    const videos = [];
    const images = [];

    // HELPER DECODE JWT
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
        // Abaikan error parsing
      }
      return /\.mp4/i.test(downloadUrl) || /video/i.test(downloadUrl);
    };

    // Cari semua link download
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
      title: customTitle,
      caption: extractedCaption || customTitle, // Menyediakan property caption khusus
      thumbnail: primaryItem.thumb_url,
      download_url: primaryItem.url,
      all_media: { videos, images }
    };

  } catch (error) {
    throw new Error('Gagal scrape Instagram: ' + error.message);
  }
}
