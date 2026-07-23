export async function scrapeInstagram(url) {
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  // Kunci RapidAPI milikmu
  const RAPID_API_KEY = "d22d36e9d4msh19d851ed141a616p186f95jsn4d9de1543af7";

  // ========================================================
  // PROVIDER 1: API Publik (Gratis, Stabil, Cocok untuk jangka panjang)
  // ========================================================
  async function fetchProvider1(igUrl) {
    // Menggunakan API publik Ryzendesu (Sangat populer & stabil di Indonesia)
    const res = await fetch(`https://api.ryzendesu.vip/api/downloader/igdl?url=${encodeURIComponent(igUrl)}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });
    
    if (!res.ok) throw new Error("Provider 1 (Ryzendesu) Down");
    const data = await res.json();
    
    if (!data || !data.data || data.data.length === 0) throw new Error("Data Provider 1 Kosong");

    // Format data ke bentuk yang diharapkan aplikasimu
    const videos = [];
    const images = [];
    
    data.data.forEach(item => {
      if (item.url) {
        // Cek apakah url berupa video (mp4) atau gambar (jpg/webp)
        if (item.url.includes('.mp4') || item.thumbnail.includes('video')) {
          videos.push({ thumb_url: item.thumbnail, url: item.url });
        } else {
          images.push({ thumb_url: item.thumbnail, url: item.url });
        }
      }
    });

    const primary = videos[0] || images[0];
    if (!primary) throw new Error("Tidak ada link media di Provider 1");

    return {
      title: "Instagram Media", // Beberapa API tidak mengirim title/caption, jadi kita fallback
      caption: "Instagram Media", // Akan diisi jika API menyediakan
      thumbnail: primary.thumb_url,
      download_url: primary.url,
      all_media: { videos, images }
    };
  }

  // ========================================================
  // PROVIDER 2: RapidAPI (Menggunakan Key-mu)
  // Host: instagram-downloader-download-instagram-videos-photos1.p.rapidapi.com
  // Pastikan kamu sudah "Subscribe" ke API ini di website RapidAPI
  // ========================================================
  async function fetchProvider2(igUrl) {
    const res = await fetch(`https://instagram-downloader-download-instagram-videos-photos1.p.rapidapi.com/get-info?url=${encodeURIComponent(igUrl)}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPID_API_KEY,
        'x-rapidapi-host': 'instagram-downloader-download-instagram-videos-photos1.p.rapidapi.com'
      }
    });

    if (!res.ok) throw new Error(`Provider 2 (RapidAPI) Gagal - Status: ${res.status}`);
    const data = await res.json();

    if (!data.download_url && !data.video_url && !data.media) throw new Error("Data RapidAPI Kosong");

    const videos = [];
    const images = [];
    const mainUrl = data.download_url || data.video_url || data.media;
    const mainThumb = data.thumbnail || data.cover || "";

    if (mainUrl.includes('.mp4')) {
      videos.push({ thumb_url: mainThumb, url: mainUrl });
    } else {
      images.push({ thumb_url: mainThumb, url: mainUrl });
    }

    return {
      title: data.caption || data.title || "Instagram Media",
      caption: data.caption || "",
      thumbnail: mainThumb,
      download_url: mainUrl,
      all_media: { videos, images }
    };
  }

  // ========================================================
  // PROVIDER 3: API Siputzx (Alternatif Publik Indonesia)
  // ========================================================
  async function fetchProvider3(igUrl) {
    const res = await fetch(`https://api.siputzx.my.id/api/d/igdl?url=${encodeURIComponent(igUrl)}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });
    
    if (!res.ok) throw new Error("Provider 3 (Siputzx) Down");
    const data = await res.json();

    if (!data.data || data.data.length === 0) throw new Error("Data Provider 3 Kosong");

    const videos = [];
    const images = [];

    data.data.forEach(item => {
      // Siputzx biasanya langsung mengembalikan URL asli IG
      if (item.url.includes('.mp4')) {
        videos.push({ thumb_url: item.thumbnail || "", url: item.url });
      } else {
        images.push({ thumb_url: item.thumbnail || "", url: item.url });
      }
    });

    const primary = videos[0] || images[0];
    
    return {
      title: data.title || "Instagram Media",
      caption: data.title || "Instagram Media", // Seringkali API menggabung title/caption
      thumbnail: primary.thumb_url,
      download_url: primary.url,
      all_media: { videos, images }
    };
  }

  // ========================================================
  // EKSEKUSI ROTASI API (AUTO-FALLBACK)
  // ========================================================
  const providers = [
    fetchProvider1, // Coba API Publik 1 (Ryzendesu) dulu karena stabil
    fetchProvider3, // Jika gagal, coba API Publik 2 (Siputzx)
    fetchProvider2  // Jika gagal, coba RapidAPI kamu
  ];

  let lastError = "";

  for (let i = 0; i < providers.length; i++) {
    try {
      console.log(`[Scraper] Mencoba API ke-${i + 1}...`);
      const result = await providers[i](url);
      
      // Jika berhasil mendapatkan download_url, langsung kembalikan data
      if (result && result.download_url) {
        console.log(`[Scraper] Berhasil menggunakan API ke-${i + 1}`);
        return result; 
      }
    } catch (error) {
      console.log(`[Scraper] API ke-${i + 1} gagal: ${error.message}`);
      lastError = error.message;
      await delay(1000); // Tunggu 1 detik sebelum mencoba API berikutnya
    }
  }

  // Jika ketiga API mati/gagal semua
  throw new Error(`Gagal mengekstrak video dari semua API. Error terakhir: ${lastError}`);
}
