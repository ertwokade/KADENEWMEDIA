const LOCAL_ORIGINS = ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:4173'];

function isProductionRuntime() {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
}

function getAllowedOrigins() {
  if (process.env.ALLOWED_ORIGINS) {
    return process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);
  }
  if (isProductionRuntime()) {
    throw new Error('ALLOWED_ORIGINS must be set in production');
  }
  return LOCAL_ORIGINS;
}

function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}

export function cors(req, res) {
  setSecurityHeaders(res);

  let allowedOrigins;
  try {
    allowedOrigins = getAllowedOrigins();
  } catch (err) {
    res.status(500).json({ error: err.message });
    return true;
  }

  const origin = req.headers.origin;

  if (origin) {
    const isAllowed =
      allowedOrigins.includes(origin) ||
      (process.env.NODE_ENV !== 'production' && /^https?:\/\/localhost/.test(origin));
    if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Vary', 'Origin');
    } else {
      res.status(403).json({ error: 'Origin not allowed' });
      return true;
    }
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}
