// File: api/proxy.js (letakkan di folder api/ di root project Vercel)
// Ini adalah serverless function untuk Vercel yang berfungsi sebagai proxy

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      return res.status(200).end();
    }
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url, auth, domain, origin } = req.body;

    // Validate input
    if (!url) {
      return res.status(400).json({
        error: 'URL is required',
        status: 0
      });
    }

    // Prepare the request body untuk vidssave API
    const body = new URLSearchParams({
      auth: auth || '20250901majwlqo',
      domain: domain || 'api-ak.vidssave.com',
      origin: origin || 'source',
      link: url
    }).toString();

    // Make the actual request ke vidssave API
    const response = await fetch('https://api.vidssave.com/api/contentsite_api/media/parse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      body: body,
      timeout: 30000
    });

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const json = await response.json();
    
    // Set CORS headers to allow requests from anywhere
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    return res.status(200).json(json);

  } catch (error) {
    console.error('Proxy error:', {
      message: error.message,
      stack: error.stack
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    return res.status(500).json({
      error: error.message || 'Internal server error',
      status: 0,
      message: 'Gagal mengambil data dari API, coba lagi atau hubungi admin.'
    });
  }
}
