import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const videoUrl = searchParams.get('url');

  if (!videoUrl) {
    return new NextResponse('URL tidak valid', { status: 400 });
  }

  try {
    // Gunakan User-Agent Mobile (iPhone) agar lolos dari proteksi 403 Forbidden TikTok CDN
    const response = await fetch(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Referer': 'https://www.tiktok.com/',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    if (!response.ok) {
      throw new Error(`Gagal mengambil file: HTTP ${response.status}`);
    }

    const headers = new Headers();
    headers.set('Content-Type', 'video/mp4');
    headers.set('Content-Disposition', `attachment; filename="TikTok_${Date.now()}.mp4"`);

    // Alirkan file video langsung ke perangkat pengguna sebagai file unduhan
    return new NextResponse(response.body, {
      status: 200,
      headers,
    });

  } catch (error) {
    return new NextResponse('Gagal memproses file: ' + error.message, { status: 500 });
  }
}
