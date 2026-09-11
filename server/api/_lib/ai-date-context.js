export function aiDateContext(now = new Date()) {
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
  return `Bugünün tarihi: ${date} (Europe/Istanbul). Kullanıcı geçmiş bir dönem istemedikçe güncel yıl ve tarihi esas al. Güncel olayları yalnızca doğrulanmış kaynak varsa kullan; tarih bağlamı canlı veriye eriştiğin anlamına gelmez.`;
}
