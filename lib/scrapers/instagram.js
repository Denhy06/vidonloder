export async function scrapeInstagram(url) {
  // 1. API VKRDown (Gratis, stabil, dapet video + caption)
  try {
    const res1 = await fetch(`https://api.vkrdown.com/api/instagram?url=${encodeURIComponent(url)}`);
    const data1 = await res1.json();
    
    if (data1?.data?.video || data1?.data?.url) {
      return {
        title: data1.data.title || data1.data.caption || "Instagram Media",
        caption: data1.data.caption || data1.data.title || "",
        thumbnail: data1.data.thumbnail || "",
        download_url: data1.data.video || data1.data.url,
        all_media: {
          videos: data1.data.video ? [{ url: data1.data.video }] : [],
          images: !data1.data.video ? [{ url: data1.data.url }] : []
        }
      };
    }
  } catch (e) {}

  // 2. Cobalt API (Tanpa Key, kuat narik metadata lengkap)
  try {
    const res2 = await fetch("https://api.cobalt.tools/api/json", {
      method: "POST",
      headers: { "Accept": "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ url: url, videoQuality: "max" })
    });
    const data2 = await res2.json();
    
    if (data2?.url) {
      return {
        title: data2.caption || "Instagram Media",
        caption: data2.caption || "",
        thumbnail: "", 
        download_url: data2.url,
        all_media: {
          videos: data2.url.includes(".mp4") ? [{ url: data2.url }] : [],
          images: !data2.url.includes(".mp4") ? [{ url: data2.url }] : []
        }
      };
    }
  } catch (e) {}

  // 3. RapidAPI Lo (Pastikan lo udah pencet "Subscribe" di web RapidAPI-nya)
  const res3 = await fetch(`https://instagram-downloader-download-instagram-videos-photos1.p.rapidapi.com/get-info?url=${encodeURIComponent(url)}`, {
    headers: {
      'x-rapidapi-key': 'd22d36e9d4msh19d851ed141a616p186f95jsn4d9de1543af7',
      'x-rapidapi-host': 'instagram-downloader-download-instagram-videos-photos1.p.rapidapi.com'
    }
  });
  
  const data3 = await res3.json();
  const mainUrl = data3.download_url || data3.video_url || data3.media;
  
  // Kalau mentok 3 API gagal semua (biasanya karena akun IG di-private)
  if (!mainUrl) {
    throw new Error("Semua API gagal atau postingan IG diprivate.");
  }

  return {
    title: data3.caption || data3.title || "Instagram Media",
    caption: data3.caption || "",
    thumbnail: data3.thumbnail || data3.cover || "",
    download_url: mainUrl,
    all_media: {
      videos: mainUrl.includes('.mp4') ? [{ thumb_url: data3.thumbnail, url: mainUrl }] : [],
      images: !mainUrl.includes('.mp4') ? [{ thumb_url: data3.thumbnail, url: mainUrl }] : []
    }
  };
}
