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

// Eski şema ya da PostgREST şema önbelleği için temel alanlarla tekrar dene.
// Çağıran, sunucu yanıtından önce bu işlemi bekler; ağ bekleme süresi sınırlıdır.
export async function logActivity({ action, detail, type, icon, user, targetType, targetId, before, after }) {
  const baseRow = {
    action,
    detail: detail || '',
    type: type || 'system',
    icon: icon || 'system',
    user: user || 'sistem',
  };
  const enrichedRow = {
    ...baseRow,
    target_type: targetType || null,
    target_id: targetId || null,
    before: before || null,
    after: after || null,
  };

  try {
    const supabase = getSupabase();
    const signal = AbortSignal.timeout(5000);
    const { error } = await supabase.from('kade_activity_log').insert(enrichedRow).abortSignal(signal);
    if (!error) return true;
    if (!['42703', 'PGRST204'].includes(error.code)) throw error;

    const { error: fallbackError } = await supabase.from('kade_activity_log').insert(baseRow).abortSignal(signal);
    if (fallbackError) throw fallbackError;
    return true;
  } catch (err) {
    console.error('Activity log write failed:', err.message);
    return false;
  }
}
