import { NextResponse } from 'next/server';
import { scrapeTiktok } from '../../../lib/scrapers/tiktok';
import { scrapeFacebook } from '../../../lib/scrapers/facebook';
import { scrapePinterest } from '../../../lib/scrapers/pinterest';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const videoUrl = searchParams.get('url');

  if (!videoUrl) {
    return NextResponse.json(
      { status: false, message: 'Parameter url wajib diisi!' }, 
      { status: 400 }
    );
  }

  try {
    let result = null;
    let platform = 'unknown';

    if (videoUrl.includes('tiktok.com')) {
      platform = 'tiktok';
      result = await scrapeTiktok(videoUrl);

      // KUNCI UTAMA: Bungkus link TikTok dengan endpoint stream lokal 
      // Agar tombol di frontend (yang tidak diubah) tidak kena "Access Denied"
      if (result && result.download_url) {
        result.download_url = `/api/download/stream?url=${encodeURIComponent(result.download_url)}`;
      }

    } else if (videoUrl.includes('facebook.com') || videoUrl.includes('fb.watch')) {
      platform = 'facebook';
      result = await scrapeFacebook(videoUrl);
    } else if (videoUrl.includes('pinterest.com') || videoUrl.includes('pin.it')) {
      platform = 'pinterest';
      result = await scrapePinterest(videoUrl);
    } else {
      return NextResponse.json(
        { status: false, message: 'Platform belum didukung!' }, 
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: true,
      platform: platform,
      data: result
    });

  } catch (error) {
    return NextResponse.json(
      { status: false, message: 'Gagal mengekstrak video', error: error.message }, 
      { status: 500 }
    );
  }
}
