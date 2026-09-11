/** Original adapter for AutoSocial's documented video + UTF-8 sidecar queue format.
 * No network calls, account sessions, queue writes or automatic publishing.
 */
export const AUTOSOCIAL_PLATFORMS = ['instagram', 'tiktok', 'youtube'] as const
export type AutoSocialPlatform = typeof AUTOSOCIAL_PLATFORMS[number]

export function createAutoSocialSidecar(videoName: string, caption: string) {
  // Keep the exact basename so AutoSocial can pair the description with the video.
  // Reject unsafe names rather than silently renaming only one half of the pair.
  if (!videoName || /[<>:"/\\|?*\u0000-\u001f\u007f]/.test(videoName)
    || videoName.startsWith('.') || /[. ]$/.test(videoName)) {
    throw new Error('Video dosyasının adı geçersiz. Dosyayı yeniden adlandırıp seç.')
  }
  const match = /^(.+)\.(mp4|mov|webm|avi|mkv)$/i.exec(videoName)
  if (!match || /[. ]$/.test(match[1]) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(match[1])) {
    throw new Error('MP4, MOV, WEBM, AVI veya MKV uzantılı bir video seç.')
  }
  const text = caption.replace(/\u0000/g, '').trim()
  if (!text) throw new Error('Bu platform için açıklama boş. Önce açıklamayı yaz.')
  if (text.length > 5000) throw new Error('Açıklama en fazla 5.000 karakter olabilir.')
  return { filename: `${match[1]}.description`, text }
}
