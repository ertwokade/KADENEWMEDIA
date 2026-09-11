export default function TranscriptionVocabulary({ value, onChange, disabled }: {
  value: string; onChange: (value: string) => void; disabled?: boolean
}) {
  return (
    <label className="block space-y-1.5 text-xs text-zinc-400">
      <span>Özel isimler (isteğe bağlı)</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}
        maxLength={2000} placeholder="Örn. Kadir Demir, ürün veya marka adı"
        className="min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-[#f2c322] focus:outline-none disabled:opacity-50" />
      <span className="block text-[11px]">En fazla 20 adı virgülle ayır. Profil ve marka sözlüğü de eklenir; bu bir yazım ipucudur, doğruluk garantisi değildir.</span>
    </label>
  )
}
