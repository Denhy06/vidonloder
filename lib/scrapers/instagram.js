export async function scrapeInstagram(url) {
  try {
    // Helper delay untuk jeda request (persis seperti usleep di PHP)
    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    const headers = {
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
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

    await delay(1200); // Jeda ~1.2 detik biar nggak diblokir

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
      body: new URLSearchParams({ url: url })
    });
    const cfData = await cfRes.json();
    const cftoken = cfData?.token;

    if (!cftoken) throw new Error("Gagal mengambil CF Token");

    await delay(1200);

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
      throw new Error("Respon HTML dari server SaveInsta tidak valid/kosong");
    }

    // === STEP 4: Parse HTML Media ===
    const responseHtml = ajaxData.data;
    const results = { images: [], videos: [] };
    
    // Ekstrak tag <li> menggunakan Regex (sebagai pengganti DOMXPath)
    const liRegex = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
    let match;

    while ((match = liRegex.exec(responseHtml)) !== null) {
      const liHtml = match[1];

      // Ambil Thumbnail
      const thumbMatch = liHtml.match(/<img[^>]+(?:data-src|src)="([^"]+)"/i);
      let thumbUrl = thumbMatch ? thumbMatch[1] : '';
      if (thumbUrl.includes('/imgs/loader.gif')) {
         const dataSrcMatch = liHtml.match(/data-src="([^"]+)"/i);
         if (dataSrcMatch) thumbUrl = dataSrcMatch[1];
      }

      // Deteksi Tipe (Video / Gambar)
      const isVideo = /icon-dlvideo/i.test(liHtml) || /video=/i.test(liHtml) || /download video/i.test(liHtml);
      
      // Ambil Link Download
      const btnHtmlMatch = liHtml.match(/<div[^>]+download-items__btn[^>]*>([\s\S]*?)<\/div>/i);
      const btnHtml = btnHtmlMatch ? btnHtmlMatch[1] : liHtml;
      const linkMatch = btnHtml.match(/<a[^>]+href="([^"]+)"/i);
      const downloadUrl = linkMatch ? linkMatch[1] : null;

      if (downloadUrl) {
        if (isVideo) {
          results.videos.push({ thumb_url: thumbUrl, url: downloadUrl });
        } else {
          results.images.push({ thumb_url: thumbUrl, url: downloadUrl });
        }
      }
    }

    // Ambil item utama (Prioritaskan video jika ada, kalau tidak ambil gambar)
    const primaryItem = results.videos[0] || results.images[0] || null;

    if (!primaryItem) {
        throw new Error("Tidak menemukan link download pada hasil ekstrak");
    }

    return {
      title: 'Instagram Downloader',
      thumbnail: primaryItem.thumb_url,
      download_url: primaryItem.url,
      // Kita kirim juga semua hasil media (penting untuk postingan Carousel Instagram)
      all_media: results 
    };

  } catch (error) {
    throw new Error('Gagal scrape Instagram: ' + error.message);
  }
}
