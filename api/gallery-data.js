export default async function handler(req, res) {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Missing Supabase configuration' });
  }

  try {
    // Fetch gallery version
    const versionRes = await fetch(
      `${SUPABASE_URL}/rest/v1/admin_settings?select=value&key=eq.gallery_version`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        }
      }
    );
    const versionArr = await versionRes.json();
    const version = versionArr?.[0]?.value || '0';

    // Fetch all gallery data in one query
    const keys = [
      'gallery_images_normal',
      'gallery_images_chibi_new',
      'gallery_images_chibi',
      'gallery_images_anime',
      'anime_subcategories'
    ].join(',');

    const dataRes = await fetch(
      `${SUPABASE_URL}/rest/v1/admin_settings?select=key,value&or=(key.in.(${keys}),key.like.img_*,key.like.pos_*,key.like.gallery_images_anime_*)`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        }
      }
    );
    const data = await dataRes.json();

    // Cache 5 min on Vercel Edge CDN, allow stale for 10 min
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({ version, data });
  } catch (error) {
    console.error('Gallery data fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch gallery data' });
  }
}
