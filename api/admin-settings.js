export default async function handler(req, res) {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Missing Supabase configuration' });
  }

  try {
    const dataRes = await fetch(
      `${SUPABASE_URL}/rest/v1/admin_settings?select=key,value&or=(key.eq.cms_status,key.like.img_*,key.like.pos_*)`,
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
    return res.status(200).json(data);
  } catch (error) {
    console.error('Admin settings fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch admin settings' });
  }
}
