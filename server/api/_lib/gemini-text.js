// Gemini cevabı birden çok `text` parçasına bölünebilir; düşünce parçaları hariç
// hepsi sırayla birleştirilmelidir. Yalnız son parçayı almak cevabın başını keser.
export function geminiResponseText(data) {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts
    .filter((part) => typeof part?.text === 'string' && part.thought !== true)
    .map((part) => part.text)
    .join('')
    .trim();
}
