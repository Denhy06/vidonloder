import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const videoUrl = searchParams.get('url');

  if (!videoUrl) {
    return new NextResponse('URL tidak valid', { status: 400 });
  }

  try {
    // Server Vercel mendownload video asli dengan menyamar pakai header browser & referer TikTok
    const response = await fetch(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://www.tiktok.com/',
        'Accept': '*/*'
      }
    });

    if (!response.ok) {
      throw new Error(`Gagal mengambil file: HTTP ${response.status}`);
    }

    const headers = new Headers();
    headers.set('Content-Type', 'video/mp4');
    headers.set('Content-Disposition', `attachment; filename="TikTok_${Date.now()}.mp4"`);

    // Mengalirkan file video langsung ke perangkat pengguna sebagai file unduhan
    return new NextResponse(response.body, {
      status: 200,
      headers,
    });

  } catch (error) {
    return new NextResponse('Gagal memproses file: ' + error.message, { status: 500 });
  }
}
