import jwt from 'jsonwebtoken';

function getSecret() {
  return process.env.JWT_SECRET || 'kademedia-default-secret-2026';
}

export function createToken(payload) {
  return jwt.sign(payload, getSecret(), { expiresIn: '24h' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, getSecret());
  } catch (e) {
    return null;
  }
}

export function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export function requireAuth(req) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return null;
  }
  return verifyToken(token);
}
