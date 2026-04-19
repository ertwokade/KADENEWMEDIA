// Shared notification/activity helpers — imported by reminders.js and messages.js

export async function createNotification(db, { userId, type, title, message, link }) {
  await db.collection('notifications').insertOne({
    userId,
    type: type || 'info',
    title,
    message,
    link: link || null,
    read: false,
    createdAt: new Date(),
  });
}

export async function logActivity(db, { action, detail, type, icon, user }) {
  await db.collection('activity_log').insertOne({
    action,
    detail: detail || '',
    type: type || 'system',
    icon: icon || '⚙️',
    user: user || 'sistem',
    createdAt: new Date(),
  });
}
