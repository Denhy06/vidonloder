import axios from 'axios';

export async function scrapeTiktok(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.tiktok.com/',
      },
      maxRedirects: 5
    });

    const html = response.data;

    let jsonText = "";
    const regexes = [
      /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([^<]+)<\/script>/,
      /<script id="SIGI_STATE"[^>]*>([^<]+)<\/script>/,
      /<script id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/
    ];

    for (let regex of regexes) {
      const match = html.match(regex);
      if (match && match[1]) {
        jsonText = match[1];
        break;
      }
    }

    if (!jsonText) throw new Error("Data script TikTok tidak ditemukan atau terkena blokir.");

    const data = JSON.parse(jsonText);
    let itemStruct = null;

    function findStruct(obj) {
      if (!obj || typeof obj !== 'object') return null;
      if (obj.video && obj.id && obj.author) return obj;
      for (let key in obj) {
        if (['music', 'stats', 'author'].includes(key)) continue;
        const result = findStruct(obj[key]);
        if (result) return result;
      }
      return null;
    }

    itemStruct = findStruct(data);
    if (!itemStruct) throw new Error("Struktur video TikTok tidak ditemukan di dalam JSON.");

    let candidates = [];

    // 1. PRIORITAS UTAMA: Ambil dari downloadAddr (URL khusus unduhan yang bebas blokir hotlink)
    if (itemStruct.video?.downloadAddr?.UrlList) {
      candidates.push(...itemStruct.video.downloadAddr.UrlList);
    }

    // 2. CADANGAN PERTAMA: Ambil dari playAddr
    if (itemStruct.video?.playAddr?.UrlList) {
      candidates.push(...itemStruct.video.playAddr.UrlList);
    }

    // 3. CADANGAN KEDUA: Ambil dari bitrateInfo
    if (itemStruct.video?.bitrateInfo) {
      itemStruct.video.bitrateInfo.forEach(br => {
        if (br.PlayAddr?.UrlList) candidates.push(...br.PlayAddr.UrlList);
      });
    }

    let finalVideoUrl = candidates[0] || null;

    if (!finalVideoUrl) {
      throw new Error("Link URL video MP4 yang valid gagal ditarik.");
    }

    return {
      title: itemStruct.desc || 'Video TikTok',
      download_url: finalVideoUrl,
      thumbnail: itemStruct.video?.cover || itemStruct.video?.originCover || ''
    };

  } catch (error) {
    throw new Error('Gagal scrape TikTok: ' + error.message);
  }
}
