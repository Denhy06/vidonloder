// Helper delay untuk jeda waktu jika diperlukan
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

/**
 * PROVIDER 1: Menggunakan Cobalt API (Open Source & Tanpa Key)
 */
async function fetchFromCobalt(url) {
  const response = await fetch("https://api.cobalt.tools/api/json", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      url: url,
      videoQuality: "max"
    })
  });

  if (!response.ok) throw new Error(`Cobalt API error status: ${response.status}`);
  const data = await response.json();

  if (data.status === "error") throw new Error(data.text || "Cobalt API error");

  return {
    provider: "Cobalt",
    title: data.caption || "Instagram Media",
    caption: data.caption || "",
    username: data.author?.name || "",
    download_url: data.url,
    media_type: data.picker ? "gallery" : "single"
  };
}

/**
 * PROVIDER 2: Menggunakan RapidAPI (Contoh Provider A)
 * Catatan: Ganti 'YOUR_RAPIDAPI_KEY' dengan API Key gratis dari RapidAPI kamu
 */
async function fetchFromRapidApiProviderA(url) {
  const rapidApiKey = "d22d36e9d4msh19d851ed141a616p186f95jsn4d9de1543af7"; // Dapatkan gratis di rapidapi.com
  
  if (!rapidApiKey || rapidApiKey === "YOUR_RAPIDAPI_KEY") {
    throw new Error("RapidAPI Key belum diisi");
  }

  const response = await fetch(`https://instagram-downloader-download-instagram-videos-photos1.p.rapidapi.com/get-info?url=${encodeURIComponent(url)}`, {
    method: "GET",
    headers: {
      "x-rapidapi-key": rapidApiKey,
      "x-rapidapi-host": "instagram-downloader-download-instagram-videos-photos1.p.rapidapi.com"
    }
  });

  if (!response.ok) throw new Error(`RapidAPI Provider A error status: ${response.status}`);
  const data = await response.json();

  return {
    provider: "RapidAPI_A",
    title: data.caption || data.title || "Instagram Media",
    caption: data.caption || "",
    username: data.user?.username || data.username || "",
    download_url: data.download_url || data.media || data.video_url,
    thumbnail: data.thumbnail || data.cover
  };
}

/**
 * PROVIDER 3: Menggunakan Public SaveInsta API Alternative
 */
async function fetchFromAlternativeApi(url) {
  const response = await fetch(`https://api.vkrdown.com/api/instagram?url=${encodeURIComponent(url)}`, {
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    }
  });

  if (!response.ok) throw new Error(`Alternative API error status: ${response.status}`);
  const data = await response.json();

  if (!data.data) throw new Error("Data dari Alternative API kosong");

  return {
    provider: "AlternativeAPI",
    title: data.data.title || data.data.caption || "Instagram Media",
    caption: data.data.caption || "",
    username: data.data.author || "",
    download_url: data.data.video || data.data.url,
    thumbnail: data.data.thumbnail
  };
}

/**
 * FUNGSI UTAMA (Scraper dengan Rotasi 3 API Fallback)
 */
export async function scrapeInstagram(url) {
  // Daftar provider yang akan dicoba berurutan
  const providers = [
    { name: "Cobalt API", fn: fetchFromCobalt },
    { name: "RapidAPI Provider A", fn: fetchFromRapidApiProviderA },
    { name: "Alternative API", fn: fetchFromAlternativeApi }
  ];

  let lastError = null;

  for (const provider of providers) {
    try {
      console.log(`[IG Downloader] Memproses via ${provider.name}...`);
      const result = await provider.fn(url);
      
      // Validasi bahwa minimal ada link download atau data yang valid
      if (result && (result.download_url || result.caption)) {
        console.log(`[IG Downloader] Berhasil mengambil data menggunakan ${provider.name}`);
        return result;
      }
    } catch (err) {
      console.warn(`[IG Downloader] ${provider.name} gagal: ${err.message}. Beralih ke API berikutnya...`);
      lastError = err;
      await delay(500); // Jeda singkat sebelum coba API berikutnya
    }
  }

  // Jika semua 3 API gagal
  throw new Error(`Semua provider API gagal mengambil data Instagram. Error terakhir: ${lastError?.message}`);
}
