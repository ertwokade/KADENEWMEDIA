// Shared notification/activity helpers imported by API handlers.

export async function createNotification(db, { userId, type, title, message, link }) {
  try {
    await db.collection('notifications').insertOne({
      userId,
      type: type || 'info',
      title,
      message,
      link: link || null,
      read: false,
      createdAt: new Date(),
    });
    return true;
  } catch (err) {
    console.error('Notification write failed:', err.message);
    return false;
  }
}

export async function logActivity(db, { action, detail, type, icon, user }) {
  try {
    await db.collection('activity_log').insertOne({
      action,
      detail: detail || '',
      type: type || 'system',
      icon: icon || 'system',
      user: user || 'sistem',
      createdAt: new Date(),
    });
    return true;
  } catch (err) {
    console.error('Activity log write failed:', err.message);
    return false;
  }
}

