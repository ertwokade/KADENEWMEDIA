import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { getDb, isValidObjectId } from './_lib/mongodb.js';
import { getDefaultPermissions, requireAdmin } from './_lib/auth.js';
import { cors } from './_lib/cors.js';
import { logActivity } from './notifications.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const user = await requireAdmin(req, res);
  if (!user) return;

  const db = await getDb();

  try {
    // GET - List all users
    if (req.method === 'GET') {
      const users = await db.collection('users')
        .find({}, { projection: { password: 0 } })
        .sort({ createdAt: -1 })
        .toArray();
      return res.status(200).json(users);
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

      const existing = await db.collection('users').findOne({ username });
      if (existing) {
        return res.status(409).json({ error: 'Bu kullanıcı adı zaten kullanılıyor' });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const newUser = {
        username,
        password: hashedPassword,
        email: req.body.email || '',
        role: role || 'viewer',
        permissions: permissions || getDefaultPermissions(role || 'viewer'),
        createdAt: new Date(),
        updatedAt: new Date(),
        sessionVersion: 0,
      };

      await db.collection('users').insertOne(newUser);
      const { password: _, ...safeUser } = newUser;
      logActivity(db, { action: 'Kullanıcı oluşturuldu', detail: `${username} - ${role || 'viewer'} rolü`, type: 'create', icon: '👤', user: user.username }).catch(() => {});
      return res.status(201).json(safeUser);
    }

    // PUT - Update user
    if (req.method === 'PUT') {
      const { id, username, password, role, permissions } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Kullanıcı ID gerekli' });
      }
      if (!isValidObjectId(id)) return res.status(400).json({ error: 'Geçersiz ID' });
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
      const updateData = { updatedAt: new Date() };
      if (username) updateData.username = username;
      if (role) {
        updateData.role = role;
        if (!permissions) updateData.permissions = getDefaultPermissions(role);
      }
      if (permissions) updateData.permissions = permissions;
      if (password) updateData.password = await bcrypt.hash(password, 12);
      if (emailUpdate !== undefined) updateData.email = emailUpdate;

      const shouldRevokeSessions = Boolean(password || role || permissions);
      await db.collection('users').updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData, ...(shouldRevokeSessions ? { $inc: { sessionVersion: 1 } } : {}) }
      );
      logActivity(db, { action: 'Kullanıcı güncellendi', detail: `${username || id}`, type: 'update', icon: '✏️', user: user.username }).catch(() => {});
      return res.status(200).json({ message: 'Kullanıcı güncellendi' });
    }

    // DELETE - Delete user
    if (req.method === 'DELETE') {
      const id = req.query.id;
      if (!id) {
        return res.status(400).json({ error: 'Kullanıcı ID gerekli' });
      }
      if (!isValidObjectId(id)) return res.status(400).json({ error: 'Geçersiz ID' });

      // Prevent deleting yourself
      const targetUser = await db.collection('users').findOne({ _id: new ObjectId(id) });
      if (targetUser && targetUser.username === user.username) {
        return res.status(400).json({ error: 'Kendinizi silemezsiniz' });
      }

      await db.collection('users').deleteOne({ _id: new ObjectId(id) });
      logActivity(db, { action: 'Kullanıcı silindi', detail: `${targetUser?.username || id}`, type: 'delete', icon: '🗑️', user: user.username }).catch(() => {});
      return res.status(200).json({ message: 'Kullanıcı silindi' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Users API error:', error);
    return res.status(500).json({ error: 'Sunucu hatası' });
  }
}
