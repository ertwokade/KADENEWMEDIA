# Editör Veri Modeli

## TimelineState v1

Timeline; primary asset, fps, canvas, included source range’ler, captions ve title overlay’lerden oluşan Zod doğrulamalı JSON’dur. `schemaVersion: 1` gelecekte kontrollü migration sağlar.

`includedRanges` orijinal asset içinde kalan bölgelerdir. Kesimler silinmiş nesneler olarak değil, included listenin dışında kalan source süreleri olarak temsil edilir. Orijinal storage nesnesi hiçbir zaman değiştirilmez.

## Invariant’lar

- Aralıklar source başlangıcına göre sıralıdır.
- Overlap ve 50 ms altı küçük boşluklar normalize edilerek birleşir.
- Başlangıç 0’ın altına, bitiş asset süresinin üstüne taşamaz.
- Sıfır/negatif süre elenir.
- Subtraction yalnız included parçaları böler; cut aralıkları shell veya FFmpeg komutu değildir.

## Source ve output zamanı

Source zamanı orijinal/proxy dosyanın timestamp’idir. Output zamanı included range uzunluklarının art arda eklenmesidir. Örneğin `[0–3s] + [5–8s]` timeline’ında output 4s, source 6s’ye eşittir; source 4s ise cut içinde olduğu için output karşılığı yoktur.

Transcript word timestamp’leri source’tur. Seek doğrudan source’a gider. Caption cue üretirken yalnız included kelimeler alınır ve output timestamp’ine remap edilir.

## Snapshot ve version

Timeline tek bir `currentVersion` işaretçisi taşır. Her başarılı command sonrası immutable TimelineSnapshot eklenir. Undo önceki snapshot state’ini timeline’a taşır; redo sonraki snapshot’ı taşır. Undo sonrası yeni edit, currentVersion sonrasındaki snapshot’ları silerek redo dalını geçersiz kılar. İsimlendirilmiş versiyon, snapshot üzerindeki `name` alanıdır ve sayfa yenilemesinde kalır.
