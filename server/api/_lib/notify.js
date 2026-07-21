// Shared notification/activity helpers imported by API handlers.
import { getSupabase } from './supabase.js';

export async function createNotification({ userId, type, title, message, link }) {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from('kade_notifications').insert({
      user_id: userId,
      type: type || 'info',
      title,
      message,
      link: link || null,
      read: false,
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Notification write failed:', err.message);
    return false;
  }
}

export async function logActivity({ action, detail, type, icon, user }) {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from('kade_activity_log').insert({
      action,
      detail: detail || '',
      type: type || 'system',
      icon: icon || 'system',
      user: user || 'sistem',
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Activity log write failed:', err.message);
    return false;
  }
}
