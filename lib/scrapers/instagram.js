export async function scrapeInstagram(url) {
  // Data host dan key langsung diambil dari gambar lo
  const apiHost = "instagram-video-downloader13.p.rapidapi.com";
  const apiKey = "d22d36e9d4msh19d851ed141a616p186f95jsn4d9de1543af7";

  // API lo butuh URLSearchParams (x-www-form-urlencoded), BUKAN FormData
  const bodyParams = new URLSearchParams();
  bodyParams.append("url", url);

  try {
    // Endpoint-nya persis kayak di gambar: /index.php
    const res = await fetch(`https://${apiHost}/index.php`, {
      method: 'POST',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': apiHost,
        'Content-Type': 'application/x-www-form-urlencoded' // Wajib ada sesuai gambar
      },
      body: bodyParams
    });

    const data = await res.json();

    // Validasi berdasarkan struktur response (dari gambar lo sebelumnya)
    if (!data.success) {
      throw new Error("Gagal. API bales: " + JSON.stringify(data));
    }

    // Ambil caption dari 'title'
    const captionText = data.title || ""; 
    const mainThumb = data.thumbnail || "";
    
    // Ambil URL video dari dalam array 'medias'
    if (!data.medias || data.medias.length === 0) {
      throw new Error("Data medias kosong, video gak ketemu.");
    }
    const mainUrl = data.medias[0].url;

    return {
      title: captionText,
      caption: captionText,
      thumbnail: mainThumb,
      download_url: mainUrl,
      all_media: {
        videos: mainUrl.includes('.mp4') ? [{ thumb_url: mainThumb, url: mainUrl }] : [],
        images: !mainUrl.includes('.mp4') ? [{ thumb_url: mainThumb, url: mainUrl }] : [] 
      }
    };

  } catch (error) {
    throw new Error(`Scraper Error: ${error.message}`);
  }
}
