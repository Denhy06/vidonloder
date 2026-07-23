export async function scrapeInstagram(url) {
  // Key RapidAPI milik lo
  const apiKey = "d22d36e9d4msh19d851ed141a616p186f95jsn4d9de1543af7";
  const apiHost = "instagram-downloader-download-instagram-videos-photos1.p.rapidapi.com";
  
  try {
    const res = await fetch(`https://${apiHost}/get-info?url=${encodeURIComponent(url)}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': apiHost
      }
    });

    if (!res.ok) {
      throw new Error(`Koneksi ditolak (Status ${res.status}). Udah subscribe API-nya di web RapidAPI belum? Atau jangan-jangan lo jalanin di Browser (Cena CORS)?`);
    }

    const data = await res.json();

    // Validasi kalau data kosong (biasanya karena IG Private atau salah link)
    if (data.error || !data.download_url && !data.video_url && !data.media) {
      throw new Error(data.message || "Gagal dapet data video. Pastiin URL bener dan akun IG gak di-private.");
    }

    // Ekstrak URL utama
    const mainUrl = data.download_url || data.video_url || data.media;
    const mainThumb = data.thumbnail || data.cover || "";
    const isVideo = mainUrl.includes('.mp4');

    // Return data lengkap termasuk Caption
    return {
      title: data.caption || data.title || "Instagram Media",
      caption: data.caption || "", 
      thumbnail: mainThumb,
      download_url: mainUrl,
      all_media: {
        videos: isVideo ? [{ thumb_url: mainThumb, url: mainUrl }] : [],
        images: !isVideo ? [{ thumb_url: mainThumb, url: mainUrl }] : []
      }
    };

  } catch (error) {
    throw new Error(`Scraper Gagal: ${error.message}`);
  }
}
