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

// target_type/target_id/before/after kolonları migration
// 202607230001_kademedia_audit_and_quote_states.sql ile eklenir (henüz canlıya
// uygulanmadı — bkz. docs/BLOCKERS_TR.md #1). Migration uygulanana kadar bu
// alanlar sağlansa bile insert hata verir; fonksiyon bunu yutar (aşağıdaki
// try/catch), yalnızca o log satırı yazılmaz — çağıran işlemler etkilenmez.
export async function logActivity({ action, detail, type, icon, user, targetType, targetId, before, after }) {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from('kade_activity_log').insert({
      action,
      detail: detail || '',
      type: type || 'system',
      icon: icon || 'system',
      user: user || 'sistem',
      target_type: targetType || null,
      target_id: targetId || null,
      before: before || null,
      after: after || null,
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Activity log write failed:', err.message);
    return false;
  }
}
