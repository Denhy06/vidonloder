export async function scrapeInstagram(url) {
  // ⚠️ PENTING: GANTI 'apiHost' DI BAWAH INI
  // Cek tab "Code Snippets" di web RapidAPI lo (sebelah tab Results), 
  // copas nilai 'x-rapidapi-host' ke sini.
  const apiHost = "instagram-video-downloader13.p.rapidapi.com"; 
  const apiKey = "d22d36e9d4msh19d851ed141a616p186f95jsn4d9de1543af7";

  // API lo butuh pengiriman tipe FORM_DATA (sesuai gambar lo)
  const formData = new FormData();
  formData.append("url", url);

  try {
    // Pastikan path endpoint bener (/video-downloader sesuai screenshot lo)
    const res = await fetch(`https://${apiHost}/video-downloader`, {
      method: 'POST',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': apiHost
      },
      body: formData
    });

    const data = await res.json();

    // Validasi berdasarkan parameter 'success: true' di screenshot lo
    if (!data.success) {
      throw new Error("Gagal. Server RapidAPI bales: " + JSON.stringify(data));
    }

    // Ekstrak data ngikutin sama persis kayak Screenshot_20260724-012849.jpg
    const captionText = data.title || ""; // Ini bakal ngambil "lagu jaman kapan?"
    const mainThumb = data.thumbnail || "";
    
    // Lo liat di screenshot, videonya ada di dalem medias -> index 0 -> url
    if (!data.medias || data.medias.length === 0) {
      throw new Error("Data medias kosong, video gak ketemu.");
    }
    const mainUrl = data.medias[0].url;

    return {
      title: captionText,
      caption: captionText, // Dapet captionnya di sini!
      thumbnail: mainThumb,
      download_url: mainUrl,
      all_media: {
        videos: [{ thumb_url: mainThumb, url: mainUrl }],
        images: [] 
      }
    };

  } catch (error) {
    throw new Error(`Scraper Error: ${error.message}`);
  }
}
