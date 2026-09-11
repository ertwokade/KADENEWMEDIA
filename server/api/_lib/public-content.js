/** A narrow public projection. Admin notes and unrelated CMS fields never leave the server. */
export function publicStats(data) {
  const text = value => typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
  const rows = Array.isArray(data?.rakamlar) ? data.rakamlar : [];
  return { rakamlar: rows.filter(row => row && row.published !== false && text(row.sayi) && text(row.etiket)).map(row => ({
    sayi: text(row.sayi), etiket: text(row.etiket), ikon: text(row.ikon),
  })) };
}
