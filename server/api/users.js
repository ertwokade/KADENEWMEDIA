import bcrypt from 'bcryptjs';
import { getSupabase, isValidUuid, isUniqueViolation } from './_lib/supabase.js';
import { getDefaultPermissions, requireAdmin } from './_lib/auth.js';
import { cors } from './_lib/cors.js';
import { logActivity } from './notifications.js';

function mapUser(u) {
  if (!u) return u;
  return {
    _id: u.id,
    id: u.id,
    username: u.username,
    email: u.email,
    role: u.role,
    permissions: u.permissions,
    sessionVersion: u.session_version,
    createdAt: u.created_at,
    updatedAt: u.updated_at,
  };
}

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const user = await requireAdmin(req, res);
  if (!user) return;

  const supabase = getSupabase();

  try {
    // GET - List all users
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('kade_users')
        .select('id, username, email, role, permissions, session_version, created_at, updated_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json((data || []).map(mapUser));
    }

    // POST - Create new user
    if (req.method === 'POST') {
      const { username, password, role, permissions } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
      }
      if (typeof username !== 'string' || !/^[a-zA-Z0-9_]{1,30}$/.test(username)) {
        return res.status(400).json({ error: 'Geçersiz kullanıcı adı formatı' });
      }
      if (typeof password !== 'string' || password.length < 12 || password.length > 128) {
        return res.status(400).json({ error: 'Şifre 12–128 karakter arasında olmalı' });
      }

      const validRoles = ['admin', 'editor', 'viewer'];
      if (role && !validRoles.includes(role)) {
        return res.status(400).json({ error: 'Geçersiz rol. Geçerli roller: admin, editor, viewer' });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const newUser = {
        username,
        password_hash: hashedPassword,
        email: req.body.email || '',
        role: role || 'viewer',
        permissions: permissions || getDefaultPermissions(role || 'viewer'),
        session_version: 0,
      };

      const { data: created, error } = await supabase.from('kade_users').insert(newUser).select().single();
      if (error) {
        if (isUniqueViolation(error)) return res.status(409).json({ error: 'Bu kullanıcı adı zaten kullanılıyor' });
        throw error;
      }
      logActivity({ action: 'Kullanıcı oluşturuldu', detail: `${username} - ${role || 'viewer'} rolü`, type: 'create', icon: '👤', user: user.username, targetType: 'user', targetId: created.id }).catch(() => {});
      return res.status(201).json(mapUser(created));
    }

    // PUT - Update user
    if (req.method === 'PUT') {
      const { id, username, password, role, permissions } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Kullanıcı ID gerekli' });
      }
      if (!isValidUuid(id)) return res.status(400).json({ error: 'Geçersiz ID' });
      if (username && (typeof username !== 'string' || !/^[a-zA-Z0-9_]{1,30}$/.test(username))) {
        return res.status(400).json({ error: 'Geçersiz kullanıcı adı formatı' });
      }
      if (role && !['admin', 'editor', 'viewer'].includes(role)) {
        return res.status(400).json({ error: 'Geçersiz rol' });
      }
      if (password && (typeof password !== 'string' || password.length < 12 || password.length > 128)) {
        return res.status(400).json({ error: 'Şifre 12–128 karakter arasında olmalı' });
      }

      const { email: emailUpdate } = req.body;
      const updateData = {};
      if (username) updateData.username = username;
      if (role) {
        updateData.role = role;
        if (!permissions) updateData.permissions = getDefaultPermissions(role);
      }
      if (permissions) updateData.permissions = permissions;
      if (password) updateData.password_hash = await bcrypt.hash(password, 12);
      if (emailUpdate !== undefined) updateData.email = emailUpdate;

      const shouldRevokeSessions = Boolean(password || role || permissions);
      if (shouldRevokeSessions) {
        const { data: current, error: fetchError } = await supabase.from('kade_users').select('session_version').eq('id', id).maybeSingle();
        if (fetchError) throw fetchError;
        updateData.session_version = Number(current?.session_version || 0) + 1;
      }

      const { error } = await supabase.from('kade_users').update(updateData).eq('id', id);
      if (error) {
        if (isUniqueViolation(error)) return res.status(409).json({ error: 'Bu kullanıcı adı zaten kullanılıyor' });
        throw error;
      }
      logActivity({ action: 'Kullanıcı güncellendi', detail: `${username || id}`, type: 'update', icon: '✏️', user: user.username, targetType: 'user', targetId: id }).catch(() => {});
      return res.status(200).json({ message: 'Kullanıcı güncellendi' });
    }

    // DELETE - Delete user
    if (req.method === 'DELETE') {
      const id = req.query.id;
      if (!id) {
        return res.status(400).json({ error: 'Kullanıcı ID gerekli' });
      }
      if (!isValidUuid(id)) return res.status(400).json({ error: 'Geçersiz ID' });

      // Prevent deleting yourself
      const { data: targetUser } = await supabase.from('kade_users').select('username').eq('id', id).maybeSingle();
      if (targetUser && targetUser.username === user.username) {
        return res.status(400).json({ error: 'Kendinizi silemezsiniz' });
      }

      const { error } = await supabase.from('kade_users').delete().eq('id', id);
      if (error) throw error;
      logActivity({ action: 'Kullanıcı silindi', detail: `${targetUser?.username || id}`, type: 'delete', icon: '🗑️', user: user.username, targetType: 'user', targetId: id }).catch(() => {});
      return res.status(200).json({ message: 'Kullanıcı silindi' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Users API error:', error);
    return res.status(500).json({ error: 'Sunucu hatası' });
  }
}
